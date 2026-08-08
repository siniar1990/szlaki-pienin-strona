import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarRange, MapPin } from 'lucide-react'

import { IlustracjaKategorii } from '@/components/atrakcje/ilustracja-kategorii'
import { podpisZdjecia } from '@/lib/dane/podpisy-zdjec'
import { zdjecieAtrakcji } from '@/lib/dane/zdjecia-atrakcji'
import { GRUPY_ATRAKCJI, type AtrakcjaTurystyczna } from '@/lib/tresc/atrakcje-turystyczne'

/**
 * Szeroka karta atrakcji.
 *
 * Jedna kolumna, karta na pełną szerokość treści, obraz z lewej i tekst
 * z prawej. Siatka małych kafelków zawodziła z prostego powodu: przy
 * dwudziestu czterech pozycjach, z których większość nie ma jeszcze zdjęcia,
 * oko dostawało dwadzieścia cztery prostokąty do przeskanowania i żadnej
 * podpowiedzi, na czym się zatrzymać. Szeroka karta daje miejsce na dwa
 * zdania opisu — a to one, nie miniatura, decydują o kliknięciu.
 *
 * Na telefonie obraz wchodzi nad tekst, ale karta zostaje jedna pod drugą.
 * Nie wracamy do siatki na żadnej szerokości.
 */
export function KartaAtrakcji({
  atrakcja,
  priorytet = false,
}: {
  atrakcja: AtrakcjaTurystyczna
  priorytet?: boolean
}) {
  const zdjecie = zdjecieAtrakcji(atrakcja.slug)
  // Podpis tylko przy zdjęciu z Commons — nasze własne go nie potrzebują.
  const podpis = zdjecie ? podpisZdjecia(atrakcja.slug) : null
  const grupa = GRUPY_ATRAKCJI.find((g) => g.klucz === atrakcja.grupa)

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-kamien-200 bg-white shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-uniesiony focus-within:-translate-y-1 focus-within:shadow-uniesiony">
      <div className="grid md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] overflow-hidden bg-las-800 md:aspect-auto md:min-h-[17rem]">
          {zdjecie ? (
            <Image
              src={zdjecie}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 26rem"
              priority={priorytet}
              loading={priorytet ? undefined : 'lazy'}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <IlustracjaKategorii
              grupa={atrakcja.grupa}
              id={atrakcja.slug}
              className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-[1.04]"
            />
          )}

          {/*
            Podpis autora na samym zdjęciu, nie pod kartą.

            Licencje Creative Commons BY i BY-SA wymagają podania autora
            i odnośnika do źródła — bez nich użycie zdjęcia jest naruszeniem,
            a nie niedopatrzeniem. Podpis siedzi więc tam, gdzie nie da się go
            zgubić przy zmianie układu karty: w rogu kadru, który opisuje.

            Mały i przygaszony, żeby nie walczył o uwagę z treścią, ale
            czytelny — na to jest ciemna podkładka, bo zdjęcia bywają jasne
            w rogu.
          */}
          {podpis && (
            <p className="absolute bottom-0 right-0 z-10 max-w-full truncate rounded-tl-lg bg-kamien-950/55 px-2 py-1 text-[10px] leading-tight text-white/85 backdrop-blur-sm">
              <a
                href={podpis.strona}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-white hover:underline"
              >
                fot. {podpis.autor} · {podpis.licencja}
              </a>
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-kamien-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-las-700">
              <MapPin className="size-4" aria-hidden />
              {atrakcja.miejscowosc}
            </span>
            {grupa && (
              <>
                <span aria-hidden className="text-kamien-300">
                  ·
                </span>
                <span>{grupa.nazwa}</span>
              </>
            )}
            {atrakcja.sezon && (
              <>
                <span aria-hidden className="text-kamien-300">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarRange className="size-3.5" aria-hidden />
                  {atrakcja.sezon}
                </span>
              </>
            )}
          </p>

          <h3 className="mt-3 font-heading text-[1.7rem] font-semibold leading-tight text-kamien-900 sm:text-[2rem]">
            <Link
              href={`/atrakcje/${atrakcja.slug}`}
              className="after:absolute after:inset-0 after:content-[''] transition-colors group-hover:text-las-700"
            >
              {atrakcja.nazwa}
            </Link>
          </h3>

          <p className="mt-4 max-w-[62ch] text-[1.0625rem] leading-relaxed text-kamien-600">
            {atrakcja.skrot}
          </p>

          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-las-700">
            Zobacz szczegóły
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </article>
  )
}
