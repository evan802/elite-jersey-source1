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
