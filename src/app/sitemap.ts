import type { MetadataRoute } from 'next'

import { KATEGORIE_TRAS } from '@/lib/dane/kategorie'
import { pobierzAtrakcje, pobierzTrasy } from '@/lib/dane/zrodlo'
import { PORTAL } from '@/lib/konfiguracja'

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
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const teraz = new Date()

  const strony: MetadataRoute.Sitemap = [
    { url: PORTAL.adres, changeFrequency: 'weekly', priority: 1 },
    { url: `${PORTAL.adres}/szlaki`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${PORTAL.adres}/atrakcje`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${PORTAL.adres}/mapa`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${PORTAL.adres}/aplikacja`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${PORTAL.adres}/wyzwania`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${PORTAL.adres}/wsparcie`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${PORTAL.adres}/prywatnosc`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const trasy: MetadataRoute.Sitemap = pobierzTrasy().map((trasa) => ({
    url: `${PORTAL.adres}/szlaki/${trasa.slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const kategorie: MetadataRoute.Sitemap = KATEGORIE_TRAS.map((kategoria) => ({
    url: `${PORTAL.adres}/szlaki/kategorie/${kategoria.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const atrakcje: MetadataRoute.Sitemap = pobierzAtrakcje().map((atrakcja) => ({
    url: `${PORTAL.adres}/atrakcje/${atrakcja.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...strony, ...trasy, ...kategorie, ...atrakcje].map((wpis) => ({
    ...wpis,
    lastModified: teraz,
  }))
}
