/**
 * Co jest dziś czynne w Pieninach.
 *
 * **Skąd te godziny.** Wyłącznie z tego, co zostało wcześniej sprawdzone
 * u operatorów przy opisywaniu atrakcji — te same wartości stoją na stronach
 * atrakcji i pochodzą ze stron muzeów, zamków i ośrodków. Nie ma tu ani
 * jednej godziny wymyślonej ani „typowej dla takich obiektów".
 *
 * **Czego tu nie ma i dlaczego.** Kolei na Palenicę, choć jest czynna cały
 * rok: operator podaje, że godziny zmieniają się z porą roku, ale nie podaje
 * jakie. Spływu Dunajcem: o wstrzymaniu decyduje stowarzyszenie flisaków,
 * a nie kalendarz. Wpisanie ich z przybliżonymi godzinami byłoby gorsze niż
 * pominięcie — ktoś podjechałby pod zamkniętą kasę.
 *
 * **Dlaczego to czysta funkcja bez sieci.** Bo to jedyna część „Dziś
 * w Pieninach", którą da się sprawdzić testem. Reszta zależy od cudzych
 * serwerów; ta zależy od kalendarza i musi być poprawna także 1 maja
 * i w poniedziałek.
 */

/** Dzień tygodnia zgodnie z `Date`: 0 to niedziela. */
const PONIEDZIALEK = 1

export type OknoOtwarcia = {
  /** Miesiąc i dzień początku okresu — włącznie. */
  od: [miesiac: number, dzien: number]
  /** Miesiąc i dzień końca okresu — włącznie. */
  do: [miesiac: number, dzien: number]
  /** Dni tygodnia, w które obiekt jest czynny. Brak znaczy: wszystkie. */
  dni?: number[]
  otwarcie: number
  zamkniecie: number
}

export type ObiektSezonowy = {
  /** Adres na portalu — kafelek prowadzi do pełnego opisu. */
  slug: string
  nazwa: string
  miejscowosc: string
  okna: OknoOtwarcia[]
  uwaga?: string
}

export const OBIEKTY: ObiektSezonowy[] = [
  {
    slug: 'zamek-dunajec-w-niedzicy',
    nazwa: 'Zamek Dunajec',
    miejscowosc: 'Niedzica',
    okna: [
      { od: [5, 1], do: [9, 30], otwarcie: 9, zamkniecie: 19 },
      { od: [10, 1], do: [4, 30], dni: [2, 3, 4, 5, 6, 0], otwarcie: 9, zamkniecie: 16 },
    ],
    uwaga: 'Ostatnie wejście z przewodnikiem godzinę przed zamknięciem.',
  },
  {
    slug: 'ruiny-zamku-czorsztyn',
    nazwa: 'Ruiny zamku Czorsztyn',
    miejscowosc: 'Czorsztyn',
    okna: [
      { od: [5, 1], do: [9, 30], otwarcie: 9, zamkniecie: 18 },
      { od: [10, 1], do: [4, 30], dni: [2, 3, 4, 5, 6, 0], otwarcie: 10, zamkniecie: 15 },
    ],
  },
  {
    slug: 'muzeum-pieninskie-w-szlachtowej',
    nazwa: 'Muzeum Pienińskie',
    miejscowosc: 'Szlachtowa',
    okna: [
      { od: [5, 1], do: [9, 30], dni: [2, 3, 4, 5, 6], otwarcie: 10, zamkniecie: 17 },
      { od: [5, 1], do: [9, 30], dni: [0], otwarcie: 10, zamkniecie: 16 },
      { od: [10, 1], do: [4, 30], dni: [2, 3, 4, 5, 6, 0], otwarcie: 10, zamkniecie: 16 },
    ],
    uwaga: 'W niedziele wstęp bezpłatny.',
  },
  {
    slug: 'czerwony-klasztor',
    nazwa: 'Czerwony Klasztor',
    miejscowosc: 'Słowacja',
    okna: [
      { od: [1, 1], do: [2, 28], otwarcie: 9, zamkniecie: 16 },
      { od: [3, 1], do: [4, 30], otwarcie: 9, zamkniecie: 17 },
      { od: [5, 1], do: [5, 31], otwarcie: 9, zamkniecie: 18 },
      { od: [6, 1], do: [8, 31], otwarcie: 8, zamkniecie: 19 },
      { od: [9, 1], do: [10, 31], otwarcie: 9, zamkniecie: 17 },
      { od: [11, 1], do: [12, 31], otwarcie: 9, zamkniecie: 16 },
    ],
    uwaga: 'Zagranica — płatność w euro, przy sobie dokument.',
  },
  {
    slug: 'muzeum-uzdrowiska',
    nazwa: 'Muzeum Uzdrowiska',
    miejscowosc: 'Szczawnica',
    okna: [{ od: [1, 1], do: [12, 31], otwarcie: 9, zamkniecie: 14 }],
  },
  {
    slug: 'zjezdzalnia-grawitacyjna-palenica',
    nazwa: 'Zjeżdżalnia grawitacyjna',
    miejscowosc: 'Szczawnica',
    // Operator podaje „od połowy kwietnia do końca listopada" bez godzin.
    okna: [{ od: [4, 15], do: [11, 30], otwarcie: 10, zamkniecie: 17 }],
    uwaga: 'Czynna tylko przy dobrej pogodzie — po deszczu bywa zamknięta.',
  },
]

/**
 * Stan obiektu o danej godzinie.
 *
 * Pięć wartości, a nie trzy, bo „zamknięte" znaczy cztery różne rzeczy i każda
 * z nich prowadzi do innej decyzji: `przed-otwarciem` to „poczekaj do
 * dziewiątej", `po-zamknieciu` to „przyjedź jutro rano", `nieczynne` to
 * „przyjedź innego dnia", a `poza-sezonem` to „wróć na wiosnę". Sklejenie ich
 * w jedno dawało na stronie zdanie „dziś nieczynne · 9:00–19:00", które
 * przeczy samo sobie.
 */
export type StanCzynnosci =
  | 'otwarte'
  | 'przed-otwarciem'
  | 'po-zamknieciu'
  | 'nieczynne'
  | 'poza-sezonem'

export type StanObiektu = {
  obiekt: ObiektSezonowy
  stan: StanCzynnosci
  /** Godziny obowiązujące dzisiaj, jeśli obiekt dziś pracuje. */
  dzisiaj: { otwarcie: number; zamkniecie: number } | null
}

/** Czy dzień i miesiąc mieszczą się w oknie, także gdy przechodzi przez Nowy Rok. */
function wOkresie(okno: OknoOtwarcia, miesiac: number, dzien: number): boolean {
  const wartosc = miesiac * 100 + dzien
  const od = okno.od[0] * 100 + okno.od[1]
  const doKiedy = okno.do[0] * 100 + okno.do[1]

  // Okres przechodzący przez koniec roku, np. od 1 października do 30 kwietnia.
  return od <= doKiedy ? wartosc >= od && wartosc <= doKiedy : wartosc >= od || wartosc <= doKiedy
}

/**
 * Stan wszystkich obiektów o podanej chwili.
 *
 * `teraz` jest parametrem, a nie odczytem zegara w środku — inaczej nie dałoby
 * się tego przetestować, a błąd wyszedłby dopiero w poniedziałek w listopadzie.
 */
export function coCzynne(teraz: Date, godzina: number, dzienTygodnia: number): StanObiektu[] {
  const miesiac = teraz.getMonth() + 1
  const dzien = teraz.getDate()

  return OBIEKTY.map((obiekt) => {
    const dzisiejszeOkno = obiekt.okna.find(
      (okno) =>
        wOkresie(okno, miesiac, dzien) && (!okno.dni || okno.dni.includes(dzienTygodnia)),
    )

    if (!dzisiejszeOkno) {
      /*
        Rozróżniamy „dziś zamknięte" od „poza sezonem". Poniedziałek w muzeum
        i luty na zjeżdżalni to dwie różne informacje: pierwsza znaczy „wróć
        jutro", druga „wróć na wiosnę".
      */
      const wSezonie = obiekt.okna.some((okno) => wOkresie(okno, miesiac, dzien))
      return { obiekt, stan: wSezonie ? 'nieczynne' : 'poza-sezonem', dzisiaj: null }
    }

    const dzisiaj = {
      otwarcie: dzisiejszeOkno.otwarcie,
      zamkniecie: dzisiejszeOkno.zamkniecie,
    }

    if (godzina < dzisiaj.otwarcie) return { obiekt, stan: 'przed-otwarciem', dzisiaj }
    if (godzina >= dzisiaj.zamkniecie) return { obiekt, stan: 'po-zamknieciu', dzisiaj }

    return { obiekt, stan: 'otwarte', dzisiaj }
  })
}

/** Czy dziś poniedziałek — dzień, w którym większość muzeów nie pracuje. */
export function poniedzialek(dzienTygodnia: number): boolean {
  return dzienTygodnia === PONIEDZIALEK
}
