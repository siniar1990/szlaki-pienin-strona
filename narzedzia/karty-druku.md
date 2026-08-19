# Karty tras do druku — jak to działa i co robić przy zmianach

## Co to jest

Jedna strona A4 na trasę, drukowana jednostronnie. Po złożeniu na pół
w poziomie i jeszcze raz w pionie wychodzi A6 do kieszeni, a na wierzchu
ląduje panel z mapą.

Układ czterech paneli jest ustalony i nie wolno go zmieniać:

| | lewa | prawa |
|---|---|---|
| **góra** | okładka: nazwa, metryczka, mapa, legenda | punkty na trasie, profil wysokości, start i meta |
| **dół** | opis po odcinkach | praktyczne, ostrzeżenia, GOPR, kod QR |

Lewy górny jest tym, co widać po złożeniu — dlatego mapa siedzi właśnie tam.

## Odświeżanie kart

```bash
npm run karty            # tylko te, których treść trasy się zmieniła
npm run karty -- --all   # wszystkie od nowa
```

Gotowe pliki lądują w `public/druk/` i **są częścią repozytorium** — tak samo
jak dane w `public/dane/`. Dzięki temu wdrożenie nie potrzebuje przeglądarki:
Vercel podaje gotowy plik, a żadne żądanie nigdy nie uruchamia Chromium.

Obok PDF-ów leży `karty.json` ze skrótem treści każdej trasy i wynikiem
dopasowania paneli. Test `src/lib/druk/karty-druku.test.ts` porównuje go
z danymi i przy rozjeździe mówi wprost, że trzeba uruchomić `npm run karty`.
**Po każdej synchronizacji danych (`npm run dane`) uruchom też `npm run karty`.**

## Skąd się bierze treść

Wszystko z danych trasy — na karcie nie ma ani jednej liczby wpisanej z ręki
poza numerami ratunkowymi:

- metryczka, punkty etapowe, czasy narastające, ostrzeżenia i ciekawostki
  z `public/dane/trasy/<ID>.json`,
- przebieg mapy z `public/dane/slady/<ID>.geojson`,
- barwy odcinków z `public/dane/slady/<ID>.kolory.geojson` — tego samego pliku,
  z którego żyje mapa na stronie trasy,
- profil wysokości z wysokości zapisanych w śladzie,
- znaczniki `start`, `meta`, `max` i `schron` liczone z danych.

Gdy brakuje pliku barw, cała trasa idzie linią „bez znaków". Kolorów nie
zgadujemy — turysta szukałby na drzewach znaku, którego tam nie ma.

## Autodopasowanie

Panele mają sztywną wysokość, a trasy różnią się objętością kilkakrotnie.
Po wyrenderowaniu skrypt w przeglądarce dopasowuje każdy panel osobno:

1. zjeżdża z rozmiarem pisma do **6,5 pt**,
2. skraca treść oznaczoną `data-skracalne`, całymi zdaniami od końca,
3. dopiero na końcu schodzi do **6 pt** — twarde dno.

Czego nie rusza nigdy: ostrzeżeń i numerów ratunkowych (`data-nieskracalne`).
Przy dwunastu i więcej punktach tabela idzie na dwie kolumny, zamiast
zjeżdżać z pismem.

Skrócony opis dostaje na końcu dopisek „Pełny opis: szlakipienin.pl/…".

## Co sprawdzić po zmianie szablonu

```bash
npm run karty -- --all   # wypisze każdy panel poniżej 6,5 pt i każde przepełnienie
npm test                 # ten sam próg, ale bez uruchamiania przeglądarki
```

Podgląd bez generowania PDF-a: `/szlaki/<slug>/druk` (dopisz `?oszczedny=1`,
żeby zobaczyć blok ratunkowy w wersji bez ciemnego wypełnienia).

## Rzeczy, o które łatwo się potknąć

- **Tło ma zostać białe.** Jedyny ciemny element to blok „Ratunek w górach",
  i ma wersję oszczędną pod przełącznikiem. Karta ma być tania w druku.
- **Kreskowanie szlaków nie jest ozdobą.** Niebieski, zielony i czerwony mają
  niemal identyczną jasność (0,133, 0,155, 0,161) i po wydruku mono zlewają się
  w jedną szarą linię. Dlatego dwa z nich dostają wzór kreski. Zmieniając to,
  sprawdź wydruk w skali szarości.
- **Fonty siedzą w repozytorium** (`src/lib/druk/czcionki/`, Inter na licencji
  SIL OFL) i wchodzą w dokument jako dane. Bez tego PDF budowany bez dostępu
  do sieci wyszedłby złożony czymkolwiek, a inny krój to inne łamanie wierszy
  i całe autodopasowanie na nic.
- **PDF-y ważą po ok. 800 kB**, bo Chrome zamienia tekst na krzywe. Cena jest
  taka, że wydruk wygląda identycznie wszędzie i nie zależy od fontów
  zainstalowanych u odbiorcy.
