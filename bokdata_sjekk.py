#!/usr/bin/env python3
"""
bokdata_sjekk.py – slår opp alle bøkene i «Bøker»-arket i Open Library og
Google Books, og foreslår sidetall, år først utgitt og sjanger.

Regel: et tall regnes som bekreftet når begge kildene er enige.
Finnes boka bare i én kilde, eller kildene er uenige, markeres raden
«Sjekk manuelt».

Bruk:
    pip install openpyxl
    python bokdata_sjekk.py bokdata-opprydding.xlsx bokdata-sjekket.xlsx
    python bokdata_sjekk.py inn.xlsx ut.xlsx --bare-lest-2026
    python bokdata_sjekk.py inn.xlsx ut.xlsx --bare-mangler --grense 20
    python bokdata_sjekk.py test.xlsx test2.xlsx --bare-tomme

Valg:
    --bare-lest-2026   bare bøker med «Lest i 2026» > 0
    --bare-mangler     bare bøker som mangler sidetall eller sjanger
    --bare-tomme       bare bøker som ikke er slått opp ennå (tom «Status»);
                       bruk forrige kjørings ut-fil som inn-fil
    --grense N         stopp etter N bøker (fint for en testkjøring)
    --overskriv        slå opp også rader som allerede har forslag
                       (ellers beholdes forslagene som er lagt inn for hånd)

Valgfritt: sett miljøvariabelen GOOGLE_API_KEY for høyere kvote hos
Google Books (uten nøkkel er grensen rundt 1000 oppslag per dag).

Svarene lagres i bokdata_cache.json, så du kan avbryte og kjøre på nytt
uten å slå opp de samme bøkene igjen.
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from copy import copy

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill

ARK = "Bøker"
CACHE_FIL = "bokdata_cache.json"
PAUSE = 1.5  # sekunder mellom oppslag, for å være snill mot API-ene

# Kolonner i «Bøker» (1-basert)
K_TITTEL, K_FORFATTER, K_ISBN = 1, 2, 3
K_LEST, K_SIDETALL, K_SJANGER, K_UTGITT = 8, 9, 10, 15
K_F_SIDER, K_F_SJANGER, K_KILDER, K_F_AAR = 17, 18, 19, 20
K_STATUS, K_AVVIK = 21, 22

OVERSKRIFTER = {
    K_F_SIDER: "Forslag sidetall",
    K_F_SJANGER: "Forslag sjanger",
    K_KILDER: "Kilder for forslag",
    K_F_AAR: "Forslag først utgitt",
    K_STATUS: "Status",
    K_AVVIK: "Avvik fra arket",
}

# Nøkkelord i kategorier/emner -> sjangernavn som allerede finnes i «Sjangre».
# Rekkefølgen bestemmer prioritet; maks tre sjangre per bok.
SJANGER_KART = [
    ("romantasy", "Fantasy"),
    ("science fiction", "Science Fiction"),
    ("dystopi", "Dystopian"),
    ("fantasy", "Fantasy"),
    ("romance", "Romance"),
    ("love stories", "Romance"),
    ("thriller", "Thrillers & Suspense"),
    ("suspense", "Thrillers & Suspense"),
    ("mystery", "Mystery"),
    ("detective", "Mystery"),
    ("crime", "Crime"),
    ("horror", "Horror"),
    ("historical", "Historical"),
    ("biography", "Biography & Autobiography"),
    ("memoir", "Biography & Autobiography"),
    ("autobiography", "Biography & Autobiography"),
    ("young adult", "Young Adult"),
    ("juvenile fiction", "Young Adult"),
    ("mytholog", "Mythology"),
    ("humor", "Humor"),
    ("humorous", "Humor"),
    ("classic", "Classics"),
    ("literary", "Literary"),
    ("short stories", "Short Stories"),
    ("sports", "Sports"),
    ("christmas", "Holidays"),
    ("holiday", "Holidays"),
    ("paranormal", "Paranormal"),
    ("vampire", "Vampires"),
    ("contemporary", "Contemporary"),
    ("art /", "Art"),
    ("business", "Business & Economics"),
]

BLÅ = PatternFill("solid", fgColor="DDEBF7")
GUL_VARSEL = PatternFill("solid", fgColor="FCE4D6")
SKRIFT = Font(name="Arial", size=10)


# ---------------------------------------------------------------- nett

class Feilet(Exception):
    """Oppslaget feilet (nettverk, 429 osv.) – ikke det samme som «ikke funnet»."""


class GoogleStengt(Exception):
    """Google Books sier stadig 429 – kvoten er brukt opp for nå."""


def hent_json(url, forsøk_maks=4):
    req = urllib.request.Request(url, headers={"User-Agent": "bokdata-sjekk/1.0 (bokklubb)"})
    for forsøk in range(forsøk_maks):
        try:
            with urllib.request.urlopen(req, timeout=20) as svar:
                return json.loads(svar.read().decode("utf-8"))
        except urllib.error.HTTPError as feil:
            if feil.code == 404:
                return None
            if forsøk == forsøk_maks - 1:
                if feil.code == 429 and "googleapis.com" in url:
                    raise GoogleStengt() from feil
                print(f"    ! klarte ikke å hente {url[:80]}…: {feil}")
                raise Feilet() from feil
            vent = 5 * 3 ** forsøk  # 5, 15, 45 s
            if feil.code == 429:
                try:
                    vent = max(vent, int(feil.headers.get("Retry-After", 0)))
                except ValueError:
                    pass
                print(f"    … 429 Too Many Requests, venter {vent} s")
            time.sleep(vent)
        except Exception as feil:  # nettverksfeil, tidsavbrudd osv.
            if forsøk == forsøk_maks - 1:
                print(f"    ! klarte ikke å hente {url[:80]}…: {feil}")
                raise Feilet() from feil
            time.sleep(5 * (forsøk + 1))


def renset_tittel(tittel):
    t = re.split(r"[:(]", tittel)[0]
    t = re.sub(r"\b(A Novel|a novel)\b", "", t)
    return re.sub(r"\s+", " ", t).strip(" .,-")


def første_forfatter(forfatter):
    if not forfatter:
        return ""
    f = re.split(r"\s*\|\s*", forfatter)[0]
    if "," in f and len(f.split(",")) == 2:  # «Nesbø, Jo» -> «Jo Nesbø»
        etter, for_ = [x.strip() for x in f.split(",")]
        f = f"{for_} {etter}"
    return f.strip()


def open_library(tittel, forfatter, isbn):
    felt = "title,author_name,number_of_pages_median,first_publish_year,subject,key"
    if isbn:
        url = f"https://openlibrary.org/search.json?isbn={isbn}&fields={felt}&limit=1"
        data = hent_json(url)
        if data and data.get("docs"):
            return data["docs"][0]
    q = urllib.parse.urlencode({"title": tittel, "author": forfatter, "fields": felt, "limit": 3})
    data = hent_json(f"https://openlibrary.org/search.json?{q}")
    if data and data.get("docs"):
        return data["docs"][0]
    return None


def google_books(tittel, forfatter, isbn):
    nøkkel = os.environ.get("GOOGLE_API_KEY")
    def spør(q):
        param = {"q": q, "maxResults": 5, "printType": "books"}
        if nøkkel:
            param["key"] = nøkkel
        data = hent_json("https://www.googleapis.com/books/v1/volumes?" + urllib.parse.urlencode(param))
        return (data or {}).get("items") or []

    treff = spør(f"isbn:{isbn}") if isbn else []
    if not treff:
        treff = spør(f'intitle:"{tittel}" inauthor:"{forfatter}"') if forfatter else spør(f'intitle:"{tittel}"')
    # Velg første treff som har sidetall
    for t in treff:
        info = t.get("volumeInfo", {})
        if info.get("pageCount"):
            return info
    return treff[0]["volumeInfo"] if treff else None


# ---------------------------------------------------------------- logikk

def enige_sider(a, b):
    return abs(a - b) <= max(15, 0.08 * max(a, b))


def år_fra(dato):
    m = re.match(r"(\d{4})", str(dato or ""))
    return int(m.group(1)) if m else None


def sjangre_fra(tekster):
    funnet = []
    for tekst in tekster:
        t = tekst.lower()
        for nøkkel, navn in SJANGER_KART:
            if nøkkel in t and navn not in funnet:
                funnet.append(navn)
    # «Contemporary» bare hvis det ikke allerede er en tydeligere sjanger
    if len(funnet) > 1 and "Contemporary" in funnet and funnet.index("Contemporary") > 1:
        funnet.remove("Contemporary")
    return ", ".join(funnet[:3])


def vurder(ol, gb):
    """Returnerer (sider, år, sjanger, kilder-tekst, status)."""
    ol_sider = (ol or {}).get("number_of_pages_median")
    ol_år = (ol or {}).get("first_publish_year")
    gb_sider = (gb or {}).get("pageCount")
    gb_år = år_fra((gb or {}).get("publishedDate"))

    deler, status = [], "Bekreftet"

    # Sidetall
    if ol_sider and gb_sider:
        if enige_sider(ol_sider, gb_sider):
            sider = round((ol_sider + gb_sider) / 2)
            deler.append(f"Sider: Open Library {ol_sider}, Google Books {gb_sider} (enige).")
        else:
            sider = ol_sider
            status = "Sjekk manuelt"
            deler.append(f"Sider: Open Library {ol_sider}, Google Books {gb_sider} – UENIGE.")
    elif ol_sider or gb_sider:
        sider = ol_sider or gb_sider
        status = "Sjekk manuelt"
        kilde = "Open Library" if ol_sider else "Google Books"
        deler.append(f"Sider: bare {kilde} ({sider}) – trenger én kilde til.")
    else:
        sider = None
        status = "Sjekk manuelt"
        deler.append("Sider: ikke funnet.")

    # År først utgitt. Google Books oppgir ofte året for utgaven, ikke
    # første utgivelse, så det eldste året brukes. Bekreftet hvis enige ±1.
    år_liste = [a for a in (ol_år, gb_år) if a]
    år = min(år_liste) if år_liste else None
    if ol_år and gb_år and abs(ol_år - gb_år) <= 1:
        deler.append(f"År: Open Library {ol_år}, Google Books {gb_år} (enige).")
    elif ol_år and gb_år and gb_år > ol_år:
        # Vanlig: Google Books viser en nyere utgave. Ikke en motsigelse,
        # men året er bare bekreftet av Open Library.
        deler.append(f"År: Open Library {ol_år} (Google Books viser en senere utgave, {gb_år}).")
    elif år_liste:
        deler.append(f"År: Open Library {ol_år or '–'}, Google Books {gb_år or '–'} – eldste brukt, sjekk gjerne.")
        if status == "Bekreftet":
            status = "Sjekk år"
    else:
        deler.append("År: ikke funnet.")

    # Sjanger: Google-kategorier først (ryddigst), deretter Open Library-emner
    tekster = list((gb or {}).get("categories") or []) + list(((ol or {}).get("subject") or [])[:20])
    sjanger = sjangre_fra(tekster)
    if sjanger:
        deler.append(f"Sjanger utledet fra: {'; '.join(tekster[:4])[:120]}.")

    if not ol and not gb:
        status = "Ikke funnet"
    return sider, år, sjanger, " ".join(deler), status


def avvik_tekst(rad_sider, rad_år, sider, år):
    biter = []
    if sider and isinstance(rad_sider, (int, float)) and rad_sider and not enige_sider(rad_sider, sider):
        biter.append(f"Sidetall i arket {int(rad_sider)}, forslag {sider}")
    if år and isinstance(rad_år, (int, float)) and rad_år and abs(rad_år - år) > 1:
        biter.append(f"Utgitt år i arket {int(rad_år)}, forslag {år}")
    return "; ".join(biter)


# ---------------------------------------------------------------- hoved

def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("inn")
    p.add_argument("ut")
    p.add_argument("--bare-lest-2026", action="store_true")
    p.add_argument("--bare-mangler", action="store_true")
    p.add_argument("--bare-tomme", action="store_true")
    p.add_argument("--grense", type=int, default=0)
    p.add_argument("--overskriv", action="store_true")
    a = p.parse_args()

    cache = {}
    if os.path.exists(CACHE_FIL):
        with open(CACHE_FIL, encoding="utf-8") as f:
            cache = json.load(f)

    wb = openpyxl.load_workbook(a.inn)  # beholder formler
    ws = wb[ARK]

    # Overskrifter med samme stil som «Nytt sidetall»
    mal = ws.cell(1, 11)
    for kol, navn in OVERSKRIFTER.items():
        c = ws.cell(1, kol, navn)
        for attr in ("font", "fill", "alignment", "border"):
            setattr(c, attr, copy(getattr(mal, attr)))
    for kol, bredde in ((K_F_SIDER, 12), (K_F_SJANGER, 36), (K_KILDER, 70),
                        (K_F_AAR, 12), (K_STATUS, 16), (K_AVVIK, 40)):
        ws.column_dimensions[openpyxl.utils.get_column_letter(kol)].width = bredde

    behandlet = 0
    teller = {}
    for r in range(2, ws.max_row + 1):
        tittel = ws.cell(r, K_TITTEL).value
        if not tittel:
            continue
        lest = ws.cell(r, K_LEST).value or 0
        mangler = ws.cell(r, K_SIDETALL).value in (None, "") or ws.cell(r, K_SJANGER).value in (None, "")
        if a.bare_lest_2026 and not lest > 0:
            continue
        if a.bare_mangler and not mangler:
            continue
        if a.bare_tomme and ws.cell(r, K_STATUS).value not in (None, ""):
            continue  # allerede slått opp i en tidligere kjøring
        if ws.cell(r, K_KILDER).value and not a.overskriv:
            continue  # forslag lagt inn for hånd tidligere
        if a.grense and behandlet >= a.grense:
            break

        forfatter = første_forfatter(ws.cell(r, K_FORFATTER).value)
        isbn = re.sub(r"[^0-9Xx]", "", str(ws.cell(r, K_ISBN).value or ""))
        t = renset_tittel(str(tittel))
        nøkkel = f"{t}|{forfatter}|{isbn}".lower()

        print(f"[{r}] {t} – {forfatter}")
        if nøkkel in cache:
            ol, gb = cache[nøkkel]
        else:
            try:
                ol = open_library(t, forfatter, isbn); time.sleep(PAUSE)
                gb = google_books(t, forfatter, isbn); time.sleep(PAUSE)
            except GoogleStengt:
                print("\n  ! Google Books svarer fortsatt 429 (kvoten er brukt opp).")
                if not os.environ.get("GOOGLE_API_KEY"):
                    print("    Sett GOOGLE_API_KEY for egen kvote, eller prøv igjen senere.")
                else:
                    print("    Dagskvoten er trolig brukt opp – prøv igjen i morgen.")
                print("    Stopper her; alt som er slått opp så langt er lagret i cachen.")
                break
            except Feilet:
                print("    ! hopper over denne boka (lagres ikke i cachen, prøves igjen neste gang)")
                continue
            cache[nøkkel] = [ol, gb]
            with open(CACHE_FIL, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False)

        sider, år, sjanger, kilder, status = vurder(ol, gb)
        avvik = avvik_tekst(ws.cell(r, K_SIDETALL).value, ws.cell(r, K_UTGITT).value, sider, år)

        verdier = {K_F_SIDER: sider, K_F_AAR: år, K_KILDER: kilder, K_STATUS: status, K_AVVIK: avvik or None}
        if ws.cell(r, K_SJANGER).value in (None, "") or a.overskriv:
            verdier[K_F_SJANGER] = sjanger or None
        for kol, v in verdier.items():
            c = ws.cell(r, kol, v)
            c.font = SKRIFT
            c.fill = GUL_VARSEL if (kol in (K_STATUS, K_AVVIK) and (status != "Bekreftet" or avvik)) else BLÅ
            c.alignment = Alignment(vertical="top", wrap_text=kol in (K_KILDER, K_AVVIK))

        teller[status] = teller.get(status, 0) + 1
        behandlet += 1

    ws.auto_filter.ref = f"A1:{openpyxl.utils.get_column_letter(K_AVVIK)}{ws.max_row}"
    wb.calculation.fullCalcOnLoad = True  # Excel regner ut «Mangler»-formlene ved åpning
    wb.save(a.ut)

    print(f"\nFerdig: {behandlet} bøker slått opp, lagret i {a.ut}")
    for s, n in sorted(teller.items()):
        print(f"  {s}: {n}")


if __name__ == "__main__":
    sys.exit(main())
