import Link from 'next/link'
import { ArrowUpRight, Newspaper } from 'lucide-react'

import { dataPolska, type WiadomoscNaLiscie } from '@/lib/wiadomosci/zapytania'

/**
 * Karta notki na liście aktualności i na stronie głównej.
 *
 * **Dlaczego zwykły `<img>`, a nie komponent obrazu Next.js.** Zdjęcia notek
 * są zapisane jako `data:` URL w bazie. Optymalizator Next.js pobiera obraz
 * spod adresu, żeby go przeskalować — a `data:` URL nie jest adresem, spod
 * którego da się cokolwiek pobrać. Obraz jest już zmniejszony w przeglądarce
 * przy wgrywaniu, więc nie ma tu czego optymalizować.
 *
 * **Dlaczego karta bez zdjęcia nie pokazuje zastępczej grafiki.** Szara plama
 * z ikoną nie niesie informacji, a zabiera miejsce tytułowi. Notka bez
 * zdjęcia dostaje po prostu więcej powietrza i mniejszy nagłówek — układ
 * pozostaje spójny, bo wysokość wyrównuje siatka.
 */
export function KartaWiadomosci({
  wiadomosc,
  wyrozniona = false,
}: {
  wiadomosc: WiadomoscNaLiscie
  wyrozniona?: boolean
}) {
  return (
    <article
      className={
        'group relative flex flex-col overflow-hidden rounded-2xl border border-kamien-200 bg-white ' +
        'transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony'
      }
    >
      {wiadomosc.zdjecie ? (
        <Link
          href={`/aktualnosci/${wiadomosc.slug}`}
          className="block aspect-[16/9] overflow-hidden bg-kamien-100"
          tabIndex={-1}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wiadomosc.zdjecie}
            alt={wiadomosc.zdjecieOpis ?? ''}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>
      ) : (
        <div className="flex items-center gap-2 border-b border-kamien-100 px-7 pt-7 text-las-600">
          <Newspaper className="size-5" aria-hidden />
        </div>
      )}

      <div className="flex flex-1 flex-col p-7">
        <time
          dateTime={wiadomosc.opublikowano.toISOString()}
          className="text-xs font-semibold uppercase tracking-wider text-kamien-500"
        >
          {dataPolska(wiadomosc.opublikowano)}
        </time>

        <h3
          className={
            'mt-3 font-heading font-semibold leading-snug text-kamien-900 ' +
            (wyrozniona ? 'text-2xl' : 'text-xl')
          }
        >
          <Link href={`/aktualnosci/${wiadomosc.slug}`} className="hover:text-las-800">
            {/* Rozciągnięcie odnośnika na całą kartę: klikalny jest cały kafelek,
                ale w drzewie dostępności zostaje jeden odnośnik z tytułem. */}
            <span className="absolute inset-0" aria-hidden />
            {wiadomosc.tytul}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-4 flex-1 leading-relaxed text-kamien-600">{wiadomosc.lid}</p>

        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-las-700">
          Czytaj
          <ArrowUpRight
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </span>
      </div>
    </article>
  )
}
