import { NextResponse } from 'next/server'

import { PORTAL } from '@/lib/konfiguracja'
import manifestDat from '@/lib/seo/daty-stron.json'
import type { ManifestDat } from '@/lib/seo/daty'
import { NAGLOWKI_XML } from '@/lib/seo/naglowki'
import { stronyMapy } from '@/lib/seo/strony-mapy'
import { mapaWitryny, type WpisMapy } from '@/lib/seo/xml'

/**
 * Mapa stron przewodnika: trasy, atrakcje, wyzwania, kategorie i strony stałe.
 *
 * Treść pochodzi z plików projektu, więc zmienia się wyłącznie przy wdrożeniu.
 * Dlatego ten plik może powstawać przy budowaniu — nie sięga do bazy i nie ma
 * powodu, żeby był liczony przy każdym żądaniu.
 *
 * **Skąd `lastmod`.** Z `daty-stron.json` — pamięci dat prowadzonej przez
 * `narzedzia/zbuduj-daty-stron.ts`, osobno dla każdego adresu. Kiedyś stała
 * tu data budowania, jedna dla wszystkich: każde wdrożenie ogłaszało 391
 * stron jako „zmienione przed chwilą", a wyszukiwarka szybko uczy się taki
 * `lastmod` ignorować — i traci jedyny sygnał, po którym wybiera, co
 * odwiedzić najpierw. Strona bez wpisu w manifeście (świeżo dodana, zanim
 * workflow zdąży go odświeżyć) idzie bez `lastmod` — brak deklaracji jest
 * lepszy niż zmyślona.
 */
export const dynamic = 'force-static'

export function GET() {
  const daty = (manifestDat as ManifestDat).strony

  const wpisy: WpisMapy[] = stronyMapy().map((strona) => ({
    adres: strona.sciezka === '/' ? PORTAL.adres : `${PORTAL.adres}${strona.sciezka}`,
    czestotliwosc: strona.czestotliwosc,
    waga: strona.waga,
    zmieniono: daty[strona.sciezka]?.zmieniono,
  }))

  return new NextResponse(mapaWitryny(wpisy), { headers: NAGLOWKI_XML })
}
