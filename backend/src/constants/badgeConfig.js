// Every "lesemerke" (badge) in one place - names, levels, colours and icons.
// The awarder (utils/badgeAwarder.js) and the profile/badge pages all read
// from here, so changing a level or a name is a one-line edit.
//
// A badge is a tier in a family. `metric` names the number it's measured
// on (see computeMetrics in badgeAwarder) and `goal` the value to reach;
// `label` is what's printed on the bookmark. Names never contain numbers -
// the number lives on the bookmark only. `secret` badges show as a lock
// until earned.
//
// Families marked `perYear` have their own tiers per calendar year (badge
// keys get the year appended), everything else is lifetime.

// Colours are the design system's theme-invariant solid fills
const BADGE_FAMILIES = [
  {
    key: "books",
    name: "Bøker lest",
    color: "#2f7a50",
    icon: "book",
    description: "Alle bøker du har markert som Lest.",
    tiers: [
      { label: "25", name: "Godt i gang", rule: "25 bøker lest", metric: "books", goal: 25 },
      { label: "50", name: "Bokorm", rule: "50 bøker lest", metric: "books", goal: 50 },
      { label: "100", name: "Lesehest", rule: "100 bøker lest", metric: "books", goal: 100 },
      { label: "250", name: "Bokslukeren", rule: "250 bøker lest", metric: "books", goal: 250 },
      { label: "500", name: "Levende bibliotek", rule: "500 bøker lest", metric: "books", goal: 500 },
      { label: "1000", name: "Bokhyllelegende", rule: "1 000 bøker lest", metric: "books", goal: 1000 },
    ],
  },
  {
    key: "pages",
    name: "Sider lest",
    color: "#2a3a6a",
    icon: "pages",
    description: "Summen av sidetallene i bøkene du har lest. Bøker uten sidetall teller ikke.",
    tiers: [
      { label: "10k", name: "Bladvender", rule: "10 000 sider", metric: "pages", goal: 10000 },
      { label: "50k", name: "Sidesluker", rule: "50 000 sider", metric: "pages", goal: 50000 },
      { label: "100k", name: "Papirmølla", rule: "100 000 sider", metric: "pages", goal: 100000 },
      { label: "250k", name: "Bokstavhavet", rule: "250 000 sider", metric: "pages", goal: 250000 },
      { label: "500k", name: "Sidenes mester", rule: "500 000 sider", metric: "pages", goal: 500000 },
    ],
  },
  {
    key: "audio",
    name: "Lydboktimer",
    color: "#1e7a93",
    icon: "headphones",
    description: "Timer lyttet i Audiobookshelf.",
    tiers: [
      { label: "25", name: "Ørene på", rule: "25 timer lydbok", metric: "audioHours", goal: 25 },
      { label: "100", name: "Lydbokvenn", rule: "100 timer lydbok", metric: "audioHours", goal: 100 },
      { label: "250", name: "Lytteløve", rule: "250 timer lydbok", metric: "audioHours", goal: 250 },
      { label: "500", name: "Lyttemaskin", rule: "500 timer lydbok", metric: "audioHours", goal: 500 },
      { label: "1000", name: "Evig lytter", rule: "1 000 timer lydbok", metric: "audioHours", goal: 1000 },
      { label: "2000", name: "Lydboklegende", rule: "2 000 timer lydbok", metric: "audioHours", goal: 2000 },
    ],
  },
  {
    key: "reviews",
    name: "Anmeldelser",
    color: "#93264d",
    icon: "pen",
    description: "Anmeldelser med tekst. Bare stjerner teller under Stjerner delt ut.",
    tiers: [
      { label: "1", name: "Første ord", rule: "1 anmeldelse", metric: "reviews", goal: 1 },
      { label: "10", name: "Meningsfull", rule: "10 anmeldelser", metric: "reviews", goal: 10 },
      { label: "25", name: "Kritikerspire", rule: "25 anmeldelser", metric: "reviews", goal: 25 },
      { label: "50", name: "Anmelderen", rule: "50 anmeldelser", metric: "reviews", goal: 50 },
      { label: "100", name: "Meningsmaskinen", rule: "100 anmeldelser", metric: "reviews", goal: 100 },
    ],
  },
  {
    key: "stars",
    name: "Stjerner delt ut",
    color: "#96631d",
    icon: "star",
    description: "Bøker du har gitt stjerner, med eller uten tekst.",
    tiers: [
      { label: "25", name: "Stjernedrysser", rule: "25 bøker vurdert", metric: "ratings", goal: 25 },
      { label: "100", name: "Stjernekaster", rule: "100 bøker vurdert", metric: "ratings", goal: 100 },
      { label: "250", name: "Stjernehimmel", rule: "250 bøker vurdert", metric: "ratings", goal: 250 },
    ],
  },
  {
    key: "dnf",
    name: "DNF",
    color: "#c1502a",
    icon: "bookx",
    description: "Bøker merket som DNF. Å legge fra seg en bok er også en ferdighet.",
    tiers: [
      { label: "1", name: "Livet er for kort", rule: "1 DNF", metric: "dnf", goal: 1 },
      { label: "10", name: "Ingen nåde", rule: "10 DNF", metric: "dnf", goal: 10 },
      { label: "25", name: "Bokdommeren", rule: "25 DNF", metric: "dnf", goal: 25 },
      { label: "50", name: "Portvokteren", rule: "50 DNF", metric: "dnf", goal: 50 },
    ],
  },
  {
    key: "series",
    name: "Serier",
    color: "#1f5d3e",
    icon: "layers",
    description: "Serier med minst tre bøker i biblioteket, der du har lest alle.",
    tiers: [
      { label: "5", name: "I mål", rule: "5 serier fullført", metric: "series", goal: 5 },
      { label: "10", name: "Seriemester", rule: "10 serier fullført", metric: "series", goal: 10 },
      { label: "25", name: "Sagasamleren", rule: "25 serier fullført", metric: "series", goal: 25 },
      { label: "50", name: "Seriemaskin", rule: "50 serier fullført", metric: "series", goal: 50 },
    ],
  },
  {
    key: "timetravel",
    name: "Tidsreisende",
    color: "#5a5a68",
    icon: "clock",
    description: "Bøker utgitt for over 100 år siden.",
    tiers: [
      { label: "1", name: "Tidsreisende", rule: "1 bok over 100 år", metric: "oldBooks", goal: 1 },
      { label: "5", name: "Klassikervenn", rule: "5 bøker over 100 år", metric: "oldBooks", goal: 5 },
      { label: "10", name: "Gammel sjel", rule: "10 bøker over 100 år", metric: "oldBooks", goal: 10 },
      { label: "25", name: "Levende arkiv", rule: "25 bøker over 100 år", metric: "oldBooks", goal: 25 },
      { label: "50", name: "Tidløs", rule: "50 bøker over 100 år", metric: "oldBooks", goal: 50 },
    ],
  },
  {
    key: "advent",
    name: "Julekalender",
    color: "#b5182f",
    icon: "gift",
    description: "Luker løst i julekalenderen. Lukemerkene gis per år.",
    perYear: true,
    tiers: [
      // Keys match the door-count badges the advent calendar already awards
      { key: "advent-doors-{year}-5", label: "5", name: "Julestart", rule: "5 luker løst innen fristen", metric: "adventDoors", goal: 5 },
      { key: "advent-doors-{year}-12", label: "12", name: "Halvveis til jul", rule: "12 luker løst innen fristen", metric: "adventDoors", goal: 12 },
      { key: "advent-doors-{year}-18", label: "18", name: "Nesten jul", rule: "18 luker løst innen fristen", metric: "adventDoors", goal: 18 },
      { key: "advent-doors-{year}-24", label: "24", name: "Kalendermester", rule: "Alle 24 luker løst innen fristen", metric: "adventDoors", goal: 24 },
    ],
  },
  {
    key: "adventExtra",
    name: "Julekalender-ekstra",
    color: "#b5182f",
    icon: "gift",
    description: "Spesielle prestasjoner i julekalenderen, på tvers av år.",
    tiers: [
      { label: "1.", name: "Blinkskudd", rule: "En luke løst på første forsøk", metric: "adventFirstTry", goal: 1 },
      { label: "5×", name: "Tankeleser", rule: "5 luker løst på første forsøk", metric: "adventFirstTry", goal: 5 },
      { label: "4.", name: "Aldri gi opp", rule: "En luke løst på fjerde forsøk", metric: "adventFourthTry", goal: 1 },
      { label: "24.", name: "Julaften", rule: "Luke 24 løst", metric: "adventDoor24", goal: 1 },
      { label: "2 år", name: "Kalenderveteran", rule: "Spilt julekalenderen to år", metric: "adventYears", goal: 2 },
    ],
  },
  {
    key: "club",
    name: "Bokklubben",
    color: "#5b3a7a",
    icon: "people",
    description: "Bokklubbmøter fra 2026 og utover, og bokklubbøkene.",
    tiers: [
      { label: "10", name: "Fast inventar", rule: "10 bokklubbmøter", metric: "meetings", goal: 10 },
      { label: "15", name: "Stamgjest", rule: "15 bokklubbmøter", metric: "meetings", goal: 15 },
      { label: "25", name: "Klubbens grunnmur", rule: "25 bokklubbmøter", metric: "meetings", goal: 25 },
      { label: "50", name: "Klubblegende", rule: "50 bokklubbmøter", metric: "meetings", goal: 50 },
      { label: "100%", name: "Trofast", rule: "Lest alle bokklubbøkene ett år", metric: "trofast", goal: 1 },
    ],
  },
  {
    key: "social",
    name: "Klubbliv",
    color: "#6b1938",
    icon: "heart",
    description: "Anbefalinger du gir, og likes på anmeldelsene dine.",
    tiers: [
      { label: "5", name: "Tipseren", rule: "5 anbefalinger gitt", metric: "recommendations", goal: 5 },
      { label: "25", name: "Bokhvisker", rule: "25 anbefalinger gitt", metric: "recommendations", goal: 25 },
      { label: "10", name: "Likt", rule: "10 likes på anmeldelsene dine", metric: "likesReceived", goal: 10 },
      { label: "50", name: "Klubbfavoritt", rule: "50 likes på anmeldelsene dine", metric: "likesReceived", goal: 50 },
    ],
  },
  {
    key: "special",
    name: "Spesielle",
    color: "#3a2c2f",
    icon: "sparkle",
    description: "Engangsmerker. Noen er hemmelige til du får dem.",
    tiers: [
      { label: "1 dag", name: "Samme dag", rule: "Startet og fullført en bok samme dag", metric: "sameDay", goal: 1, secret: true },
      { label: "2×", name: "På repeat", rule: "Lyttet gjennom en lydbok to ganger", metric: "audioRepeat", goal: 1, secret: true },
    ],
  },
  {
    // Awarded per year, with the year on the bookmark: the reading goal,
    // sending in Bokwrapped, and the year's reading personality (only once
    // that year's Bokwrapped has been released)
    key: "year",
    name: "Årsmerker",
    color: "#96631d",
    icon: "sparkle",
    description: "Et merke for hvert år: lesemålet, Bokwrapped og årets leserpersonlighet.",
    perYear: true,
    tiers: [
      { key: "goal-{year}", label: "{year}", name: "Lesemål nådd", rule: "Leste årets lesemål", metric: "goalReached", goal: 1 },
      { key: "wrapped-{year}", label: "{year}", name: "Bokwrapped-deltaker", rule: "Sendte inn Bokwrapped", metric: "wrappedSubmitted", goal: 1 },
    ],
  },
];

// A book this many years old (or older) counts for Tidsreisende
const OLD_BOOK_AGE = 100;
// Series need at least this many books in the library to count
const MIN_SERIES_SIZE = 3;
// Meetings count from this date (the club's meeting records start here)
const MEETINGS_FROM = new Date("2026-01-01T00:00:00");

// Setting key for the admin launch switch
const BADGES_LAUNCH_SETTING = "badges:launch";

module.exports = { BADGE_FAMILIES, OLD_BOOK_AGE, MIN_SERIES_SIZE, MEETINGS_FROM, BADGES_LAUNCH_SETTING };
