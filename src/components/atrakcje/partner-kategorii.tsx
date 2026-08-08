import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin, Star } from 'lucide-react'

import { zdjecieAtrakcji } from '@/lib/dane/zdjecia-atrakcji'
import { znajdzAtrakcjeTurystyczna } from '@/lib/tresc/atrakcje-turystyczne'
import {
  nazwaLokalizacji,
  partnerKategorii,
  type KategoriaAtrakcji,
} from '@/lib/tresc/kategorie-atrakcji'

/**
 * Wyróżnienie partnera kategorii.
 *
 * **Dziś nie renderuje niczego** — `partnerKategorii()` zwraca `null` dla
 * wszystkich kategorii, bo rejestr partnerów jest pusty. Komponent istnieje po
 * to, żeby włączenie tej funkcji polegało na wypełnieniu jednego wpisu
 * w `PARTNERZY_KATEGORII`, a nie na dopisywaniu układu do gotowej strony pod
 * presją terminu.
 *
 * Trzy rzeczy są wpisane w komponent, a nie zostawione na później, bo później
 * zawsze znaczy „gdy ktoś zauważy":
 *
 *  1. **Oznaczenie treści opłaconej** jest zawsze widoczne i bierze się
 *     z danych partnera. Prawo wymaga oznaczania reklamy, a etykieta doklejana
 *     ręcznie w widoku prędzej czy później zostanie pominięta przy kopiowaniu
 *     układu.
 *  2. **`rel="sponsored"`** na odnośniku do oferty — tego wymagają wyszukiwarki
 *     od odnośników opłaconych. Bez tego portal ryzykuje oceną jako sprzedający
 *     odnośniki.
 *  3. **Partner nie znika z listy** swojej kategorii. Wyróżnienie jest dodatkiem
 *     nad siatką, nie zamiast pozycji w niej — inaczej wykupienie reklamy
 *     wypychałoby firmę z alfabetycznego porządku i czytelnik miałby wrażenie,
 *     że katalog czegoś nie pokazuje.
 */
export function PartnerKategorii({ kategoria }: { kategoria: KategoriaAtrakcji }) {
  const partner = partnerKategorii(kategoria)
  if (!partner) return null

  const atrakcja = znajdzAtrakcjeTurystyczna(partner.atrakcja)
  if (!atrakcja) return null

  const zdjecie = zdjecieAtrakcji(atrakcja.slug)
  const adres = partner.adresOferty ?? atrakcja.rezerwacja ?? atrakcja.strona

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-amber-300 bg-amber-50/60">
      <div className="grid sm:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] bg-las-800 sm:aspect-auto sm:min-h-[13rem]">
          {zdjecie && (
            <Image
              src={zdjecie}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 22rem"
              className="object-cover"
            />
          )}
        </div>

        <div className="flex flex-col justify-center p-6">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-900">
            <Star className="size-3" aria-hidden />
            {partner.oznaczenie}
          </p>

          <h3 className="mt-3 font-heading text-xl font-semibold text-kamien-900">
            <Link href={`/atrakcje/${atrakcja.slug}`}>{atrakcja.nazwa}</Link>
          </h3>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-kamien-600">
            <MapPin className="size-3.5" aria-hidden />
            {atrakcja.miejscowosc ?? nazwaLokalizacji(atrakcja.lokalizacja)}
          </p>

          {atrakcja.skrot && (
            <p className="mt-3 max-w-[55ch] text-sm leading-relaxed text-kamien-700">
              {atrakcja.skrot}
            </p>
          )}

          {adres && (
            <a
              href={adres}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
            >
              Sprawdź ofertę
              <ArrowRight className="size-4" aria-hidden />
              <span className="sr-only">(otwiera się w nowej karcie)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
