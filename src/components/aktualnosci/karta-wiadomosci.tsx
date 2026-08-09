import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Newspaper } from 'lucide-react'

import { adresZdjecia, dataPolska, type WiadomoscNaLiscie } from '@/lib/wiadomosci/zapytania'

/**
 * Karta notki na liście aktualności i na stronie głównej.
 *
 * **Dlaczego komponent obrazu Next.js, a nie zwykły `<img>` z `data:` URL.**
 * Pierwsza wersja wstawiała zdjęcie wprost z bazy jako `data:` URL i to był
 * błąd, który zważył trzy megabajty: taki obraz ląduje w HTML-u, i to dwa
 * razy — raz w znaczniku, raz w ładunku, z którego React odtwarza stronę.
 * Nie da się go też zapamiętać w pamięci podręcznej ani wczytać leniwie,
 * bo nie jest osobnym zasobem.
 *
 * Teraz zdjęcie ma własny adres, więc Next.js może je przeskalować do
 * rozmiaru karty — zamiast kilobajtów tysiąca na miniaturkę idzie ich
 * kilkadziesiąt.
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
      {wiadomosc.maZdjecie ? (
        <Link
          href={`/aktualnosci/${wiadomosc.slug}`}
          className="relative block aspect-[16/9] overflow-hidden bg-kamien-100"
          tabIndex={-1}
          aria-hidden
        >
          <Image
            src={adresZdjecia(wiadomosc.slug)}
            alt={wiadomosc.zdjecieOpis ?? ''}
            fill
            /*
              Karta zajmuje całą szerokość na telefonie, dwie trzecie
              w wyróżnieniu i jedną trzecią w siatce. Bez tej podpowiedzi
              przeglądarka pobrałaby wariant na całą szerokość ekranu.
            */
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
