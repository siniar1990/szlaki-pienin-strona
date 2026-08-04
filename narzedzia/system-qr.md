# System tabliczek QR — uruchomienie

Etap pierwszy jest gotowy w kodzie. Zostały czynności, których nie da się
wykonać bez twoich kont: założenie bazy, projektu na Vercelu i przepięcie
domeny. Poniżej kolejność, w jakiej trzeba to zrobić, żeby działający portal
ani na chwilę nie przestał odpowiadać.

## 1. Baza danych (Neon)

1. Załóż projekt na <https://neon.tech>, region **Frankfurt** — najbliżej
   i Pienin, i serwerów Vercela w Europie.
2. Skopiuj adres połączenia. Wygląda tak:
   `postgresql://…@ep-….eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Utwórz gałąź bazy do pracy lokalnej (przycisk „Branch"). Migracje potrafią
   skasować dane — na produkcji uruchamiaj je świadomie, nie przy okazji.

## 2. Zmienne środowiskowe

```bash
cp .env.example .env
npm run haslo -- "twoje-dlugie-haslo-do-panelu"   # wynik → HASLO_PANELU
openssl rand -hex 32                              # → SEKRET_SESJI
openssl rand -hex 32                              # → SEKRET_ZADAN
```

Hasła nie zapisuj nigdzie poza menedżerem haseł — w zmiennej ląduje wyłącznie
skrót PBKDF2, z którego nie da się go odtworzyć.

## 3. Migracja i dane startowe

```bash
npm run baza:migracja      # tworzy tabele
npm run baza:wgraj         # pięć tabliczek testowych: Sokolica, Trzy Korony…
npm run dev                # panel pod http://localhost:3000/panel
```

## 4. Vercel

1. Zaimportuj repozytorium na <https://vercel.com>.
2. Wpisz cztery zmienne środowiskowe z punktu 2 (dla Production i Preview).
3. Pierwsze wdrożenie pójdzie na adres `*.vercel.app` — **sprawdź je, zanim
   ruszysz DNS**. Przejdź po `/`, `/szlaki`, `/atrakcje`, `/mapa`, zaloguj się
   do panelu, wygeneruj kod i zeskanuj go telefonem.

**Uwaga o planie.** Darmowy plan Hobby nie obejmuje zastosowań komercyjnych.
Portal pokazujący dane inwestorom i samorządowi pod ten wyjątek nie podpada —
potrzebny jest plan Pro.

## 5. Przepięcie domeny

Dopiero gdy wdrożenie na `*.vercel.app` działa w całości:

1. W panelu Vercela dodaj domenę `szlakipienin.pl` i `www.szlakipienin.pl`.
2. W OVH podmień rekordy `A` i `AAAA` na wskazane przez Vercela, `www` zostaw
   jako `CNAME`. **Rekordów MX i SPF nie ruszaj** — to poczta.
3. Po przełączeniu wyłącz publikację z GitHub Pages
   (Settings → Pages → Source: None), żeby nie działały dwie kopie portalu.
4. Sprawdź, że `/prywatnosc.html` i `/wsparcie.html` zwracają 301, a nie 404 —
   te adresy są podane w App Store Connect.

## 6. Zadania cykliczne

`vercel.json` opisuje dwa zadania: przeliczanie statystyk co pięć minut
i czyszczenie surowych zdarzeń raz na dobę. Vercel uruchomi je sam po
wdrożeniu. Sprawdzenie ręczne:

```bash
curl -H "Authorization: Bearer $SEKRET_ZADAN" https://szlakipienin.pl/api/cron/agregacja
```

## Codzienna praca

**Nowa tabliczka:** panel → Tabliczki → Nowa tabliczka. Identyfikator nadaje
system. Po zapisaniu pobierz SVG i wyślij do drukarni.

**Paczka do druku:** panel → Tabliczki → Wygeneruj paczkę. Powstają kody ze
statusem *zapas* — wydrukowane, jeszcze niezamontowane. Po zamontowaniu wejdź
w kod, uzupełnij nazwę, kategorię i współrzędne, przestaw status na *aktywna*.

Archiwum ZIP ze wszystkimi plikami i zestawieniem CSV:
`/api/panel/paczka?status=ZAPAS`. Zestawienie jest ważniejsze, niż się wydaje —
bez niego drukarnia nie wie, który z dwustu plików trafia na którą tabliczkę.

**Weryfikacja przed montażem:** wydrukuj jeden kod i zeskanuj go telefonem.
To jedyny test, który naprawdę dowodzi, że system działa; wszystkie pozostałe
sprawdzają tylko, że kod się kompiluje.

## Co zostało na etap drugi

Heatmapa, wykresy godzinowe i sezonowe, porównania między punktami, publiczny
pulpit dla inwestorów, raporty PDF, API dla samorządu, testy A/B tabliczek.
Pole `nosnik` w bazie czeka już na tabliczki NFC — wejdą do tej samej
analityki bez migracji.
