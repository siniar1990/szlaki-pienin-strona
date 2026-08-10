import { NextResponse } from 'next/server'

import { KATEGORIE_TRAS } from '@/lib/dane/kategorie'
import { KOLEKCJE } from '@/lib/dane/kolekcje'
import { pobierzAtrakcje, pobierzTrasy, pobierzWyzwania } from '@/lib/dane/zrodlo'
import { PORTAL } from '@/lib/konfiguracja'
import { NAGLOWKI_XML } from '@/lib/seo/naglowki'
import { mapaWitryny, type WpisMapy } from '@/lib/seo/xml'
import { ATRAKCJE_TURYSTYCZNE } from '@/lib/tresc/atrakcje-turystyczne'
import { MIEJSCOWOSCI } from '@/lib/tresc/miejscowosci'

/**
 * Mapa stron przewodnika: trasy, atrakcje, wyzwania, kategorie i strony stałe.
 *
 * Treść pochodzi z plików projektu, więc zmienia się wyłącznie przy wdrożeniu.
 * Dlatego ten plik może powstawać przy budowaniu — nie sięga do bazy i nie ma
 * powodu, żeby był liczony przy każdym żądaniu.
 *
 * `priority` nie jest obietnicą pozycji w wynikach, tylko podpowiedzią, co
 * w obrębie tej witryny jest ważniejsze. Trasy dostają więcej niż kategorie,
 * bo to one niosą treść.
 */
export const dynamic = 'force-static'

export function GET() {
  const teraz = new Date()

  const strony: WpisMapy[] = [
    { adres: PORTAL.adres, czestotliwosc: 'daily', waga: 1 },
    { adres: `${PORTAL.adres}/szlaki`, czestotliwosc: 'weekly', waga: 0.9 },
    { adres: `${PORTAL.adres}/atrakcje`, czestotliwosc: 'monthly', waga: 0.8 },
    { adres: `${PORTAL.adres}/miejscowosci`, czestotliwosc: 'monthly', waga: 0.8 },
    { adres: `${PORTAL.adres}/mapa`, czestotliwosc: 'monthly', waga: 0.7 },
    { adres: `${PORTAL.adres}/aktualnosci`, czestotliwosc: 'daily', waga: 0.9 },
    // Treść zmienia się kilka razy dziennie — to jedyna strona stała,
    // przy której „daily" jest zaniżeniem, a nie grzecznościową deklaracją.
    { adres: `${PORTAL.adres}/dzis`, czestotliwosc: 'hourly', waga: 0.8 },
    { adres: `${PORTAL.adres}/aplikacja`, czestotliwosc: 'monthly', waga: 0.8 },
    { adres: `${PORTAL.adres}/wyzwania`, czestotliwosc: 'monthly', waga: 0.6 },
    { adres: `${PORTAL.adres}/o-nas`, czestotliwosc: 'yearly', waga: 0.5 },
    { adres: `${PORTAL.adres}/wsparcie`, czestotliwosc: 'yearly', waga: 0.4 },
    { adres: `${PORTAL.adres}/kontakt`, czestotliwosc: 'yearly', waga: 0.5 },
    { adres: `${PORTAL.adres}/prywatnosc`, czestotliwosc: 'yearly', waga: 0.3 },
  ]

  const miejscowosci: WpisMapy[] = MIEJSCOWOSCI.map((miejscowosc) => ({
    adres: `${PORTAL.adres}/miejscowosci/${miejscowosc.slug}`,
    czestotliwosc: 'weekly',
    waga: 0.7,
  }))

  const trasy: WpisMapy[] = pobierzTrasy().map((trasa) => ({
    adres: `${PORTAL.adres}/szlaki/${trasa.slug}`,
    czestotliwosc: 'monthly',
    waga: 0.8,
  }))

  /*
    Tylko wyzwania dostępne. Niedostępne nie mają własnej strony, więc wpis
    w mapie witryny prowadziłby wyszukiwarkę prosto w stronę 404.
  */
  const wyzwania: WpisMapy[] = pobierzWyzwania()
    .filter((wyzwanie) => wyzwanie.dostepne)
    .map((wyzwanie) => ({
      adres: `${PORTAL.adres}/wyzwania/${wyzwanie.slug}`,
      czestotliwosc: 'monthly',
      waga: 0.7,
    }))

  const kategorie: WpisMapy[] = KATEGORIE_TRAS.map((kategoria) => ({
    adres: `${PORTAL.adres}/szlaki/kategorie/${kategoria.slug}`,
    czestotliwosc: 'monthly',
    waga: 0.6,
  }))

  /*
    Kolekcje wypadły z mapy witryny przy przepisywaniu jej na własną trasę —
    dziesięć istniejących stron, o których wyszukiwarka nie miała skąd
    wiedzieć. Są tu z tą samą wagą co kategorie, bo pełnią tę samą rolę:
    prowadzą do tras, same będąc rozdrożem.
  */
  const kolekcje: WpisMapy[] = KOLEKCJE.map((kolekcja) => ({
    adres: `${PORTAL.adres}/szlaki/kolekcje/${kolekcja.slug}`,
    czestotliwosc: 'monthly',
    waga: 0.6,
  }))

  /*
    Atrakcje pochodzą z dwóch źródeł: katalogu redakcyjnego i punktów na
    trasach. Slug jest wspólną przestrzenią nazw, więc odsiewamy powtórzenia —
    inaczej ten sam adres pojawiłby się w mapie dwa razy.
  */
  const adresyAtrakcji = new Set([
    ...ATRAKCJE_TURYSTYCZNE.map((a) => a.slug),
    ...pobierzAtrakcje().map((a) => a.slug),
  ])

  const atrakcje: WpisMapy[] = [...adresyAtrakcji].map((slug) => ({
    adres: `${PORTAL.adres}/atrakcje/${slug}`,
    czestotliwosc: 'monthly',
    waga: 0.6,
  }))

  const xml = mapaWitryny(
    [
      ...strony,
      ...miejscowosci,
      ...trasy,
      ...wyzwania,
      ...kategorie,
      ...kolekcje,
      ...atrakcje,
    ].map((wpis) => ({
      ...wpis,
      zmieniono: teraz,
    })),
  )

  return new NextResponse(xml, { headers: NAGLOWKI_XML })
}
