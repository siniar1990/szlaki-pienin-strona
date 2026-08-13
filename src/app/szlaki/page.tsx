import type { Metadata } from 'next'

import { KafelkiKategorii } from '@/components/glowna/kafelki-kategorii'
import { PrzegladarkaTras, type TrasaDoPrzegladania } from '@/components/trasy/przegladarka-tras'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { NaglowekSekcji } from '@/components/uklad/naglowek-sekcji'
import { KATEGORIE_APLIKACJI } from '@/lib/dane/kategorie'
import { naListe, pobierzTrasy } from '@/lib/dane/zrodlo'
import { kilometry } from '@/lib/format'
import { PORTAL } from '@/lib/konfiguracja'

export const metadata: Metadata = {
  title: 'Szlaki i trasy w Pieninach',
  description:
    'Wszystkie trasy piesze i rowerowe w Pieninach — z opisem odcinek po odcinku, ' +
    'mapą, profilem wysokości i plikiem GPX. Filtruj po trudności, długości, ' +
    'czasie przejścia i miejscowości startowej.',
  alternates: { canonical: '/szlaki' },
}

/**
 * Strona szlaków.
 *
 * Układ prowadzi od ogółu do szczegółu, bo tak szuka człowiek, który jest tu
 * pierwszy raz: najpierw kategorie z aplikacji, a dopiero pod nimi pełna
 * lista z filtrami i polem szukania.
 *
 * Wcześniej wszystkie 53 trasy leciały jedną listą od razu pod nagłówkiem.
 * Dla kogoś, kto wie, że szuka Sokolicy, to było w porządku; dla reszty —
 * ściana kafelków bez podpowiedzi, od czego zacząć.
 *
 * Nad kategoriami stały jeszcze „Gotowe zestawy tras" — kafelki kolekcji.
 * Zeszły stąd na życzenie właściciela; same kolekcje istnieją dalej pod
 * `/szlaki/kolekcje/<slug>` i zostają w mapie witryny.
 */

export default function StronaSzlakow() {
  const trasy = pobierzTrasy()
  const sumaKm = trasy.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

  const doPrzegladania: TrasaDoPrzegladania[] = trasy.map((trasa) => ({
    ...naListe(trasa),
    punkty: trasa.punkty.map((punkt) => punkt.nazwa),
  }))

  const daneOkruszkow = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
      { '@type': 'ListItem', position: 2, name: 'Szlaki', item: `${PORTAL.adres}/szlaki` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneOkruszkow) }}
      />

      <NaglowekStrony
        okruszki={[{ nazwa: 'Szlaki', adres: '/szlaki' }]}
        tytul="Szlaki i trasy w Pieninach"
        lead={`${trasy.length} tras, razem ${kilometry(sumaKm)}. Każda z opisem odcinek po odcinku, punktami po drodze, czasem przejścia z przewodnika PTTK i plikiem GPX do pobrania.`}
      />

      {/* ── Kategorie z aplikacji ────────────────────────────────────────── */}
      <section className="sekcja bg-kamien-50" aria-labelledby="kategorie">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Jak w aplikacji"
            tytul="Kategorie tras"
            opis="Ten sam podział, który widzisz na ekranie startowym w telefonie."
          />
          <div className="mt-10">
            <KafelkiKategorii
              kategorie={KATEGORIE_APLIKACJI}
              liczba={(kategoria) => trasy.filter(kategoria.pasuje).length}
            />
          </div>
        </div>
      </section>

      {/* ── Pełna lista z filtrami ───────────────────────────────────────── */}
      <section className="sekcja" aria-labelledby="wszystkie">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Wszystkie trasy"
            tytul="Znajdź swoją trasę"
            opis="Zawęź po trudności, długości, czasie albo miejscowości startowej. Filtry działają od razu, bez przeładowania strony."
          />

          <div className="mt-10">
            <PrzegladarkaTras trasy={doPrzegladania} />
          </div>
        </div>
      </section>
    </>
  )
}
