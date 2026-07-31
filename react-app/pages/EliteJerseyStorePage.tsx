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
