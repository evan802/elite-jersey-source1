import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Eye,
  Heart,
  ImagePlus,
  LogOut,
  Package,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  compressImageFile,
  createEjItem,
  deleteEjInterest,
  deleteEjItem,
  ejAdminLogin,
  fetchEjSummary,
  formatEjPrice,
  getEjAdminPass,
  setEjAdminPass,
  setEjOrderStatus,
  updateEjItem,
  type EjItem,
  type EjItemInput,
  type EjOrder,
} from "@/lib/elitejersey";
import { EjBrand } from "@/pages/elitejersey/EjBrand";

const BLUE = "#3665f3";
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2.5 text-sm text-[#191919] outline-none focus:border-[#3665f3] focus:ring-2 focus:ring-[#3665f3]/20";

const ORDER_STATUSES: EjOrder["status"][] = ["pending", "shipped", "completed", "cancelled"];
const STATUS_COLORS: Record<EjOrder["status"], string> = {
  pending: "#f5af02",
  shipped: "#0064d2",
  completed: "#86b817",
  cancelled: "#9ca3af",
};

type Tab = "listings" | "orders" | "interest";

/**
 * Elite Jersey back office — George's admin panel. Manage listings (photos,
 * prices, stock), watch orders come in, and review buyer offers/interest.
 */
const EliteJerseyAdminPage = () => {
  const [authed, setAuthed] = useState<boolean>(() => getEjAdminPass().length > 0);
  const [tab, setTab] = useState<Tab>("listings");
  const [editing, setEditing] = useState<EjItem | "new" | null>(null);
  const queryClient = useQueryClient();

  const summary = useQuery({
    queryKey: ["ej-summary"],
    queryFn: () => fetchEjSummary(),
    enabled: authed,
    refetchInterval: 10000,
    retry: false,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["ej-summary"] });

  if (!authed) {
    return <LoginGate onSuccess={() => setAuthed(true)} />;
  }

  const stats = summary.data?.stats;

  return (
    <div className="min-h-screen bg-neutral-50 text-[#191919]" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <EjBrand tone="light" size={36} badge="Seller Hub" />
          <button
            type="button"
            onClick={() => {
              setEjAdminPass("");
              setAuthed(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-neutral-500"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
        <div className="mx-auto mt-2.5 flex max-w-5xl gap-2">
          {(
            [
              { id: "listings" as Tab, label: "Listings" },
              { id: "orders" as Tab, label: `Orders${stats && stats.openOrders > 0 ? ` (${stats.openOrders})` : ""}` },
              { id: "interest" as Tab, label: "Offers & Interest" },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                tab === t.id ? "bg-[#191919] text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Package className="h-4 w-4" />} label="Active listings" value={String(stats?.activeListings ?? "—")} />
          <StatCard icon={<Eye className="h-4 w-4" />} label="Total views" value={String(stats?.totalViews ?? "—")} />
          <StatCard icon={<ShoppingCart className="h-4 w-4" />} label="Open orders" value={String(stats?.openOrders ?? "—")} />
          <StatCard icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={stats ? formatEjPrice(stats.revenue) : "—"} />
        </div>

        {summary.isError && (
          <p className="mt-6 rounded-lg border border-[#e53238]/30 bg-[#e53238]/5 p-3 text-sm text-[#e53238]">
            Couldn't load your data — check your connection or log in again.
          </p>
        )}

        {tab === "listings" && (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Your listings</h2>
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: BLUE }}
              >
                <Plus className="h-4 w-4" /> New listing
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
              {(summary.data?.items ?? []).length === 0 && (
                <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                  No listings yet — tap "New listing" to add your first jersey.
                </p>
              )}
              {(summary.data?.items ?? []).map((item) => (
                <ListingRow key={item.id} item={item} onEdit={() => setEditing(item)} onChanged={refresh} />
              ))}
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section className="mt-6">
            <h2 className="text-base font-bold">Orders</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {(summary.data?.orders ?? []).length === 0 && (
                <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                  No orders yet — they'll appear here the moment a buyer checks out.
                </p>
              )}
              {(summary.data?.orders ?? []).map((order) => (
                <OrderRow key={order.id} order={order} onChanged={refresh} />
              ))}
            </div>
          </section>
        )}

        {tab === "interest" && (
          <section className="mt-6">
            <h2 className="text-base font-bold">Offers & interest</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {(summary.data?.interest ?? []).length === 0 && (
                <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                  No offers yet — buyer questions and offers land here with their contact info.
                </p>
              )}
              {(summary.data?.interest ?? []).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">
                        {entry.name} <span className="font-normal text-neutral-500">· {entry.email}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">on “{entry.itemTitle}” · {new Date(entry.ts).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => void deleteEjInterest(entry.id).then(refresh)}
                      className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-[#e53238]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {entry.offer > 0 && (
                    <p className="mt-2 inline-block rounded bg-[#86b817]/15 px-2 py-1 text-xs font-bold text-[#5a7d0f]">
                      Offered {formatEjPrice(entry.offer)}
                    </p>
                  )}
                  {entry.message && <p className="mt-2 text-sm text-neutral-700">“{entry.message}”</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {editing && (
        <ListingEditor
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{icon}{label}</p>
    <p className="mt-1 text-xl font-bold">{value}</p>
  </div>
);

const LoginGate = ({ onSuccess }: { onSuccess: () => void }) => {
  const [password, setPassword] = useState<string>("");
  const login = useMutation({
    mutationFn: async () => {
      const ok = await ejAdminLogin(password);
      if (!ok) throw new Error("Wrong password — try again.");
      setEjAdminPass(password);
    },
    onSuccess,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <form
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
      >
        <EjBrand tone="light" size={44} />
        <h1 className="mt-3 text-sm font-semibold text-neutral-600">Seller Hub — log in to manage your store</h1>
        <input
          className={`${inputClass} mt-4`}
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {login.isError && <p className="mt-2 text-xs font-medium text-[#e53238]">{(login.error as Error).message}</p>}
        <button type="submit" disabled={login.isPending || !password} className="mt-4 w-full rounded-full py-3 text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: BLUE }}>
          {login.isPending ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
};

const ListingRow = ({ item, onEdit, onChanged }: { item: EjItem; onEdit: () => void; onChanged: () => void }) => {
  const hasSizeStock = Object.keys(item.sizeStock ?? {}).length > 0;
  const stock = useMutation({
    mutationFn: (next: number) => updateEjItem(item.id, { stock: next }),
    onSuccess: onChanged,
  });
  const sizeStock = useMutation({
    mutationFn: (next: Record<string, number>) => updateEjItem(item.id, { sizeStock: next }),
    onSuccess: onChanged,
  });
  const bumpSize = (s: string, delta: number) => {
    const next = { ...item.sizeStock, [s]: Math.max(0, (item.sizeStock[s] ?? 0) + delta) };
    sizeStock.mutate(next);
  };
  const toggle = useMutation({
    mutationFn: () => updateEjItem(item.id, { status: item.status === "active" ? "draft" : "active" }),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: () => deleteEjItem(item.id),
    onSuccess: onChanged,
  });

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
        {item.images[0] ? (
          <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300"><Package className="h-6 w-6" /></div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-bold">{item.title}</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {formatEjPrice(item.price)} · {item.views} views
          {item.status === "draft" && <span className="ml-1.5 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold uppercase">draft</span>}
        </p>
        {hasSizeStock ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {Object.entries(item.sizeStock).map(([s, q]) => (
              <div key={s} className="flex items-center rounded-md border border-neutral-300 text-xs">
                <span className={`px-1.5 font-bold ${q === 0 ? "text-[#e53238]" : ""}`}>{s}</span>
                <button type="button" disabled={sizeStock.isPending} onClick={() => bumpSize(s, -1)} className="border-l border-neutral-200 px-1.5 py-0.5 font-bold text-neutral-500 hover:text-[#191919]">−</button>
                <span className={`min-w-5 text-center font-semibold ${q === 0 ? "text-[#e53238]" : ""}`}>{q}</span>
                <button type="button" disabled={sizeStock.isPending} onClick={() => bumpSize(s, 1)} className="px-1.5 py-0.5 font-bold text-neutral-500 hover:text-[#191919]">+</button>
              </div>
            ))}
            <span className="text-[10px] text-neutral-400">= {item.stock} total</span>
          </div>
        ) : (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Stock</span>
            <div className="flex items-center rounded-md border border-neutral-300">
              <button type="button" disabled={stock.isPending} onClick={() => stock.mutate(Math.max(0, item.stock - 1))} className="px-2 py-0.5 text-sm font-bold">−</button>
              <span className="min-w-7 text-center text-sm font-semibold">{item.stock}</span>
              <button type="button" disabled={stock.isPending} onClick={() => stock.mutate(item.stock + 1)} className="px-2 py-0.5 text-sm font-bold">+</button>
            </div>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="flex gap-1">
          <button type="button" aria-label="Edit" onClick={onEdit} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
          <button
            type="button"
            aria-label="Delete"
            onClick={() => {
              if (window.confirm(`Delete “${item.title}”? This can't be undone.`)) remove.mutate();
            }}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-[#e53238]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
            item.status === "active" ? "bg-[#86b817]/15 text-[#5a7d0f]" : "bg-neutral-200 text-neutral-600"
          }`}
        >
          {item.status === "active" ? "Live — tap to hide" : "Hidden — tap to publish"}
        </button>
      </div>
    </div>
  );
};

const OrderRow = ({ order, onChanged }: { order: EjOrder; onChanged: () => void }) => {
  const setStatus = useMutation({
    mutationFn: (status: EjOrder["status"]) => setEjOrderStatus(order.id, status),
    onSuccess: onChanged,
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{order.itemTitle}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            #{order.id.slice(0, 8).toUpperCase()} · {order.size ? `Size ${order.size} · ` : ""}Qty {order.qty} · {new Date(order.ts).toLocaleString()}
          </p>
        </div>
        <p className="text-lg font-bold">{formatEjPrice(order.total)}</p>
      </div>
      <div className="mt-2.5 rounded-lg bg-neutral-50 p-2.5 text-xs leading-relaxed text-neutral-700">
        <p><span className="font-bold">{order.buyerName}</span> · {order.buyerEmail}{order.buyerPhone ? ` · ${order.buyerPhone}` : ""}</p>
        <p className="mt-0.5">{order.address}</p>
        {order.note && <p className="mt-0.5 italic">“{order.note}”</p>}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[order.status] }} />
        <select
          value={order.status}
          onChange={(e) => setStatus.mutate(e.target.value as EjOrder["status"])}
          disabled={setStatus.isPending}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs font-semibold capitalize outline-none"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {order.status === "cancelled" && <span className="text-[11px] text-neutral-500">stock restored automatically</span>}
      </div>
    </div>
  );
};

const CONDITIONS = ["Brand New", "New with tags", "New without tags", "Pre-Owned — Excellent", "Pre-Owned — Good", "Vintage"];

interface SizeRow {
  name: string;
  qty: string;
}

const ListingEditor = ({ item, onClose, onSaved }: { item: EjItem | null; onClose: () => void; onSaved: () => void }) => {
  const [title, setTitle] = useState<string>(item?.title ?? "");
  const [category, setCategory] = useState<string>(item?.category ?? "");
  const [condition, setCondition] = useState<string>(item?.condition ?? "Pre-Owned — Excellent");
  const [description, setDescription] = useState<string>(item?.description ?? "");
  const [price, setPrice] = useState<string>(item ? String(item.price) : "");
  const [stock, setStock] = useState<string>(item ? String(item.stock) : "1");
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(() => {
    if (item && Object.keys(item.sizeStock ?? {}).length > 0) {
      return Object.entries(item.sizeStock).map(([name, qty]) => ({ name, qty: String(qty) }));
    }
    if (item) return item.sizes.map((name) => ({ name, qty: "" }));
    return ["S", "M", "L", "XL"].map((name) => ({ name, qty: "" }));
  });
  const [images, setImages] = useState<string[]>(item?.images ?? []);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const namedRows = sizeRows.filter((r) => r.name.trim());
  const usesPerSize = namedRows.some((r) => r.qty.trim() !== "");
  const perSizeTotal = namedRows.reduce((sum, r) => sum + Math.max(0, Math.floor(Number(r.qty) || 0)), 0);

  const setRow = (index: number, patch: Partial<SizeRow>) => {
    setSizeRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const save = useMutation({
    mutationFn: async () => {
      const sizeStock: Record<string, number> = usesPerSize
        ? Object.fromEntries(namedRows.map((r) => [r.name.trim(), Math.max(0, Math.floor(Number(r.qty) || 0))]))
        : {};
      const input: EjItemInput = {
        title,
        category,
        condition,
        description,
        price: Number(price) || 0,
        stock: usesPerSize ? perSizeTotal : Math.max(0, Math.floor(Number(stock) || 0)),
        sizes: namedRows.map((r) => r.name.trim()),
        sizeStock,
        images,
        status: item?.status ?? "active",
      };
      if (item) await updateEjItem(item.id, input);
      else await createEjItem(input);
    },
    onSuccess: onSaved,
  });

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploadError("");
    try {
      const next: string[] = [];
      for (const file of Array.from(files).slice(0, 10 - images.length)) {
        next.push(await compressImageFile(file));
      }
      setImages((prev) => [...prev, ...next].slice(0, 10));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed — try a different photo.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold">{item ? "Edit listing" : "New listing"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
        </div>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          {/* Photos */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Photos (up to 10)</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={img.slice(0, 40) + String(i)} className="relative h-20 w-20">
                  <img src={img} alt="" className="h-full w-full rounded-lg border border-neutral-200 object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-[#191919] p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">COVER</span>}
                </div>
              ))}
              {images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-[#3665f3] hover:text-[#3665f3]"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Add photo</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addFiles(e.target.files)} />
            </div>
            <div className="mt-2 flex gap-2">
              <input className={inputClass} placeholder="…or paste an image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <button
                type="button"
                disabled={!imageUrl.trim() || images.length >= 10}
                onClick={() => {
                  setImages((prev) => [...prev, imageUrl.trim()].slice(0, 10));
                  setImageUrl("");
                }}
                className="shrink-0 rounded-md border border-neutral-300 px-3 text-xs font-bold disabled:opacity-40"
              >
                Add
              </button>
            </div>
            {uploadError && <p className="mt-1.5 text-xs font-medium text-[#e53238]">{uploadError}</p>}
          </div>

          <input className={inputClass} placeholder="Title — e.g. Argentina 2022 Home Jersey, Size L" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2.5">
            <input className={inputClass} placeholder="Category — e.g. National Teams" value={category} onChange={(e) => setCategory(e.target.value)} />
            <select className={inputClass} value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <input className={inputClass} type="number" min="0" step="0.01" placeholder="Price (USD)" value={price} onChange={(e) => setPrice(e.target.value)} required />
            {usesPerSize ? (
              <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-600">
                Total stock: <span className="ml-1 font-bold text-[#191919]">{perSizeTotal}</span>
              </div>
            ) : (
              <input className={inputClass} type="number" min="0" step="1" placeholder="Total stock" value={stock} onChange={(e) => setStock(e.target.value)} required />
            )}
          </div>

          {/* Sizes & per-size quantities */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sizes &amp; quantity per size</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {sizeRows.map((row, i) => {
                const isSoldOut = row.qty.trim() === "0";
                return (
                  <div
                    key={`size-box-${String(i)}`}
                    className={`relative flex w-[76px] flex-col items-center rounded-lg border pb-1.5 pt-2 ${isSoldOut ? "border-[#e53238] bg-red-50" : "border-neutral-300 bg-white"}`}
                  >
                    <button
                      type="button"
                      aria-label={`Remove size ${row.name || String(i + 1)}`}
                      onClick={() => setSizeRows((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-[#191919] p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <input
                      className={`w-full bg-transparent text-center text-sm font-bold uppercase outline-none placeholder:font-normal placeholder:normal-case placeholder:text-neutral-300 ${isSoldOut ? "text-[#e53238] line-through" : "text-[#191919]"}`}
                      placeholder="Size"
                      aria-label={`Size name ${String(i + 1)}`}
                      value={row.name}
                      onChange={(e) => setRow(i, { name: e.target.value })}
                    />
                    <input
                      className="mt-1.5 w-14 rounded-md border border-neutral-300 bg-neutral-50 px-1 py-1 text-center text-sm font-semibold text-[#191919] outline-none focus:border-[#3665f3] focus:ring-2 focus:ring-[#3665f3]/20"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      placeholder="0"
                      aria-label={`Quantity for size ${row.name || String(i + 1)}`}
                      value={row.qty}
                      onChange={(e) => setRow(i, { qty: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setRow(i, { qty: isSoldOut ? "" : "0" })}
                      className={`mt-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                        isSoldOut ? "bg-[#e53238] text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                      }`}
                    >
                      Sold out
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setSizeRows((prev) => [...prev, { name: "", qty: "" }])}
                disabled={sizeRows.length >= 12}
                className="flex w-[76px] flex-col items-center justify-center gap-1 self-stretch rounded-lg border-2 border-dashed border-neutral-300 py-2 text-neutral-400 hover:border-[#3665f3] hover:text-[#3665f3] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                <span className="text-[10px] font-bold">Add size</span>
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-400">Type how many you have of each size — or tap “Sold out” to keep a size visible but unbuyable. Leave all quantities blank to use one total stock number instead.</p>
          </div>
          <textarea className={inputClass} rows={4} placeholder="Description — condition details, measurements, authenticity notes…" value={description} onChange={(e) => setDescription(e.target.value)} />

          {save.isError && <p className="text-xs font-medium text-[#e53238]">{(save.error as Error).message}</p>}
          <button type="submit" disabled={save.isPending || !title.trim()} className="w-full rounded-full py-3 text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: BLUE }}>
            {save.isPending ? "Saving…" : item ? "Save changes" : "Publish listing"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EliteJerseyAdminPage;
