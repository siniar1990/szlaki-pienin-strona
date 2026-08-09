import type { MetadataRoute } from 'next'

import { KATEGORIE_TRAS } from '@/lib/dane/kategorie'
import { ATRAKCJE_TURYSTYCZNE } from '@/lib/tresc/atrakcje-turystyczne'
import { pobierzAtrakcje, pobierzTrasy, pobierzWyzwania } from '@/lib/dane/zrodlo'
import { PORTAL } from '@/lib/konfiguracja'
import { pobierzSlugiWiadomosci } from '@/lib/wiadomosci/zapytania'

/**
 * Mapa witryny.
 *
 * Przy eksporcie statycznym Next zapisuje ją jako `sitemap.xml` w katalogu
 * wynikowym — plik, którego szuka Google. Zawiera wszystko, co ma trafić do
 * indeksu; strona wyszukiwania świadomie jest pominięta, bo sama prosi
 * o nieindeksowanie.
 *
 * `priority` nie jest obietnicą pozycji w wynikach, tylko podpowiedzią, co
 * w obrębie tej witryny jest ważniejsze. Trasy dostają więcej niż kategorie,
 * bo to one niosą treść.
 */
// Tak jak przy robots.txt — deklarujemy, że plik powstaje raz, przy budowaniu.


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teraz = new Date()

  const strony: MetadataRoute.Sitemap = [
    { url: PORTAL.adres, changeFrequency: 'weekly', priority: 1 },
    { url: `${PORTAL.adres}/szlaki`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${PORTAL.adres}/atrakcje`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${PORTAL.adres}/mapa`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${PORTAL.adres}/aktualnosci`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${PORTAL.adres}/aplikacja`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${PORTAL.adres}/wyzwania`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${PORTAL.adres}/wsparcie`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${PORTAL.adres}/kontakt`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${PORTAL.adres}/prywatnosc`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const trasy: MetadataRoute.Sitemap = pobierzTrasy().map((trasa) => ({
    url: `${PORTAL.adres}/szlaki/${trasa.slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  /*
    Strony wyzwań. Tylko dostępne — niedostępne nie mają własnej strony, więc
    wpis w mapie witryny prowadziłby Google w stronę 404.
  */
  const wyzwania: MetadataRoute.Sitemap = pobierzWyzwania()
    .filter((wyzwanie) => wyzwanie.dostepne)
    .map((wyzwanie) => ({
      url: `${PORTAL.adres}/wyzwania/${wyzwanie.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  const kategorie: MetadataRoute.Sitemap = KATEGORIE_TRAS.map((kategoria) => ({
    url: `${PORTAL.adres}/szlaki/kategorie/${kategoria.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  /*
    Atrakcje pochodzą z dwóch źródeł: katalogu redakcyjnego i punktów na trasach
    (szczyty, przełęcze, schroniska). Mapa witryny musi obejmować oba, bo obie
    grupy mają własne strony pod `/atrakcje/…`. Wcześniej były tu tylko te
    z tras i pięćdziesiąt siedem stron katalogu nie trafiało do indeksu.

    Slug jest wspólną przestrzenią nazw, więc odsiewamy powtórzenia — inaczej
    ten sam adres pojawiłby się w mapie dwa razy.
  */
  const adresyAtrakcji = new Set([
    ...ATRAKCJE_TURYSTYCZNE.map((a) => a.slug),
    ...pobierzAtrakcje().map((a) => a.slug),
  ])

  const atrakcje: MetadataRoute.Sitemap = [...adresyAtrakcji].map((slug) => ({
    url: `${PORTAL.adres}/atrakcje/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  /*
    Aktualności mają własną datę zmiany — dla działu informacyjnego to jedyne
    pole w tej mapie, które naprawdę coś znaczy. Reszta dostaje „teraz", bo
    zmienia się razem z wdrożeniem.
  */
  const wiadomosci: MetadataRoute.Sitemap = (await pobierzSlugiWiadomosci()).map((wiadomosc) => ({
    url: `${PORTAL.adres}/aktualnosci/${wiadomosc.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
    lastModified: wiadomosc.opublikowano,
  }))

  return [
    ...[...strony, ...trasy, ...wyzwania, ...kategorie, ...atrakcje].map((wpis) => ({
      ...wpis,
      lastModified: teraz,
    })),
    ...wiadomosci,
  ]
}
