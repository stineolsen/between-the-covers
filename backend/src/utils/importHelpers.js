const he = require("he");
const levenshtein = require("fast-levenshtein");

function normStr(s) {
  return (s || "").toString().trim();
}

function normIsbn(isbn) {
  if (!isbn) return null;
  const cleaned = isbn.toString().replace(/[^0-9Xx]/g, "").toUpperCase();
  return cleaned.length >= 10 ? cleaned : null;
}

function normalizeTitle(title) {
  let t = normStr(title).toLowerCase();
  t = t.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ");
  t = t.replace(/[^a-z0-9]+/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function normalizeAuthor(author) {
  return normStr(author)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a, b) {
  const A = normalizeTitle(a);
  const B = normalizeTitle(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const dist = levenshtein.get(A, B);
  const maxLen = Math.max(A.length, B.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

// Fix Atlas "language override unsupported: eng" by storing analyzer-friendly names
function normalizeLanguageForAtlas(code) {
  if (!code) return null;
  const v = code.toString().trim().toLowerCase();
  const map = {
    eng: "english",
    en: "english",
    nob: "norwegian",
    nno: "norwegian",
    nor: "norwegian",
    no: "norwegian",
    dan: "danish",
    da: "danish",
    swe: "swedish",
    sv: "swedish",
    deu: "german",
    ger: "german",
    de: "german",
    fra: "french",
    fre: "french",
    fr: "french",
    spa: "spanish",
    es: "spanish",
    ita: "italian",
    it: "italian",
  };
  return map[v] || v;
}

// Strips HTML comments down to readable plain text with paragraph breaks.
// Expects raw (non-XML-escaped) HTML, e.g. Calibre's stored "comments" field.
function cleanDescription(html) {
  if (!html) return null;

  let s = html.toString();

  s = s
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div\s*>/gi, "\n")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<\/h[1-6]\s*>/gi, "\n\n");

  s = s.replace(/<[^>]*>/g, "");
  s = he.decode(s);

  s = s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return s || null;
}

// --- Calibre-Web OPDS parsing ---
// The feed mixes real XML elements (div/br/p wrapper) with Calibre's comments
// HTML embedded as XML-escaped text inside the wrapping <p>, so the description
// is escaped twice: once by the XML serializer, once because the source value is
// itself HTML. he.decode() once to reveal real tags, then cleanDescription() to
// strip them and resolve the remaining entity layer.
function parseOpdsEntry(entryXml) {
  const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
  if (!titleMatch) return null;
  const title = he.decode(titleMatch[1].trim());

  const updatedMatch = entryXml.match(/<updated>([^<]+)<\/updated>/);
  const updatedAt = updatedMatch ? new Date(updatedMatch[1]) : null;

  const authorNames = [];
  const authorRe = /<author>\s*<name>([^<]*)<\/name>\s*<\/author>/g;
  let m;
  while ((m = authorRe.exec(entryXml))) {
    const name = he.decode(m[1].trim());
    if (name) authorNames.push(name);
  }
  const author = authorNames.length ? authorNames.join(" | ") : null;

  const publisherMatch = entryXml.match(/<publisher>\s*<name>([^<]*)<\/name>\s*<\/publisher>/);
  const publisher = publisherMatch ? he.decode(publisherMatch[1].trim()) || null : null;

  const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);
  let publishedYear = null;
  if (publishedMatch) {
    const y = new Date(publishedMatch[1]).getFullYear();
    // Calibre's "no pubdate set" sentinel serializes as year 101 - ignore it
    if (Number.isFinite(y) && y > 1000) publishedYear = y;
  }

  const languageMatch = entryXml.match(/<dcterms:language>([^<]+)<\/dcterms:language>/);
  const languageCode = languageMatch ? languageMatch[1].trim() : null;

  const genres = [];
  const categoryRe = /<category[^>]*\sterm="([^"]*)"/g;
  while ((m = categoryRe.exec(entryXml))) {
    genres.push(he.decode(m[1]));
  }

  const acquisitionMatch = entryXml.match(/\/opds\/download\/(\d+)\//);
  const calibreId = acquisitionMatch ? acquisitionMatch[1] : null;

  const contentMatch = entryXml.match(/<content type="xhtml">([\s\S]*?)<\/content>/);
  let series = null;
  let seriesNumber = null;
  let description = null;
  if (contentMatch) {
    const content = contentMatch[1];

    const seriesMatch = content.match(/SERIES:\s*([^[<]+?)\s*\[([\d.]+)\]/);
    if (seriesMatch) {
      series = he.decode(seriesMatch[1].trim());
      seriesNumber = parseFloat(seriesMatch[2]);
    }

    const descMatch = content.match(/<p>([\s\S]*)<\/p>\s*<\/div>\s*$/);
    if (descMatch) {
      description = cleanDescription(he.decode(descMatch[1]));
    }
  }

  return {
    title,
    author,
    updatedAt,
    publisher,
    publishedYear,
    languageCode,
    genres,
    calibreId,
    series,
    seriesNumber,
    description,
  };
}

async function fetchOpdsXml(url, username, password) {
  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) {
    throw new Error(`OPDS request failed: ${res.status} ${url}`);
  }
  return res.text();
}

function getOpdsNextPageUrl(xml, baseUrl) {
  const nextMatch = xml.match(/<link rel="next"[^>]*href="([^"]+)"/);
  return nextMatch ? new URL(he.decode(nextMatch[1]), baseUrl).toString() : null;
}

// --- Audiobookshelf ---

async function absGet(baseUrl, token, path) {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`ABS ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function resolveAbsLibraryId(baseUrl, token, configuredLibraryId) {
  if (configuredLibraryId) return { id: configuredLibraryId, available: null };
  const libs = await absGet(baseUrl, token, "/api/libraries");
  const list = Array.isArray(libs) ? libs : libs?.libraries || [];
  return { id: null, available: list.map((l) => ({ id: l.id, name: l.name })) };
}

async function fetchAllAbsItems(baseUrl, token, libraryId) {
  const data = await absGet(baseUrl, token, `/api/libraries/${libraryId}/items?limit=1000`);
  return data.results || data.items || [];
}

// ABS metadata shapes vary by version, so pull title/author/isbn as best-effort
function mapAbsItem(item, publicItemBase) {
  const media = item.media || item;
  const md = media.metadata || media;

  const title = md.title || item.title || null;

  const author =
    md.authorName ||
    (Array.isArray(md.authors) ? md.authors.map((a) => a?.name || a).join(", ") : null) ||
    null;

  const isbn = normIsbn(md.isbn) || normIsbn(md.identifiers?.isbn) || null;

  const absId = item.id || item.libraryItemId || null;
  const audiobookUrl = absId && publicItemBase ? `${publicItemBase.replace(/\/$/, "")}/${absId}` : null;

  return {
    absId,
    title,
    author,
    isbn,
    titleNormalized: normalizeTitle(title),
    authorNormalized: normalizeAuthor(author),
    audiobookUrl,
  };
}

module.exports = {
  normalizeTitle,
  normalizeAuthor,
  normalizeLanguageForAtlas,
  cleanDescription,
  titleSimilarity,
  parseOpdsEntry,
  fetchOpdsXml,
  getOpdsNextPageUrl,
  resolveAbsLibraryId,
  fetchAllAbsItems,
  mapAbsItem,
};
