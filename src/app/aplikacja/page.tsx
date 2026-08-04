import type { Metadata } from 'next'
import {
  BatteryCharging,
  Compass,
  Download,
  FileDown,
  MapPin,
  Medal,
  ShieldCheck,
  WifiOff,
} from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { pobierzStatystyki } from '@/lib/dane/zrodlo'
import { liczba } from '@/lib/format'
import { PORTAL } from '@/lib/konfiguracja'

export const metadata: Metadata = {
  title: 'Aplikacja Szlaki Pienin',
  description:
    'Przewodnik po Pieninach na telefon: mapy offline, nawigacja GPS, tryb „Na szlaku", ' +
    'nagrywanie marszu i eksport GPX. Bez konta, bez opłat, bez reklam.',
  alternates: { canonical: '/aplikacja' },
}

const MOZLIWOSCI = [
  {
    ikona: WifiOff,
    tytul: 'Mapa offline',
    tekst:
      'Pobierz mapę okolicy przez Wi-Fi przed wyjściem. W Pieninach zasięg bywa ' +
      'wybiórczy, a w wąwozach znika zupełnie — mapa działa niezależnie od tego.',
  },
  {
    ikona: Compass,
    tytul: 'Tryb „Na szlaku"',
    tekst:
      'Pokazuje postęp na trasie, następny punkt i wskazówkę dojścia. Gdy oddalisz ' +
      'się od szlaku o ponad 120 metrów, aplikacja to zauważy i da znać.',
  },
  {
    ikona: MapPin,
    tytul: 'Nawigacja GPS',
    tekst:
      'Twoja pozycja rzutowana wprost na linię trasy, więc widzisz nie tylko gdzie ' +
      'jesteś, ale ile jeszcze zostało do przełęczy.',
  },
  {
    ikona: FileDown,
    tytul: 'Nagrywanie i eksport GPX',
    tekst:
      'Zapisuj przebyte trasy i przenoś je do Stravy, Garmina albo dokąd chcesz. ' +
      'Plik jest twój.',
  },
  {
    ikona: Medal,
    tytul: 'Pienińskie odznaki',
    tekst:
      'Diament Pienin i Rubin Szczawnicy — aplikacja liczy postęp i podpowiada, ' +
      'czego jeszcze brakuje do zdobycia odznaki.',
  },
  {
    ikona: ShieldCheck,
    tytul: 'SOS pod ręką',
    tekst:
      'Numer GOPR, numer alarmowy i twoje współrzędne na jednym ekranie. ' +
      'Gdy trzeba, nie szuka się tego po menu.',
  },
]

export default function StronaAplikacji() {
  const statystyki = pobierzStatystyki()

  const daneAplikacji = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: PORTAL.aplikacja.nazwa,
    applicationCategory: 'TravelApplication',
    operatingSystem: 'iOS, Android',
    url: `${PORTAL.adres}/aplikacja`,
    description: metadata.description,
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'PLN' },
    // Świadomie bez `aggregateRating` — aplikacja nie jest jeszcze w sklepach,
    // więc nie ma ocen. Wpisanie tu czegokolwiek byłoby fałszowaniem danych,
    // za które Google zresztą karze.
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneAplikacji) }}
      />

      <NaglowekStrony
        okruszki={[{ nazwa: 'Aplikacja', adres: '/aplikacja' }]}
        tytul="Przewodnik po Pieninach w telefonie"
        lead={`Wszystkie ${liczba(statystyki.liczbaTras)} tras z tej strony, plus mapa offline, nawigacja i nagrywanie marszu. Bez konta, bez opłat, bez reklam.`}
        dodatek={<PrzyciskiSklepow wariant="ciemny" />}
      />

      <div className="obszar py-16 lg:py-20">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MOZLIWOSCI.map(({ ikona: Ikona, tytul, tekst }) => (
            <li
              key={tytul}
              className="rounded-2xl border border-kamien-200 bg-white p-7 shadow-miekki"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-las-50 text-las-700">
                <Ikona className="size-5" aria-hidden />
              </span>
              <h2 className="mt-5 font-heading text-lg font-semibold text-kamien-900">
                {tytul}
              </h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-kamien-600">{tekst}</p>
            </li>
          ))}
        </ul>

        <section className="mt-16 rounded-3xl border border-kamien-200 bg-kamien-50 p-8 sm:p-12">
          <h2 className="text-sekcja font-semibold text-kamien-900">
            Skąd biorą się te trasy
          </h2>
          <div className="mt-5 max-w-[68ch] space-y-4 leading-relaxed text-kamien-700">
            <p>
              Opisy, punkty i czasy przejścia pochodzą z przewodnika PTTK Oddziału
              Pienińskiego „Szlaki pełne zdrowia" Piotra Krzywdy. Ślady tras to zapisy
              GPS uzupełnione o wysokości z modelu terenu EU-DEM o rozdzielczości 25 m.
            </p>
            <p>
              Strona i aplikacja czerpią z jednego zbioru danych. Poprawka opisu trasy
              w aplikacji trafia na tę stronę przy najbliższej publikacji — nie ma
              dwóch wersji prawdy o tym, którędy biegnie szlak.
            </p>
          </div>
        </section>

        <section className="mt-10 flex flex-col items-start gap-6 rounded-3xl bg-las-800 p-8 text-white sm:p-12">
          <Download className="size-8" aria-hidden />
          <h2 className="text-tytul font-semibold">Pobierz i wyjdź w góry</h2>
          <p className="max-w-[54ch] text-white/80">
            Aplikacja waży tyle, co kilka zdjęć, i działa bez zasięgu.
          </p>
          <PrzyciskiSklepow wariant="jasny" />
        </section>

        <p className="mt-10 flex items-start gap-3 text-sm leading-relaxed text-kamien-500">
          <BatteryCharging className="mt-0.5 size-4 shrink-0" aria-hidden />
          Nawigacja GPS zużywa baterię. Na całodniowe wyjście warto zabrać powerbank —
          telefon z rozładowaną baterią przestaje być mapą i przestaje być telefonem.
        </p>
      </div>
    </>
  )
}
