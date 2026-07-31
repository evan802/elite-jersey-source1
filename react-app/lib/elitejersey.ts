/**
 * Elite Jersey client store — API layer for the storefront (/ej) and
 * George's admin back office (/ej/admin). Talks to the TouchBridge backend
 * where the ej_* tables live.
 */

const BACKEND_URL: string = (import.meta.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL as string | undefined) ?? "";

export interface EjItem {
  id: string;
  title: string;
  category: string;
  condition: string;
  description: string;
  price: number;
  stock: number;
  sizes: string[];
  /** Per-size available quantity (e.g. { S: 2, M: 1 }). Empty = one shared stock pool. */
  sizeStock: Record<string, number>;
  images: string[];
  imageCount: number;
  status: "active" | "draft";
  views: number;
  createdTs: number;
}

export interface EjOrder {
  id: string;
  itemId: string;
  itemTitle: string;
  size: string;
  qty: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  address: string;
  note: string;
  total: number;
  status: "pending" | "shipped" | "completed" | "cancelled";
  ts: number;
}

export interface EjInterest {
  id: string;
  itemId: string;
  itemTitle: string;
  name: string;
  email: string;
  message: string;
  offer: number;
  ts: number;
}

export interface EjStats {
  activeListings: number;
  totalViews: number;
  openOrders: number;
  revenue: number;
}

export interface EjSummary {
  items: EjItem[];
  orders: EjOrder[];
  interest: EjInterest[];
  stats: EjStats;
}

const EJ_PASS_KEY = "ej-admin-pass";

export function getEjAdminPass(): string {
  try {
    return localStorage.getItem(EJ_PASS_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setEjAdminPass(pass: string): void {
  try {
    if (pass) localStorage.setItem(EJ_PASS_KEY, pass);
    else localStorage.removeItem(EJ_PASS_KEY);
  } catch {
    // storage unavailable — session only
  }
}

function adminHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "X-EJ-Admin": getEjAdminPass() };
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong — try again.");
  return data;
}

export async function fetchEjItems(): Promise<EjItem[]> {
  const res = await fetch(`${BACKEND_URL}/ej/items`);
  const data = await parseOrThrow<{ items: EjItem[] }>(res);
  return data.items;
}

export async function fetchEjItem(id: string): Promise<EjItem> {
  const res = await fetch(`${BACKEND_URL}/ej/items/${id}`);
  const data = await parseOrThrow<{ item: EjItem }>(res);
  return data.item;
}

export interface EjOrderInput {
  itemId: string;
  size: string;
  qty: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  note: string;
}

export async function placeEjOrder(input: EjOrderInput): Promise<{ orderId: string; total: number }> {
  const res = await fetch(`${BACKEND_URL}/ej/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow<{ orderId: string; total: number }>(res);
}

export interface EjInterestInput {
  itemId: string;
  name: string;
  email: string;
  message: string;
  offer: number;
}

export async function sendEjInterest(input: EjInterestInput): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/ej/interest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await parseOrThrow<{ ok: boolean }>(res);
}

export async function ejAdminLogin(password: string): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/ej/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

export async function fetchEjSummary(): Promise<EjSummary> {
  const res = await fetch(`${BACKEND_URL}/ej/admin/summary`, { headers: adminHeaders() });
  return parseOrThrow<EjSummary>(res);
}

export interface EjItemInput {
  title: string;
  category: string;
  condition: string;
  description: string;
  price: number;
  stock: number;
  sizes: string[];
  /** Per-size quantities; when non-empty the backend derives sizes + total stock from it. */
  sizeStock?: Record<string, number>;
  images: string[];
  status: "active" | "draft";
}

export async function createEjItem(input: EjItemInput): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/ej/admin/items`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  await parseOrThrow<{ ok: boolean }>(res);
}

export async function updateEjItem(id: string, input: Partial<EjItemInput>): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/ej/admin/items/${id}`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  await parseOrThrow<{ ok: boolean }>(res);
}

export async function deleteEjItem(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/ej/admin/items/${id}/delete`, { method: "POST", headers: adminHeaders() });
  await parseOrThrow<{ ok: boolean }>(res);
}

export async function setEjOrderStatus(id: string, status: EjOrder["status"]): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/ej/admin/orders/${id}`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
  await parseOrThrow<{ ok: boolean }>(res);
}

export async function deleteEjInterest(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/ej/admin/interest/${id}/delete`, { method: "POST", headers: adminHeaders() });
  await parseOrThrow<{ ok: boolean }>(res);
}

/**
 * Compresses an uploaded photo to a compact JPEG data URL (max 900px edge)
 * so listing images stay well under the backend payload limit.
 */
export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a valid image."));
      img.onload = () => {
        const maxEdge = 900;
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image processing unavailable in this browser."));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function formatEjPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
