import type { Metadata } from 'next'
import Link from 'next/link'
import { Mountain } from 'lucide-react'

import { FiltryAtrakcji } from '@/components/atrakcje/filtry-atrakcji'
import { KartaAtrakcji } from '@/components/atrakcje/karta-atrakcji'
import { PartnerKategorii } from '@/components/atrakcje/partner-kategorii'
import { WolneMiejscePartnera } from '@/components/atrakcje/wolne-miejsce-partnera'
import { pobierzAtrakcje } from '@/lib/dane/zrodlo'
import { PORTAL } from '@/lib/konfiguracja'
import { ATRAKCJE_TURYSTYCZNE, atrakcjeWKategorii } from '@/lib/tresc/atrakcje-turystyczne'
import { KATEGORIE_ATRAKCJI, type KategoriaAtrakcji } from '@/lib/tresc/kategorie-atrakcji'

export const metadata: Metadata = {
  title: 'Atrakcje Pienin',
  description:
    'Spływ Dunajcem, Wąwóz Homole, zamki w Niedzicy i Czorsztynie, pijalnia wód, ' +
    'wyciągi i trasy narciarskie — katalog atrakcji Szczawnicy, Jaworek, Krościenka ' +
    'i całych Pienin, z filtrowaniem po kategorii i miejscowości.',
  alternates: { canonical: '/atrakcje' },
}

/**
 * Katalog atrakcji.
 *
 * **Kategoria przed miejscowością.** Turysta pyta najpierw „co mogę robić",
 * a dopiero potem „gdzie to jest". Dlatego sekcjami są kategorie, a miejscowość
 * jest filtrem — odwrotny układ zmuszałby do przeglądania sześciu miejscowości,
 * żeby znaleźć wszystkie miejsca dla dzieci.
 *
 * **Wszystko renderuje się na serwerze, filtruje po stronie przeglądarki.**
 * Karty są w gotowym HTML-u, więc wyszukiwarka widzi komplet atrakcji, a nie
 * pustą stronę czekającą na JavaScript. Filtry tylko chowają to, co odpadło.
 *
 * **Atrakcja może być w kilku kategoriach i pojawi się w kilku sekcjach.**
 * To nie jest duplikat: rekord jest jeden, `slug` jeden, strona szczegółowa
 * jedna. Kuligi są zimowe i aktywne naraz i szukający w obu kategoriach ma
 * prawo je znaleźć.
 */
/** Kategorie, w których szukamy partnera. Rozszerza się dopisaniem klucza. */
const KATEGORIE_Z_ZAPROSZENIEM: KategoriaAtrakcji[] = ['woda']

export default function StronaAtrakcji() {
  const kategorieZTrescia = KATEGORIE_ATRAKCJI.map((kategoria) => ({
    ...kategoria,
    atrakcje: atrakcjeWKategorii(kategoria.klucz),
  })).filter((kategoria) => kategoria.atrakcje.length > 0)

  const liczbaSzczytow = pobierzAtrakcje().filter((a) => a.typ === 'szczyt').length

  const daneOkruszkow = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
      { '@type': 'ListItem', position: 2, name: 'Atrakcje', item: `${PORTAL.adres}/atrakcje` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneOkruszkow) }}
      />

      {/* ── Hero ────────────────────────────────────────────────────────────
          Celowo niski. Katalog ma pięćdziesiąt siedem pozycji i każdy
          dodatkowy ekran nagłówka to jeden ekran mniej dla nich. */}
      <header className="bg-kamien-50 py-10 lg:py-14">
        <div className="obszar">
          <nav aria-label="Okruszki" className="text-sm text-kamien-500">
            <Link href="/" className="hover:text-las-700">
              Start
            </Link>
            <span aria-hidden className="mx-2">
              /
            </span>
            <span className="text-kamien-700">Atrakcje</span>
          </nav>

          <h1 className="mt-4 text-tytul font-semibold text-kamien-900">Atrakcje Pienin</h1>
          <p className="mt-3 max-w-[60ch] text-prowadzacy text-kamien-600">
            Odkryj najciekawsze miejsca, atrakcje i aktywności w Szczawnicy i całych
            Pieninach.
          </p>
        </div>
      </header>

      {/* Pasek filtrów przykleja się pod nagłówkiem strony — przy siedmiu
          sekcjach zmiana kategorii bez przewijania na górę jest różnicą między
          narzędziem a listą. */}
      <div className="sticky top-[4.5rem] z-30 sm:top-24">
        <FiltryAtrakcji
          pozycje={ATRAKCJE_TURYSTYCZNE.map((a) => ({
            kategorie: a.kategorie,
            lokalizacja: a.lokalizacja,
          }))}
        />
      </div>

      <div id="katalog-atrakcji" className="obszar py-10 lg:py-14">
        {kategorieZTrescia.map((kategoria) => (
          <section key={kategoria.klucz} id={kategoria.klucz} className="mb-12 scroll-mt-56">
            <div className="mb-5">
              <h2 className="font-heading text-2xl font-semibold text-kamien-900">
                {kategoria.nazwa}
              </h2>
              <p className="mt-1 max-w-[70ch] text-sm text-kamien-600">{kategoria.opis}</p>
            </div>

            {/* Nie renderuje niczego, dopóki kategoria nie ma partnera. */}
            <PartnerKategorii kategoria={kategoria.klucz} />

            {/*
              Zaproszenie dla partnerów — na razie tylko w tej jednej kategorii.
              Ogłoszenie przy każdej sekcji zamieniłoby katalog w słup
              ogłoszeniowy, a wisi po to, żeby znaleźć pierwszego partnera,
              nie żeby ozdabiać stronę.
            */}
            {KATEGORIE_Z_ZAPROSZENIEM.includes(kategoria.klucz) && (
              <WolneMiejscePartnera kategoria={kategoria.klucz} />
            )}

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {kategoria.atrakcje.map((atrakcja) => (
                <li
                  key={atrakcja.slug}
                  /* Atrybuty czytane przez filtry. Kategorie rozdzielone spacją,
                     żeby dało się je dopasować selektorem `~=`. */
                  data-kategorie={atrakcja.kategorie.join(' ')}
                  data-lokalizacja={atrakcja.lokalizacja}
                >
                  <KartaAtrakcji atrakcja={atrakcja} kategoriaSekcji={kategoria.klucz} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-2xl border border-kamien-200 bg-kamien-50 p-6 sm:p-8">
          <h2 className="flex items-center gap-2.5 font-heading text-xl font-semibold text-kamien-900">
            <Mountain className="size-5 text-las-600" aria-hidden />
            Szczyty i punkty widokowe
          </h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-kamien-600">
            Szczyty opisujemy przy trasach, które na nie prowadzą — jest ich{' '}
            {liczbaSzczytow}, każdy z czasem dojścia i punktami po drodze. Znajdziesz
            je na stronie głównej i przy poszczególnych szlakach.
          </p>
          <Link
            href="/szlaki"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-kamien-300 bg-white px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
          >
            Przeglądaj trasy
          </Link>
        </section>
      </div>
    </>
  )
}
