import type { Metadata } from 'next'

import { PasmoSzczytow } from '@/components/atrakcje/pasmo-szczytow'
import { SekcjaGrupy, SkrotyDoGrup } from '@/components/atrakcje/sekcja-atrakcji'
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
    'Spływ Dunajcem, pijalnia wód mineralnych, zjeżdżalnie grawitacyjne, zamki, ' +
    'wąwozy i wodospady — atrakcje Szczawnicy, Krościenka i okolic. Do tego pasmo ' +
    'wszystkich szczytów, na które prowadzą opisane trasy.',
  alternates: { canonical: '/atrakcje' },
}

export default function StronaAtrakcji() {
  // Atrakcje wyciągnięte z tras to dziś wyłącznie szczyty — reszta punktów
  // (przełęcze, schroniska, stacje kolei) zostaje przy trasach i na mapie.
  const szczyty = pobierzAtrakcje().filter((atrakcja) => atrakcja.typ === 'szczyt')

  const grupyZTrescia = GRUPY_ATRAKCJI.filter((g) => atrakcjeWGrupie(g.klucz).length > 0)

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

      <NaglowekStrony
        okruszki={[{ nazwa: 'Atrakcje', adres: '/atrakcje' }]}
        tytul="Atrakcje Pienin"
        tytulOpis="Co zobaczyć w Szczawnicy, Krościenku i okolicy"
        lead={`${ATRAKCJE_TURYSTYCZNE.length} miejsc, od spływu Dunajcem po zamki nad jeziorem, oraz pasmo ${szczyty.length} szczytów, na które prowadzą opisane u nas trasy.`}
        dodatek={<SkrotyDoGrup grupy={grupyZTrescia} />}
      />

      <div className="obszar py-14 lg:py-20">
        <div className="space-y-20">
          {GRUPY_ATRAKCJI.map((grupa, indeks) => {
            const wGrupie = atrakcjeWGrupie(grupa.klucz)
            if (wGrupie.length === 0) return null

            return (
              <SekcjaGrupy
                key={grupa.klucz}
                grupa={grupa.klucz}
                nazwa={grupa.nazwa}
                opis={grupa.opis}
                atrakcje={wGrupie}
                numer={indeks + 1}
              />
            )
          })}
        </div>
      </div>

      {/* ── Pasmo szczytów ───────────────────────────────────────────────── */}
      <section aria-labelledby="szczyty" className="border-t border-kamien-200 bg-white py-16 lg:py-20">
        <div className="obszar">
          <p className="font-plakat text-sm uppercase tracking-[0.22em] text-las-600">
            {String(grupyZTrescia.length + 1).padStart(2, '0')}
          </p>
          <h2
            id="szczyty"
            className="mt-2 font-plakat text-[clamp(1.9rem,4vw,3rem)] uppercase leading-[0.98] text-kamien-900"
          >
            Pasmo szczytów
          </h2>
          <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-kamien-600">
            Wszystkie {szczyty.length} szczytów, na które prowadzą opisane u nas trasy —
            od Radziejowej po najniższy. Wysokość wierzchołka na rysunku odpowiada
            wysokości w terenie. Przewiń w prawo.
          </p>

          <div className="mt-10">
            <PasmoSzczytow szczyty={szczyty} />
          </div>
        </div>
      </section>
    </>
  )
}
