/**
 * Elite Jersey — client store backend (George Yermak's jersey resale shop, project f8562a10).
 * Lives inside StudioDB's Durable Object storage under ej_* tables and is
 * routed through /ej/* on the worker. Public storefront endpoints power the
 * listings; admin endpoints (password-gated) power George's back office.
 */

export const EJ_ADMIN_PASSWORD = "EliteJersey2026";

const VALID_ORDER_STATUSES = ["pending", "shipped", "completed", "cancelled"] as const;
type OrderStatus = (typeof VALID_ORDER_STATUSES)[number];

interface ItemRow {
  id: string;
  title: string;
  category: string;
  condition: string;
  description: string;
  price: number;
  stock: number;
  sizes: string;
  size_stock: string;
  images: string;
  status: string;
  views: number;
  created_ts: number;
}

interface OrderRow {
  id: string;
  item_id: string;
  item_title: string;
  size: string;
  qty: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  address: string;
  note: string;
  total: number;
  status: string;
  ts: number;
}

interface InterestRow {
  id: string;
  item_id: string;
  item_title: string;
  name: string;
  email: string;
  message: string;
  offer: number;
  ts: number;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

function newId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Parses the per-size stock map ({"S": 2, "M": 1}) stored as JSON. */
function parseSizeStock(raw: string): Record<string, number> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const qty = Math.max(0, Math.floor(Number(value) || 0));
      if (key.trim()) out[key.trim().slice(0, 20)] = qty;
    }
    return out;
  } catch {
    return {};
  }
}

/** Sanitizes an incoming per-size stock map; max 12 sizes. */
function sanitizeSizeStock(input: unknown): Record<string, number> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input).slice(0, 12)) {
    const name = String(key).trim().slice(0, 20);
    if (!name) continue;
    out[name] = Math.max(0, Math.floor(Number(value) || 0));
  }
  return out;
}

function itemPayload(row: ItemRow, thumbOnly: boolean): Record<string, unknown> {
  const images = parseJsonArray(row.images);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    condition: row.condition,
    description: row.description,
    price: row.price,
    stock: row.stock,
    sizes: parseJsonArray(row.sizes),
    sizeStock: parseSizeStock(row.size_stock ?? "{}"),
    images: thumbOnly ? images.slice(0, 1) : images,
    imageCount: images.length,
    status: row.status,
    views: row.views,
    createdTs: row.created_ts,
  };
}

function orderPayload(row: OrderRow): Record<string, unknown> {
  return {
    id: row.id,
    itemId: row.item_id,
    itemTitle: row.item_title,
    size: row.size,
    qty: row.qty,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerPhone: row.buyer_phone,
    address: row.address,
    note: row.note,
    total: row.total,
    status: row.status,
    ts: row.ts,
  };
}

function interestPayload(row: InterestRow): Record<string, unknown> {
  return {
    id: row.id,
    itemId: row.item_id,
    itemTitle: row.item_title,
    name: row.name,
    email: row.email,
    message: row.message,
    offer: row.offer,
    ts: row.ts,
  };
}

function ensureTables(sql: SqlStorage): void {
  sql.exec(`
    CREATE TABLE IF NOT EXISTS ej_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      condition TEXT NOT NULL DEFAULT 'Pre-Owned',
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 1,
      sizes TEXT NOT NULL DEFAULT '[]',
      images TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      views INTEGER NOT NULL DEFAULT 0,
      created_ts INTEGER NOT NULL
    )
  `);
  try {
    sql.exec("ALTER TABLE ej_items ADD COLUMN size_stock TEXT NOT NULL DEFAULT '{}'");
  } catch {
    // column already exists
  }
  sql.exec(`
    CREATE TABLE IF NOT EXISTS ej_orders (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      item_title TEXT NOT NULL DEFAULT '',
      size TEXT NOT NULL DEFAULT '',
      qty INTEGER NOT NULL DEFAULT 1,
      buyer_name TEXT NOT NULL DEFAULT '',
      buyer_email TEXT NOT NULL DEFAULT '',
      buyer_phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      ts INTEGER NOT NULL
    )
  `);
  sql.exec(`
    CREATE TABLE IF NOT EXISTS ej_interest (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      item_title TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      offer REAL NOT NULL DEFAULT 0,
      ts INTEGER NOT NULL
    )
  `);
}

function itemById(sql: SqlStorage, id: string): ItemRow | null {
  const rows = sql.exec<ItemRow>("SELECT * FROM ej_items WHERE id = ?", id).toArray();
  return rows[0] ?? null;
}

interface ItemBody {
  title?: string;
  category?: string;
  condition?: string;
  description?: string;
  price?: number;
  stock?: number;
  sizes?: string[];
  sizeStock?: Record<string, number>;
  images?: string[];
  status?: string;
}

function sanitizeImages(images: unknown): string[] | null {
  if (!Array.isArray(images)) return null;
  const clean = images.filter((v): v is string => typeof v === "string" && v.length > 0).slice(0, 10);
  // Keep the whole row safely under the Durable Object SQLite 2MB row limit.
  const totalBytes = clean.reduce((sum, img) => sum + img.length, 0);
  if (totalBytes > 1_800_000) return null;
  return clean;
}

/**
 * Handles all /ej/* routes. `isAdmin` is the trusted TB-admin flag from the
 * worker; George's own panel authenticates with the X-EJ-Admin header.
 */
export async function handleEliteJersey(
  sql: SqlStorage,
  request: Request,
  path: string,
  method: string,
  isTbAdmin: boolean,
): Promise<Response> {
  ensureTables(sql);
  const isEjAdmin = isTbAdmin || request.headers.get("X-EJ-Admin") === EJ_ADMIN_PASSWORD;

  // ---- public storefront ----

  if (method === "GET" && path === "/ej/items") {
    const rows = sql.exec<ItemRow>("SELECT * FROM ej_items WHERE status = 'active' ORDER BY created_ts DESC").toArray();
    return json({ items: rows.map((r) => itemPayload(r, true)) });
  }

  const itemMatch = path.match(/^\/ej\/items\/([a-f0-9]{16,64})$/);
  if (method === "GET" && itemMatch) {
    const item = itemById(sql, itemMatch[1]);
    if (!item || (item.status !== "active" && !isEjAdmin)) return json({ error: "not found" }, 404);
    sql.exec("UPDATE ej_items SET views = views + 1 WHERE id = ?", item.id);
    return json({ item: itemPayload({ ...item, views: item.views + 1 }, false) });
  }

  if (method === "POST" && path === "/ej/orders") {
    const body = (await request.json().catch(() => ({}))) as {
      itemId?: string; size?: string; qty?: number; name?: string; email?: string; phone?: string; address?: string; note?: string;
    };
    const item = itemById(sql, (body.itemId ?? "").trim());
    if (!item || item.status !== "active") return json({ error: "This listing is no longer available." }, 404);
    const qty = Math.max(1, Math.min(10, Math.floor(Number(body.qty) || 1)));
    if (item.stock < qty) return json({ error: `Only ${item.stock} left in stock.` }, 409);
    const sizeStock = parseSizeStock(item.size_stock ?? "{}");
    const orderSize = (body.size ?? "").trim().slice(0, 20);
    const hasSizeStock = Object.keys(sizeStock).length > 0;
    if (hasSizeStock) {
      if (!orderSize || sizeStock[orderSize] === undefined) {
        return json({ error: "Please pick a size before checking out." }, 400);
      }
      if (sizeStock[orderSize] < qty) {
        return json({ error: `Only ${sizeStock[orderSize]} left in size ${orderSize}.` }, 409);
      }
    }
    const name = (body.name ?? "").trim().slice(0, 120);
    const email = (body.email ?? "").trim().slice(0, 200);
    const address = (body.address ?? "").trim().slice(0, 400);
    if (!name || !email.includes("@") || !address) {
      return json({ error: "Name, valid email and shipping address are required." }, 400);
    }
    const id = newId();
    sql.exec(
      "INSERT INTO ej_orders (id, item_id, item_title, size, qty, buyer_name, buyer_email, buyer_phone, address, note, total, status, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
      id,
      item.id,
      item.title,
      orderSize,
      qty,
      name,
      email,
      (body.phone ?? "").trim().slice(0, 60),
      address,
      (body.note ?? "").trim().slice(0, 500),
      Math.round(item.price * qty * 100) / 100,
      Date.now(),
    );
    if (hasSizeStock) {
      sizeStock[orderSize] -= qty;
      sql.exec("UPDATE ej_items SET stock = stock - ?, size_stock = ? WHERE id = ?", qty, JSON.stringify(sizeStock), item.id);
    } else {
      sql.exec("UPDATE ej_items SET stock = stock - ? WHERE id = ?", qty, item.id);
    }
    return json({ ok: true, orderId: id, total: Math.round(item.price * qty * 100) / 100 });
  }

  if (method === "POST" && path === "/ej/interest") {
    const body = (await request.json().catch(() => ({}))) as {
      itemId?: string; name?: string; email?: string; message?: string; offer?: number;
    };
    const item = itemById(sql, (body.itemId ?? "").trim());
    if (!item) return json({ error: "not found" }, 404);
    const name = (body.name ?? "").trim().slice(0, 120);
    const email = (body.email ?? "").trim().slice(0, 200);
    if (!name || !email.includes("@")) return json({ error: "Name and a valid email are required." }, 400);
    const id = newId();
    sql.exec(
      "INSERT INTO ej_interest (id, item_id, item_title, name, email, message, offer, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      id,
      item.id,
      item.title,
      name,
      email,
      (body.message ?? "").trim().slice(0, 500),
      Math.max(0, Number(body.offer) || 0),
      Date.now(),
    );
    return json({ ok: true });
  }

  // ---- admin (George's back office) ----

  if (method === "POST" && path === "/ej/admin/login") {
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    const ok = body.password === EJ_ADMIN_PASSWORD;
    return json({ ok }, ok ? 200 : 401);
  }

  if (!isEjAdmin) return json({ error: "unauthorized" }, 401);

  if (method === "GET" && path === "/ej/admin/summary") {
    const items = sql.exec<ItemRow>("SELECT * FROM ej_items ORDER BY created_ts DESC").toArray();
    const orders = sql.exec<OrderRow>("SELECT * FROM ej_orders ORDER BY ts DESC").toArray();
    const interest = sql.exec<InterestRow>("SELECT * FROM ej_interest ORDER BY ts DESC").toArray();
    const revenue = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
    return json({
      items: items.map((r) => itemPayload(r, false)),
      orders: orders.map(orderPayload),
      interest: interest.map(interestPayload),
      stats: {
        activeListings: items.filter((i) => i.status === "active").length,
        totalViews: items.reduce((sum, i) => sum + i.views, 0),
        openOrders: orders.filter((o) => o.status === "pending").length,
        revenue: Math.round(revenue * 100) / 100,
      },
    });
  }

  if (method === "POST" && path === "/ej/admin/items") {
    const body = (await request.json().catch(() => ({}))) as ItemBody;
    const title = (body.title ?? "").trim().slice(0, 200);
    if (!title) return json({ error: "Title is required." }, 400);
    const images = sanitizeImages(body.images ?? []);
    if (images === null) return json({ error: "Images too large — max 10 photos." }, 400);
    const newSizeStock = sanitizeSizeStock(body.sizeStock);
    const hasNewSizeStock = Object.keys(newSizeStock).length > 0;
    const sizes = hasNewSizeStock
      ? Object.keys(newSizeStock)
      : (body.sizes ?? []).map((s) => String(s).trim().slice(0, 20)).filter(Boolean).slice(0, 12);
    const totalStock = hasNewSizeStock
      ? Object.values(newSizeStock).reduce((sum, n) => sum + n, 0)
      : Math.max(0, Math.floor(Number(body.stock) || 0));
    const id = newId();
    sql.exec(
      "INSERT INTO ej_items (id, title, category, condition, description, price, stock, sizes, size_stock, images, status, views, created_ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)",
      id,
      title,
      (body.category ?? "").trim().slice(0, 80),
      (body.condition ?? "Pre-Owned").trim().slice(0, 80),
      (body.description ?? "").trim().slice(0, 2000),
      Math.max(0, Number(body.price) || 0),
      totalStock,
      JSON.stringify(sizes),
      JSON.stringify(newSizeStock),
      JSON.stringify(images),
      body.status === "draft" ? "draft" : "active",
      Date.now(),
    );
    const created = itemById(sql, id);
    return json({ ok: true, item: created ? itemPayload(created, false) : null });
  }

  const adminItemMatch = path.match(/^\/ej\/admin\/items\/([a-f0-9]{16,64})$/);
  if (method === "POST" && adminItemMatch) {
    const item = itemById(sql, adminItemMatch[1]);
    if (!item) return json({ error: "not found" }, 404);
    const body = (await request.json().catch(() => ({}))) as ItemBody;
    const images = body.images !== undefined ? sanitizeImages(body.images) : parseJsonArray(item.images);
    if (images === null) return json({ error: "Images too large — max 10 photos." }, 400);
    let nextSizeStockJson = item.size_stock ?? "{}";
    let nextSizes = body.sizes !== undefined
      ? JSON.stringify(body.sizes.map((s) => String(s).trim().slice(0, 20)).filter(Boolean).slice(0, 12))
      : item.sizes;
    let nextStock = body.stock !== undefined ? Math.max(0, Math.floor(Number(body.stock) || 0)) : item.stock;
    if (body.sizeStock !== undefined) {
      const cleaned = sanitizeSizeStock(body.sizeStock);
      nextSizeStockJson = JSON.stringify(cleaned);
      if (Object.keys(cleaned).length > 0) {
        nextSizes = JSON.stringify(Object.keys(cleaned));
        nextStock = Object.values(cleaned).reduce((sum, n) => sum + n, 0);
      }
    }
    sql.exec(
      "UPDATE ej_items SET title = ?, category = ?, condition = ?, description = ?, price = ?, stock = ?, sizes = ?, size_stock = ?, images = ?, status = ? WHERE id = ?",
      (body.title ?? item.title).trim().slice(0, 200) || item.title,
      (body.category ?? item.category).trim().slice(0, 80),
      (body.condition ?? item.condition).trim().slice(0, 80),
      (body.description ?? item.description).trim().slice(0, 2000),
      body.price !== undefined ? Math.max(0, Number(body.price) || 0) : item.price,
      nextStock,
      nextSizes,
      nextSizeStockJson,
      JSON.stringify(images),
      body.status === "draft" || body.status === "active" ? body.status : item.status,
      item.id,
    );
    const updated = itemById(sql, item.id);
    return json({ ok: true, item: updated ? itemPayload(updated, false) : null });
  }

  const deleteItemMatch = path.match(/^\/ej\/admin\/items\/([a-f0-9]{16,64})\/delete$/);
  if (method === "POST" && deleteItemMatch) {
    sql.exec("DELETE FROM ej_items WHERE id = ?", deleteItemMatch[1]);
    return json({ ok: true });
  }

  const orderStatusMatch = path.match(/^\/ej\/admin\/orders\/([a-f0-9]{16,64})$/);
  if (method === "POST" && orderStatusMatch) {
    const rows = sql.exec<OrderRow>("SELECT * FROM ej_orders WHERE id = ?", orderStatusMatch[1]).toArray();
    const order = rows[0];
    if (!order) return json({ error: "not found" }, 404);
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    const status = body.status as OrderStatus;
    if (!VALID_ORDER_STATUSES.includes(status)) return json({ error: "invalid status" }, 400);
    // Restock when an order flips to cancelled; deduct again if it comes back.
    const adjustStock = (delta: number): void => {
      const target = itemById(sql, order.item_id);
      if (!target) return;
      const sizeStock = parseSizeStock(target.size_stock ?? "{}");
      if (order.size && sizeStock[order.size] !== undefined) {
        sizeStock[order.size] = Math.max(0, sizeStock[order.size] + delta);
        const total = Object.values(sizeStock).reduce((sum, n) => sum + n, 0);
        sql.exec("UPDATE ej_items SET stock = ?, size_stock = ? WHERE id = ?", total, JSON.stringify(sizeStock), target.id);
      } else {
        sql.exec("UPDATE ej_items SET stock = MAX(0, stock + ?) WHERE id = ?", delta, target.id);
      }
    };
    if (status === "cancelled" && order.status !== "cancelled") {
      adjustStock(order.qty);
    } else if (status !== "cancelled" && order.status === "cancelled") {
      adjustStock(-order.qty);
    }
    sql.exec("UPDATE ej_orders SET status = ? WHERE id = ?", status, order.id);
    return json({ ok: true });
  }

  const interestDeleteMatch = path.match(/^\/ej\/admin\/interest\/([a-f0-9]{16,64})\/delete$/);
  if (method === "POST" && interestDeleteMatch) {
    sql.exec("DELETE FROM ej_interest WHERE id = ?", interestDeleteMatch[1]);
    return json({ ok: true });
  }

  return json({ error: "not found" }, 404);
}
