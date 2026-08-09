import { baza } from '../src/lib/baza'

/**
 * Wgranie startowej listy źródeł aktualności.
 *
 * Uruchamiane raz, przy zakładaniu działu. Później źródła dodaje się w panelu
 * — ale pierwsza lista jest długa i wpisywanie jej z ręki byłoby dwudziestoma
 * pięcioma wizytami w tym samym formularzu.
 *
 *     npx tsx narzedzia/wgraj-zrodla.ts
 *
 * Wgranie ponowne niczego nie psuje: adres ma warunek unikalności, a wpisy
 * już istniejące zostają nietknięte razem ze swoim stanem włączenia.
 */

const ZRODLA: { nazwa: string; adres: string; aktywne?: boolean }[] = [
  // ── Serwisy pienińskie ──────────────────────────────────────────────────
  { nazwa: 'Pieniny24', adres: 'https://pieniny24.pl/aktualnosci' },
  // Podany adres /aktualnosci/ zwraca 404 — serwis wystawia za to kanał RSS.
  { nazwa: 'wPieniny', adres: 'https://wpieniny.pl/feed/' },
  { nazwa: 'Pieniny na weekend', adres: 'https://pieniny-na-weekend.pl/aktualnosci/' },
  { nazwa: 'Moje Pieniny', adres: 'https://mojepieniny.pl/' },

  // ── Prasa regionalna ────────────────────────────────────────────────────
  { nazwa: 'Podhale24 — Szczawnica', adres: 'https://podhale24.pl/tag/Szczawnica/' },
  { nazwa: 'Tygodnik Podhalański', adres: 'https://24tp.pl/?mod=news&typ=w&kat=4' },
  { nazwa: 'Goral24 — Szczawnica', adres: 'https://goral24.pl/szczawnica' },
  { nazwa: 'Goral24 — Krościenko', adres: 'https://goral24.pl/kroscienko-nad-dunajcem' },
  { nazwa: 'Podhalego — Krościenko', adres: 'https://podhalego.pl/kroscienko-nad-dunajcem' },
  { nazwa: 'Nasze Miasto — Szczawnica', adres: 'https://szczawnica.naszemiasto.pl/' },
  /*
    Gazeta Krakowska odpowiada kodem 403 na żądania spoza przeglądarki —
    wydawca świadomie blokuje automaty. Wpis zostaje wyłączony, a nie usunięty:
    gdyby polityka serwisu się zmieniła, wystarczy jedno kliknięcie w panelu.
    Obchodzenie blokady przez podszywanie się pod przeglądarkę byłoby
    działaniem wbrew wyraźnej woli właściciela serwisu.
  */
  {
    nazwa: 'Gazeta Krakowska — Podhale',
    adres: 'https://gazetakrakowska.pl/wiadomosci/podhale',
    aktywne: false,
  },
  { nazwa: 'Głos24 — Podhale', adres: 'https://glos24.pl/informacje/podhale' },
  { nazwa: 'Co w Górach — Szczawnica', adres: 'https://cowgorach.pl/tag/Szczawnica' },
  { nazwa: 'TVP Info — Szczawnica', adres: 'https://www.tvp.info/tag?tag=szczawnica' },

  // ── Samorządy ───────────────────────────────────────────────────────────
  { nazwa: 'Szczawnica — miasto', adres: 'https://szczawnica.pl/' },
  {
    nazwa: 'Szczawnica — wiadomości samorządowe',
    adres: 'https://szczawnica.pl/pl/1773/0/wiadomosci-samorzadowe.html',
  },
  {
    nazwa: 'Szczawnica — informacje bieżące',
    adres: 'https://szczawnica.pl/pl/1772/0/informacje-biezace.html',
  },
  { nazwa: 'Krościenko — gmina', adres: 'https://kroscienko.pl/' },
  { nazwa: 'Krościenko — aktualności', adres: 'https://kroscienko.pl/pl/980/0/aktualnosci.html' },
  { nazwa: 'Czorsztyn — gmina', adres: 'https://czorsztyn.pl/' },
  { nazwa: 'Czorsztyn — aktualności', adres: 'https://czorsztyn.pl/pl/378/0/aktualnosci.html' },

  // ── Geoportale gminne ───────────────────────────────────────────────────
  {
    nazwa: 'Geoportal — Szczawnica',
    adres: 'https://szczawnica.geoportal-krajowy.pl/wiadomosci',
  },
  {
    nazwa: 'Geoportal — Krościenko',
    adres: 'https://kroscienko-nad-dunajcem.geoportal-krajowy.pl/wiadomosci',
  },
  { nazwa: 'Geoportal — Czorsztyn', adres: 'https://czorsztyn.geoportal-krajowy.pl/wiadomosci' },

  /*
    Świadomie pominięty: profil gminy Szczawnica na Facebooku.

    Facebook nie wystawia treści stron bez zalogowania i bez klucza do swojego
    interfejsu, a automatyczne pobieranie zawartości serwisu jest wprost
    zakazane w jego regulaminie. Obchód dostałby tam ekran logowania i zapisał
    go jako artykuł. Jeżeli te wpisy mają trafiać do aktualności, drogą jest
    oficjalny interfejs Facebooka albo przepisanie ich ręcznie.
  */
]

async function wgraj() {
  let dodane = 0

  for (const zrodlo of ZRODLA) {
    const wynik = await baza.zrodloWiadomosci.createMany({ data: [zrodlo], skipDuplicates: true })
    dodane += wynik.count
  }

  const wszystkie = await baza.zrodloWiadomosci.count()
  console.log(`Dodano ${dodane} nowych źródeł. Razem w bazie: ${wszystkie}.`)
}

wgraj()
  .catch((blad) => {
    console.error(blad)
    process.exitCode = 1
  })
  .finally(() => baza.$disconnect())
