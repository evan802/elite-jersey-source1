/* ============================================================
   ELITE JERSEY - COMPLETE PRODUCTION SOURCE CODE
   All frontend + backend source in one file.
   Built by TouchBridge Studios for George Yermak / Elite Jersey.
   ============================================================

   LIVE API: https://tbstudios-backend.rork.app

   FILE MAP
     FILE 1: elitejersey.ts               Storefront + admin API layer (frontend)
     FILE 2: EjBrand.tsx                  Brand tokens, palette, shared UI atoms
     FILE 3: EjHomeSections.tsx           Homepage sections, club detection, hero
     FILE 4: EliteJerseyStorePage.tsx     Public storefront page
     FILE 5: EliteJerseyAdminPage.tsx     George's admin back office
     FILE 6: elite-jersey.ts              Backend API + database (Cloudflare Worker)

   SECURITY NOTE
     This file contains NO passwords and NO API keys. The admin
     password is read from the EJ_ADMIN_PASSWORD server secret and
     never appears in source code, so this bundle is safe to share.
   ============================================================ */


============================================================
  FILE 1: elitejersey.ts
  Storefront + admin API layer (frontend)
  source path: web/src/lib/elitejersey.ts
============================================================

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


============================================================
  FILE 2: EjBrand.tsx
  Brand tokens, palette, shared UI atoms
  source path: web/src/pages/elitejersey/EjBrand.tsx
============================================================

/**
 * Shared Elite Jersey brand mark — used on the storefront and the Seller Hub
 * so the logo always stays in sync across both sides of the product.
 */

export const EJ_LOGO_URL =
  "https://r2-pub.rork.com/projects/yjqgibkbwlxfph55bsglg/assets/2c7af047-e1cc-4812-93d4-13aea076aab2.png";

const VOLT = "#C8F231";

interface EjBrandProps {
  /** "dark" renders light text for dark backgrounds; "light" renders dark text. */
  tone?: "dark" | "light";
  /** Pixel size of the crest mark. */
  size?: number;
  /** Optional badge rendered after the wordmark (e.g. "Seller Hub"). */
  badge?: string;
  onClick?: () => void;
}

export const EjBrand = ({ tone = "dark", size = 40, badge, onClick }: EjBrandProps) => {
  const textColor = tone === "dark" ? "#F2F4EF" : "#101310";
  const content = (
    <span className="flex select-none items-center gap-2.5">
      <img
        src={EJ_LOGO_URL}
        alt="Elite Jersey crest"
        style={{ height: size, width: size }}
        className="shrink-0 object-contain drop-shadow-[0_2px_10px_rgba(200,242,49,0.35)] transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"
        draggable={false}
      />
      <span className="font-display uppercase leading-none tracking-wide" style={{ color: textColor, fontSize: size * 0.52 }}>
        Elite<span style={{ color: tone === "dark" ? VOLT : "#7A9A0E" }}>Jersey</span>
      </span>
      {badge && (
        <span
          className="rounded-full px-2 py-0.5 font-monotb text-[9px] font-bold uppercase tracking-[0.15em]"
          style={tone === "dark" ? { backgroundColor: VOLT, color: "#0B0D0B" } : { backgroundColor: "#101310", color: VOLT }}
        >
          {badge}
        </span>
      )}
    </span>
  );

  if (!onClick) return <span className="group inline-flex items-center">{content}</span>;

  return (
    <button type="button" onClick={onClick} className="group inline-flex items-center">
      {content}
    </button>
  );
};


============================================================
  FILE 3: EjHomeSections.tsx
  Homepage sections, club detection, hero
  source path: web/src/pages/elitejersey/EjHomeSections.tsx
============================================================

import { animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Eye,
  Flame,
  Heart,
  MessageCircle,
  Package,
  Shield,
  Sparkles,
  Trophy,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { formatEjPrice, type EjItem } from "@/lib/elitejersey";
import { EJ_LOGO_URL } from "@/pages/elitejersey/EjBrand";

/* ---------------------------------------------------------------- palette */
const VOLT = "#C8F231";
const INK = "#0B0D0B";
const SURFACE = "#151815";
const LINE = "#262B26";
const PAPER = "#F4F5F1";
const MUTED = "#A8B0A5";
const DIM = "#6E756C";

/** George's verified eBay seller profile — the proof behind the shop. */
export const EBAY_URL = "https://www.ebay.com/usr/elite_jersey_us";

/** The eBay wordmark rendered in its four brand colors. */
export const EbayWord = ({ className }: { className?: string }) => (
  <span className={`normal-case ${className ?? ""}`} style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
    <span style={{ color: "#E53238" }}>e</span>
    <span style={{ color: "#0064D2" }}>b</span>
    <span style={{ color: "#F5AF02" }}>a</span>
    <span style={{ color: "#86B817" }}>y</span>
  </span>
);

/* ------------------------------------------------------------- club atlas */
export interface ClubDef {
  id: string;
  name: string;
  keys: string[];
  /** Brand gradient for banners and cards without a photo. */
  colors: [string, string];
  /** Official crest, hotlinked from Wikimedia. Falls back to a monogram if it fails. */
  crest: string;
  /** Founding year shown as "Est. XXXX" on team banners. */
  est: number;
}

const WIKI = "https://upload.wikimedia.org/wikipedia";

/** Ordered — earlier entries win ties (Inter before Milan so "Inter Milan" maps right). */
const CLUB_DEFS: ClubDef[] = [
  { id: "inter", name: "Inter Milan", keys: ["inter milan", "inter "], colors: ["#0068A8", "#001F3F"], crest: `${WIKI}/commons/0/05/FC_Internazionale_Milano_2021.svg`, est: 1908 },
  { id: "ac-milan", name: "AC Milan", keys: ["ac milan", "milan"], colors: ["#FB090B", "#1A1A1A"], crest: `${WIKI}/commons/d/d0/Logo_of_AC_Milan.svg`, est: 1899 },
  { id: "man-utd", name: "Manchester United", keys: ["man utd", "manchester united", "man united", "manchester utd"], colors: ["#DA291C", "#3B0A08"], crest: `${WIKI}/en/7/7a/Manchester_United_FC_crest.svg`, est: 1878 },
  { id: "man-city", name: "Manchester City", keys: ["man city", "manchester city"], colors: ["#6CABDD", "#1C3549"], crest: `${WIKI}/en/e/eb/Manchester_City_FC_badge.svg`, est: 1880 },
  { id: "arsenal", name: "Arsenal", keys: ["arsenal"], colors: ["#EF0107", "#3F0203"], crest: `${WIKI}/en/5/53/Arsenal_FC.svg`, est: 1886 },
  { id: "chelsea", name: "Chelsea", keys: ["chelsea"], colors: ["#034694", "#021D3D"], crest: `${WIKI}/en/c/cc/Chelsea_FC.svg`, est: 1905 },
  { id: "liverpool", name: "Liverpool", keys: ["liverpool"], colors: ["#C8102E", "#38040D"], crest: `${WIKI}/en/0/0c/Liverpool_FC.svg`, est: 1892 },
  { id: "tottenham", name: "Tottenham", keys: ["tottenham", "spurs", "hotspur"], colors: ["#132257", "#080E24"], crest: `${WIKI}/en/b/b4/Tottenham_Hotspur.svg`, est: 1882 },
  { id: "barcelona", name: "FC Barcelona", keys: ["barcelona", "barça", "barca"], colors: ["#A50044", "#004D98"], crest: `${WIKI}/en/4/47/FC_Barcelona_%28crest%29.svg`, est: 1899 },
  { id: "real-madrid", name: "Real Madrid", keys: ["real madrid"], colors: ["#B8A24A", "#1F2A5A"], crest: `${WIKI}/en/5/56/Real_Madrid_CF.svg`, est: 1902 },
  { id: "atletico", name: "Atlético Madrid", keys: ["atletico", "atlético"], colors: ["#CB3524", "#27357A"], crest: `${WIKI}/en/f/f9/Atletico_Madrid_Logo_2024.svg`, est: 1903 },
  { id: "bayern", name: "Bayern Munich", keys: ["bayern"], colors: ["#DC052D", "#38010B"], crest: `${WIKI}/commons/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg`, est: 1900 },
  { id: "dortmund", name: "Borussia Dortmund", keys: ["dortmund", "bvb"], colors: ["#FDE100", "#4A4200"], crest: `${WIKI}/commons/6/67/Borussia_Dortmund_logo.svg`, est: 1909 },
  { id: "psg", name: "PSG", keys: ["psg", "paris saint", "paris sg"], colors: ["#004170", "#B41F30"], crest: `${WIKI}/en/a/a7/Paris_Saint-Germain_F.C..svg`, est: 1970 },
  { id: "juventus", name: "Juventus", keys: ["juventus", "juve"], colors: ["#3A3A3A", "#0A0A0A"], crest: `${WIKI}/commons/e/ed/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg`, est: 1897 },
  { id: "napoli", name: "Napoli", keys: ["napoli"], colors: ["#12A0D7", "#053B51"], crest: `${WIKI}/commons/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg`, est: 1926 },
  { id: "roma", name: "AS Roma", keys: ["as roma", "roma"], colors: ["#8E1F2F", "#5A1520"], crest: `${WIKI}/en/f/f7/AS_Roma_logo_%282017%29.svg`, est: 1927 },
  { id: "ajax", name: "Ajax", keys: ["ajax"], colors: ["#D2122E", "#3D0510"], crest: `${WIKI}/commons/0/0d/Logo_AFC_Ajax_%281928-1991%2C_2025-%29.png`, est: 1900 },
  { id: "celtic", name: "Celtic", keys: ["celtic"], colors: ["#018749", "#013B20"], crest: `${WIKI}/en/7/71/Celtic_FC_crest.svg`, est: 1887 },
  { id: "brazil", name: "Brazil", keys: ["brazil", "brasil"], colors: ["#009C3B", "#0A5C2A"], crest: `${WIKI}/commons/3/32/Confedera%C3%A7%C3%A3o_Brasileira_de_Futebol_logo_%282020%29.svg`, est: 1914 },
  { id: "argentina", name: "Argentina", keys: ["argentina"], colors: ["#75AADB", "#2A4C68"], crest: `${WIKI}/en/c/c1/Argentina_national_football_team_logo.svg`, est: 1893 },
  { id: "france", name: "France", keys: ["france", "les bleus"], colors: ["#21304D", "#0C121F"], crest: `${WIKI}/en/1/12/France_national_football_team_seal.svg`, est: 1919 },
  { id: "germany", name: "Germany", keys: ["germany", "deutschland"], colors: ["#2B2B2B", "#101010"], crest: `${WIKI}/commons/e/e3/DFBEagle.svg`, est: 1900 },
  { id: "italy", name: "Italy", keys: ["italy", "italia", "azzurri"], colors: ["#0064AA", "#022A46"], crest: `${WIKI}/commons/b/bf/Logo_Italy_National_Football_Team_-_2023.svg`, est: 1898 },
  { id: "portugal", name: "Portugal", keys: ["portugal"], colors: ["#E42518", "#046A38"], crest: `${WIKI}/en/e/e4/Portugal_national_football_team_logo.svg`, est: 1914 },
  { id: "england", name: "England", keys: ["england"], colors: ["#26355C", "#101A33"], crest: `${WIKI}/en/8/8b/England_national_football_team_crest.svg`, est: 1863 },
  { id: "spain", name: "Spain", keys: ["spain", "españa", "espana"], colors: ["#AA151B", "#3E0709"], crest: `${WIKI}/en/3/39/Spain_national_football_team_crest.svg`, est: 1913 },
  { id: "mexico", name: "Mexico", keys: ["mexico", "méxico"], colors: ["#006847", "#02291D"], crest: `${WIKI}/en/3/3f/Mexico_national_football_team_crest.svg`, est: 1927 },
  { id: "usa", name: "USA", keys: ["usmnt", "uswnt", "usa ", "united states"], colors: ["#B22234", "#232D5B"], crest: `${WIKI}/commons/1/1e/United_States_Soccer_Federation_logo.svg`, est: 1913 },
  { id: "netherlands", name: "Netherlands", keys: ["netherlands", "holland", "oranje"], colors: ["#F36C21", "#57230A"], crest: `${WIKI}/en/7/78/Netherlands_national_football_team_logo.svg`, est: 1889 },
  { id: "japan", name: "Japan", keys: ["japan"], colors: ["#1D2088", "#0A0B33"], crest: `${WIKI}/en/8/84/Japan_national_football_team_crest.svg`, est: 1921 },
];

/** George's featured clubs (from his eBay-era storefront) — shown on the wall even before stock lands. */
export const FEATURED_CLUB_IDS = ["man-utd", "ac-milan", "barcelona", "arsenal", "chelsea", "roma", "bayern", "real-madrid"];

/** Looks a club up by its id. */
export function clubById(id: string): ClubDef | null {
  return CLUB_DEFS.find((c) => c.id === id) ?? null;
}

/** Maps a listing title to the club it belongs to, if any. */
export function detectClub(title: string): ClubDef | null {
  const t = ` ${title.toLowerCase()} `;
  for (const club of CLUB_DEFS) {
    if (club.keys.some((k) => t.includes(k))) return club;
  }
  return null;
}

export interface ClubStat {
  club: ClubDef;
  count: number;
  cover: string;
}

/** Groups live inventory into club collections, biggest first. */
export function buildClubStats(items: EjItem[]): ClubStat[] {
  const map = new Map<string, ClubStat>();
  for (const item of items) {
    const club = detectClub(item.title);
    if (!club) continue;
    const existing = map.get(club.id);
    if (existing) {
      existing.count += 1;
      if (!existing.cover && item.images[0]) existing.cover = item.images[0];
    } else {
      map.set(club.id, { club, count: 1, cover: item.images[0] ?? "" });
    }
  }
  const featIdx = (id: string) => {
    const i = FEATURED_CLUB_IDS.indexOf(id);
    return i === -1 ? 99 : i;
  };
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || featIdx(a.club.id) - featIdx(b.club.id) || a.club.name.localeCompare(b.club.name),
  );
}

/* ------------------------------------------------------------ crest badge */
/** White plate holding the club crest; falls back to a monogram if the image fails. */
export const CrestBadge = ({ club, className }: { club: ClubDef; className?: string }) => {
  const [failed, setFailed] = useState<boolean>(false);
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_14px_34px_-12px_rgba(0,0,0,0.65)] ${className ?? "h-20 w-20"}`}>
      {club.crest && !failed ? (
        <img
          src={club.crest}
          alt={`${club.name} crest`}
          className="h-[68%] w-[68%] object-contain"
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-display text-lg uppercase leading-none" style={{ color: club.colors[0] }}>
          {club.name.slice(0, 3)}
        </span>
      )}
    </span>
  );
};

/** Club-colored stand-in for kits whose photos haven't been uploaded yet. */
export const JerseyPlaceholder = ({ title, dense }: { title: string; dense?: boolean }) => {
  const club = detectClub(title);
  const colors: [string, string] = club?.colors ?? ["#20261F", "#101310"];
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-2.5 overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)` }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "repeating-linear-gradient(-45deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 12px)" }}
      />
      {club ? (
        <CrestBadge club={club} className={dense ? "h-14 w-14" : "h-20 w-20"} />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/30">
          <Package className="h-7 w-7 text-white/70" />
        </span>
      )}
      {!dense && (
        <span className="rounded-full bg-black/35 px-3 py-1 font-monotb text-[9px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
          Photos on request
        </span>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ count-up */
function useCountUp(target: number, duration = 1.4): number {
  const [value, setValue] = useState<number>(0);
  const prev = useRef<number>(0);
  useEffect(() => {
    const controls = animate(prev.current, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    prev.current = target;
    return () => controls.stop();
  }, [target, duration]);
  return value;
}

/* ------------------------------------------------------- section heading */
export const SectionHeading = ({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <motion.p
        initial={{ opacity: 0, x: -16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 font-monotb text-[11px] font-bold uppercase tracking-[0.3em]"
        style={{ color: VOLT }}
      >
        <span className="inline-block h-[2px] w-6" style={{ backgroundColor: VOLT }} />
        {kicker}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, delay: 0.06 }}
        className="mt-2 font-display text-3xl uppercase leading-none tracking-wide sm:text-5xl"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="mt-2.5 max-w-lg text-sm leading-relaxed"
          style={{ color: MUTED }}
        >
          {sub}
        </motion.p>
      )}
    </div>
    {right}
  </div>
);

/* ------------------------------------------------------------------ hero */
const HeroCard = ({
  item,
  onOpen,
  className,
  rotate,
  float,
  delay,
  x,
  y,
  badge,
}: {
  item: EjItem;
  onOpen: (id: string) => void;
  className: string;
  rotate: number;
  float: number;
  delay: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  badge?: string;
}) => (
  <motion.div style={{ x, y }} className={`absolute ${className}`}>
    <motion.button
      type="button"
      onClick={() => onOpen(item.id)}
      initial={{ opacity: 0, y: 60, rotate: rotate * 2.2, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, rotate, scale: 1 }}
      transition={{ type: "spring", stiffness: 70, damping: 14, delay }}
      whileHover={{ scale: 1.04, rotate: 0, zIndex: 30 }}
      className="group relative block w-full overflow-hidden rounded-2xl border-2 text-left shadow-[0_30px_60px_-24px_rgba(0,0,0,0.8)]"
      style={{ borderColor: LINE, backgroundColor: PAPER }}
    >
      <motion.div
        animate={{ y: [0, -float, 0] }}
        transition={{ repeat: Infinity, duration: 5 + delay * 3, ease: "easeInOut" }}
        className="aspect-[4/5] w-full"
      >
        {item.images[0] ? (
          <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" draggable={false} />
        ) : (
          <JerseyPlaceholder title={item.title} dense />
        )}
      </motion.div>
      {badge && (
        <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 font-monotb text-[10px] font-bold uppercase tracking-[0.14em]" style={{ backgroundColor: INK, color: VOLT }}>
          {badge}
        </span>
      )}
      <span
        className="absolute bottom-3 right-3 rounded-full px-3 py-1.5 font-display text-sm shadow-lg"
        style={{ backgroundColor: VOLT, color: INK }}
      >
        {formatEjPrice(item.price)}
      </span>
      <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 transition-transform duration-300 group-hover:translate-y-0">
        <span className="line-clamp-1 text-xs font-bold text-white">{item.title}</span>
      </span>
    </motion.button>
  </motion.div>
);

export const EjHero = ({
  items,
  clubCount,
  onShop,
  onClubs,
  onOpen,
}: {
  items: EjItem[];
  clubCount: number;
  onShop: () => void;
  onClubs: () => void;
  onOpen: (id: string) => void;
}) => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 16 });
  const sy = useSpring(my, { stiffness: 50, damping: 16 });
  const layerA_x = useTransform(sx, (v) => v * 18);
  const layerA_y = useTransform(sy, (v) => v * 12);
  const layerB_x = useTransform(sx, (v) => v * -26);
  const layerB_y = useTransform(sy, (v) => v * -16);
  const layerC_x = useTransform(sx, (v) => v * 34);
  const layerC_y = useTransform(sy, (v) => v * -24);

  const featured = useMemo(() => {
    const score = (i: EjItem): number => (i.stock > 0 ? 2 : 0) + (i.images[0] ? 1 : 0);
    return [...items].sort((a, b) => score(b) - score(a)).slice(0, 3);
  }, [items]);

  const kitCount = useCountUp(items.length);
  const clubs = useCountUp(clubCount);
  const sold = useCountUp(800, 1.8);

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-3xl border"
      style={{ borderColor: LINE, backgroundColor: SURFACE }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {/* atmosphere */}
      <div className="ej-glow pointer-events-none absolute -right-24 -top-24 h-[480px] w-[480px] rounded-full" style={{ background: `radial-gradient(circle, ${VOLT}2E 0%, transparent 62%)` }} />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full" style={{ background: `radial-gradient(circle, ${VOLT}14 0%, transparent 60%)` }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`, backgroundSize: "44px 44px" }} />
      <motion.p
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.04 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="pointer-events-none absolute -bottom-8 left-0 select-none whitespace-nowrap font-display text-[190px] uppercase leading-none tracking-tight text-white"
      >
        Elite Jersey Elite Jersey
      </motion.p>

      <div className="relative grid gap-6 px-6 py-12 sm:px-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:py-16 xl:px-14">
        {/* -------- left: copy -------- */}
        <div className="flex flex-col justify-center">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 font-monotb text-[11px] font-bold uppercase tracking-[0.3em]"
            style={{ color: VOLT }}
          >
            <Flame className="h-3.5 w-3.5" /> The kit vault is open
          </motion.p>

          <h1 className="mt-4 font-display text-5xl uppercase leading-[0.92] sm:text-6xl xl:text-7xl">
            {["Wear", "the"].map((w, i) => (
              <motion.span
                key={w}
                initial={{ opacity: 0, y: 44 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                className="mr-[0.22em] inline-block"
              >
                {w}
              </motion.span>
            ))}
            <br />
            <motion.span
              initial={{ opacity: 0, y: 44 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative inline-block"
              style={{ color: VOLT }}
            >
              legend.
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                className="absolute -bottom-1.5 left-0 h-2 w-full origin-left rounded-full"
                style={{ backgroundColor: VOLT }}
              />
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
            className="mt-5 max-w-md text-[15px] leading-relaxed"
            style={{ color: MUTED }}
          >
            Hand-picked club &amp; national team jerseys — collector prices, shipped fast from New Jersey. Every kit tells a story.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.44 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <motion.button
              type="button"
              onClick={onShop}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-full px-7 py-3.5 font-display text-sm uppercase tracking-wide shadow-[0_10px_40px_-10px_rgba(200,242,49,0.55)]"
              style={{ backgroundColor: VOLT, color: INK }}
            >
              Shop by team
            </motion.button>
            <motion.button
              type="button"
              onClick={onClubs}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-full border-2 px-6 py-3 font-display text-sm uppercase tracking-wide transition-colors hover:bg-white/5"
              style={{ borderColor: LINE, color: "#F2F4EF" }}
            >
              Meet the seller
            </motion.button>
          </motion.div>

          {/* live stats */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-9 flex items-center gap-7 border-t pt-6"
            style={{ borderColor: LINE }}
          >
            {[
              { n: String(kitCount), label: "kits in the vault" },
              { n: String(clubs), label: "clubs & nations" },
              { n: `${String(sold)}+`, label: "sold on eBay" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl leading-none" style={{ color: VOLT }}>{s.n}</p>
                <p className="mt-1 font-monotb text-[10px] uppercase tracking-[0.16em]" style={{ color: DIM }}>{s.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs"
            style={{ color: MUTED }}
          >
            <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" style={{ color: VOLT }} /> Free shipping</span>
            <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" style={{ color: VOLT }} /> Buyer protection</span>
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5" style={{ color: VOLT }} /> Top-rated on <EbayWord /></span>
          </motion.div>
        </div>

        {/* -------- right: floating jersey collage -------- */}
        <div className="relative hidden min-h-[460px] lg:block">
          {/* rotating dotted orbit */}
          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-25"
            style={{ borderColor: VOLT }}
          />
          <motion.div
            aria-hidden
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.9 }}
            className="absolute right-2 top-4 z-20 flex h-[86px] w-[86px] items-center justify-center rounded-full border-2 text-center font-monotb text-[9px] font-bold uppercase leading-tight tracking-[0.14em]"
            style={{ borderColor: VOLT, color: VOLT, backgroundColor: `${INK}D9` }}
          >
            New<br />drops<br />weekly
          </motion.div>

          {featured.length > 0 ? (
            <>
              {featured[0] && (
                <HeroCard item={featured[0]} onOpen={onOpen} className="left-1/2 top-1/2 z-10 w-[54%] -translate-x-1/2 -translate-y-1/2" rotate={-2.5} float={10} delay={0.25} x={layerA_x} y={layerA_y} badge="Featured" />
              )}
              {featured[1] && (
                <HeroCard item={featured[1]} onOpen={onOpen} className="left-[2%] top-[8%] w-[34%]" rotate={-8} float={14} delay={0.45} x={layerB_x} y={layerB_y} />
              )}
              {featured[2] && (
                <HeroCard item={featured[2]} onOpen={onOpen} className="bottom-[4%] right-[1%] w-[36%]" rotate={7} float={12} delay={0.6} x={layerC_x} y={layerC_y} />
              )}
            </>
          ) : (
            <motion.div style={{ x: layerA_x, y: layerA_y }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.img
                src={EJ_LOGO_URL}
                alt="Elite Jersey crest"
                animate={{ y: [0, -14, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="h-56 w-56 object-contain drop-shadow-[0_20px_60px_rgba(200,242,49,0.4)]"
                draggable={false}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* mobile mini collage */}
      {featured.length > 0 && (
        <div className="relative -mt-4 flex gap-3 overflow-x-auto px-6 pb-8 lg:hidden">
          {featured.map((f, i) => (
            <motion.button
              key={f.id}
              type="button"
              onClick={() => onOpen(f.id)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="relative w-36 shrink-0 overflow-hidden rounded-2xl border"
              style={{ borderColor: LINE, backgroundColor: PAPER }}
            >
              <div className="aspect-[4/5]">
                {f.images[0] ? (
                  <img src={f.images[0]} alt={f.title} className="h-full w-full object-cover" />
                ) : (
                  <JerseyPlaceholder title={f.title} dense />
                )}
              </div>
              <span className="absolute bottom-2 right-2 rounded-full px-2 py-0.5 font-display text-xs" style={{ backgroundColor: VOLT, color: INK }}>
                {formatEjPrice(f.price)}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
};

/* ------------------------------------------------------------ club marquee */
export const ClubMarquee = ({ clubs }: { clubs: ClubStat[] }) => {
  const names = clubs.length >= 3 ? clubs.map((c) => c.club.name) : ["Authentic kits", "Retro classics", "National teams", "Player icons", "Collector grade"];
  const row = [...names, ...names, ...names, ...names];
  return (
    <div className="mt-16 overflow-hidden border-y py-5 sm:mt-20" style={{ borderColor: LINE }}>
      <div className="ej-marquee flex w-max items-center gap-10">
        {row.map((name, i) => (
          <span key={`${name}-${String(i)}`} className="flex shrink-0 items-center gap-10">
            <span
              className="whitespace-nowrap font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl"
              style={i % 2 === 0 ? { color: "#F2F4EF" } : { WebkitTextStroke: `1.5px ${VOLT}`, color: "transparent" }}
            >
              {name}
            </span>
            <Sparkles className="h-4 w-4 shrink-0" style={{ color: VOLT }} />
          </span>
        ))}
      </div>
    </div>
  );
};

/* --------------------------------------------------------- team banners */
/** One club banner — crest plate, Est. year, stock count on full-bleed club colors. */
const ClubBanner = ({
  club,
  count,
  incoming,
  index,
  onClick,
}: {
  club: ClubDef;
  count: number;
  incoming?: boolean;
  index: number;
  onClick: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, y: 36, scale: 0.97 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -6 }}
    className="group relative h-44 overflow-hidden rounded-2xl border text-left transition-shadow duration-300 hover:shadow-[0_0_0_1.5px_#C8F231,0_26px_60px_-22px_rgba(200,242,49,0.35)] sm:h-48"
    style={{ borderColor: LINE }}
  >
    <div className="absolute inset-0" style={{ background: `linear-gradient(118deg, ${club.colors[0]} 0%, ${club.colors[1]} 100%)` }} />
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.08]"
      style={{ backgroundImage: "repeating-linear-gradient(-45deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 13px)" }}
    />
    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-black/35" />
    <span aria-hidden className="pointer-events-none absolute -bottom-4 right-0 select-none whitespace-nowrap font-display text-[92px] uppercase leading-none text-white/[0.07]">
      {club.name}
    </span>
    <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    <div className="relative flex h-full items-center gap-4 px-5 sm:gap-5 sm:px-6">
      <CrestBadge club={club} className="h-[72px] w-[72px] transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-110 sm:h-20 sm:w-20" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-2xl uppercase leading-none tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:text-[26px]">
          {club.name}
        </p>
        <p className="mt-2 flex items-center gap-2 font-monotb text-[9px] font-bold uppercase tracking-[0.3em] text-white/70">
          <span className="inline-block h-px w-5 bg-white/40" /> Est. {club.est} <span className="inline-block h-px w-5 bg-white/40" />
        </p>
        {incoming ? (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-3 py-1 font-monotb text-[9px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" style={{ color: VOLT }} /> New drops incoming
          </span>
        ) : (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 font-monotb text-[9px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm" style={{ color: VOLT }}>
            {count} kit{count === 1 ? "" : "s"} in stock
          </span>
        )}
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/25 backdrop-blur-sm transition-all duration-300 group-hover:border-transparent group-hover:bg-[#C8F231]">
        <ArrowRight className="h-4 w-4 text-white transition-all duration-300 group-hover:-rotate-45 group-hover:text-black" />
      </span>
    </div>
  </motion.button>
);

/** The main shopping center — a wall of team crest banners plus the extras rack. */
export const TeamWall = ({
  stats,
  incoming,
  extrasCount,
  onPickClub,
  onPickExtras,
}: {
  stats: ClubStat[];
  incoming: ClubDef[];
  extrasCount: number;
  onPickClub: (id: string) => void;
  onPickExtras: () => void;
}) => (
  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {stats.map((stat, i) => (
      <ClubBanner key={stat.club.id} club={stat.club} count={stat.count} index={i} onClick={() => onPickClub(stat.club.id)} />
    ))}
    {incoming.map((club, i) => (
      <ClubBanner key={club.id} club={club} count={0} incoming index={stats.length + i} onClick={() => onPickClub(club.id)} />
    ))}
    {extrasCount > 0 && (
      <motion.button
        type="button"
        onClick={onPickExtras}
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.55, delay: ((stats.length + incoming.length) % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -6 }}
        className="group relative h-44 overflow-hidden rounded-2xl border text-left transition-shadow duration-300 hover:shadow-[0_0_0_1.5px_#C8F231,0_26px_60px_-22px_rgba(200,242,49,0.35)] sm:h-48"
        style={{ borderColor: LINE }}
      >
        <div className="absolute inset-0" style={{ background: `linear-gradient(118deg, #2E361D 0%, ${INK} 70%)` }} />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: `repeating-linear-gradient(-45deg, ${VOLT} 0px, ${VOLT} 2px, transparent 2px, transparent 13px)` }}
        />
        <span aria-hidden className="pointer-events-none absolute -bottom-4 right-0 select-none whitespace-nowrap font-display text-[92px] uppercase leading-none text-white/[0.06]">
          Extras
        </span>
        <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <div className="relative flex h-full items-center gap-4 px-5 sm:gap-5 sm:px-6">
          <span
            className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-2 transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-110 sm:h-20 sm:w-20"
            style={{ borderColor: VOLT, backgroundColor: `${VOLT}14` }}
          >
            <Package className="h-8 w-8" style={{ color: VOLT }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-2xl uppercase leading-none tracking-wide text-white sm:text-[26px]">The extras rack</p>
            <p className="mt-2 flex items-center gap-2 font-monotb text-[9px] font-bold uppercase tracking-[0.3em] text-white/60">
              <span className="inline-block h-px w-5 bg-white/30" /> Beyond the badges <span className="inline-block h-px w-5 bg-white/30" />
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 font-monotb text-[9px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm" style={{ color: VOLT }}>
              {extrasCount} item{extrasCount === 1 ? "" : "s"} in stock
            </span>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/25 backdrop-blur-sm transition-all duration-300 group-hover:border-transparent group-hover:bg-[#C8F231]">
            <ArrowRight className="h-4 w-4 text-white transition-all duration-300 group-hover:-rotate-45 group-hover:text-black" />
          </span>
        </div>
      </motion.button>
    )}
  </div>
);

/* ------------------------------------------------------------- shop tabs */
export type ShopTab = "teams" | "all" | "classics";

/** Segmented pill switcher for the shop section — Teams / All Jerseys / Best Sellers. */
export const ShopTabs = ({
  tab,
  onPick,
  teamsCount,
  allCount,
  classicsCount,
}: {
  tab: ShopTab;
  onPick: (t: ShopTab) => void;
  teamsCount: number;
  allCount: number;
  classicsCount: number;
}) => {
  const tabs: { id: ShopTab; label: string; icon: typeof Trophy; count: number }[] = [
    { id: "teams", label: "Teams", icon: Shield, count: teamsCount },
    { id: "all", label: "All Jerseys", icon: Package, count: allCount },
    { id: "classics", label: "Best Sellers", icon: Trophy, count: classicsCount },
  ];
  return (
    <div className="mt-7 inline-flex max-w-full overflow-x-auto rounded-full border p-1" style={{ borderColor: LINE, backgroundColor: SURFACE }} role="tablist" aria-label="Shop view">
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onPick(t.id)}
            className="relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 font-monotb text-[11px] font-bold uppercase tracking-[0.14em] transition-colors sm:px-5"
            style={{ color: active ? INK : MUTED }}
          >
            {active && (
              <motion.span
                layoutId="ej-shop-tab"
                className="absolute inset-0 rounded-full shadow-[0_8px_26px_-10px_rgba(200,242,49,0.6)]"
                style={{ backgroundColor: VOLT }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <t.icon className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">{t.label}</span>
            <span
              className="relative z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-monotb text-[9px] font-bold"
              style={active ? { backgroundColor: INK, color: VOLT } : { backgroundColor: LINE, color: MUTED }}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* ----------------------------------------------------------- best sellers */
/** One trophy-case card — club-color header band, crest, rank, kit photo. */
const ClassicCard = ({
  item,
  rank,
  onOpen,
  wished,
  onToggleWish,
}: {
  item: EjItem;
  rank: number;
  onOpen: (id: string) => void;
  wished: boolean;
  onToggleWish: (id: string) => void;
}) => {
  const club = detectClub(item.title);
  const colors: [string, string] = club?.colors ?? ["#2E361D", INK];
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, delay: ((rank - 1) % 3) * 0.09, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-[0_0_0_1.5px_#C8F231,0_28px_64px_-22px_rgba(200,242,49,0.4)]"
      style={{ borderColor: LINE, backgroundColor: SURFACE }}
    >
      {/* club-color header band — echoes the team banners */}
      <div className="relative flex items-center gap-3 px-4 py-3" style={{ background: `linear-gradient(118deg, ${colors[0]} 0%, ${colors[1]} 100%)` }}>
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "repeating-linear-gradient(-45deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 12px)" }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {club ? (
          <CrestBadge club={club} className="relative h-11 w-11 transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-110" />
        ) : (
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/30">
            <Package className="h-5 w-5 text-white/80" />
          </span>
        )}
        <div className="relative min-w-0 flex-1">
          <p className="truncate font-display text-lg uppercase leading-none tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            {club?.name ?? "Elite pick"}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 font-monotb text-[8px] font-bold uppercase tracking-[0.26em] text-white/65">
            <span className="inline-block h-px w-4 bg-white/40" /> {club ? `Est. ${club.est}` : "One of one"}
          </p>
        </div>
        <span
          aria-hidden
          className="relative shrink-0 font-display text-4xl leading-none"
          style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.75)", color: "transparent" }}
        >
          {String(rank).padStart(2, "0")}
        </span>
      </div>

      <button type="button" onClick={() => onOpen(item.id)} className="block w-full text-left">
        <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: PAPER }}>
          {item.images[0] ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <JerseyPlaceholder title={item.title} />
          )}

          <span
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 font-monotb text-[10px] font-bold uppercase tracking-[0.14em] shadow-lg"
            style={{ backgroundColor: VOLT, color: INK }}
          >
            <Trophy className="h-3 w-3" /> Best seller
          </span>

          {item.stock <= 2 && item.stock > 0 && (
            <span className="absolute left-3 top-12 flex items-center gap-1 rounded-full px-2.5 py-1 font-monotb text-[10px] font-bold uppercase" style={{ backgroundColor: INK, color: VOLT }}>
              <Flame className="h-3 w-3" /> Only {item.stock} left
            </span>
          )}

          {item.imageCount > 1 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-0.5 font-monotb text-[10px] font-bold text-white backdrop-blur-sm">
              {item.imageCount} photos
            </span>
          )}

          {item.views > 0 && (
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 font-monotb text-[10px] font-bold text-white backdrop-blur-sm">
              <Eye className="h-3 w-3" /> {item.views}
            </span>
          )}

          {item.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
              <span className="-rotate-12 rounded-md border-2 border-white/90 px-4 py-1.5 font-display text-lg uppercase tracking-[0.2em] text-white">
                Sold out
              </span>
            </div>
          )}

          {/* hover action bar */}
          <div className="absolute inset-x-3 bottom-3 translate-y-[130%] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="flex items-center justify-center gap-2 rounded-full py-2.5 font-monotb text-[11px] font-bold uppercase tracking-[0.14em] shadow-xl" style={{ backgroundColor: VOLT, color: INK }}>
              View kit <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="font-monotb text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: VOLT }}>{item.condition}</span>
            {item.category && (
              <>
                <span className="h-0.5 w-0.5 rounded-full" style={{ backgroundColor: DIM }} />
                <span className="font-monotb text-[9px] uppercase tracking-[0.16em]" style={{ color: DIM }}>{item.category}</span>
              </>
            )}
          </div>
          <p className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug tracking-tight">{item.title}</p>
          <div className="mt-2.5 flex items-baseline justify-between border-t pt-2.5" style={{ borderColor: LINE }}>
            <span className="font-display text-[22px]" style={{ color: VOLT }}>{formatEjPrice(item.price)}</span>
            <span className="text-[10px]" style={{ color: DIM }}>or Best Offer</span>
          </div>
        </div>
      </button>

      {/* wishlist */}
      <motion.button
        type="button"
        aria-label={wished ? "Remove from watchlist" : "Add to watchlist"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleWish(item.id);
        }}
        whileTap={{ scale: 0.8 }}
        className="absolute right-3 top-[74px] z-10 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors"
        style={wished ? { backgroundColor: VOLT, borderColor: VOLT } : { backgroundColor: "rgba(11,13,11,0.55)", borderColor: "rgba(255,255,255,0.18)" }}
      >
        <Heart className="h-4 w-4" style={wished ? { color: INK, fill: INK } : { color: "white" }} />
      </motion.button>
    </motion.div>
  );
};

/** The trophy case — every proven kit ranked and dressed in its club colors. */
export const ClassicsGrid = ({
  items,
  onOpen,
  wishlist,
  onToggleWish,
}: {
  items: EjItem[];
  onOpen: (id: string) => void;
  wishlist: string[];
  onToggleWish: (id: string) => void;
}) => (
  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
    {items.map((item, i) => (
      <ClassicCard
        key={item.id}
        item={item}
        rank={i + 1}
        onOpen={onOpen}
        wished={wishlist.includes(item.id)}
        onToggleWish={onToggleWish}
      />
    ))}
  </div>
);

/* --------------------------------------------------------- club shop hero */
/** Full-width club banner that heads a team's shop page. */
export const ClubHero = ({ club, count }: { club: ClubDef; count: number }) => (
  <section className="relative mt-5 overflow-hidden rounded-3xl border" style={{ borderColor: LINE }}>
    <div className="absolute inset-0" style={{ background: `linear-gradient(118deg, ${club.colors[0]} 0%, ${club.colors[1]} 100%)` }} />
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.08]"
      style={{ backgroundImage: "repeating-linear-gradient(-45deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 14px)" }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/25" />
    <motion.span
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.07 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      className="pointer-events-none absolute -bottom-6 left-0 select-none whitespace-nowrap font-display text-[150px] uppercase leading-none text-white"
    >
      {club.name} {club.name}
    </motion.span>
    <div className="relative flex flex-col items-center px-6 py-12 text-center sm:py-16">
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 90, damping: 14 }}>
        <CrestBadge club={club} className="h-28 w-28 sm:h-32 sm:w-32" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12 }}
        className="mt-5 font-display text-4xl uppercase leading-none tracking-wide text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] sm:text-6xl"
      >
        {club.name}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.24 }}
        className="mt-3 flex items-center gap-3 font-monotb text-[11px] font-bold uppercase tracking-[0.35em] text-white/75"
      >
        <span className="inline-block h-px w-8 bg-white/40" /> Est. {club.est} <span className="inline-block h-px w-8 bg-white/40" />
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.34 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-2"
      >
        <span className="rounded-full px-4 py-1.5 font-monotb text-[10px] font-bold uppercase tracking-[0.16em]" style={{ backgroundColor: VOLT, color: INK }}>
          {count > 0 ? `${count} kit${count === 1 ? "" : "s"} in stock` : "New drops incoming"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 font-monotb text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
          <Truck className="h-3 w-3" /> Free shipping
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 font-monotb text-[10px] font-bold uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">
          <BadgeCheck className="h-3 w-3" /> Hand-checked
        </span>
      </motion.div>
    </div>
  </section>
);

/** Horizontal rail of crest chips for hopping between team shops. */
export const TeamChipRail = ({
  clubs,
  currentId,
  onPick,
}: {
  clubs: ClubDef[];
  currentId: string;
  onPick: (id: string) => void;
}) => (
  <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
    {clubs
      .filter((c) => c.id !== currentId)
      .map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onPick(c.id)}
          className="group flex shrink-0 items-center gap-2.5 rounded-full border py-1.5 pl-2 pr-4 transition-all hover:border-[#C8F231] active:scale-95"
          style={{ borderColor: LINE, backgroundColor: SURFACE }}
        >
          <CrestBadge club={c} className="h-8 w-8" />
          <span className="font-monotb text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8B0A5] transition-colors group-hover:text-white">
            {c.name}
          </span>
        </button>
      ))}
  </div>
);

/* -------------------------------------------------------- popular jerseys */
export const PopularRow = ({ items, onOpen }: { items: EjItem[]; onOpen: (id: string) => void }) => (
  <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3">
    {items.map((item, i) => (
      <motion.button
        key={item.id}
        type="button"
        onClick={() => onOpen(item.id)}
        initial={{ opacity: 0, x: 44 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: i * 0.06 }}
        className="group relative flex w-[250px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border text-left transition-shadow hover:shadow-[0_0_0_1.5px_#C8F231,0_22px_50px_-20px_rgba(200,242,49,0.35)]"
        style={{ borderColor: LINE, backgroundColor: SURFACE }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -left-1 -top-5 z-10 font-display text-[88px] leading-none"
          style={{ WebkitTextStroke: `1.5px ${VOLT}`, color: "transparent", opacity: 0.85 }}
        >
          {String(i + 1).padStart(2, "0")}
        </span>
        <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: PAPER }}>
          {item.images[0] ? (
            <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" draggable={false} />
          ) : (
            <JerseyPlaceholder title={item.title} dense />
          )}
          <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 font-monotb text-[10px] font-bold text-white backdrop-blur-sm">
            <Eye className="h-3 w-3" /> {item.views}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</p>
          <div className="mt-auto flex items-baseline justify-between pt-2.5">
            <span className="font-display text-xl" style={{ color: VOLT }}>{formatEjPrice(item.price)}</span>
            <span className="font-monotb text-[9px] uppercase tracking-widest" style={{ color: DIM }}>{item.condition}</span>
          </div>
        </div>
      </motion.button>
    ))}
  </div>
);

/* ----------------------------------------------------------- product card */
export const ProductCard = ({
  item,
  index,
  onOpen,
  wished,
  onToggleWish,
}: {
  item: EjItem;
  index: number;
  onOpen: (id: string) => void;
  wished: boolean;
  onToggleWish: (id: string) => void;
}) => {
  const isNew = Date.now() - item.createdTs < 14 * 86_400_000;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-[0_0_0_1.5px_#C8F231,0_24px_56px_-20px_rgba(200,242,49,0.38)]"
      style={{ borderColor: LINE, backgroundColor: SURFACE }}
    >
      <button type="button" onClick={() => onOpen(item.id)} className="block w-full text-left">
        <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: PAPER }}>
          {item.images[0] ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <JerseyPlaceholder title={item.title} />
          )}

          {/* status badges */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {isNew && item.stock > 0 && (
              <span className="rounded-full px-2.5 py-1 font-monotb text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: INK, color: VOLT }}>
                New in
              </span>
            )}
            {item.stock <= 2 && item.stock > 0 && (
              <span className="flex items-center gap-1 rounded-full px-2.5 py-1 font-monotb text-[10px] font-bold uppercase" style={{ backgroundColor: VOLT, color: INK }}>
                <Flame className="h-3 w-3" /> Only {item.stock} left
              </span>
            )}
          </div>
          {item.imageCount > 1 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-0.5 font-monotb text-[10px] font-bold text-white backdrop-blur-sm">
              {item.imageCount} photos
            </span>
          )}
          {item.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
              <span className="-rotate-12 rounded-md border-2 border-white/90 px-4 py-1.5 font-display text-lg uppercase tracking-[0.2em] text-white">
                Sold out
              </span>
            </div>
          )}

          {/* hover action bar */}
          <div className="absolute inset-x-3 bottom-3 translate-y-[130%] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="flex items-center justify-center gap-2 rounded-full py-2.5 font-monotb text-[11px] font-bold uppercase tracking-[0.14em] shadow-xl" style={{ backgroundColor: VOLT, color: INK }}>
              View kit <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="font-monotb text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: VOLT }}>{item.condition}</span>
            {item.category && (
              <>
                <span className="h-0.5 w-0.5 rounded-full" style={{ backgroundColor: DIM }} />
                <span className="font-monotb text-[9px] uppercase tracking-[0.16em]" style={{ color: DIM }}>{item.category}</span>
              </>
            )}
          </div>
          <p className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug tracking-tight">{item.title}</p>
          <div className="mt-2.5 flex items-baseline justify-between border-t pt-2.5" style={{ borderColor: LINE }}>
            <span className="font-display text-[22px]" style={{ color: VOLT }}>{formatEjPrice(item.price)}</span>
            <span className="text-[10px]" style={{ color: DIM }}>or Best Offer</span>
          </div>
        </div>
      </button>

      {/* wishlist */}
      <motion.button
        type="button"
        aria-label={wished ? "Remove from watchlist" : "Add to watchlist"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleWish(item.id);
        }}
        whileTap={{ scale: 0.8 }}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors"
        style={wished ? { backgroundColor: VOLT, borderColor: VOLT } : { backgroundColor: "rgba(11,13,11,0.55)", borderColor: "rgba(255,255,255,0.18)" }}
      >
        <Heart className="h-4 w-4 transition-transform" style={wished ? { color: INK, fill: INK } : { color: "white" }} />
      </motion.button>
    </motion.div>
  );
};

/* --------------------------------------------------------- ebay legacy */
/** Animated number that starts counting when it scrolls into view. */
const CountOnView = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [seen, setSeen] = useState<boolean>(false);
  const value = useCountUp(seen ? target : 0, 1.8);
  return (
    <motion.span onViewportEnter={() => setSeen(true)} viewport={{ once: true }}>
      {value.toLocaleString()}
      {suffix}
    </motion.span>
  );
};

/** Circular 99% feedback gauge that draws itself on scroll. */
const FeedbackRing = () => (
  <div className="relative h-36 w-36 shrink-0">
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
      <circle cx="50" cy="50" r="44" fill="none" stroke={LINE} strokeWidth="7" />
      <motion.circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke={VOLT}
        strokeWidth="7"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 0.99 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <span className="font-display text-3xl leading-none" style={{ color: VOLT }}>99%</span>
      <span className="mt-1 font-monotb text-[8px] font-bold uppercase leading-tight tracking-[0.16em]" style={{ color: DIM }}>
        positive
        <br />
        feedback
      </span>
    </div>
  </div>
);

/** Wide “proven on eBay” trust banner — the whole card links to George's profile. */
const EbayLegacyBanner = () => (
  <motion.a
    href={EBAY_URL}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="group relative block overflow-hidden rounded-2xl border transition-shadow duration-300 hover:shadow-[0_0_0_1.5px_#C8F231,0_28px_70px_-24px_rgba(200,242,49,0.4)]"
    style={{ borderColor: LINE, backgroundColor: SURFACE }}
  >
    {/* shine sweep */}
    <span className="pointer-events-none absolute inset-0 z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full" style={{ background: `radial-gradient(circle, ${VOLT}1C, transparent 65%)` }} />
    <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full" style={{ background: `radial-gradient(circle, ${VOLT}14, transparent 60%)` }} />

    <div className="relative grid items-center gap-8 px-7 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_auto]">
      <div>
        <p className="flex flex-wrap items-center gap-2 font-monotb text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: VOLT }}>
          <span className="inline-block h-[2px] w-6" style={{ backgroundColor: VOLT }} />
          Proven track record on <EbayWord className="text-sm tracking-normal" />
        </p>
        <h3 className="mt-3 max-w-xl font-display text-3xl uppercase leading-[1.02] sm:text-4xl">
          <span style={{ color: VOLT }}>
            <CountOnView target={800} suffix="+" />
          </span>{" "}
          jerseys sold before this shop even opened
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: MUTED }}>
          George ran <span className="font-semibold text-white">elite_jersey_us</span> on eBay as a top seller — hundreds of kits shipped worldwide with a 99% positive feedback ratio. Same seller, same standards, now direct to you.
        </p>
        <span
          className="mt-5 inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 font-display text-xs uppercase tracking-wide transition-colors duration-300 group-hover:bg-[#C8F231]/10"
          style={{ borderColor: VOLT, color: VOLT }}
        >
          Verify the feedback on eBay
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="flex items-center justify-center">
        <FeedbackRing />
      </div>
    </div>
  </motion.a>
);

/* ----------------------------------------------------------- why shop */
export const WhyShop = ({ items }: { items: EjItem[] }) => {
  const kits = useCountUp(items.length, 1.4);

  const cards = [
    { icon: BadgeCheck, title: "Authenticity checked", body: "Every jersey is inspected stitch-by-stitch — tags, crests, and print — before it's ever listed." },
    { icon: Truck, title: "Ships in 24 hours", body: "Boxed, protected, and on a USPS truck within one business day. Tracking lands in your inbox." },
    { icon: Shield, title: "Buyer protection", body: "No payment is taken at checkout — the seller confirms your order and invoices you securely." },
    { icon: MessageCircle, title: "Deal with a human", body: "Make an offer on anything and a real collector answers fast — usually within a few hours." },
  ];

  return (
    <div className="mt-8">
      {/* proven on eBay */}
      <EbayLegacyBanner />

      {/* stat strip */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4"
        style={{ borderColor: LINE, backgroundColor: LINE }}
      >
        {[
          { n: <CountOnView target={800} suffix="+" />, label: "jerseys sold on eBay" },
          { n: "99%" as ReactNode, label: "positive feedback" },
          { n: String(kits), label: "kits in the vault" },
          { n: "24h", label: "avg. ship time" },
        ].map((s) => (
          <div key={s.label} className="px-5 py-6 text-center" style={{ backgroundColor: SURFACE }}>
            <p className="font-display text-3xl sm:text-4xl" style={{ color: VOLT }}>{s.n}</p>
            <p className="mt-1.5 font-monotb text-[9px] uppercase tracking-[0.18em]" style={{ color: DIM }}>{s.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.09 }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-2xl border p-6 transition-shadow duration-300 hover:shadow-[0_0_0_1.5px_#C8F231]"
            style={{ borderColor: LINE, backgroundColor: SURFACE }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${VOLT}22, transparent 65%)` }} />
            <span className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" style={{ backgroundColor: `${VOLT}1A`, border: `1px solid ${VOLT}44` }}>
              <card.icon className="h-5 w-5" style={{ color: VOLT }} />
            </span>
            <p className="mt-4 font-display text-lg uppercase tracking-wide">{card.title}</p>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: MUTED }}>{card.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};


============================================================
  FILE 4: EliteJerseyStorePage.tsx
  Public storefront page
  source path: web/src/pages/elitejersey/EliteJerseyStorePage.tsx
============================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  Eye,
  Heart,
  Package,
  Search,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchEjItem,
  fetchEjItems,
  formatEjPrice,
  placeEjOrder,
  sendEjInterest,
  type EjItem,
} from "@/lib/elitejersey";
import { EjBrand, EJ_LOGO_URL } from "@/pages/elitejersey/EjBrand";
import {
  buildClubStats,
  ClassicsGrid,
  ClubHero,
  ClubMarquee,
  clubById,
  detectClub,
  EBAY_URL,
  EbayWord,
  EjHero,
  FEATURED_CLUB_IDS,
  JerseyPlaceholder,
  PopularRow,
  ProductCard,
  SectionHeading,
  ShopTabs,
  TeamChipRail,
  TeamWall,
  WhyShop,
  type ClubDef,
  type ShopTab,
} from "@/pages/elitejersey/EjHomeSections";

/* ---------------------------------------------------------------- palette */
const VOLT = "#C8F231";
const INK = "#0B0D0B";
const SURFACE = "#151815";
const LINE = "#262B26";
const PAPER = "#F4F5F1";

const inputClass =
  "w-full rounded-xl border border-[#2E332E] bg-[#101310] px-3.5 py-3 text-sm text-[#F2F4EF] placeholder:text-[#6E756C] outline-none transition-colors focus:border-[#C8F231]";

/* --------------------------------------------------------------- ticker */
const TICKER_ITEMS = [
  "Free shipping on every order",
  "800+ jerseys sold on eBay",
  "99% positive feedback",
  "Ships from New Jersey in 24h",
  "Make an offer on anything",
];

const Ticker = () => (
  <div className="overflow-hidden border-b py-2" style={{ backgroundColor: VOLT, borderColor: INK }}>
    <div className="ej-ticker flex w-max items-center gap-8">
      {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
        <span key={`${t}-${String(i)}`} className="flex items-center gap-8 whitespace-nowrap font-monotb text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: INK }}>
          {t}
          <Zap className="h-3 w-3" fill={INK} />
        </span>
      ))}
    </div>
  </div>
);

const WISHLIST_KEY = "ej-wishlist";

function loadWishlist(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

interface CheckoutState {
  item: EjItem;
  size: string;
  qty: number;
}

/**
 * Elite Jersey storefront — a bold, animated jersey shop for George Yermak.
 * eBay-style mechanics (Buy It Now / Make an Offer) with a unique locker-room
 * aesthetic: floating hero collage, shop-by-club collections, popularity
 * charts, and a watchlist. Navigation is state-based so it works behind the
 * preview proxy.
 */
const EliteJerseyStorePage = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"home" | "item" | "club">("home");
  const [activeId, setActiveId] = useState<string>("");
  const [activeClubId, setActiveClubId] = useState<string>("");
  const [fromClub, setFromClub] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [shopTab, setShopTab] = useState<ShopTab>("teams");
  const [wishlist, setWishlist] = useState<string[]>(loadWishlist);
  const [wishOnly, setWishOnly] = useState<boolean>(false);
  const [gallery, setGallery] = useState<number>(0);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [offerItem, setOfferItem] = useState<EjItem | null>(null);
  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState<number>(1);

  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, { stiffness: 140, damping: 28 });

  const itemsQuery = useQuery({ queryKey: ["ej-items"], queryFn: () => fetchEjItems(), refetchInterval: 30000 });
  const itemQuery = useQuery({
    queryKey: ["ej-item", activeId],
    queryFn: () => fetchEjItem(activeId),
    enabled: view === "item" && activeId.length > 0,
  });

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes ej-ticker { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
      .ej-ticker { animation: ej-ticker 22s linear infinite; }
      .ej-marquee { animation: ej-ticker 46s linear infinite; }
      @keyframes ej-glow { 0%,100% { opacity: .5; transform: translate(-10%, -10%) scale(1); } 50% { opacity: .9; transform: translate(6%, 8%) scale(1.15); } }
      .ej-glow { animation: ej-glow 9s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const clubStats = useMemo(() => buildClubStats(items), [items]);

  /** Featured clubs from George's eBay era that don't have live stock yet. */
  const incoming = useMemo<ClubDef[]>(
    () =>
      FEATURED_CLUB_IDS.filter((id) => !clubStats.some((s) => s.club.id === id))
        .map((id) => clubById(id))
        .filter((c): c is ClubDef => c !== null),
    [clubStats],
  );

  /** Anything that doesn't wear a club badge — its own rack. */
  const extras = useMemo(() => items.filter((i) => detectClub(i.title) === null), [items]);

  const popular = useMemo(
    () => [...items].filter((i) => i.views > 0).sort((a, b) => b.views - a.views).slice(0, 8),
    [items],
  );

  /** The trophy case — every kit ranked by real buyer attention. */
  const classics = useMemo(
    () => [...items].sort((a, b) => b.views - a.views || b.stock - a.stock || a.title.localeCompare(b.title)),
    [items],
  );

  const activeClubDef = useMemo(() => clubById(activeClubId), [activeClubId]);

  const clubItems = useMemo(
    () => (activeClubDef ? items.filter((i) => detectClub(i.title)?.id === activeClubDef.id) : []),
    [items, activeClubDef],
  );

  /** All wall clubs (stocked + incoming) for the hop-around rail. */
  const wallClubs = useMemo<ClubDef[]>(() => [...clubStats.map((s) => s.club), ...incoming], [clubStats, incoming]);

  const searching = search.trim().length > 0 || wishOnly;

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (wishOnly && !wishlist.includes(i.id)) return false;
      if (search && !`${i.title} ${i.category} ${i.condition}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, wishOnly, wishlist]);

  const toggleWish = (id: string) => {
    setWishlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — session only
      }
      return next;
    });
  };

  const openItem = (id: string) => {
    setFromClub(view === "club" ? activeClubId : "");
    setActiveId(id);
    setView("item");
    setGallery(0);
    setSize("");
    setQty(1);
    window.scrollTo({ top: 0 });
  };

  const openClub = (id: string) => {
    setActiveClubId(id);
    setView("club");
    setSearch("");
    setWishOnly(false);
    void queryClient.invalidateQueries({ queryKey: ["ej-items"] });
    window.scrollTo({ top: 0 });
  };

  const goHome = () => {
    setView("home");
    setActiveId("");
    setActiveClubId("");
    setFromClub("");
    void queryClient.invalidateQueries({ queryKey: ["ej-items"] });
    window.scrollTo({ top: 0 });
  };

  const backFromItem = () => {
    if (fromClub && clubById(fromClub)) {
      openClub(fromClub);
    } else {
      goHome();
    }
  };

  const scrollToSection = (id: string) => {
    setSearch("");
    setWishOnly(false);
    if (view !== "home") {
      goHome();
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 140);
    } else {
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 40);
    }
  };

  const item = itemQuery.data;
  const galleryImages = item?.images ?? [];
  const hasSizeStock = Object.keys(item?.sizeStock ?? {}).length > 0;
  const availableForSelection = hasSizeStock ? (size ? item?.sizeStock[size] ?? 0 : 0) : item?.stock ?? 0;

  const related = useMemo(() => {
    if (!item) return [];
    const others = items.filter((i) => i.id !== item.id);
    const club = detectClub(item.title);
    const ranked = [
      ...others.filter((i) => club && detectClub(i.title)?.id === club.id),
      ...others.filter((i) => i.category && i.category === item.category),
      ...others,
    ];
    const seen = new Set<string>();
    return ranked.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true))).slice(0, 4);
  }, [item, items]);

  const backClub = fromClub ? clubById(fromClub) : null;
  const resultsTitle = search ? `“${search}”` : "Your watchlist";

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: INK, color: "#F2F4EF" }}>
      {/* scroll progress */}
      <motion.div className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left" style={{ scaleX: progressX, backgroundColor: VOLT }} />

      <Ticker />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-md" style={{ borderColor: LINE, backgroundColor: "rgba(11,13,11,0.88)" }}>
        <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
          <EjBrand onClick={goHome} />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Store sections">
            {[
              { label: "Teams", id: "ej-teams" },
              ...(extras.length > 0 ? [{ label: "Extras", id: "ej-extras" }] : []),
              ...(popular.length >= 3 ? [{ label: "Popular", id: "ej-popular" }] : []),
              { label: "Why us", id: "ej-why" },
            ].map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="rounded-full px-3 py-1.5 font-monotb text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8B0A5] transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex flex-1 items-center gap-2 rounded-full border px-4 py-2 transition-colors focus-within:border-[#C8F231]" style={{ borderColor: LINE, backgroundColor: SURFACE }}>
            <Search className="h-4 w-4 shrink-0 text-[#6E756C]" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (view !== "home") goHome();
              }}
              placeholder="Search kits, clubs, eras…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#6E756C]"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-[#6E756C] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* watchlist toggle */}
          <button
            type="button"
            onClick={() => {
              setWishOnly((w) => !w);
              setSearch("");
              if (view !== "home") goHome();
              window.setTimeout(() => document.getElementById("ej-results")?.scrollIntoView({ behavior: "smooth" }), 80);
            }}
            aria-label={wishOnly ? "Show all kits" : "Show watchlist"}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors"
            style={wishOnly ? { backgroundColor: VOLT, borderColor: VOLT } : { borderColor: LINE, backgroundColor: SURFACE }}
          >
            <Heart className="h-4 w-4" style={wishOnly ? { color: INK, fill: INK } : { color: "#A8B0A5" }} />
            {wishlist.length > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-monotb text-[9px] font-bold"
                style={wishOnly ? { backgroundColor: INK, color: VOLT } : { backgroundColor: VOLT, color: INK }}
              >
                {wishlist.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.main key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mx-auto max-w-[1360px] px-4 pb-28 sm:px-6">
            {!searching && (
              <>
                {/* ------------------------------------------------ hero */}
                <EjHero
                  items={items}
                  clubCount={clubStats.length + incoming.length}
                  onShop={() => document.getElementById("ej-teams")?.scrollIntoView({ behavior: "smooth" })}
                  onClubs={() => document.getElementById("ej-why")?.scrollIntoView({ behavior: "smooth" })}
                  onOpen={openItem}
                />

                {/* --------------------------------------------- marquee */}
                <ClubMarquee clubs={clubStats} />

                {/* --------------------------------------- the team wall */}
                <section id="ej-teams" className="mt-16 scroll-mt-24 sm:mt-24">
                  {shopTab === "teams" ? (
                    <SectionHeading
                      kicker="The main event"
                      title="Shop by team"
                      sub="Every kit in the vault, sorted by badge. Pick your club or country and step inside — anything without a crest lives on the extras rack."
                    />
                  ) : shopTab === "all" ? (
                    <SectionHeading
                      kicker="The full vault"
                      title="All jerseys"
                      sub="Every kit on one rail — no badges, no sorting hats. Browse the whole vault front to back."
                    />
                  ) : (
                    <SectionHeading
                      kicker="The trophy case"
                      title="Best sellers"
                      sub="The proven kits — the jerseys collectors watch, want, and buy. Ranked by real attention, dressed in their club colors."
                    />
                  )}

                  <ShopTabs
                    tab={shopTab}
                    onPick={setShopTab}
                    teamsCount={clubStats.length + incoming.length}
                    allCount={items.length}
                    classicsCount={classics.length}
                  />

                  {itemsQuery.isLoading ? (
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-44 animate-pulse rounded-2xl border sm:h-48" style={{ borderColor: LINE, backgroundColor: SURFACE }} />
                      ))}
                    </div>
                  ) : shopTab === "teams" ? (
                    <TeamWall
                      stats={clubStats}
                      incoming={incoming}
                      extrasCount={extras.length}
                      onPickClub={openClub}
                      onPickExtras={() => document.getElementById("ej-extras")?.scrollIntoView({ behavior: "smooth" })}
                    />
                  ) : shopTab === "all" ? (
                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                      {classics.map((listing, i) => (
                        <ProductCard
                          key={listing.id}
                          item={listing}
                          index={i}
                          onOpen={openItem}
                          wished={wishlist.includes(listing.id)}
                          onToggleWish={toggleWish}
                        />
                      ))}
                    </div>
                  ) : (
                    <ClassicsGrid items={classics} onOpen={openItem} wishlist={wishlist} onToggleWish={toggleWish} />
                  )}
                </section>

                {/* ---------------------------------------- extras rack */}
                {extras.length > 0 && (
                  <section id="ej-extras" className="mt-16 scroll-mt-24 sm:mt-24">
                    <SectionHeading
                      kicker="Beyond the badges"
                      title="The extras rack"
                      sub="Shorts, training gear, accessories — everything that doesn't wear a club crest."
                      right={
                        <span className="font-monotb text-[11px] uppercase tracking-widest text-[#6E756C]">
                          {extras.length} item{extras.length === 1 ? "" : "s"}
                        </span>
                      }
                    />
                    <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                      {extras.map((listing, i) => (
                        <ProductCard
                          key={listing.id}
                          item={listing}
                          index={i}
                          onOpen={openItem}
                          wished={wishlist.includes(listing.id)}
                          onToggleWish={toggleWish}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* ------------------------------------- popular jerseys */}
                {popular.length >= 3 && (
                  <section id="ej-popular" className="mt-16 scroll-mt-24 sm:mt-24">
                    <SectionHeading
                      kicker="Popular right now"
                      title="Most-watched kits"
                      sub="The jerseys collectors keep coming back to — ranked by real views this season."
                    />
                    <PopularRow items={popular} onOpen={openItem} />
                  </section>
                )}
              </>
            )}

            {/* --------------------------------------------- results */}
            {searching && (
              <section id="ej-results" className="mt-10 scroll-mt-24">
                <SectionHeading
                  kicker={wishOnly ? "Saved by you" : "Search the vault"}
                  title={resultsTitle}
                  right={
                    <span className="font-monotb text-[11px] uppercase tracking-widest text-[#6E756C]">
                      {filtered.length} kit{filtered.length === 1 ? "" : "s"}
                    </span>
                  }
                />
                {filtered.length === 0 ? (
                  <div className="mt-16 flex flex-col items-center text-center">
                    {wishOnly ? <Heart className="h-10 w-10 text-[#3A403A]" /> : <Package className="h-10 w-10 text-[#3A403A]" />}
                    <p className="mt-3 font-display text-lg uppercase">{wishOnly ? "Watchlist is empty" : "Nothing here yet"}</p>
                    <p className="mt-1 text-xs text-[#6E756C]">
                      {wishOnly ? "Tap the heart on any kit to save it here." : "Try a different search — new kits drop weekly."}
                    </p>
                  </div>
                ) : (
                  <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                    {filtered.map((listing, i) => (
                      <ProductCard
                        key={listing.id}
                        item={listing}
                        index={i}
                        onOpen={openItem}
                        wished={wishlist.includes(listing.id)}
                        onToggleWish={toggleWish}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ---------------------------------------- why shop */}
            <section id="ej-why" className="mt-16 scroll-mt-24 sm:mt-24">
              <SectionHeading
                kicker="Why shop with us"
                title="Built by a collector"
                sub="The store is new — the seller isn't. 800+ jerseys sold on eBay with 99% positive feedback, every one packed by the same pair of hands in New Jersey."
              />
              <WhyShop items={items} />
            </section>
          </motion.main>
        )}

        {view === "club" && activeClubDef && (
          <motion.main
            key={`club-${activeClubDef.id}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="mx-auto max-w-[1360px] px-4 pb-28 sm:px-6"
          >
            <button
              type="button"
              onClick={goHome}
              className="mt-5 inline-flex items-center gap-1.5 font-monotb text-[11px] font-bold uppercase tracking-widest transition-colors hover:text-white"
              style={{ color: VOLT }}
            >
              <ChevronLeft className="h-4 w-4" /> All teams
            </button>

            <ClubHero club={activeClubDef} count={clubItems.length} />

            {clubItems.length > 0 ? (
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                {clubItems.map((listing, i) => (
                  <ProductCard
                    key={listing.id}
                    item={listing}
                    index={i}
                    onOpen={openItem}
                    wished={wishlist.includes(listing.id)}
                    onToggleWish={toggleWish}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-14 flex flex-col items-center text-center">
                <p className="font-display text-2xl uppercase">The {activeClubDef.name} rail is restocking</p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A8B0A5]">
                  George is listing new {activeClubDef.name} kits right now. Check back soon — or see the 800+ jerseys he's already sold on eBay.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={goHome}
                    className="rounded-full px-6 py-3 font-display text-sm uppercase tracking-wide transition-transform active:scale-95"
                    style={{ backgroundColor: VOLT, color: INK }}
                  >
                    Browse all teams
                  </button>
                  <a
                    href={EBAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-2.5 font-display text-sm uppercase tracking-wide transition-colors hover:bg-[#C8F231]/10"
                    style={{ borderColor: VOLT, color: VOLT }}
                  >
                    The eBay track record <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            <div className="mt-16">
              <SectionHeading kicker="Keep exploring" title="More teams" />
              <TeamChipRail clubs={wallClubs} currentId={activeClubDef.id} onPick={openClub} />
            </div>
          </motion.main>
        )}

        {view === "item" && (
          <motion.main key="item" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="mx-auto max-w-[1360px] px-4 pb-28 sm:px-6">
            <button type="button" onClick={backFromItem} className="mt-5 inline-flex items-center gap-1.5 font-monotb text-[11px] font-bold uppercase tracking-widest transition-colors hover:text-white" style={{ color: VOLT }}>
              <ChevronLeft className="h-4 w-4" /> {backClub ? `Back to ${backClub.name}` : "All kits"}
            </button>

            {itemQuery.isLoading || !item ? (
              <div className="mt-6 grid animate-pulse gap-8 md:grid-cols-2">
                <div className="aspect-square rounded-3xl" style={{ backgroundColor: SURFACE }} />
                <div className="space-y-4">
                  <div className="h-8 w-4/5 rounded" style={{ backgroundColor: SURFACE }} />
                  <div className="h-10 w-2/5 rounded" style={{ backgroundColor: SURFACE }} />
                  <div className="h-14 w-full rounded-full" style={{ backgroundColor: SURFACE }} />
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-8 md:grid-cols-[1.05fr_1fr] lg:gap-12">
                {/* ---------------------------------------- gallery */}
                <div>
                  <div className="relative aspect-square overflow-hidden rounded-3xl border" style={{ borderColor: LINE, backgroundColor: PAPER }}>
                    <AnimatePresence mode="wait">
                      {galleryImages[gallery] ? (
                        <motion.img
                          key={gallery}
                          src={galleryImages[gallery]}
                          alt={item.title}
                          initial={{ opacity: 0, scale: 1.02 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="h-full w-full object-contain p-4"
                        />
                      ) : (
                        <JerseyPlaceholder title={item.title} />
                      )}
                    </AnimatePresence>

                    {galleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Previous photo"
                          onClick={() => setGallery((gallery - 1 + galleryImages.length) % galleryImages.length)}
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next photo"
                          onClick={() => setGallery((gallery + 1) % galleryImages.length)}
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 font-monotb text-[10px] font-bold text-white backdrop-blur-sm">
                          {gallery + 1} / {galleryImages.length}
                        </span>
                      </>
                    )}
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {galleryImages.map((img, i) => (
                        <button
                          key={img.slice(0, 40) + String(i)}
                          type="button"
                          onClick={() => setGallery(i)}
                          className="h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 transition-all"
                          style={{ borderColor: gallery === i ? VOLT : LINE, height: 72, width: 72, opacity: gallery === i ? 1 : 0.55, backgroundColor: PAPER }}
                        >
                          <img src={img} alt="" className="h-full w-full object-contain p-1" />
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 inline-flex items-center gap-1.5 font-monotb text-[11px] uppercase tracking-widest text-[#6E756C]">
                    <Eye className="h-3.5 w-3.5" /> {Math.max(item.views, 1)} view{item.views === 1 ? "" : "s"} on this kit
                  </p>
                </div>

                {/* ---------------------------------------- buy box */}
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border px-3 py-1 font-monotb text-[10px] font-bold uppercase tracking-widest" style={{ borderColor: VOLT, color: VOLT }}>{item.condition}</span>
                    {item.category && (
                      <span className="rounded-full border px-3 py-1 font-monotb text-[10px] font-bold uppercase tracking-widest text-[#A8B0A5]" style={{ borderColor: LINE }}>{item.category}</span>
                    )}
                  </div>
                  <h1 className="mt-3 font-display text-3xl uppercase leading-tight sm:text-4xl">{item.title}</h1>

                  <a
                    href={EBAY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all hover:border-[#C8F231]/70 hover:shadow-[0_10px_30px_-14px_rgba(200,242,49,0.35)]"
                    style={{ borderColor: LINE, backgroundColor: SURFACE }}
                  >
                    <img src={EJ_LOGO_URL} alt="Elite Jersey" className="h-10 w-10 shrink-0 object-contain transition-transform duration-300 group-hover:scale-110" draggable={false} />
                    <div className="flex-1 text-xs">
                      <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                        elite_jersey_us
                        <BadgeCheck className="h-3.5 w-3.5" style={{ color: VOLT }} />
                        <span className="font-normal text-[#6E756C]">· Top Seller on <EbayWord /></span>
                      </p>
                      <p className="mt-0.5 text-[#6E756C]">800+ jerseys sold · 99% positive feedback · NJ, USA</p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1 font-monotb text-[9px] font-bold uppercase tracking-[0.14em] text-[#6E756C] transition-colors group-hover:text-[#C8F231] sm:flex">
                      Verify
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </a>

                  <div className="mt-5 flex items-baseline gap-3">
                    <span className="font-display text-4xl" style={{ color: VOLT }}>{formatEjPrice(item.price)}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#A8B0A5]"><Truck className="h-3.5 w-3.5" /> Free shipping</span>
                  </div>

                  {item.sizes.length > 0 && (
                    <div className="mt-5">
                      <p className="font-monotb text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E756C]">Pick a size</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.sizes.map((s) => {
                          const left = hasSizeStock ? item.sizeStock[s] ?? 0 : item.stock;
                          const soldOut = left === 0;
                          return (
                            <button
                              key={s}
                              type="button"
                              disabled={soldOut}
                              onClick={() => {
                                setSize(size === s ? "" : s);
                                setQty(1);
                              }}
                              className="flex min-w-12 flex-col items-center rounded-xl border px-4 py-2 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                              style={
                                size === s
                                  ? { backgroundColor: VOLT, borderColor: VOLT, color: INK }
                                  : { borderColor: LINE, color: "#F2F4EF", backgroundColor: SURFACE }
                              }
                            >
                              <span className="text-sm font-bold">{s}</span>
                              {hasSizeStock && (
                                <span
                                  className="mt-0.5 font-monotb text-[9px] font-bold uppercase tracking-wide"
                                  style={{ color: size === s ? INK : soldOut ? "#6E756C" : left <= 2 ? VOLT : "#6E756C" }}
                                >
                                  {soldOut ? "Sold out" : `${left} left`}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    <p className="font-monotb text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E756C]">Qty</p>
                    <div className="flex items-center rounded-xl border" style={{ borderColor: LINE, backgroundColor: SURFACE }}>
                      <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="px-3.5 py-2 text-sm font-bold transition-colors hover:text-[#C8F231]">−</button>
                      <span className="min-w-8 text-center text-sm font-bold">{qty}</span>
                      <button type="button" onClick={() => setQty(Math.min(Math.max(availableForSelection, 1), qty + 1))} className="px-3.5 py-2 text-sm font-bold transition-colors hover:text-[#C8F231]">+</button>
                    </div>
                    <span className="text-xs text-[#6E756C]">
                      {item.stock === 0
                        ? "Out of stock"
                        : hasSizeStock
                          ? size
                            ? `${availableForSelection} in stock · size ${size}`
                            : "pick a size to see stock"
                          : `${item.stock} in stock`}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-2.5">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      disabled={item.stock === 0 || (hasSizeStock && !size)}
                      onClick={() => setCheckout({ item, size, qty })}
                      className="w-full rounded-full py-3.5 font-display text-base uppercase tracking-wide transition-all hover:brightness-110 disabled:opacity-40"
                      style={{ backgroundColor: VOLT, color: INK }}
                    >
                      {item.stock === 0 ? "Sold out" : hasSizeStock && !size ? "Pick a size first" : "Buy it now"}
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setOfferItem(item)}
                      className="w-full rounded-full border-2 py-3 font-display text-sm uppercase tracking-wide transition-colors hover:bg-[#C8F231]/10"
                      style={{ borderColor: VOLT, color: VOLT }}
                    >
                      Make an offer
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setOfferItem(item)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border py-3 text-sm font-semibold text-[#A8B0A5] transition-colors hover:border-[#4A524A] hover:text-white"
                      style={{ borderColor: LINE }}
                    >
                      <Heart className="h-4 w-4" /> Ask a question / notify me
                    </button>
                  </div>

                  {item.description && (
                    <div className="mt-7 border-t pt-5" style={{ borderColor: LINE }}>
                      <h2 className="font-display text-sm uppercase tracking-wide">About this kit</h2>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#A8B0A5]">{item.description}</p>
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl border p-4 text-xs leading-relaxed text-[#A8B0A5]" style={{ borderColor: LINE, backgroundColor: SURFACE }}>
                    <p className="font-monotb text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: VOLT }}>Shipping &amp; returns</p>
                    <p className="mt-1.5">Ships within 1 business day via USPS with tracking. 30-day returns accepted — buyer pays return shipping. Questions? Use "Make an offer" to message the seller directly.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------ you might also like */}
            {item && related.length > 0 && (
              <div className="mt-16 sm:mt-20">
                <SectionHeading kicker="Keep digging" title="You might also like" />
                <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
                  {related.map((rel, i) => (
                    <ProductCard
                      key={rel.id}
                      item={rel}
                      index={i}
                      onOpen={openItem}
                      wished={wishlist.includes(rel.id)}
                      onToggleWish={toggleWish}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src={EJ_LOGO_URL} alt="Elite Jersey crest" className="h-14 w-14 object-contain" draggable={false} />
              <p className="font-display text-xl uppercase tracking-wide">
                Elite<span style={{ color: VOLT }}>Jersey</span>
              </p>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#A8B0A5]">
              Authentic club &amp; national team jerseys, hand-picked and resold with care from New Jersey, USA — by the seller behind 800+ jersey sales on eBay.
            </p>
          </div>
          <div>
            <p className="font-monotb text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: VOLT }}>Explore</p>
            <div className="mt-3 flex flex-col items-start gap-2">
              {[
                { label: "Shop by team", id: "ej-teams" },
                { label: "The extras rack", id: "ej-extras" },
                { label: "Popular kits", id: "ej-popular" },
                { label: "Why shop with us", id: "ej-why" },
              ].map((link) => (
                <button key={link.id} type="button" onClick={() => scrollToSection(link.id)} className="text-sm text-[#A8B0A5] transition-colors hover:text-white">
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-monotb text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: VOLT }}>The promise</p>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-[#A8B0A5]">
              <span className="inline-flex items-center gap-2"><Truck className="h-3.5 w-3.5 shrink-0" style={{ color: VOLT }} /> Free tracked shipping, every order</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 shrink-0" style={{ color: VOLT }} /> Authenticity checked by hand</span>
              <span className="inline-flex items-center gap-2"><Heart className="h-3.5 w-3.5 shrink-0" style={{ color: VOLT }} /> Make an offer on anything</span>
              <a
                href={EBAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 transition-colors hover:text-white"
              >
                <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: VOLT }} />
                800+ sales on <EbayWord /> — verify
                <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t py-5 text-center" style={{ borderColor: LINE }}>
          <p className="font-monotb text-[10px] uppercase tracking-[0.2em] text-[#6E756C]">
            © {new Date().getFullYear()} · Authentic kits, resold with care · New Jersey, USA
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {checkout && <CheckoutModal state={checkout} onClose={() => setCheckout(null)} onDone={() => void queryClient.invalidateQueries({ queryKey: ["ej-items"] })} />}
        {offerItem && <OfferModal item={offerItem} onClose={() => setOfferItem(null)} />}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------- modal shell */
const ModalShell = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    role="dialog"
    aria-modal="true"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      onClick={(e) => e.stopPropagation()}
      className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t p-5 sm:rounded-3xl sm:border"
      style={{ backgroundColor: "#111411", borderColor: LINE, color: "#F2F4EF" }}
    >
      {children}
    </motion.div>
  </motion.div>
);

const CheckoutModal = ({ state, onClose, onDone }: { state: CheckoutState; onClose: () => void; onDone: () => void }) => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const order = useMutation({
    mutationFn: () =>
      placeEjOrder({ itemId: state.item.id, size: state.size, qty: state.qty, name, email, phone, address, note }),
    onSuccess: () => onDone(),
  });

  const total = state.item.price * state.qty;

  return (
    <ModalShell onClose={onClose}>
      {order.isSuccess ? (
        <div className="py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.1 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${VOLT}22` }}
          >
            <BadgeCheck className="h-9 w-9" style={{ color: VOLT }} />
          </motion.div>
          <h2 className="mt-4 font-display text-2xl uppercase">Order placed!</h2>
          <p className="mt-2 text-sm text-[#A8B0A5]">
            Thanks {name.split(" ")[0]} — your order for <span className="font-semibold text-white">{state.item.title}</span> is in.
            The seller will email <span className="font-semibold text-white">{email}</span> with payment &amp; tracking details.
          </p>
          <p className="mt-3 rounded-xl border py-2.5 font-monotb text-xs text-[#A8B0A5]" style={{ borderColor: LINE }}>
            Order #{order.data.orderId.slice(0, 8).toUpperCase()} · Total {formatEjPrice(order.data.total)}
          </p>
          <button type="button" onClick={onClose} className="mt-5 w-full rounded-full py-3.5 font-display text-sm uppercase tracking-wide" style={{ backgroundColor: VOLT, color: INK }}>
            Keep browsing
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <h2 className="font-display text-xl uppercase">Checkout</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 transition-colors hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-3 flex gap-3 rounded-2xl border p-3" style={{ borderColor: LINE, backgroundColor: SURFACE }}>
            {state.item.images[0] && <img src={state.item.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />}
            <div className="text-sm">
              <p className="line-clamp-1 font-semibold">{state.item.title}</p>
              <p className="text-xs text-[#6E756C]">
                {state.size ? `Size ${state.size} · ` : ""}Qty {state.qty}
              </p>
              <p className="font-display" style={{ color: VOLT }}>{formatEjPrice(total)}</p>
            </div>
          </div>
          <form
            className="mt-4 flex flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              order.mutate();
            }}
          >
            <input className={inputClass} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={inputClass} type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <textarea className={inputClass} placeholder="Shipping address" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} required />
            <input className={inputClass} placeholder="Note to seller (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            {order.isError && <p className="text-xs font-medium text-[#FF6B6B]">{(order.error as Error).message}</p>}
            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={order.isPending} className="mt-1 w-full rounded-full py-3.5 font-display text-sm uppercase tracking-wide disabled:opacity-50" style={{ backgroundColor: VOLT, color: INK }}>
              {order.isPending ? "Placing order…" : `Place order — ${formatEjPrice(total)}`}
            </motion.button>
            <p className="text-center text-[11px] text-[#6E756C]">No payment taken now — the seller confirms and invoices you by email.</p>
          </form>
        </>
      )}
    </ModalShell>
  );
};

const OfferModal = ({ item, onClose }: { item: EjItem; onClose: () => void }) => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [offer, setOffer] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const send = useMutation({
    mutationFn: () => sendEjInterest({ itemId: item.id, name, email, message, offer: Number(offer) || 0 }),
  });

  return (
    <ModalShell onClose={onClose}>
      {send.isSuccess ? (
        <div className="py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.1 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${VOLT}22` }}
          >
            <Heart className="h-8 w-8" style={{ color: VOLT }} />
          </motion.div>
          <h2 className="mt-4 font-display text-2xl uppercase">Sent to the seller!</h2>
          <p className="mt-2 text-sm text-[#A8B0A5]">You'll hear back at <span className="font-semibold text-white">{email}</span> — usually within a few hours.</p>
          <button type="button" onClick={onClose} className="mt-5 w-full rounded-full py-3.5 font-display text-sm uppercase tracking-wide" style={{ backgroundColor: VOLT, color: INK }}>
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <h2 className="font-display text-xl uppercase">Make an offer</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 transition-colors hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-[#6E756C]">{item.title} · listed at {formatEjPrice(item.price)}</p>
          <form
            className="mt-4 flex flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              send.mutate();
            }}
          >
            <input className={inputClass} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={inputClass} type="number" min="0" step="0.01" placeholder={`Your offer in USD (listed at ${formatEjPrice(item.price)})`} value={offer} onChange={(e) => setOffer(e.target.value)} />
            <textarea className={inputClass} rows={3} placeholder="Message — size questions, bundle deals, anything" value={message} onChange={(e) => setMessage(e.target.value)} />
            {send.isError && <p className="text-xs font-medium text-[#FF6B6B]">{(send.error as Error).message}</p>}
            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={send.isPending} className="mt-1 w-full rounded-full py-3.5 font-display text-sm uppercase tracking-wide disabled:opacity-50" style={{ backgroundColor: VOLT, color: INK }}>
              {send.isPending ? "Sending…" : "Send to seller"}
            </motion.button>
          </form>
        </>
      )}
    </ModalShell>
  );
};

export default EliteJerseyStorePage;


============================================================
  FILE 5: EliteJerseyAdminPage.tsx
  George's admin back office
  source path: web/src/pages/elitejersey/EliteJerseyAdminPage.tsx
============================================================

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


============================================================
  FILE 6: elite-jersey.ts
  Backend API + database (Cloudflare Worker)
  source path: functions/elite-jersey.ts
============================================================

/**
 * Elite Jersey — client store backend (George Yermak's jersey resale shop, project f8562a10).
 * Lives inside StudioDB's Durable Object storage under ej_* tables and is
 * routed through /ej/* on the worker. Public storefront endpoints power the
 * listings; admin endpoints (password-gated) power George's back office.
 */

import { callerIp, constantTimeEqual, rateLimit, tooManyRequests } from "./security";

/**
 * Elite Jersey admin password, read only from the EJ_ADMIN_PASSWORD secret.
 *
 * There is deliberately NO hardcoded fallback: a literal here would ship inside
 * every source bundle we hand to the client. If the secret is unset this returns
 * null and admin auth fails closed rather than falling back to a known value.
 */
function ejAdminPassword(env: EliteJerseyEnv): string | null {
  const secret = env.EJ_ADMIN_PASSWORD?.trim();
  return secret ? secret : null;
}

/** Constant-time admin password check that denies outright when unconfigured. */
function ejPasswordMatches(env: EliteJerseyEnv, candidate: string): boolean {
  const secret = ejAdminPassword(env);
  if (!secret) return false;
  return constantTimeEqual(candidate, secret);
}

export interface EliteJerseyEnv {
  EJ_ADMIN_PASSWORD?: string;
}

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
  env: EliteJerseyEnv = {},
): Promise<Response> {
  ensureTables(sql);
  const isEjAdmin = isTbAdmin || ejPasswordMatches(env, request.headers.get("X-EJ-Admin") ?? "");

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
    // Orders decrement stock with no payment step, so an unthrottled bot could
    // zero out the whole catalogue. Cap order attempts per IP.
    const orderLimit = rateLimit(sql, "ej-order", callerIp(request), 5, 10 * 60 * 1000);
    if (!orderLimit.allowed) {
      return tooManyRequests(orderLimit.retryAfter, "Too many orders from this device — try again shortly.");
    }
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
    const interestLimit = rateLimit(sql, "ej-interest", callerIp(request), 8, 10 * 60 * 1000);
    if (!interestLimit.allowed) {
      return tooManyRequests(interestLimit.retryAfter, "Too many messages — give it a few minutes.");
    }
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
    const loginLimit = rateLimit(sql, "ej-login", callerIp(request), 8, 15 * 60 * 1000);
    if (!loginLimit.allowed) {
      return tooManyRequests(loginLimit.retryAfter, "Too many login attempts — try again later.");
    }
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    if (!ejAdminPassword(env)) {
      return json({ ok: false, error: "Admin sign-in is not configured yet." }, 503);
    }
    const ok = ejPasswordMatches(env, body.password ?? "");
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

