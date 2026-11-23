// Between the Covers – widgets for iPhone (Scriptable)
// ---------------------------------------------------------------------------
// Slik bruker du det:
//  1. Installer «Scriptable» fra App Store.
//  2. Åpne Scriptable, trykk +, lim inn hele dette skriptet og gi det navnet
//     «Between the Covers».
//  3. Hjemskjerm: hold inne → Rediger → + → Scriptable → velg størrelse.
//     Låseskjerm: hold inne låseskjermen → Tilpass → Låseskjerm → widgets →
//     Scriptable.
//  4. Trykk på widgeten (i redigeringsmodus) → Script: «Between the Covers».
//     Parameter (valgfritt) bestemmer hva den viser:
//        bok    boka du leser nå, med omslag og prosent
//        plan   🎯 dagens lesemål fra leseplanen
//        møte   neste bokklubbmøte
//        mål    lesemålet ditt i år
//     Tom parameter = det som passer best for størrelsen.
//
// Nøkkelen under er personlig – ikke del skriptet med andre. Lag en ny på
// profilsiden hvis den kommer på avveie; da slutter denne å virke.
// ---------------------------------------------------------------------------

const API = "__API_URL__";
const SITE = "__SITE_URL__";
const TOKEN = "__WIDGET_TOKEN__";

// ─── Colours (same as the app) ──────────────────────────────────────────────
const C = {
  bg: Color.dynamic(new Color("#faf6ee"), new Color("#221a1c")),
  card: Color.dynamic(new Color("#efe7d6"), new Color("#2c2224")),
  text: Color.dynamic(new Color("#2a2321"), new Color("#f1e6dc")),
  muted: Color.dynamic(new Color("#756558"), new Color("#bba99a")),
  wine: Color.dynamic(new Color("#93264d"), new Color("#e8799f")),
  sage: Color.dynamic(new Color("#2b6f49"), new Color("#59c08a")),
  terracotta: Color.dynamic(new Color("#a44424"), new Color("#e8825a")),
  track: Color.dynamic(new Color("#93264d", 0.15), new Color("#e8799f", 0.2)),
};
// Bars and rings are drawn as images, which can't follow light/dark mode
const DARK = Device.isUsingDarkAppearance();
const RAW = {
  wine: new Color(DARK ? "#e8799f" : "#93264d"),
  track: new Color(DARK ? "#e8799f" : "#93264d", DARK ? 0.22 : 0.15),
};

// ─── Data ───────────────────────────────────────────────────────────────────
const fm = FileManager.local();
const cacheDir = fm.joinPath(fm.cacheDirectory(), "btc-widget");
if (!fm.fileExists(cacheDir)) fm.createDirectory(cacheDir, true);
const dataCache = fm.joinPath(cacheDir, "data.json");

async function loadData() {
  try {
    const req = new Request(`${API}/api/widget`);
    req.headers = { Authorization: `Bearer ${TOKEN}` };
    req.timeoutInterval = 15;
    const json = await req.loadJSON();
    if (req.response.statusCode === 401) return { error: json.message || "Ugyldig widget-nøkkel" };
    if (!json.success) throw new Error(json.message || "Feil fra serveren");
    fm.writeString(dataCache, JSON.stringify(json));
    return json;
  } catch (e) {
    // Offline or server asleep: show the last data we had
    if (fm.fileExists(dataCache)) {
      const cached = JSON.parse(fm.readString(dataCache));
      cached.stale = true;
      return cached;
    }
    return { error: "Får ikke kontakt med Between the Covers" };
  }
}

function coverUrl(coverImage) {
  if (!coverImage) return null;
  return coverImage.startsWith("http") ? coverImage : `${API}/uploads/books/${coverImage}`;
}

async function loadCover(coverImage) {
  const url = coverUrl(coverImage);
  if (!url) return null;
  const file = fm.joinPath(cacheDir, "cover-" + url.replace(/[^a-z0-9]/gi, "").slice(-60));
  if (fm.fileExists(file)) return fm.readImage(file);
  try {
    const img = await new Request(url).loadImage();
    fm.writeImage(file, img);
    return img;
  } catch (e) {
    return null;
  }
}

// ─── Reading plan maths (same as the app's readingPlan.js) ──────────────────
const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);

function planStatus(book) {
  const { total, currentPage, readingPlan: plan } = book;
  if (!total || !plan) return null;
  const today = new Date();
  const remaining = Math.max(0, total - currentPage);
  const daysLeft = daysBetween(today, plan.targetDate) + 1;
  const overdue = daysLeft < 1;
  const pagesPerDay = remaining === 0 ? 0 : overdue ? remaining : Math.ceil(remaining / daysLeft);
  const todayGoalPage = Math.min(total, currentPage + pagesPerDay);
  const planDays = Math.max(1, daysBetween(plan.startDate, plan.targetDate) + 1);
  const daysDone = Math.min(planDays, Math.max(0, daysBetween(plan.startDate, today)));
  const expectedPage = Math.round(plan.startPage + ((total - plan.startPage) * daysDone) / planDays);
  return {
    remaining,
    daysLeft: Math.max(0, daysLeft),
    overdue,
    pagesPerDay,
    todayGoalPage,
    aheadBy: currentPage - expectedPage,
    done: remaining === 0,
    targetDate: new Date(plan.targetDate),
  };
}

// ─── Text helpers ───────────────────────────────────────────────────────────
const pagesWord = (n) => `${n} ${n === 1 ? "side" : "sider"}`;
const daysWord = (n) => `${n} ${n === 1 ? "dag" : "dager"}`;
const fmtShort = (d) => new Date(d).toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short" });
const fmtDayMonth = (d) => new Date(d).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });

function meetingWhen(m) {
  const days = daysBetween(new Date(), m.date);
  const rel = days <= 0 ? "I dag" : days === 1 ? "I morgen" : `Om ${daysWord(days)}`;
  return { days, rel, date: fmtShort(m.date) + (m.time ? ` kl. ${m.time}` : "") };
}

// ─── Drawing ────────────────────────────────────────────────────────────────
function barImage(width, height, pct, fg = RAW.wine, bg = RAW.track) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const r = height / 2;
  const track = new Path();
  track.addRoundedRect(new Rect(0, 0, width, height), r, r);
  ctx.addPath(track);
  ctx.setFillColor(bg);
  ctx.fillPath();
  const w = Math.max(pct > 0 ? height : 0, (width * Math.min(100, pct)) / 100);
  if (w > 0) {
    const fill = new Path();
    fill.addRoundedRect(new Rect(0, 0, w, height), r, r);
    ctx.addPath(fill);
    ctx.setFillColor(fg);
    ctx.fillPath();
  }
  return ctx.getImage();
}

// Ring gauge for the round lock screen widget (iOS tints it anyway)
function ringImage(pct, label, sub) {
  const S = 60;
  const ctx = new DrawContext();
  ctx.size = new Size(S, S);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const lw = 5;
  const c = S / 2;
  const rad = c - lw / 2 - 1;
  ctx.setLineWidth(lw);
  ctx.setStrokeColor(new Color("#ffffff", 0.25));
  ctx.strokeEllipse(new Rect(c - rad, c - rad, rad * 2, rad * 2));
  if (pct > 0) {
    const arc = new Path();
    const steps = 60;
    const sweep = (Math.min(100, pct) / 100) * Math.PI * 2;
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + (sweep * i) / steps;
      const p = new Point(c + rad * Math.cos(a), c + rad * Math.sin(a));
      if (i === 0) arc.move(p);
      else arc.addLine(p);
    }
    ctx.addPath(arc);
    ctx.setStrokeColor(Color.white());
    ctx.strokePath();
  }
  ctx.setTextAlignedCenter();
  ctx.setTextColor(Color.white());
  ctx.setFont(Font.boldRoundedSystemFont(sub ? 15 : 17));
  ctx.drawTextInRect(label, new Rect(0, sub ? 15 : 19, S, 20));
  if (sub) {
    ctx.setFont(Font.mediumSystemFont(8));
    ctx.drawTextInRect(sub, new Rect(0, 33, S, 12));
  }
  return ctx.getImage();
}

function addText(stack, text, { size = 13, weight = "regular", color = C.text, lines = 1, scale = 0.8, rounded = false } = {}) {
  const t = stack.addText(String(text));
  const fonts = rounded
    ? { regular: Font.regularRoundedSystemFont, medium: Font.mediumRoundedSystemFont, semibold: Font.semiboldRoundedSystemFont, bold: Font.boldRoundedSystemFont }
    : { regular: Font.systemFont, medium: Font.mediumSystemFont, semibold: Font.semiboldSystemFont, bold: Font.boldSystemFont };
  t.font = fonts[weight](size);
  t.textColor = color;
  t.lineLimit = lines;
  t.minimumScaleFactor = scale;
  return t;
}

function addCover(stack, img, w, h) {
  if (img) {
    const i = stack.addImage(img);
    i.imageSize = new Size(w, h);
    i.cornerRadius = 4;
    i.applyFillingContentMode();
    return i;
  }
  const box = stack.addStack();
  box.size = new Size(w, h);
  box.cornerRadius = 4;
  box.backgroundColor = C.card;
  box.centerAlignContent();
  addText(box, "📖", { size: Math.round(w / 2.2) });
  return box;
}

function addLabel(stack, text) {
  addText(stack, text.toUpperCase(), { size: 10, weight: "bold", color: C.muted });
}

function emptyMessage(w, title, body) {
  addLabel(w, "Between the Covers");
  w.addSpacer(6);
  addText(w, title, { size: 15, weight: "bold", lines: 2 });
  w.addSpacer(2);
  addText(w, body, { size: 12, color: C.muted, lines: 3 });
  w.addSpacer();
}

function staleNote(w, data) {
  if (!data.stale) return;
  w.addSpacer(2);
  addText(w, "⚠︎ Viser sist hentede data", { size: 9, color: C.muted });
}

// ─── Home screen widgets ────────────────────────────────────────────────────

// Book you're reading: cover, title, percent, bar (+ plan line on medium)
async function bookWidget(w, data, family) {
  const book = data.reading[0];
  w.url = SITE + "/leseplaner";
  if (!book) return emptyMessage(w, "Du leser ingen bok nå", "Sett en bok til «Leser» i appen.");
  w.url = `${SITE}/books/${book.bookId}`;
  const cover = await loadCover(book.coverImage);
  const status = planStatus(book);

  if (family === "small") {
    const top = w.addStack();
    top.topAlignContent();
    addCover(top, cover, 40, 60);
    top.addSpacer();
    const pctStack = top.addStack();
    pctStack.layoutVertically();
    addText(pctStack, book.percent != null ? `${book.percent}%` : "–", { size: 24, weight: "bold", color: C.wine, rounded: true });
    w.addSpacer();
    addText(w, book.title, { size: 13, weight: "semibold", lines: 2 });
    w.addSpacer(5);
    if (book.percent != null) w.addImage(barImage(130, 6, book.percent)).imageSize = new Size(130, 6);
    else addText(w, "Legg inn fremdrift", { size: 10, color: C.muted });
    staleNote(w, data);
    return;
  }

  // medium / large
  const row = w.addStack();
  row.centerAlignContent();
  addCover(row, cover, 62, 93);
  row.addSpacer(12);
  const col = row.addStack();
  col.layoutVertically();
  addLabel(col, "Leser nå");
  col.addSpacer(3);
  addText(col, book.title, { size: 15, weight: "bold", lines: 2 });
  addText(col, book.author || "", { size: 11, color: C.muted });
  col.addSpacer(8);
  if (book.percent != null) {
    const pr = col.addStack();
    pr.centerAlignContent();
    pr.addImage(barImage(150, 7, book.percent)).imageSize = new Size(150, 7);
    pr.addSpacer(8);
    addText(pr, `${book.percent}%`, { size: 14, weight: "bold", color: C.wine, rounded: true });
    col.addSpacer(3);
    addText(col, `Side ${book.currentPage} av ${book.total}`, { size: 11, color: C.muted });
  } else {
    addText(col, "Legg inn hvor langt du har kommet", { size: 11, color: C.muted });
  }
  if (status && !status.done) {
    col.addSpacer(4);
    addText(col, status.overdue ? "Fristen er ute" : `🎯 I dag: til side ${status.todayGoalPage}`, {
      size: 12,
      weight: "semibold",
      color: status.overdue ? C.terracotta : C.text,
    });
  }
  staleNote(w, data);
}

// Today's reading goal from the plan
async function planWidget(w, data, family) {
  const book = data.reading.find((b) => b.readingPlan) || null;
  w.url = SITE + "/leseplaner";
  if (!book) return emptyMessage(w, "Ingen leseplan", "Lag en leseplan på en bok du leser, så ser du dagens mål her.");
  const s = planStatus(book);

  addLabel(w, "🎯 Dagens mål");
  w.addSpacer(family === "small" ? 4 : 6);

  if (s.done) {
    addText(w, "Ferdig! 🎉", { size: 22, weight: "bold", color: C.sage, rounded: true });
    addText(w, book.title, { size: 12, color: C.muted, lines: 2 });
    w.addSpacer();
    return staleNote(w, data);
  }

  const row = w.addStack();
  row.centerAlignContent();
  if (family !== "small") {
    addCover(row, await loadCover(book.coverImage), 44, 66);
    row.addSpacer(12);
  }
  const col = row.addStack();
  col.layoutVertically();
  addText(col, s.overdue ? "Fristen er ute" : `Til side ${s.todayGoalPage}`, {
    size: family === "small" ? 24 : 26,
    weight: "bold",
    color: s.overdue ? C.terracotta : C.wine,
    rounded: true,
  });
  addText(col, s.overdue ? `${pagesWord(s.remaining)} igjen` : `${pagesWord(s.pagesPerDay)} i dag`, { size: 13, weight: "semibold" });
  if (family !== "small") addText(col, book.title, { size: 12, color: C.muted });

  w.addSpacer();
  const pct = Math.round((book.currentPage / book.total) * 100);
  w.addImage(barImage(family === "small" ? 130 : 290, 6, pct)).imageSize = new Size(family === "small" ? 130 : 290, 6);
  w.addSpacer(4);
  let foot = s.overdue ? `Frist var ${fmtDayMonth(s.targetDate)}` : `${daysWord(s.daysLeft)} igjen · ferdig ${fmtDayMonth(s.targetDate)}`;
  if (!s.overdue && s.aheadBy > 0 && family !== "small") foot += ` · ${pagesWord(s.aheadBy)} foran 💪`;
  addText(w, foot, { size: 10, color: s.aheadBy < 0 && !s.overdue ? C.terracotta : C.muted });
  staleNote(w, data);
}

// Next book club meeting
async function meetingWidget(w, data, family) {
  const m = data.nextMeeting;
  w.url = SITE + "/meetings";
  if (!m) return emptyMessage(w, "Ingen møter planlagt", "Neste bokklubbmøte dukker opp her.");
  w.url = `${SITE}/meetings/${m.id}`;
  const when = meetingWhen(m);

  addLabel(w, "📚 Neste bokklubb");
  w.addSpacer(family === "small" ? 4 : 6);
  const row = w.addStack();
  row.topAlignContent();
  if (family !== "small" && m.book) {
    addCover(row, await loadCover(m.book.coverImage), 56, 84);
    row.addSpacer(12);
  }
  const col = row.addStack();
  col.layoutVertically();
  addText(col, when.rel, { size: family === "small" ? 22 : 24, weight: "bold", color: C.wine, rounded: true });
  addText(col, when.date, { size: 12, weight: "semibold" });
  if (m.location && family !== "small") addText(col, `📍 ${m.location}`, { size: 11, color: C.muted });
  if (m.book) {
    col.addSpacer(4);
    addText(col, m.book.title, { size: 12, weight: "medium", lines: family === "small" ? 2 : 1, color: C.text });
  } else if (family !== "small") {
    addText(col, m.title, { size: 12, color: C.muted });
  }
  w.addSpacer();
  if (family !== "small") addText(w, m.attending ? "✓ Du er påmeldt" : "Du har ikke meldt deg på ennå", { size: 10, color: m.attending ? C.sage : C.muted });
  staleNote(w, data);
}

// Reading goal this year
async function goalWidget(w, data, family) {
  w.url = SITE + "/history";
  const year = new Date().getFullYear();
  addLabel(w, `Lesemål ${year}`);
  w.addSpacer();
  if (!data.readingGoal) {
    addText(w, `${data.readThisYear}`, { size: 34, weight: "bold", color: C.wine, rounded: true });
    addText(w, `${data.readThisYear === 1 ? "bok" : "bøker"} lest i år`, { size: 12, color: C.muted });
    w.addSpacer();
    return staleNote(w, data);
  }
  const pct = Math.min(100, Math.round((data.readThisYear / data.readingGoal) * 100));
  const row = w.addStack();
  row.bottomAlignContent();
  addText(row, `${data.readThisYear}`, { size: 34, weight: "bold", color: C.wine, rounded: true });
  addText(row, ` / ${data.readingGoal}`, { size: 16, weight: "semibold", color: C.muted, rounded: true });
  addText(w, data.readThisYear >= data.readingGoal ? "Målet er nådd! 🎉" : `${data.readingGoal - data.readThisYear} bøker igjen`, { size: 12, color: C.muted });
  w.addSpacer(6);
  const bw = family === "small" ? 130 : 290;
  w.addImage(barImage(bw, 6, pct)).imageSize = new Size(bw, 6);
  staleNote(w, data);
}

// Medium/large with no parameter: book + plan, then the meeting
async function overviewWidget(w, data, family) {
  w.url = SITE + "/leseplaner";
  const books = data.reading.slice(0, family === "large" ? 3 : 1);
  if (!books.length) {
    addLabel(w, "Leser nå");
    w.addSpacer(4);
    addText(w, "Du leser ingen bok nå", { size: 14, weight: "semibold" });
  }
  for (const [i, book] of books.entries()) {
    if (i > 0) w.addSpacer(10);
    const row = w.addStack();
    row.centerAlignContent();
    addCover(row, await loadCover(book.coverImage), 40, 60);
    row.addSpacer(10);
    const col = row.addStack();
    col.layoutVertically();
    addText(col, book.title, { size: 14, weight: "bold" });
    col.addSpacer(4);
    if (book.percent != null) {
      const pr = col.addStack();
      pr.centerAlignContent();
      pr.addImage(barImage(170, 6, book.percent)).imageSize = new Size(170, 6);
      pr.addSpacer(8);
      addText(pr, `${book.percent}%`, { size: 13, weight: "bold", color: C.wine, rounded: true });
    } else {
      addText(col, "Legg inn fremdrift", { size: 11, color: C.muted });
    }
    const s = planStatus(book);
    if (s && !s.done) {
      col.addSpacer(3);
      addText(col, s.overdue ? "Fristen er ute" : `🎯 I dag: til side ${s.todayGoalPage} (${pagesWord(s.pagesPerDay)})`, {
        size: 11,
        weight: "medium",
        color: s.overdue ? C.terracotta : C.text,
      });
    }
  }

  w.addSpacer();
  const m = data.nextMeeting;
  const foot = w.addStack();
  foot.centerAlignContent();
  if (m) {
    const when = meetingWhen(m);
    addText(foot, `📚 Bokklubb ${when.rel.toLowerCase()}`, { size: 11, weight: "semibold" });
    addText(foot, ` · ${when.date}${m.book ? ` · ${m.book.title}` : ""}`, { size: 11, color: C.muted });
  } else if (data.readingGoal) {
    addText(foot, `Lesemål: ${data.readThisYear} av ${data.readingGoal} bøker i år`, { size: 11, color: C.muted });
  }
  if (family === "large" && m && data.readingGoal) {
    w.addSpacer(3);
    addText(w, `Lesemål: ${data.readThisYear} av ${data.readingGoal} bøker i år`, { size: 11, color: C.muted });
  }
  staleNote(w, data);
}

// ─── Lock screen widgets ────────────────────────────────────────────────────
function lockCircular(w, data, kind) {
  w.addAccessoryWidgetBackground = true;
  const book = data.reading[0];
  let img;
  if (kind === "plan") {
    const b = data.reading.find((x) => x.readingPlan);
    const s = b && planStatus(b);
    img = s && !s.done ? ringImage(Math.round((b.currentPage / b.total) * 100), s.overdue ? "!" : `${s.todayGoalPage}`, "I DAG") : ringImage(0, "–");
    w.url = SITE + "/leseplaner";
  } else if (kind === "møte") {
    const m = data.nextMeeting;
    if (m) {
      const d = Math.max(0, daysBetween(new Date(), m.date));
      img = ringImage(0, d === 0 ? "I dag" : `${d}`, d === 0 ? "BOKKLUBB" : d === 1 ? "DAG" : "DAGER");
      w.url = `${SITE}/meetings/${m.id}`;
    } else img = ringImage(0, "–");
  } else if (kind === "mål") {
    const goal = data.readingGoal;
    img = ringImage(goal ? (data.readThisYear / goal) * 100 : 0, `${data.readThisYear}`, goal ? `AV ${goal}` : "LEST");
    w.url = SITE + "/history";
  } else {
    img = book && book.percent != null ? ringImage(book.percent, `${book.percent}%`) : ringImage(0, "📖");
    w.url = book ? `${SITE}/books/${book.bookId}` : SITE;
  }
  const i = w.addImage(img);
  i.imageSize = new Size(60, 60);
  i.centerAlignImage();
}

function lockRectangular(w, data, kind) {
  const book = data.reading[0];
  const planBook = data.reading.find((x) => x.readingPlan);
  const line = (text, weight = "regular") => addText(w, text, { size: 13, weight, color: Color.white() });

  if (kind === "møte") {
    const m = data.nextMeeting;
    w.url = m ? `${SITE}/meetings/${m.id}` : SITE + "/meetings";
    if (!m) return line("Ingen møter planlagt");
    const when = meetingWhen(m);
    line(`📚 Bokklubb ${when.rel.toLowerCase()}`, "bold");
    line(when.date);
    if (m.book) line(m.book.title);
    return;
  }
  if (kind === "mål") {
    w.url = SITE + "/history";
    line(`Lesemål ${new Date().getFullYear()}`, "bold");
    line(data.readingGoal ? `${data.readThisYear} av ${data.readingGoal} bøker` : `${data.readThisYear} bøker lest`);
    if (data.readingGoal) {
      w.addSpacer(3);
      w.addImage(barImage(150, 5, (data.readThisYear / data.readingGoal) * 100, Color.white(), new Color("#ffffff", 0.3))).imageSize = new Size(150, 5);
    }
    return;
  }
  if (kind === "plan" && planBook) {
    const s = planStatus(planBook);
    w.url = SITE + "/leseplaner";
    if (s.done) return line(`🎉 Ferdig med ${planBook.title}`, "bold");
    line(s.overdue ? "🎯 Fristen er ute" : `🎯 I dag: til side ${s.todayGoalPage}`, "bold");
    line(s.overdue ? `${pagesWord(s.remaining)} igjen` : `${pagesWord(s.pagesPerDay)} · ${daysWord(s.daysLeft)} igjen`);
    line(planBook.title);
    return;
  }
  // bok (default)
  w.url = book ? `${SITE}/books/${book.bookId}` : SITE;
  if (!book) return line("📖 Ingen bok på gang");
  line(book.title, "bold");
  if (book.percent != null) {
    line(`${book.percent}% · side ${book.currentPage} av ${book.total}`);
    w.addSpacer(3);
    w.addImage(barImage(150, 5, book.percent, Color.white(), new Color("#ffffff", 0.3))).imageSize = new Size(150, 5);
  } else {
    line(book.author || "Leser nå");
  }
}

function lockInline(w, data, kind) {
  const book = data.reading[0];
  const planBook = data.reading.find((x) => x.readingPlan);
  let text;
  if (kind === "møte") {
    const m = data.nextMeeting;
    text = m ? `📚 Bokklubb ${meetingWhen(m).rel.toLowerCase()}` : "📚 Ingen møter planlagt";
  } else if (kind === "mål") {
    text = data.readingGoal ? `📚 ${data.readThisYear}/${data.readingGoal} bøker i år` : `📚 ${data.readThisYear} bøker i år`;
  } else if ((kind === "plan" || !kind) && planBook) {
    const s = planStatus(planBook);
    text = s.done ? "🎉 Ferdig med boka!" : s.overdue ? "🎯 Fristen er ute" : `🎯 I dag: til side ${s.todayGoalPage}`;
  } else {
    text = book ? `📖 ${book.title}${book.percent != null ? ` · ${book.percent}%` : ""}` : "📖 Ingen bok på gang";
  }
  addText(w, text, { size: 13 });
  w.url = SITE;
}

// ─── Build ──────────────────────────────────────────────────────────────────
function normalizeKind(param) {
  const p = String(param || "").trim().toLowerCase();
  if (["bok", "book", "leser"].includes(p)) return "bok";
  if (["plan", "leseplan", "mål i dag"].includes(p)) return "plan";
  if (["møte", "mote", "moete", "meeting", "bokklubb"].includes(p)) return "møte";
  if (["mål", "mal", "goal", "lesemål"].includes(p)) return "mål";
  return "";
}

async function buildWidget(family, kind) {
  const w = new ListWidget();
  // Ask iOS to refresh in ~15 min (iOS decides the exact time)
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  const data = await loadData();
  const isLock = family.startsWith("accessory");

  if (!isLock) {
    w.backgroundColor = C.bg;
    w.setPadding(14, 14, 14, 14);
  }

  if (data.error) {
    if (isLock) addText(w, "⚠︎ " + data.error, { size: 12, color: Color.white(), lines: 3 });
    else emptyMessage(w, "Kunne ikke hente data", data.error);
    w.url = SITE + "/profile";
    return w;
  }

  if (family === "accessoryCircular") lockCircular(w, data, kind);
  else if (family === "accessoryRectangular") lockRectangular(w, data, kind || (data.reading.some((b) => b.readingPlan) ? "plan" : "bok"));
  else if (family === "accessoryInline") lockInline(w, data, kind);
  else if (kind === "bok") await bookWidget(w, data, family);
  else if (kind === "plan") await planWidget(w, data, family);
  else if (kind === "møte") await meetingWidget(w, data, family);
  else if (kind === "mål") await goalWidget(w, data, family);
  else if (family === "small") await bookWidget(w, data, family);
  else await overviewWidget(w, data, family);
  return w;
}

if (config.runsInWidget || config.runsInAccessoryWidget) {
  Script.setWidget(await buildWidget(config.widgetFamily || "medium", normalizeKind(args.widgetParameter)));
} else {
  // Run inside the Scriptable app: pick a preview
  const previews = [
    ["Oversikt (medium)", "medium", ""],
    ["Oversikt (stor)", "large", ""],
    ["Boka du leser (liten)", "small", "bok"],
    ["Boka du leser (medium)", "medium", "bok"],
    ["Dagens mål (liten)", "small", "plan"],
    ["Dagens mål (medium)", "medium", "plan"],
    ["Neste møte (liten)", "small", "møte"],
    ["Neste møte (medium)", "medium", "møte"],
    ["Lesemål (liten)", "small", "mål"],
    ["Låseskjerm: rund", "accessoryCircular", "bok"],
    ["Låseskjerm: rektangel", "accessoryRectangular", ""],
    ["Låseskjerm: én linje", "accessoryInline", ""],
  ];
  const a = new Alert();
  a.title = "Between the Covers";
  a.message = "Velg en widget å forhåndsvise";
  previews.forEach(([label]) => a.addAction(label));
  a.addCancelAction("Avbryt");
  const choice = await a.presentSheet();
  if (choice >= 0) {
    const [, family, kind] = previews[choice];
    const w = await buildWidget(family, kind);
    const present = {
      small: () => w.presentSmall(),
      medium: () => w.presentMedium(),
      large: () => w.presentLarge(),
      accessoryCircular: () => w.presentAccessoryCircular(),
      accessoryRectangular: () => w.presentAccessoryRectangular(),
      accessoryInline: () => w.presentAccessoryInline(),
    };
    await present[family]();
  }
}
Script.complete();
