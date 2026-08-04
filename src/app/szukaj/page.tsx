import type { Metadata } from 'next'

import { Wyszukiwarka, type WpisIndeksu } from '@/components/szukaj/wyszukiwarka'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { KATEGORIE_TRAS } from '@/lib/dane/kategorie'
import { pobierzAtrakcje, pobierzTrasy } from '@/lib/dane/zrodlo'
import { czas, etykietaTypu, kilometry, metry } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Szukaj',
  description: 'Przeszukaj trasy, atrakcje i kategorie w portalu Szlaki Pienin.',
  alternates: { canonical: '/szukaj' },
  // Strona wyszukiwania nie ma własnej treści — w indeksie Google byłaby
  // pustym wynikiem, więc prosimy, by jej nie indeksował. Odnośniki z niej
  // wychodzące mają być nadal odwiedzane, stąd `follow`.
  robots: { index: false, follow: true },
}

export default function StronaSzukania() {
  const indeks: WpisIndeksu[] = [
    ...pobierzTrasy().map((trasa) => ({
      nazwa: trasa.nazwa,
      adres: `/szlaki/${trasa.slug}`,
      rodzaj: 'trasa',
      opis: `${kilometry(trasa.dlugoscKm)} · ${czas(trasa.czasMin.tam)} · ${trasa.punkty
        .map((punkt) => punkt.nazwa)
        .join(', ')}`,
    })),
    ...pobierzAtrakcje().map((atrakcja) => ({
      nazwa: atrakcja.nazwa,
      adres: `/atrakcje/${atrakcja.slug}`,
      rodzaj: 'atrakcja',
      opis: [
        etykietaTypu(atrakcja.typ),
        atrakcja.wysokoscM !== null ? `${metry(atrakcja.wysokoscM)} n.p.m.` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    })),
    ...KATEGORIE_TRAS.map((kategoria) => ({
      nazwa: kategoria.nazwa,
      adres: `/szlaki/kategorie/${kategoria.slug}`,
      rodzaj: 'kategoria',
      opis: kategoria.opis,
    })),
    { nazwa: 'Mapa Pienin', adres: '/mapa', rodzaj: 'strona', opis: 'Interaktywna mapa tras i atrakcji' },
    { nazwa: 'Aplikacja Szlaki Pienin', adres: '/aplikacja', rodzaj: 'strona', opis: 'Mapy offline i nawigacja GPS' },
    { nazwa: 'Pienińskie odznaki', adres: '/wyzwania', rodzaj: 'strona', opis: 'Diament Pienin, Rubin Szczawnicy' },
    { nazwa: 'Wsparcie i kontakt', adres: '/wsparcie', rodzaj: 'strona', opis: 'Pomoc, częste pytania, zgłaszanie błędów' },
  ]

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Szukaj', adres: '/szukaj' }]}
        tytul="Szukaj w portalu"
        lead="Trasy, szczyty, punkty widokowe, schroniska i kategorie — wszystko w jednym polu."
      />

      <div className="obszar py-14 lg:py-20">
        <Wyszukiwarka indeks={indeks} />
      </div>
    </>
  )
}
