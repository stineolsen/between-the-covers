# Designnotat: Julekalender

Tilpasser planen for julekalenderen til stacken som faktisk finnes i dette repoet. Basert på gjennomgang av `backend/` og `frontend/` 2026-10-08. **Venter på godkjenning før implementering**, som avtalt.

## 0. Stacken, kort oppsummert

- **Backend:** Express 5 + Mongoose (MongoDB), CommonJS, kjører som én langlevd Node-prosess på **Railway** (ikke Vercel — det er bare frontend). Ingen migrasjonsverktøy; nye felt/modeller legges bare til i Mongoose-schemaer.
- **Frontend:** React 19 + Vite + Tailwind 4 + react-router v7, deployet på Vercel. Axios-klient (`frontend/src/api/axiosConfig.js`) med JWT i både httpOnly-cookie og localStorage.
- **Auth:** `protect`-middleware + `authorize("admin")`, `User.role` er `"member" | "admin"`. Dette dekker admin-kravet i åpent spørsmål 6 uten noe nytt.
- **Cron:** `node-cron` er allerede i bruk i `backend/src/utils/notificationScheduler.js`, med `cron.schedule(expr, fn, { timezone: "Europe/Oslo" })`. Samme mønster gjenbrukes direkte — tidssone-håndteringen i planen er allerede løst et annet sted i kodebasen.
- **Feed:** Ikke en «opprett innlegg»-modell. `activityController.getActivity` bygger feeden **live ved lesing** av `Review`, `UserBook` og `Meeting`. Det finnes ingen flagg noe sted for å skru av varsel/feed per handling — fordi ingenting «trigger» dem explisitt i dag, de beregnes. Dette er gunstig: så lenge vi ikke selv kaller `ListNotification.create` eller `emailService`/`pushService` for kalender-hendelser, skjer det **ingen** varsler automatisk.
- **Bibliotek/Calibre:** Se punkt 1 under — dette er det ene punktet som avviker fra planens forutsetning, og som trenger en avgjørelse fra deg.
- **Bildeopplasting:** `multer` til disk, servert uautentisert via `express.static("/uploads")`. Dette dekker ikke kravet om at bilder bare skal serveres til spillere med rettigheter — se punkt 7.
- **Rate limiting:** finnes ikke i det hele tatt i dag. Må legges til som ny middleware.

## 1. Åpent punkt: bibliotek-publisering (viktig, trenger avklaring)

Planen forutsetter et «issue #21 — legge inn bøker uten fil» som gjør det mulig å legge en bok inn i Calibre automatisk når fristen går ut. **Jeg finner ingen slik issue, og ingen kodevei i dette repoet som skriver til Calibre-Web.** Den eneste integrasjonen er motsatt vei: `POST /api/admin/import/calibre/run` (admin-trigget) leser Calibre-Web sin OPDS-feed og kopierer metadata **inn i** appens egen `Book`-samling i MongoDB. Appen har ingen credentials eller API-kall for å skrive til Calibre-Web.

Det betyr at advarselen i planen om at «Calibre-Web viser nye bøker øverst på forsiden og i Discover, og omslag har gjettbare `/cover/<id>`-adresser» gjelder **det faktiske Calibre-Web-biblioteket**, som styres helt utenfor denne kodebasen (du legger antagelig bokfiler inn der manuelt i dag). Denne appen kan ikke risikere å lekke en luke-bok via Calibre-Web, fordi den aldri skriver dit.

**Forslag:** Når fristen for en luke går ut, legg boka inn i appens **egen** `Book`-samling (samme samling som driver biblioteksiden, søk, anmeldelser osv.), med `calibreId: null` og et flagg som markerer at den ikke skal trigge feed/varsler (se punkt 2). Den dukker da opp i «biblioteket» som appens brukere ser det. Det fysiske Calibre-Web-biblioteket (og dermed `/cover/<id>`-risikoen) berøres ikke før du eventuelt selv legger filen inn der — noe som uansett bør skje etter at fristen er ute, som en separat, manuell vane.

Si om dette er greit, eller om «biblioteket» i planen faktisk betyr det fysiske Calibre-Web-systemet og at issue #21 finnes et annet sted (f.eks. i et eget GitHub-repo for Calibre-Web, eller en idé som ikke er skrevet ned ennå). Resten av notatet forutsetter forslaget over.

## 2. Datamodell (Mongoose, i `backend/src/models/`)

Følger samme stil som eksisterende modeller (`timestamps: true`, `ref` til `User`, enum for status):

```js
// AdventDay.js
{ year, day,                                  // unique index (year, day)
  title, author, altTitles: [String],
  publishedYear, pageCount, genre,             // genre: fast liste, se punkt 7 i planen
  hint1, hint2, hint3, isbn,
  imageOriginalKey, imageLevel1Key, imageLevel2Key, imageLevel3Key, imageLevel4Key,
  libraryBookId: { type: ObjectId, ref: "Book", default: null },
  publishedToLibraryAt: Date,                  // satt når punkt 1 er kjørt — idempotens-sjekk
}

// AdventAttempt.js
{ user: ObjectId ref User, adventDay: ObjectId ref AdventDay, attemptNo: Number,
  action: "guess" | "skip", guessedBook: { type: ObjectId, ref: "Book", default: null },
  result: "wrong" | "author" | "correct", createdAt }
// unique index (user, adventDay, attemptNo)

// AdventResult.js   -- én per bruker+luke, oppsummerer AdventAttempt
{ user, adventDay, status: "in_progress" | "solved" | "failed",
  attemptsUsed, points, openedAt, finishedAt, countsForLeaderboard: Boolean }
// unique index (user, adventDay)

// ReadingChallenge.js
{ year, number, title, description, publishAt, deadlineAt }

// ChallengeCompletion.js
{ user, challenge: ObjectId ref ReadingChallenge, libraryBook: ObjectId ref Book, completedAt }
// unique index (user, challenge); libraryBook er påkrevd (se åpent spørsmål 4 — svart JA)

// Badge.js / UserBadge.js
{ key, name, description, icon, year: { type: Number, default: null } }
{ user, badge: ObjectId ref Badge, awardedAt }
// unique index (user, badge) på UserBadge — forhindrer duplikat ved re-kjøring
```

Ingen migrasjoner nødvendig — bare nye filer, slik resten av modellene i `backend/src/models/` er lagt til over tid.

## 3. `now()`-hjelper med testklokke

Ny fil `backend/src/utils/calendarClock.js`:

```js
function now() {
  if (process.env.NODE_ENV !== "production" && process.env.CALENDAR_FAKE_NOW) {
    return new Date(process.env.CALENDAR_FAKE_NOW);
  }
  return new Date();
}
```

All åpne/frist-sammenligning gjøres med `Europe/Oslo`-bevisste grenser beregnet fra denne, samme måte `notificationScheduler.js` allerede gir cron-jobber `timezone: "Europe/Oslo"` — vi trenger ikke et nytt tidssone-bibliotek utover det som eventuelt allerede brukes der (sjekkes ved implementering; om ingen dato-bibliotek er i bruk, legges `date-fns-tz` eller lignende til som ny avhengighet).

## 4. Trenger vi faktisk cron-jobber?

Planen antar luker og utfordringer «åpner» ved et cron-tidspunkt. Det er ikke nødvendig: siden `now()` finnes, kan «er luke N åpen» og «er søndagsutfordring X publisert» beregnes **ved hvert API-kall** (`day<=... && now() >= åpningstidspunkt`), akkurat som dagens kode beregner feeden live i stedet for å lagre innlegg. Det gir færre bevegelige deler.

Det ene som trenger en jobb er **bibliotek-publisering ved fristutløp** (punkt 1). Planen tillater lat kjøring. Forslag: gjør det lat (kjøres idempotent inne i `GET /advent/:year/:day` og `GET /advent/:year` — sjekk `publishedToLibraryAt`, kjør om fristen er ute og feltet er tomt) **og** legg til én daglig sikkerhetsjobb i `notificationScheduler.js`-mønsteret (`cron.schedule("0 4 * * *", ..., { timezone: "Europe/Oslo" })`) i tilfelle en luke aldri blir besøkt etter fristen. Begge kaller samme idempotente funksjon, så ingen duplikater.

## 5. API (Express-ruter, følger eksisterende struktur)

Nye filer i `backend/src/routes/` + `backend/src/controllers/`, mountet i `backend/src/app.js` slik de andre er (`app.use("/api/advent", adventRoutes)` osv.):

- `GET /api/advent/:year` — `protect` — kalenderoversikt m/ status per luke
- `GET /api/advent/:year/:day` — `protect` — kun opplåst data (se sikkerhetspunktet under)
- `POST /api/advent/:year/:day/attempt` — `protect` + ny rate-limit-middleware
- `GET /api/advent/search?q=` — `protect` — gjenbruker regex-mønsteret fra `bookController.js` (`GET /api/books?search=`) over `Book`-samlingen, utvidet med kandidatpoolen (se punkt 7)
- `GET /api/advent/:year/leaderboard` — `protect`
- `GET /api/challenges/:year`, `POST /api/challenges/:id/complete` — `protect`
- `GET /api/users/:id/badges` — `protect`
- Admin (alle med `protect` + `authorize("admin")`, samme mønster som `importRoutes.js`): CRUD på `AdventDay`/`ReadingChallenge`, manuell trigger for bibliotek-publisering og badge-tildeling.

## 6. Sikkerhet mot juks — konkretisert mot stacken

- **Bilder:** Dagens `/uploads`-rute er `express.static`, altså uautentisert og forutsigbar — duger ikke her. Ny dedikert rute, f.eks. `GET /api/advent/:year/:day/image/:level`, bak `protect`, som i kontrolleren slår opp brukerens `AdventResult`/`AdventAttempt` og kun strømmer filen fra disk (`backend/uploads/advent/<year>/<day>/levelN.jpg`, utenfor det statiske uploads-treet) hvis nivået faktisk er låst opp for denne brukeren. Dette dekker kravet bedre enn en uforutsigbar URL alene, siden planen selv sier at ugjettbar URL ikke er nok — serveren må sjekke rettighet.
- **Rate limiting:** finnes ikke i repoet i dag. Legg til `express-rate-limit` (ny avhengighet) kun på attempt-endepunktet, f.eks. 10 forsøk/minutt per bruker.
- **Server teller forsøk:** `AdventAttempt`-dokumenter er kilden til sannhet; kontroller avviser et 5. forsøk uansett hva klienten sender.
- **Ikke-åpnet luke:** kontrolleren returnerer 404 før noe `AdventDay`-felt leses ut, samme stil som andre kontrollere i repoet sjekker tilgang før de bygger responsen.

## 7. Søk/autocomplete og «kjente bøker»-liste

`GET /api/books?search=` (regex over `title`/`author`/`series`) er allerede generelt nok til å gjenbrukes direkte. For at gjetting skal dekke «hele biblioteket + kalenderbøker + en ekstra liste med kjente bøker» uten at man kan bla seg til svaret:

- Kalenderbøkene (24 + 4 reserve) og en kuratert liste med kjente bøker seedes som **vanlige `Book`-dokumenter** (samme samling som biblioteket), med `addedBy` satt til admin-brukeren — akkurat som `seedBook.js` gjør i dag. Da trenger søket ingen spesialkode for å slå sammen flere kilder.
- `altTitles`/norsk titel fra regnearket legges i `Book.title`/et nytt `altTitles`-felt på `Book` (eller på `AdventDay`, og søket slår opp begge) — avklares ved implementering avhengig av hvor mye `Book`-modellen bør utvides versus holdes uendret.

## 8. Feed-integrasjon

`activityController.getActivity` utvides til også å spørre `AdventResult` (kun `status: "solved"`) og `ChallengeCompletion`, og slå dem sammen med `type: "advent"` / `type: "challenge"` i responsen — samme mønster som `review`/`status`/`meeting` i dag. Payloaden for et `advent`-innlegg inneholder **kun** bruker, luke-nummer, poeng og fargerute-arrayet (`["correct"]`, `["wrong","author"]` osv.) — aldri `AdventDay.title`/`author`/bilde-nøkler. Siden feeden bygges live av kontrolleren og ikke av en «opprett innlegg»-kallsite, er det naturlig at **mislykkede forsøk aldri vises** (svar nei på åpent spørsmål 2) — vi filtrerer ganske enkelt på `status: "solved"` i spørringen, ingen eksplisitt undertrykkingslogikk nødvendig.

Ingen e-post/push trigges av dette automatisk, siden det ikke finnes noe kall til `emailService`/`pushService`/`ListNotification.create` i denne koden — i tråd med at bibliotek-publiseringen (punkt 1) heller ikke skal gi varsler.

## 9. Badge-tildeling

`backend/src/utils/badgeAwarder.js`: en funksjon per regel (søndagsutfordring fullført, N luker løst innen frist — grenser `[5, 12, 18, 24]` som konstant, lett å endre). Hver funksjon gjør `UserBadge.updateOne({user, badge}, {$setOnInsert: {awardedAt: now()}}, {upsert: true})` — idempotent ved design, ikke bare ved sjekk-før-skriv. Kjøres både inline etter relevante handlinger (fullført utfordring, luke løst) og via et admin-endepunkt som kjører alle reglene på nytt for et gitt år — dekker kravet om at badges kan lanseres og etterberegnes etter 1. desember.

## 10. Frontend

Følger eksisterende struktur (`frontend/src/pages/`, `frontend/src/components/<feature>/`, `frontend/src/api/<feature>Api.js` à la `booksApi.js`):

- `api/adventApi.js`, `api/challengesApi.js`, `api/badgesApi.js` — tynne axios-wrappere som resten.
- `pages/AdventCalendarPage.jsx` + `components/advent/{CalendarGrid, DayTile, DayView, GuessSearch, ResultGrid}.jsx`
- `pages/challenges`/`components/challenges/...` for søndagsutfordringene
- Badges vises i eksisterende profilvisning (samme sted `UserBook`-status o.l. vises i dag — bekreftes ved implementering).
- Admin-UI for `AdventDay`/`ReadingChallenge` CRUD legges som ny seksjon der annet admin-UI allerede bor (bekreftes ved implementering — fantes ikke tid til å kartlegge eksisterende admin-sider i detalj i denne runden).
- Tailwind 4 for styling, samme som resten av frontend. Mobiltilpasning er default i eksisterende komponenter — følges.

## 11. Data- og bildeskript

- `backend/scripts/seedAdventCalendar.js` — leser CSV-eksport av regnearket, upserter `AdventDay` på `(year, day)`, samme forbindelse/opprettelsesstil som `seedBook.js` (kan kjøres på nytt uten duplikater pga. upsert).
- `backend/scripts/generateAdventImages.js` — nytt skript, ny avhengighet `sharp` (finnes ikke i `backend/package.json` i dag). Leser `NN.jpg` fra en mappe, nedskalerer til breddene `[8, 12, 20, 36]` px og opp igjen med nearest-neighbor, skriver til `backend/uploads/advent/<year>/<day>/level{1..4}.jpg` (utenfor det offentlig-serverte `uploads/books`-treet — se punkt 6).

## 12. Oppsummering av det som trenger svar fra deg

1. **Punkt 1** — er «legge inn i biblioteket» = appens egen `Book`-samling (mitt forslag), eller må det faktiske Calibre-Web-systemet også oppdateres automatisk? Hvis sistnevnte: finnes det en API-nøkkel/metode for å skrive til Calibre-Web jeg ikke har funnet, eller må det løses utenfor denne kodebasen?
2. Greit å legge til `express-rate-limit` og `sharp` som nye avhengigheter i `backend/package.json`?
3. Skal `altTitles` ligge på `Book` (påvirker hele biblioteksøket) eller bare på `AdventDay` (påvirker kun kalender-søket)?

Resten av notatet er klart til implementering så snart disse er avklart.
