#!/bin/bash
# Kopiuje dane z repozytorium aplikacji do `public/dane/` na stronie.
#
#     ./narzedzia/synchronizuj-dane.sh     (albo: npm run dane)
#
# Dlaczego kopiujemy, a nie robimy dowiązania (symlink): GitHub Pages publikuje
# to, co leży w TYM repozytorium. W maszynie budującej repozytorium aplikacji
# nie istnieje, więc dowiązanie wskazywałoby w pustkę i strona pokazałaby
# błędy zamiast tras. Kopie są prawdziwymi plikami i po prostu działają.
#
# Kopiujemy w JEDNĄ stronę: aplikacja → strona. Aplikacja jest źródłem prawdy;
# gdyby dało się edytować dane po stronie WWW, po tygodniu nikt by nie wiedział,
# która wersja opisu trasy jest właściwa.
#
# Dlaczego pod `public/`: Next.js serwuje ten katalog bez zmian, więc ten sam
# plik GeoJSON, który czyta generator stron, pobiera też mapa w przeglądarce.
# Gdyby dane leżały obok, trzeba by je kopiować drugi raz przy budowaniu.
set -eu

APLIKACJA="${APLIKACJA:-$HOME/Desktop/Szczawnica/Aplikacja Szlaki}"
CEL="public/dane"

if [ ! -d "$APLIKACJA/assets/trasy" ]; then
  echo "Nie widzę aplikacji w: $APLIKACJA" >&2
  echo "Podaj ścieżkę:  APLIKACJA=/gdzie/lezy ./narzedzia/synchronizuj-dane.sh" >&2
  exit 1
fi

echo "Źródło: $APLIKACJA"
mkdir -p "$CEL"/{trasy,slady,ilustracje,wyzwania,okolica,szlaki,obszary,obrazy,zdjecia}

# Opisy tras i indeks — sedno danych.
rsync -a --delete "$APLIKACJA/assets/trasy/"*.json "$CEL/trasy/"
# Ślady GPX (GeoJSON) — do rysowania trasy na mapie.
rsync -a --delete "$APLIKACJA/assets/trasy/gpx/" "$CEL/slady/"
# Malowane ilustracje tras — te same, które widać na liście w aplikacji.
rsync -a --delete "$APLIKACJA/assets/ilustracje/" "$CEL/ilustracje/"
# Odznaki pienińskich wyzwań.
rsync -a --delete --exclude='*.json' "$APLIKACJA/assets/wyzwania/" "$CEL/wyzwania/"
cp "$APLIKACJA/assets/wyzwania/wyzwania.json" "$CEL/wyzwania.json"
# Noclegi, sklepy i restauracje — warstwa użytkowa mapy.
rsync -a --delete "$APLIKACJA/assets/okolica/" "$CEL/okolica/"
# Przebiegi szlaków, kapliczki i godła szałasowe — pozostałe warstwy mapy.
rsync -a --delete "$APLIKACJA/assets/szlaki/" "$CEL/szlaki/"
# Obszary z zakazem wprowadzania psów — park narodowy, dwa rezerwaty i wzgórze
# zamkowe. Granice są szczegółowe (sam PPN ma 1398 punktów, z wcięciami przy
# Przełomie Dunajca), bo zgrubny obrys zamykałby ścieżki biegnące tuż obok.
rsync -a --delete "$APLIKACJA/assets/obszary/" "$CEL/obszary/"
# Zdjęcia z przewodnika i fotografia tytułowa.
rsync -a --delete "$APLIKACJA/assets/obrazy/" "$CEL/obrazy/"
rsync -a --delete "$APLIKACJA/assets/zdjecia/" "$CEL/zdjecia/"

# Filmów wyzwań (16 MB) świadomie NIE kopiujemy — repozytorium z historią
# zmian spuchłoby o tyle przy każdej nowej wersji, a na stronie i tak lepiej
# wyglądałyby wstawione z serwisu wideo niż serwowane z GitHub Pages.

# Znacznik pochodzenia — żeby po miesiącach było wiadomo, z czego to jest.
cat > "$CEL/SKAD_TO.md" <<INFO
# Dane skopiowane z aplikacji

Nie edytuj tych plików ręcznie — przy najbliższej synchronizacji zmiany
przepadną. Poprawki nanoś w repozytorium aplikacji, potem uruchom:

    ./narzedzia/synchronizuj-dane.sh

Ostatnia synchronizacja: $(date '+%Y-%m-%d %H:%M')
INFO

echo
echo "Skopiowano do $CEL/:"
printf '  %-14s %s\n' \
  "trasy/"      "$(ls "$CEL/trasy" | wc -l | tr -d ' ') plików" \
  "slady/"      "$(ls "$CEL/slady" | wc -l | tr -d ' ') śladów" \
  "ilustracje/" "$(ls "$CEL/ilustracje" | wc -l | tr -d ' ') obrazów" \
  "wyzwania/"   "$(ls "$CEL/wyzwania" | wc -l | tr -d ' ') odznak" \
  "okolica/"    "$(ls "$CEL/okolica" | wc -l | tr -d ' ') plików" \
  "szlaki/"     "$(ls "$CEL/szlaki" | wc -l | tr -d ' ') warstw" \
  "obszary/"    "$(ls "$CEL/obszary" | wc -l | tr -d ' ') granic" \
  "zdjecia/"    "$(ls "$CEL/zdjecia" | wc -l | tr -d ' ') fotografii"
echo "  razem        $(du -sh "$CEL" | cut -f1)"
