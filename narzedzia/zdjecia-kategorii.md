# Zdjęcia kafelków kategorii — co pobrać i gdzie wrzucić

## Jak to działa

Wrzuć plik do `public/marka/kategorie/` pod nazwą **równą slugowi kategorii**
i przebuduj stronę. Nic więcej nie trzeba — kod sam sprawdza przy budowaniu,
czy plik istnieje, i podmienia zapasową ilustrację na zdjęcie. Gdy pliku nie ma,
kafelek pokazuje malowaną ilustrację trasy z aplikacji.

Rozszerzenia w kolejności pierwszeństwa: `.webp`, `.jpg`, `.jpeg`, `.png`.

```
public/marka/kategorie/
  krotkie.jpg
  srednie.jpg
  dlugie.jpg
  trzy-korony.jpg
  z-dziecmi.jpg
  rowerowe.jpg
  korony-pienin.jpg
  wyzwania.jpg
  atrakcje.jpg
```

## Wymagania techniczne

| parametr | wartość |
|---|---|
| proporcje | **4:3 poziome** (kafelek jest przycinany do tego kształtu) |
| minimalna szerokość | 1600 px — kafelek na dużym ekranie ma ok. 420 px, ale ekrany 2× potrzebują zapasu |
| waga po obróbce | do 250 kB na plik; przy większych stronę zacznie zauważalnie ważyć |
| kadr | **dolna trzecia część musi być spokojna** — leży na niej nazwa kategorii w bieli. Niebo u góry, ciemniejszy pierwszy plan u dołu działa najlepiej |
| czego unikać | rozpoznawalnych twarzy, logotypów firm, tablic z tekstem, zimowych kadrów przy kategoriach letnich |

Po pobraniu ze stocku warto przepuścić przez konwersję do WebP — te same
zdjęcia ważą wtedy 3–4 razy mniej:

```bash
cwebp -q 82 -resize 1600 0 zdjecie.jpg -o public/marka/kategorie/krotkie.webp
```

## Czego szukać dla każdej kategorii

Frazy podane po polsku i po angielsku — Adobe Stock indeksuje oba, ale
angielskie zwykle dają więcej trafień.

### `krotkie.jpg` — Piesze trasy krótkie (2–4 h)

**Szukaj:** `Pieniny szlak wiosna` · `Pieniny hiking trail` · `Szczawnica góry`
**Kadr:** ścieżka wchodząca w głąb kadru, poranne albo miękkie światło, łagodne
zalesione wzgórza. Ma mówić „spacer", nie „wyprawa".
**Unikaj:** grani, ekspozycji, plecaków wspinaczkowych.

### `srednie.jpg` — Piesze trasy średnie (4–6 h)

**Szukaj:** `Pieniny grań` · `Pieniny ridge view` · `Małe Pieniny panorama`
**Kadr:** grzbiet w pełnym świetle dnia, kilka pasm jedno za drugim, wyraźny
błękit. Może być sylwetka turysty na szlaku.

### `dlugie.jpg` — Piesze trasy długie (ponad 6 h)

**Szukaj:** `Pieniny zachód słońca` · `Pieniny sunset mountains` · `Beskid Sądecki panorama`
**Kadr:** późne popołudnie albo złota godzina, pasma aż po horyzont, długie
cienie. Obraz dnia, który się kończy, a droga jeszcze nie.

### `trzy-korony.jpg` — Trzy Korony

**Szukaj:** `Trzy Korony Pieniny` · `Three Crowns Pieniny` · `Trzy Korony taras widokowy`
**Kadr:** rozpoznawalna sylwetka trzech wapiennych baszt — najlepiej z boku
albo z przeciwległego zbocza, nie z samego szczytu. To jedyny kafelek, na
którym widz ma rozpoznać konkretne miejsce.

### `z-dziecmi.jpg` — mamy własne zdjęcie

Zostawiamy `dp_droga.jpg` z aplikacji: brukowana promenada nad Grajcarkiem,
dzieci na hulajnogach. Pasuje lepiej niż cokolwiek ze stocku, bo jest stąd.
Jeśli chcesz podmienić — szukaj `rodzina góry szlak` · `family hiking mountains`.

### `rowerowe.jpg` — Trasy rowerowe

**Szukaj:** `Velo Dunajec` · `Dunajec rower ścieżka` · `cycling path river Poland`
**Kadr:** rowerzysta albo sama ścieżka wzdłuż rzeki, dolina, wapienne ściany
w tle. Nie kolarstwo górskie w błocie — chodzi o spokojny przejazd doliną.

### `korony-pienin.jpg` — Korony Pienin (24 szczyty)

**Szukaj:** `Pieniny szczyt panorama` · `Pieniny summit view` · `Pieniny mgła doliny`
**Kadr:** widok ze szczytu na kolejne wierzchołki, najlepiej z mgłą w dolinach.
Ma mówić „jest tego dwadzieścia cztery", więc im więcej planów, tym lepiej.

### `wyzwania.jpg` — Pienińskie wyzwania (odznaki)

**Szukaj:** `Pieniny wschód słońca` · `mountain sunrise hiker` · `Pieniny świt`
**Kadr:** świt albo pierwsze światło, sylwetka na szczycie. Odznaki zdobywa się
wychodząc przed świtem — kadr ma to oddać.

### `atrakcje.jpg` — mamy własne zdjęcie

Zostawiamy `dp_przystan.jpg`: drewniana brama „Szczawnica Przystań" nad
Dunajcem z drogowskazem „Spływ Dunajcem". Trafia w sedno lepiej niż stock.
Jeśli chcesz podmienić — szukaj `spływ Dunajcem tratwa` · `Dunajec river rafting`.

## Uwaga o spójności

Dziewięć zdjęć od dziewięciu różnych autorów łatwo wygląda jak zbieranina.
Trzy rzeczy, które temu zapobiegają:

1. **Jedna pora roku.** Najlepiej późne lato albo wczesna jesień — wtedy
   Pieniny wyglądają najbardziej charakterystycznie, a zieleń nie jest
   jeszcze płaska jak w czerwcu.
2. **Podobna temperatura barwna.** Odrzucaj kadry przesadnie nasycone
   i takie z mocnym filtrem — na siatce trzy na trzy jeden krzykliwy kafelek
   psuje wszystkie pozostałe.
3. **Ta sama odległość od tematu.** Albo wszystkie szerokie panoramy, albo
   wszystkie kadry z bliskim pierwszym planem. Mieszanka wygląda niechlujnie.

Jak wybierzesz, wrzuć pliki i napisz — sprawdzę kadrowanie na kafelkach,
czytelność napisów i wagę strony po zmianie.
