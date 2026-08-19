# Zdjęcia główne tras — jak podmienić rysunek na fotografię

## Jak to działa

Każda trasa pokazuje na kafelku i na swojej stronie jeden obrazek. Domyślnie
jest to malowana ilustracja z aplikacji (`public/dane/ilustracje/1A.webp`).
Gdy w `public/marka/trasy/` leży plik o tej samej nazwie — wygrywa fotografia.

Nazwa pliku to **identyfikator trasy**, nie slug: `1A`, `4D`, `DP`, `KP07`.
Ten sam klucz co w katalogu ilustracji, więc porównanie obu katalogów od razu
pokazuje, czego brakuje.

Kodu nie trzeba ruszać — sprawdzenie dzieje się przy budowaniu
(`src/lib/dane/zdjecia-tras.ts`), tak samo jak przy kategoriach i atrakcjach.

## Wgrywanie nowych zdjęć

Wrzuć zdjęcia z aparatu do jednego katalogu i uruchom:

```bash
npm run zdjecia:trasy -- "~/Downloads/Trasy zdjecia"
```

Skrypt sam rozpoznaje, do której trasy należy plik — po nazwie:

- zaczyna się od identyfikatora: `4b co tam u bacow.jpeg` → `4B`
- albo cała nazwa jest nazwą trasy: `Nie mam roweru.jpeg` → `5B`

Porównanie idzie bez ogonków i wielkości liter, bo nazwy z telefonu rzadko je
mają. Czego skrypt nie rozpozna, to wypisze na końcu — nic nie ginie po cichu.

## Wymagania techniczne

| parametr | wartość |
|---|---|
| proporcje | **16:10 poziome** — skrypt przycina sam |
| rozmiar wyjściowy | 1600 × 1000 WebP, jakość 82 |
| kadr | skrypt wybiera pas o największej zawartości (`attention` w sharp) |

Proporcja nie jest dowolna: kafelek trasy ma `aspect-[16/10]`, a malowane
ilustracje z aplikacji to 420 × 260 — czyli to samo. Gdyby zdjęcia miały
własne proporcje, karty na liście skakałyby wysokością zależnie od tego,
która trasa ma już zdjęcie, a która jeszcze rysunek.

Zdjęcia trafiają na stronę przez optymalizator obrazów Next (`next.config.ts`),
więc do przeglądarki idzie wariant dopasowany do ekranu, nie plik źródłowy.
Dlatego trzymamy tu wyższą jakość niż przy kafelkach kategorii.

## Stan na dziś

Zdjęcia mają wszystkie trasy piesze i rowerowe z przewodnika (24). Malowaną
ilustrację pokazują jeszcze:

- `TK1`–`TK3` — warianty wejścia na Trzy Korony,
- `KP01`–`KP24` — szczyty Korony Pienin,
- `DIAMENT`, `RUBIN`, `SZMARAGD` — pienińskie wyzwania.
