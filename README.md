# Szlaki Pienin — portal turystyczny

Portal o Pieninach pod adresem <https://szlakipienin.pl>: trasy, atrakcje,
mapa interaktywna oraz strona aplikacji mobilnej wraz z **polityką
prywatności** i **wsparciem** wymaganymi przez App Store.

## Jak to działa

Next.js (App Router) eksportowany do plików statycznych. Każde `git push`
do `main` uruchamia workflow `.github/workflows/publikuj.yml`: buduje portal
i publikuje katalog `out/` na GitHub Pages.

Wszystkie strony powstają przy budowaniu — do przeglądarki trafia gotowy HTML,
bez pobierania danych w locie. Mapa jest jedynym elementem doładowywanym
osobno, bo MapLibre waży tyle, że nie ma sensu wysyłać go komuś, kto do mapy
nie dojdzie.

```bash
npm install
npm run dev      # podgląd na localhost:3000
npm run build    # eksport do out/
npm run dane     # synchronizacja danych z aplikacji
```

## Skąd biorą się dane

Aplikacja mobilna jest **źródłem prawdy**. Skrypt kopiuje jej dane do
`public/dane/`, skąd czyta je generator stron:

```
Aplikacja Szlaki/assets/  →  narzedzia/synchronizuj-dane.sh  →  public/dane/  →  next build
```

Kopiujemy w jedną stronę. Gdyby dało się edytować dane po stronie WWW, po
tygodniu nikt by nie wiedział, która wersja opisu trasy jest właściwa.

Po zmianie tras w aplikacji: uruchom `npm run dane`, zerknij na `git diff`
i wypchnij. Portal przebuduje się sam. Repozytorium aplikacji może też wysłać
zdarzenie `repository_dispatch` o typie `dane-zmienione` i wywołać publikację
bez udziału człowieka.

Każdy plik przechodzi walidację schematem (Zod). Gdy w aplikacji zmieni się
nazwa pola albo trasa przyjdzie niekompletna, **budowanie przerywa się
z komunikatem wskazującym plik** — zamiast opublikować stronę, na której
dystans wyświetla się jako „undefined km".

## Układ projektu

| katalog | co zawiera |
|---|---|
| `src/app/` | trasy adresowe (strony) |
| `src/components/` | komponenty: układ, trasy, mapa, treść |
| `src/lib/dane/` | schematy, model domenowy, wczytywanie i wyliczenia |
| `src/lib/konfiguracja.ts` | adresy sklepów, menu, źródła, kontakt |
| `public/dane/` | dane skopiowane z aplikacji — **nie edytuj ręcznie** |
| `narzedzia/` | skrypty pomocnicze |

`src/lib/dane/zrodlo.ts` to jedyne miejsce czytające pliki z dysku. Podmiana
źródła na CMS (Sanity, Strapi) sprowadza się do napisania drugiej implementacji
tych samych funkcji — komponentów nie trzeba ruszać.

## Czego portal nie zmyśla

- **Ocen i liczby pobrań nie ma**, dopóki aplikacja nie trafi do sklepów.
  Przyciski pobrania są w stanie „Wkrótce" i nie da się w nie kliknąć; adresy
  wpisuje się w `src/lib/konfiguracja.ts`, w stałej `SKLEPY`.
- **Nie ma „najpopularniejszych tras"** — portal nie zbiera statystyk odwiedzin.
  Na stronie głównej są trasy najlepiej opisane, co da się policzyć uczciwie.
- **Trudność jest wyliczana** z długości i sumy podejść (100 m w pionie liczone
  jak kilometr po płaskim) i tak też podpisana na stronie trasy.
- **Filtry mapy obejmują tylko kategorie mające dane.** Parkingów, toalet
  i wodospadów w danych aplikacji nie ma, więc nie ma ich przełączników.

## Źródła treści

Opisy tras, punkty i czasy przejścia: przewodnik PTTK Oddziału Pienińskiego
„Szlaki pełne zdrowia" (Piotr Krzywda, wyd. II, 2019). Ślady: zapisy GPS
uzupełnione o wysokości z modelu terenu EU-DEM 25 m. Kapliczki: przewodnik
„Śladami kapliczek, krzyży i figur przydrożnych Szczawnicy". Podkład mapy:
OpenFreeMap na danych OpenStreetMap.

## Adresy, których nie wolno zepsuć

Podane w App Store Connect, więc muszą działać zawsze:

- <https://szlakipienin.pl/prywatnosc>
- <https://szlakipienin.pl/wsparcie>
