/* ============================================================
   Elite Jersey — standalone storefront (vanilla JS)
   Talks to the live store backend, so the catalog, stock,
   orders and offers stay in sync with George's Seller Hub.
   ============================================================ */

"use strict";

/* ------------------------------------------------ config */
const API = "https://tbstudios-backend.rork.app";
const EBAY_URL = "https://www.ebay.com/usr/elite_jersey_us";
const LOGO_URL = "https://r2-pub.rork.com/projects/yjqgibkbwlxfph55bsglg/assets/2c7af047-e1cc-4812-93d4-13aea076aab2.png";
const WISHLIST_KEY = "ej-wishlist";

const TICKER_ITEMS = [
  "Free shipping on every order",
  "800+ jerseys sold on eBay",
  "99% positive feedback",
  "Ships from New Jersey in 24h",
  "Make an offer on anything",
];

/* Club definitions — order matters for detection (Inter before Milan). */
const WIKI = "https://upload.wikimedia.org/wikipedia";
const CLUBS = [
  { id: "inter", name: "Inter Milan", keys: ["inter milan", "inter "], colors: ["#0068A8", "#001F3F"], crest: WIKI + "/commons/0/05/FC_Internazionale_Milano_2021.svg", est: 1908 },
  { id: "ac-milan", name: "AC Milan", keys: ["ac milan", "milan"], colors: ["#FB090B", "#1A1A1A"], crest: WIKI + "/commons/d/d0/Logo_of_AC_Milan.svg", est: 1899 },
  { id: "man-utd", name: "Manchester United", keys: ["man utd", "manchester united", "man united", "manchester utd"], colors: ["#DA291C", "#3B0A08"], crest: WIKI + "/en/7/7a/Manchester_United_FC_crest.svg", est: 1878 },
  { id: "man-city", name: "Manchester City", keys: ["man city", "manchester city"], colors: ["#6CABDD", "#1C3549"], crest: WIKI + "/en/e/eb/Manchester_City_FC_badge.svg", est: 1880 },
  { id: "arsenal", name: "Arsenal", keys: ["arsenal"], colors: ["#EF0107", "#3F0203"], crest: WIKI + "/en/5/53/Arsenal_FC.svg", est: 1886 },
  { id: "chelsea", name: "Chelsea", keys: ["chelsea"], colors: ["#034694", "#021D3D"], crest: WIKI + "/en/c/cc/Chelsea_FC.svg", est: 1905 },
  { id: "liverpool", name: "Liverpool", keys: ["liverpool"], colors: ["#C8102E", "#38040D"], crest: WIKI + "/en/0/0c/Liverpool_FC.svg", est: 1892 },
  { id: "tottenham", name: "Tottenham", keys: ["tottenham", "spurs", "hotspur"], colors: ["#132257", "#080E24"], crest: WIKI + "/en/b/b4/Tottenham_Hotspur.svg", est: 1882 },
  { id: "barcelona", name: "FC Barcelona", keys: ["barcelona", "barça", "barca"], colors: ["#A50044", "#004D98"], crest: WIKI + "/en/4/47/FC_Barcelona_%28crest%29.svg", est: 1899 },
  { id: "real-madrid", name: "Real Madrid", keys: ["real madrid"], colors: ["#B8A24A", "#1F2A5A"], crest: WIKI + "/en/5/56/Real_Madrid_CF.svg", est: 1902 },
  { id: "atletico", name: "Atlético Madrid", keys: ["atletico", "atlético"], colors: ["#CB3524", "#27357A"], crest: WIKI + "/en/f/f9/Atletico_Madrid_Logo_2024.svg", est: 1903 },
  { id: "bayern", name: "Bayern Munich", keys: ["bayern"], colors: ["#DC052D", "#38010B"], crest: WIKI + "/commons/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg", est: 1900 },
  { id: "dortmund", name: "Borussia Dortmund", keys: ["dortmund", "bvb"], colors: ["#FDE100", "#4A4200"], crest: WIKI + "/commons/6/67/Borussia_Dortmund_logo.svg", est: 1909 },
  { id: "psg", name: "PSG", keys: ["psg", "paris saint", "paris sg"], colors: ["#004170", "#B41F30"], crest: WIKI + "/en/a/a7/Paris_Saint-Germain_F.C..svg", est: 1970 },
  { id: "juventus", name: "Juventus", keys: ["juventus", "juve"], colors: ["#3A3A3A", "#0A0A0A"], crest: WIKI + "/commons/e/ed/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg", est: 1897 },
  { id: "napoli", name: "Napoli", keys: ["napoli"], colors: ["#12A0D7", "#053B51"], crest: WIKI + "/commons/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg", est: 1926 },
  { id: "roma", name: "AS Roma", keys: ["as roma", "roma"], colors: ["#8E1F2F", "#5A1520"], crest: WIKI + "/en/f/f7/AS_Roma_logo_%282017%29.svg", est: 1927 },
  { id: "ajax", name: "Ajax", keys: ["ajax"], colors: ["#D2122E", "#3D0510"], crest: WIKI + "/commons/0/0d/Logo_AFC_Ajax_%281928-1991%2C_2025-%29.png", est: 1900 },
  { id: "celtic", name: "Celtic", keys: ["celtic"], colors: ["#018749", "#013B20"], crest: WIKI + "/en/7/71/Celtic_FC_crest.svg", est: 1887 },
  { id: "brazil", name: "Brazil", keys: ["brazil", "brasil"], colors: ["#009C3B", "#0A5C2A"], crest: WIKI + "/commons/3/32/Confedera%C3%A7%C3%A3o_Brasileira_de_Futebol_logo_%282020%29.svg", est: 1914 },
  { id: "argentina", name: "Argentina", keys: ["argentina"], colors: ["#75AADB", "#2A4C68"], crest: WIKI + "/en/c/c1/Argentina_national_football_team_logo.svg", est: 1893 },
  { id: "france", name: "France", keys: ["france", "les bleus"], colors: ["#21304D", "#0C121F"], crest: WIKI + "/en/1/12/France_national_football_team_seal.svg", est: 1919 },
  { id: "germany", name: "Germany", keys: ["germany", "deutschland"], colors: ["#2B2B2B", "#101010"], crest: WIKI + "/commons/e/e3/DFBEagle.svg", est: 1900 },
  { id: "italy", name: "Italy", keys: ["italy", "italia", "azzurri"], colors: ["#0064AA", "#022A46"], crest: WIKI + "/commons/b/bf/Logo_Italy_National_Football_Team_-_2023.svg", est: 1898 },
  { id: "portugal", name: "Portugal", keys: ["portugal"], colors: ["#E42518", "#046A38"], crest: WIKI + "/en/e/e4/Portugal_national_football_team_logo.svg", est: 1914 },
  { id: "england", name: "England", keys: ["england"], colors: ["#26355C", "#101A33"], crest: WIKI + "/en/8/8b/England_national_football_team_crest.svg", est: 1863 },
  { id: "spain", name: "Spain", keys: ["spain", "españa", "espana"], colors: ["#AA151B", "#3E0709"], crest: WIKI + "/en/3/39/Spain_national_football_team_crest.svg", est: 1913 },
  { id: "mexico", name: "Mexico", keys: ["mexico", "méxico"], colors: ["#006847", "#02291D"], crest: WIKI + "/en/3/3f/Mexico_national_football_team_crest.svg", est: 1927 },
  { id: "usa", name: "USA", keys: ["usmnt", "uswnt", "usa ", "united states"], colors: ["#B22234", "#232D5B"], crest: WIKI + "/commons/1/1e/United_States_Soccer_Federation_logo.svg", est: 1913 },
  { id: "netherlands", name: "Netherlands", keys: ["netherlands", "holland", "oranje"], colors: ["#F36C21", "#57230A"], crest: WIKI + "/en/7/78/Netherlands_national_football_team_logo.svg", est: 1889 },
  { id: "japan", name: "Japan", keys: ["japan"], colors: ["#1D2088", "#0A0B33"], crest: WIKI + "/en/8/84/Japan_national_football_team_crest.svg", est: 1921 },
];

/* Clubs from George's eBay era shown as "restocking" when no live stock. */
const FEATURED_CLUB_IDS = ["man-utd", "ac-milan", "barcelona", "arsenal", "chelsea", "roma", "bayern", "real-madrid"];

/* ------------------------------------------------ state */
const state = {
  items: [],
  loaded: false,
  failed: false,
  search: "",
  wishOnly: false,
  shopTab: "teams",
  wishlist: loadWishlist(),
  fromClub: "",
  /* item view */
  item: null,
  gallery: 0,
  size: "",
  qty: 1,
};

/* ------------------------------------------------ helpers */
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function money(n) {
  return "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

function loadWishlist() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch { return []; }
}

function saveWishlist() {
  try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(state.wishlist)); } catch { /* session only */ }
}

function detectClub(title) {
  const lower = " " + String(title).toLowerCase() + " ";
  for (const club of CLUBS) {
    for (const key of club.keys) {
      if (lower.includes(key)) return club;
    }
  }
  return null;
}

function clubById(id) {
  return CLUBS.find((c) => c.id === id) || null;
}

function grad(club) {
  return "linear-gradient(135deg, " + club.colors[0] + ", " + club.colors[1] + ")";
}

const heartSvg = (filled) =>
  '<svg viewBox="0 0 24 24" fill="' + (filled ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" class="icon"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';

function placeholder(title) {
  return '<div class="ph"><span class="ph-shirt">👕</span><span class="ph-label">' + esc(title.slice(0, 42)) + "</span></div>";
}

/* ------------------------------------------------ API */
async function fetchItems() {
  try {
    const res = await fetch(API + "/ej/items");
    const data = await res.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    state.loaded = true;
    state.failed = false;
  } catch {
    state.loaded = true;
    state.failed = true;
  }
}

async function fetchItem(id) {
  const res = await fetch(API + "/ej/items/" + encodeURIComponent(id));
  if (!res.ok) throw new Error("not found");
  const data = await res.json();
  return data.item;
}

async function postOrder(payload) {
  const res = await fetch(API + "/ej/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong — try again.");
  return data;
}

async function postInterest(payload) {
  const res = await fetch(API + "/ej/interest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong — try again.");
  return data;
}

/* ------------------------------------------------ derived data */
function clubStats() {
  const map = new Map();
  for (const item of state.items) {
    const club = detectClub(item.title);
    if (!club) continue;
    const entry = map.get(club.id) || { club, count: 0, minPrice: Infinity };
    entry.count += 1;
    entry.minPrice = Math.min(entry.minPrice, item.price);
    map.set(club.id, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.club.name.localeCompare(b.club.name));
}

function incomingClubs(stats) {
  return FEATURED_CLUB_IDS.filter((id) => !stats.some((s) => s.club.id === id)).map(clubById).filter(Boolean);
}

function extras() {
  return state.items.filter((i) => detectClub(i.title) === null);
}

function popular() {
  return [...state.items].filter((i) => i.views > 0).sort((a, b) => b.views - a.views).slice(0, 8);
}

function classics() {
  return [...state.items].sort((a, b) => b.views - a.views || b.stock - a.stock || a.title.localeCompare(b.title));
}

function filtered() {
  return state.items.filter((i) => {
    if (state.wishOnly && !state.wishlist.includes(i.id)) return false;
    if (state.search && !(i.title + " " + i.category + " " + i.condition).toLowerCase().includes(state.search.toLowerCase())) return false;
    return true;
  });
}

/* ------------------------------------------------ routing */
function route() {
  const hash = location.hash || "#/";
  const club = hash.match(/^#\/club\/([a-z0-9-]+)$/);
  const item = hash.match(/^#\/item\/([a-f0-9]{16,64})$/);
  if (club) return { view: "club", id: club[1] };
  if (item) return { view: "item", id: item[1] };
  return { view: "home", id: "" };
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

window.addEventListener("hashchange", () => {
  window.scrollTo({ top: 0 });
  render();
});

/* ------------------------------------------------ shared render bits */
function productCard(item) {
  const wished = state.wishlist.includes(item.id);
  const img = item.images && item.images[0];
  const low = item.stock > 0 && item.stock <= 2;
  const out = item.stock === 0;
  return (
    '<div class="card" data-open="' + item.id + '" role="button" tabindex="0">' +
      '<div class="card-img">' +
        (item.views >= 5 ? '<span class="card-badge">🔥 Popular</span>' : "") +
        '<button class="card-heart' + (wished ? " on" : "") + '" data-wish="' + item.id + '" aria-label="Save to watchlist">' + heartSvg(wished) + "</button>" +
        (img ? '<img src="' + esc(img) + '" alt="' + esc(item.title) + '" loading="lazy" />' : placeholder(item.title)) +
      "</div>" +
      '<div class="card-body">' +
        '<p class="card-title">' + esc(item.title) + "</p>" +
        '<div class="card-meta"><span>' + esc(item.condition) + "</span>" + (item.category ? "<span>·</span><span>" + esc(item.category) + "</span>" : "") + "</div>" +
        '<div class="card-foot">' +
          '<span class="card-price">' + money(item.price) + "</span>" +
          '<span class="card-stock' + (out ? " out" : low ? " low" : "") + '">' + (out ? "Sold out" : low ? "Only " + item.stock + " left" : item.stock + " in stock") + "</span>" +
        "</div>" +
      "</div>" +
    "</div>"
  );
}

function grid(items) {
  return '<div class="grid">' + items.map(productCard).join("") + "</div>";
}

function sectionHead(kicker, title, sub, right) {
  return (
    '<div class="section-head"><div>' +
      '<p class="kicker">' + esc(kicker) + "</p>" +
      '<h2 class="heading">' + esc(title) + "</h2>" +
      (sub ? '<p class="sub">' + esc(sub) + "</p>" : "") +
    "</div>" + (right ? '<span class="count-note">' + esc(right) + "</span>" : "") + "</div>"
  );
}

/* ------------------------------------------------ home view */
function renderHome() {
  const app = document.getElementById("app");
  const searching = state.search.trim().length > 0 || state.wishOnly;

  if (!state.loaded) {
    app.innerHTML = '<div class="grid" style="margin-top:40px">' + [1, 2, 3, 4, 5, 6].map(() => '<div class="skel" style="height:280px"></div>').join("") + "</div>";
    return;
  }

  if (state.failed) {
    app.innerHTML = '<div class="empty"><span class="big">📡</span><h3>Can\'t reach the vault</h3><p>Check your connection and refresh — the store will be right here.</p></div>';
    return;
  }

  const stats = clubStats();
  const incoming = incomingClubs(stats);
  const ex = extras();
  const pop = popular();
  const cls = classics();

  let html = "";

  if (!searching) {
    /* hero */
    html +=
      '<section class="hero reveal in">' +
        '<div class="hero-glow"></div>' +
        '<span class="hero-kicker">⚡ New store · trusted seller</span>' +
        "<h1>Authentic kits.<span class=\"volt\">Zero gamble.</span></h1>" +
        '<p class="hero-sub">Club & national team jerseys hand-picked, authenticated and shipped from New Jersey — by the seller behind 800+ jersey sales on eBay with 99% positive feedback.</p>' +
        '<div class="hero-ctas">' +
          '<button class="btn btn-volt" data-scroll="ej-teams">Shop the vault</button>' +
          '<a class="btn btn-ghost" href="' + EBAY_URL + '" target="_blank" rel="noopener noreferrer">The eBay track record ↗</a>' +
        "</div>" +
        '<div class="hero-stats">' +
          '<div class="hero-stat"><p class="n">' + state.items.length + '</p><p class="l">kits in the vault</p></div>' +
          '<div class="hero-stat"><p class="n">' + (stats.length + incoming.length) + '</p><p class="l">clubs & countries</p></div>' +
          '<div class="hero-stat"><p class="n">800+</p><p class="l">eBay sales</p></div>' +
          '<div class="hero-stat"><p class="n">99%</p><p class="l">positive feedback</p></div>' +
        "</div>" +
      "</section>";

    /* team wall */
    const tabDefs = [
      { id: "teams", label: "Teams", n: stats.length + incoming.length },
      { id: "all", label: "All kits", n: state.items.length },
      { id: "classics", label: "Best sellers", n: cls.length },
    ];
    const headByTab = {
      teams: sectionHead("The main event", "Shop by team", "Every kit in the vault, sorted by badge. Pick your club or country and step inside — anything without a crest lives on the extras rack."),
      all: sectionHead("The full vault", "All jerseys", "Every kit on one rail — no badges, no sorting hats. Browse the whole vault front to back."),
      classics: sectionHead("The trophy case", "Best sellers", "The proven kits — the jerseys collectors watch, want, and buy. Ranked by real attention."),
    };

    html += '<section id="ej-teams" class="section reveal in">' + headByTab[state.shopTab];
    html += '<div class="tabs">' + tabDefs.map((t) =>
      '<button class="tab' + (state.shopTab === t.id ? " active" : "") + '" data-tab="' + t.id + '">' + t.label + '<span class="tab-n">' + t.n + "</span></button>"
    ).join("") + "</div>";

    if (state.shopTab === "teams") {
      html += '<div class="team-wall">';
      for (const s of stats) {
        html +=
          '<button class="club-card" data-club="' + s.club.id + '" style="background:' + grad(s.club) + '">' +
            '<img class="crest" src="' + s.club.crest + '" alt="" loading="lazy" onerror="this.style.display=\'none\'" />' +
            '<span class="est">est. ' + s.club.est + "</span>" +
            '<span class="name">' + esc(s.club.name) + "</span>" +
            '<span class="meta"><span class="pill">' + s.count + " kit" + (s.count === 1 ? "" : "s") + '</span><span class="pill">from ' + money(s.minPrice) + "</span></span>" +
          "</button>";
      }
      for (const club of incoming) {
        html +=
          '<button class="club-card incoming" data-club="' + club.id + '" style="background:' + grad(club) + '">' +
            '<img class="crest" src="' + club.crest + '" alt="" loading="lazy" onerror="this.style.display=\'none\'" />' +
            '<span class="est">est. ' + club.est + "</span>" +
            '<span class="name">' + esc(club.name) + "</span>" +
            '<span class="meta"><span class="pill">Restocking — new kits soon</span></span>' +
          "</button>";
      }
      html += "</div>";
    } else {
      html += grid(cls);
    }
    html += "</section>";

    /* extras rack */
    if (ex.length > 0) {
      html += '<section id="ej-extras" class="section reveal in">' +
        sectionHead("Beyond the badges", "The extras rack", "Shorts, training gear, accessories — everything that doesn't wear a club crest.", ex.length + " item" + (ex.length === 1 ? "" : "s")) +
        grid(ex) + "</section>";
    }

    /* popular */
    if (pop.length >= 3) {
      html += '<section id="ej-popular" class="section reveal in">' +
        sectionHead("Popular right now", "Most-watched kits", "The jerseys collectors keep coming back to — ranked by real views this season.") +
        grid(pop) + "</section>";
    }
  } else {
    /* search / watchlist results */
    const results = filtered();
    const title = state.search ? '"' + state.search + '"' : "Your watchlist";
    html += '<section id="ej-results" class="section" style="margin-top:40px">' +
      sectionHead(state.wishOnly ? "Saved by you" : "Search the vault", title, "", results.length + " kit" + (results.length === 1 ? "" : "s"));
    if (results.length === 0) {
      html += '<div class="empty"><span class="big">' + (state.wishOnly ? "♥" : "📦") + "</span>" +
        "<h3>" + (state.wishOnly ? "Watchlist is empty" : "Nothing here yet") + "</h3>" +
        "<p>" + (state.wishOnly ? "Tap the heart on any kit to save it here." : "Try a different search — new kits drop weekly.") + "</p></div>";
    } else {
      html += grid(results);
    }
    html += "</section>";
  }

  /* why us */
  html += '<section id="ej-why" class="section reveal in">' +
    sectionHead("Why shop with us", "Built by a collector", "The store is new — the seller isn't. 800+ jerseys sold on eBay with 99% positive feedback, every one packed by the same pair of hands in New Jersey.") +
    '<div class="why-grid">' +
      '<div class="why-card"><p class="n">800+</p><h3>Jerseys sold</h3><p>Not a first rodeo — eight hundred kits found new homes through eBay before this store even opened.</p></div>' +
      '<div class="why-card"><p class="n">99%</p><h3>Positive feedback</h3><p>Real buyers, real ratings. Check the receipts on eBay any time — the track record is public.</p></div>' +
      '<div class="why-card"><p class="n">24h</p><h3>Ship-out time</h3><p>Orders leave New Jersey within one business day, tracked, with free shipping on everything.</p></div>' +
    "</div>" +
    '<a class="ebay-cta" href="' + EBAY_URL + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + LOGO_URL + '" alt="" style="height:36px;width:36px;object-fit:contain" />' +
      '<span style="font-size:13px"><strong>elite_jersey_us</strong> · Top Seller on <span class="ebay-word"><span>e</span><span>B</span><span>a</span><span>y</span></span> — tap to verify ↗</span>' +
    "</a>" +
  "</section>";

  app.innerHTML = html;
  bindHome();
}

function bindHome() {
  document.querySelectorAll("[data-tab]").forEach((el) => {
    el.addEventListener("click", () => {
      state.shopTab = el.getAttribute("data-tab");
      render();
      document.getElementById("ej-teams")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  document.querySelectorAll("[data-club]").forEach((el) => {
    el.addEventListener("click", () => go("#/club/" + el.getAttribute("data-club")));
  });
  document.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", () => document.getElementById(el.getAttribute("data-scroll"))?.scrollIntoView({ behavior: "smooth" }));
  });
  bindCards();
}

function bindCards() {
  document.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-wish]")) return;
      state.fromClub = route().view === "club" ? route().id : "";
      go("#/item/" + el.getAttribute("data-open"));
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") el.click();
    });
  });
  document.querySelectorAll("[data-wish]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = el.getAttribute("data-wish");
      state.wishlist = state.wishlist.includes(id) ? state.wishlist.filter((x) => x !== id) : [...state.wishlist, id];
      saveWishlist();
      updateWishBadge();
      el.classList.toggle("on");
      el.innerHTML = heartSvg(el.classList.contains("on"));
    });
  });
}

/* ------------------------------------------------ club view */
function renderClub(id) {
  const app = document.getElementById("app");
  const club = clubById(id);
  if (!club) { go("#/"); return; }

  const items = state.items.filter((i) => detectClub(i.title)?.id === club.id);
  const stats = clubStats();
  const wall = [...stats.map((s) => s.club), ...incomingClubs(stats)];

  let html = '<a class="back-link" href="#/">‹ All teams</a>';
  html +=
    '<div class="club-hero" style="background:' + grad(club) + '">' +
      '<img class="crest" src="' + club.crest + '" alt="" onerror="this.style.display=\'none\'" />' +
      '<p class="est">est. ' + club.est + "</p>" +
      "<h1>" + esc(club.name) + "</h1>" +
      '<p class="meta">' + items.length + " kit" + (items.length === 1 ? "" : "s") + " in the vault · free shipping</p>" +
    "</div>";

  if (items.length > 0) {
    html += grid(items);
  } else {
    html +=
      '<div class="empty-rail">' +
        "<h2>The " + esc(club.name) + " rail is restocking</h2>" +
        "<p>George is listing new " + esc(club.name) + " kits right now. Check back soon — or see the 800+ jerseys he's already sold on eBay.</p>" +
        '<div class="row">' +
          '<a class="btn btn-volt" href="#/">Browse all teams</a>' +
          '<a class="btn btn-ghost" href="' + EBAY_URL + '" target="_blank" rel="noopener noreferrer">The eBay track record ↗</a>' +
        "</div>" +
      "</div>";
  }

  html += '<div class="section">' + sectionHead("Keep exploring", "More teams") +
    '<div class="chip-rail">' + wall.map((c) =>
      '<button class="chip' + (c.id === club.id ? " current" : "") + '" data-club="' + c.id + '">' + esc(c.name) + "</button>"
    ).join("") + "</div></div>";

  app.innerHTML = html;
  document.querySelectorAll("[data-club]").forEach((el) => {
    el.addEventListener("click", () => go("#/club/" + el.getAttribute("data-club")));
  });
  bindCards();
}

/* ------------------------------------------------ item view */
async function renderItem(id) {
  const app = document.getElementById("app");
  const backClub = state.fromClub ? clubById(state.fromClub) : null;
  const backHref = backClub ? "#/club/" + backClub.id : "#/";
  const backLabel = backClub ? "Back to " + backClub.name : "All kits";

  app.innerHTML = '<a class="back-link" href="' + backHref + '">‹ ' + esc(backLabel) + "</a>" +
    '<div class="item-grid"><div class="skel" style="aspect-ratio:1;border-radius:24px"></div>' +
    '<div><div class="skel" style="height:34px;width:80%"></div><div class="skel" style="height:44px;width:40%;margin-top:14px"></div><div class="skel" style="height:56px;margin-top:20px;border-radius:999px"></div></div></div>';

  let item;
  try {
    item = await fetchItem(id);
  } catch {
    app.innerHTML = '<div class="empty"><span class="big">🕳</span><h3>Kit not found</h3><p>This listing may have sold. Browse the vault for more.</p>' +
      '<div style="margin-top:20px"><a class="btn btn-volt" href="#/">Back to the vault</a></div></div>';
    return;
  }

  if (route().view !== "item" || route().id !== id) return; // navigated away meanwhile

  state.item = item;
  state.gallery = 0;
  state.size = "";
  state.qty = 1;
  drawItem(backHref, backLabel);
}

function drawItem(backHref, backLabel) {
  const app = document.getElementById("app");
  const item = state.item;
  const images = item.images || [];
  const hasSizeStock = Object.keys(item.sizeStock || {}).length > 0;
  const available = hasSizeStock ? (state.size ? item.sizeStock[state.size] || 0 : 0) : item.stock;

  /* related: same club → same category → rest */
  const club = detectClub(item.title);
  const others = state.items.filter((i) => i.id !== item.id);
  const seen = new Set();
  const related = [
    ...others.filter((i) => club && detectClub(i.title)?.id === club.id),
    ...others.filter((i) => i.category && i.category === item.category),
    ...others,
  ].filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true))).slice(0, 4);

  let html = '<a class="back-link" href="' + backHref + '">‹ ' + esc(backLabel) + "</a>";
  html += '<div class="item-grid">';

  /* gallery */
  html += "<div>";
  html += '<div class="gallery">';
  html += images[state.gallery]
    ? '<img class="main" src="' + esc(images[state.gallery]) + '" alt="' + esc(item.title) + '" />'
    : placeholder(item.title);
  if (images.length > 1) {
    html += '<button class="g-nav prev" id="g-prev" aria-label="Previous photo">‹</button>' +
      '<button class="g-nav next" id="g-next" aria-label="Next photo">›</button>' +
      '<span class="g-count">' + (state.gallery + 1) + " / " + images.length + "</span>";
  }
  html += "</div>";
  if (images.length > 1) {
    html += '<div class="thumbs">' + images.map((img, i) =>
      '<button data-g="' + i + '" class="' + (state.gallery === i ? "on" : "") + '"><img src="' + esc(img) + '" alt="" /></button>'
    ).join("") + "</div>";
  }
  html += '<p class="views-note">👁 ' + Math.max(item.views, 1) + " view" + (item.views === 1 ? "" : "s") + " on this kit</p>";
  html += "</div>";

  /* buy box */
  html += "<div>";
  html += '<div class="chips"><span class="chip-tag volt">' + esc(item.condition) + "</span>" +
    (item.category ? '<span class="chip-tag">' + esc(item.category) + "</span>" : "") + "</div>";
  html += '<h1 class="item-title">' + esc(item.title) + "</h1>";

  html += '<a class="seller-card" href="' + EBAY_URL + '" target="_blank" rel="noopener noreferrer">' +
    '<img src="' + LOGO_URL + '" alt="Elite Jersey" />' +
    '<span><span class="s-name">elite_jersey_us ✔ <span class="dim" style="font-weight:400">· Top Seller on <span class="ebay-word"><span>e</span><span>B</span><span>a</span><span>y</span></span></span></span>' +
    '<span class="s-sub">800+ jerseys sold · 99% positive feedback · NJ, USA</span></span>' +
    '<span class="s-verify">Verify ↗</span></a>';

  html += '<div class="price-row"><span class="price-big">' + money(item.price) + '</span><span class="ship-note">🚚 Free shipping</span></div>';

  if ((item.sizes || []).length > 0) {
    html += '<p class="opt-label">Pick a size</p><div class="sizes">';
    for (const s of item.sizes) {
      const left = hasSizeStock ? item.sizeStock[s] || 0 : item.stock;
      const soldOut = left === 0;
      html += '<button class="size-btn' + (state.size === s ? " on" : "") + '" data-size="' + esc(s) + '"' + (soldOut ? " disabled" : "") + ">" +
        '<span class="s">' + esc(s) + "</span>" +
        (hasSizeStock ? '<span class="left' + (!soldOut && left <= 2 ? " low" : "") + '">' + (soldOut ? "Sold out" : left + " left") + "</span>" : "") +
        "</button>";
    }
    html += "</div>";
  }

  html += '<div class="qty-row"><p class="opt-label" style="margin-top:0">Qty</p>' +
    '<div class="qty-box"><button id="qty-minus">−</button><span class="q">' + state.qty + '</span><button id="qty-plus">+</button></div>' +
    '<span class="stock-note">' + (item.stock === 0 ? "Out of stock" : hasSizeStock ? (state.size ? available + " in stock · size " + esc(state.size) : "pick a size to see stock") : item.stock + " in stock") + "</span></div>";

  const buyDisabled = item.stock === 0 || (hasSizeStock && !state.size);
  const buyLabel = item.stock === 0 ? "Sold out" : hasSizeStock && !state.size ? "Pick a size first" : "Buy it now";
  html += '<div class="buy-stack">' +
    '<button class="btn btn-volt btn-block" id="buy-btn"' + (buyDisabled ? " disabled" : "") + ">" + buyLabel + "</button>" +
    '<button class="btn btn-ghost btn-block" id="offer-btn">Make an offer</button>' +
    '<button class="btn btn-line btn-block" id="ask-btn">♥ Ask a question / notify me</button>' +
  "</div>";

  if (item.description) {
    html += '<div class="about-block"><h2>About this kit</h2><p>' + esc(item.description) + "</p></div>";
  }
  html += '<div class="ship-block"><p class="k">Shipping &amp; returns</p><p style="margin-top:6px">Ships within 1 business day via USPS with tracking. 30-day returns accepted — buyer pays return shipping. Questions? Use "Make an offer" to message the seller directly.</p></div>';
  html += "</div></div>";

  if (related.length > 0) {
    html += '<div class="section">' + sectionHead("Keep digging", "You might also like") + grid(related) + "</div>";
  }

  app.innerHTML = html;

  /* bindings */
  const redraw = () => drawItem(backHref, backLabel);
  if (images.length > 1) {
    document.getElementById("g-prev")?.addEventListener("click", () => { state.gallery = (state.gallery - 1 + images.length) % images.length; redraw(); });
    document.getElementById("g-next")?.addEventListener("click", () => { state.gallery = (state.gallery + 1) % images.length; redraw(); });
    document.querySelectorAll("[data-g]").forEach((el) => el.addEventListener("click", () => { state.gallery = Number(el.getAttribute("data-g")); redraw(); }));
  }
  document.querySelectorAll("[data-size]").forEach((el) => {
    el.addEventListener("click", () => {
      const s = el.getAttribute("data-size");
      state.size = state.size === s ? "" : s;
      state.qty = 1;
      redraw();
    });
  });
  document.getElementById("qty-minus")?.addEventListener("click", () => { state.qty = Math.max(1, state.qty - 1); redraw(); });
  document.getElementById("qty-plus")?.addEventListener("click", () => { state.qty = Math.min(Math.max(available, 1), state.qty + 1); redraw(); });
  document.getElementById("buy-btn")?.addEventListener("click", () => openCheckout(item));
  document.getElementById("offer-btn")?.addEventListener("click", () => openOffer(item));
  document.getElementById("ask-btn")?.addEventListener("click", () => openOffer(item));
  bindCards();
}

/* ------------------------------------------------ modals */
function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
  document.body.style.overflow = "";
}

function mountModal(inner) {
  const root = document.getElementById("modal-root");
  root.innerHTML = '<div class="modal-overlay" id="overlay"><div class="modal">' + inner + "</div></div>";
  document.body.style.overflow = "hidden";
  document.getElementById("overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") closeModal(); });
  root.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
}

function openCheckout(item) {
  const total = item.price * state.qty;
  mountModal(
    '<div class="modal-head"><h2>Checkout</h2><button class="modal-close" data-close aria-label="Close">✕</button></div>' +
    '<div class="modal-sum"><span class="t">' + esc(item.title) + (state.size ? " · " + esc(state.size) : "") + " × " + state.qty + '</span><span class="volt-p">' + money(total) + "</span></div>" +
    '<form id="checkout-form">' +
      '<input class="field" name="name" placeholder="Full name *" required maxlength="120" />' +
      '<input class="field" name="email" type="email" placeholder="Email *" required maxlength="200" />' +
      '<input class="field" name="phone" type="tel" placeholder="Phone (optional)" maxlength="60" />' +
      '<textarea class="field" name="address" placeholder="Shipping address *" rows="3" required maxlength="400"></textarea>' +
      '<textarea class="field" name="note" placeholder="Note to seller (optional)" rows="2" maxlength="500"></textarea>' +
      '<div id="checkout-err"></div>' +
      '<button class="btn btn-volt btn-block" type="submit" id="checkout-submit">Place order · ' + money(total) + "</button>" +
      '<p class="modal-note">No payment is taken online — George confirms your order by email with payment options (PayPal, Venmo, Zelle). Free tracked shipping from NJ within 24h.</p>' +
    "</form>"
  );
  document.getElementById("checkout-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = document.getElementById("checkout-submit");
    btn.disabled = true;
    btn.textContent = "Placing order…";
    document.getElementById("checkout-err").innerHTML = "";
    try {
      const result = await postOrder({
        itemId: item.id,
        size: state.size,
        qty: state.qty,
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.trim(),
        address: f.address.value.trim(),
        note: f.note.value.trim(),
      });
      mountModal(
        '<div class="success"><div class="ring">✔</div><h2>Order placed!</h2>' +
        "<p>George has your order and will email <strong>" + esc(f.email.value.trim()) + "</strong> within a few hours to confirm payment & shipping.</p>" +
        '<p class="oid">Order ID: ' + esc(result.orderId) + "</p>" +
        '<div style="margin-top:20px"><button class="btn btn-volt btn-block" data-close>Done</button></div></div>'
      );
      document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
      await fetchItems();
      state.item = await fetchItem(item.id).catch(() => state.item);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Place order · " + money(total);
      document.getElementById("checkout-err").innerHTML = '<div class="modal-err">' + esc(err.message) + "</div>";
    }
  });
}

function openOffer(item) {
  mountModal(
    '<div class="modal-head"><h2>Make an offer</h2><button class="modal-close" data-close aria-label="Close">✕</button></div>' +
    '<div class="modal-sum"><span class="t">' + esc(item.title) + '</span><span class="volt-p">' + money(item.price) + "</span></div>" +
    '<form id="offer-form">' +
      '<input class="field" name="name" placeholder="Your name *" required maxlength="120" />' +
      '<input class="field" name="email" type="email" placeholder="Email *" required maxlength="200" />' +
      '<input class="field" name="offer" type="number" min="0" step="0.01" placeholder="Your offer in USD (optional)" />' +
      '<textarea class="field" name="message" placeholder="Question or message (optional)" rows="3" maxlength="500"></textarea>' +
      '<div id="offer-err"></div>' +
      '<button class="btn btn-volt btn-block" type="submit" id="offer-submit">Send to George</button>' +
      '<p class="modal-note">Offers and questions go straight to the seller — you\'ll get a reply by email, usually same day.</p>' +
    "</form>"
  );
  document.getElementById("offer-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = document.getElementById("offer-submit");
    btn.disabled = true;
    btn.textContent = "Sending…";
    document.getElementById("offer-err").innerHTML = "";
    try {
      await postInterest({
        itemId: item.id,
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        message: f.message.value.trim(),
        offer: Number(f.offer.value) || 0,
      });
      mountModal(
        '<div class="success"><div class="ring">✔</div><h2>Sent!</h2>' +
        "<p>Your message is in George's inbox. He replies to <strong>" + esc(f.email.value.trim()) + "</strong> — usually the same day.</p>" +
        '<div style="margin-top:20px"><button class="btn btn-volt btn-block" data-close>Done</button></div></div>'
      );
      document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
    } catch (err) {
      btn.disabled = false;
      btn.textContent = "Send to George";
      document.getElementById("offer-err").innerHTML = '<div class="modal-err">' + esc(err.message) + "</div>";
    }
  });
}

/* ------------------------------------------------ header chrome */
function updateWishBadge() {
  const count = document.getElementById("wish-count");
  count.textContent = String(state.wishlist.length);
  count.hidden = state.wishlist.length === 0;
}

function buildChrome() {
  /* ticker */
  const track = document.getElementById("ticker-track");
  const seq = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  track.innerHTML = seq.map((t) => "<span>" + esc(t) + " ⚡</span>").join("");

  /* nav */
  const nav = document.getElementById("header-nav");
  const links = [
    { label: "Teams", id: "ej-teams" },
    { label: "Popular", id: "ej-popular" },
    { label: "Why us", id: "ej-why" },
  ];
  nav.innerHTML = links.map((l) => '<button data-nav="' + l.id + '">' + l.label + "</button>").join("");
  nav.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => {
      state.search = "";
      state.wishOnly = false;
      document.getElementById("search").value = "";
      document.getElementById("wish-toggle").classList.remove("active");
      if (route().view !== "home") {
        go("#/");
        setTimeout(() => document.getElementById(el.getAttribute("data-nav"))?.scrollIntoView({ behavior: "smooth" }), 160);
      } else {
        render();
        setTimeout(() => document.getElementById(el.getAttribute("data-nav"))?.scrollIntoView({ behavior: "smooth" }), 40);
      }
    });
  });

  /* footer links */
  const foot = document.getElementById("footer-links");
  foot.innerHTML = [
    { label: "Shop by team", id: "ej-teams" },
    { label: "The extras rack", id: "ej-extras" },
    { label: "Popular kits", id: "ej-popular" },
    { label: "Why shop with us", id: "ej-why" },
  ].map((l) => '<button data-foot="' + l.id + '">' + l.label + "</button>").join("");
  foot.querySelectorAll("[data-foot]").forEach((el) => {
    el.addEventListener("click", () => {
      state.search = "";
      state.wishOnly = false;
      document.getElementById("search").value = "";
      if (route().view !== "home") {
        go("#/");
        setTimeout(() => document.getElementById(el.getAttribute("data-foot"))?.scrollIntoView({ behavior: "smooth" }), 160);
      } else {
        document.getElementById(el.getAttribute("data-foot"))?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  /* search */
  const search = document.getElementById("search");
  const clear = document.getElementById("search-clear");
  search.addEventListener("input", () => {
    state.search = search.value;
    clear.hidden = search.value.length === 0;
    if (route().view !== "home") { state.fromClub = ""; location.hash = "#/"; }
    else render();
  });
  clear.addEventListener("click", () => {
    search.value = "";
    state.search = "";
    clear.hidden = true;
    render();
  });

  /* watchlist toggle */
  const wishBtn = document.getElementById("wish-toggle");
  wishBtn.addEventListener("click", () => {
    state.wishOnly = !state.wishOnly;
    state.search = "";
    search.value = "";
    clear.hidden = true;
    wishBtn.classList.toggle("active", state.wishOnly);
    if (route().view !== "home") location.hash = "#/";
    else render();
  });
  updateWishBadge();

  /* scroll progress */
  const progress = document.getElementById("progress");
  window.addEventListener("scroll", () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
  }, { passive: true });

  document.getElementById("year").textContent = String(new Date().getFullYear());
}

/* ------------------------------------------------ render dispatch */
function render() {
  const r = route();
  if (r.view === "home") renderHome();
  else if (r.view === "club") renderClub(r.id);
  else void renderItem(r.id);
}

/* ------------------------------------------------ boot */
async function boot() {
  buildChrome();
  render(); // skeletons
  await fetchItems();
  render();
  /* keep stock fresh */
  setInterval(async () => {
    if (route().view === "home") {
      await fetchItems();
      render();
    }
  }, 30000);
}

void boot();
