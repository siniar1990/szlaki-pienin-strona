import type { Metadata } from 'next'
import Link from 'next/link'
import { Mountain } from 'lucide-react'

import { KartaAtrakcji } from '@/components/atrakcje/karta-atrakcji'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { pobierzAtrakcje } from '@/lib/dane/zrodlo'
import { PORTAL } from '@/lib/konfiguracja'
import {
  ATRAKCJE_TURYSTYCZNE,
  GRUPY_ATRAKCJI,
  atrakcjeWGrupie,
} from '@/lib/tresc/atrakcje-turystyczne'

export const metadata: Metadata = {
  title: 'Atrakcje Pienin',
  description:
    'Spływ Dunajcem, Wąwóz Homole, zamki w Niedzicy i Czorsztynie, pijalnia wód ' +
    'mineralnych, zjeżdżalnie grawitacyjne — atrakcje Szczawnicy, Krościenka ' +
    'i okolic, każda z opisem, lokalizacją i dojazdem.',
  alternates: { canonical: '/atrakcje' },
}

/**
 * Lista atrakcji.
 *
 * Jedna kolumna szerokich kart zamiast siatki miniatur. Powód jest prosty:
 * większość atrakcji nie ma jeszcze zdjęcia, a siatka dwudziestu czterech
 * kafelków bez zdjęć to dwadzieścia cztery prostokąty do przeskanowania
 * i żadnej podpowiedzi, gdzie się zatrzymać. Szeroka karta daje miejsce na
 * dwa zdania opisu — a to one decydują o kliknięciu.
 *
 * Pasmo szczytów zostało stąd zdjęte; mieszka na stronie głównej i nie ma
 * powodu, żeby stało w dwóch miejscach.
 */
export default function StronaAtrakcji() {
  const grupyZTrescia = GRUPY_ATRAKCJI.filter((g) => atrakcjeWGrupie(g.klucz).length > 0)
  const liczbaSzczytow = pobierzAtrakcje().filter((a) => a.typ === 'szczyt').length

  const daneOkruszkow = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
      { '@type': 'ListItem', position: 2, name: 'Atrakcje', item: `${PORTAL.adres}/atrakcje` },
    ],
  }

  let licznik = 0

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneOkruszkow) }}
      />

      <NaglowekStrony
        okruszki={[{ nazwa: 'Atrakcje', adres: '/atrakcje' }]}
        tytul="Atrakcje Pienin"
        tytulOpis="Co zobaczyć w Szczawnicy, Krościenku i okolicy"
        lead={`${ATRAKCJE_TURYSTYCZNE.length} miejsc, od spływu Dunajcem po zamki nad jeziorem. Każde z opisem, lokalizacją i informacją, kiedy warto się tam wybrać.`}
        dodatek={
          <ul className="flex flex-wrap gap-2">
            {grupyZTrescia.map((grupa) => (
              <li key={grupa.klucz}>
                <a
                  href={`#${grupa.klucz}`}
                  className="inline-flex items-center gap-2 rounded-full border border-kamien-300 bg-white px-4 py-2 text-sm font-medium text-kamien-700 transition-colors hover:border-las-500 hover:bg-las-50 hover:text-las-800"
                >
                  {grupa.nazwa}
                  <span className="text-xs text-kamien-400">
                    {atrakcjeWGrupie(grupa.klucz).length}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        }
      />

      <div className="obszar py-14 lg:py-20">
        <div className="space-y-20 lg:space-y-24">
          {grupyZTrescia.map((grupa) => {
            const wGrupie = atrakcjeWGrupie(grupa.klucz)

            return (
              <section key={grupa.klucz} id={grupa.klucz} className="scroll-mt-28">
                <div className="border-b border-kamien-200 pb-6">
                  <h2 className="font-plakat text-[clamp(1.8rem,3.6vw,2.6rem)] uppercase leading-none text-kamien-900">
                    {grupa.nazwa}
                  </h2>
                  <p className="mt-3 max-w-[64ch] text-lg leading-relaxed text-kamien-600">
                    {grupa.opis}
                  </p>
                </div>

                {/* Jedna kolumna na każdej szerokości — świadomie, nie z braku
                    pomysłu. Siatka wracałaby do tego samego problemu. */}
                <div className="mt-8 space-y-6">
                  {wGrupie.map((atrakcja) => {
                    licznik += 1
                    return (
                      <KartaAtrakcji
                        key={atrakcja.slug}
                        atrakcja={atrakcja}
                        priorytet={licznik <= 2}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {/* Szczyty mają własne strony, ale pasmo mieszka na stronie głównej.
            Zamiast powielać moduł, zostawiamy jedno zdanie z odnośnikiem. */}
        <aside className="mt-20 rounded-2xl border border-kamien-200 bg-kamien-50 p-8 text-center">
          <Mountain className="mx-auto size-6 text-las-600" aria-hidden />
          <p className="mt-3 text-lg text-kamien-700">
            Opisaliśmy też {liczbaSzczytow} szczytów, na które prowadzą nasze trasy.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-kamien-300 bg-white px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50 hover:text-las-800"
          >
            Zobacz pasmo szczytów
          </Link>
        </aside>
      </div>
    </>
  )
}
