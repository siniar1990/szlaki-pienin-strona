import type { MetadataRoute } from 'next'

import { PORTAL } from '@/lib/konfiguracja'

/**
 * Zasady dla robotów wyszukiwarek.
 *
 * Wpuszczamy wszystkich wszędzie poza trzema miejscami:
 *
 *  - `/szukaj` generuje wyniki dopiero w przeglądarce, więc dla robota jest
 *    pustym formularzem,
 *  - `/panel` jest zamknięty hasłem i nie ma czego pokazywać wyszukiwarce,
 *  - `/qr` to adresy tabliczek. Prowadzą do przekierowania, nie do treści;
 *    zaindeksowane rozmywałyby stronę, do której i tak kierują, a przy okazji
 *    robot szukający nowych adresów podbijałby liczniki skanów zdarzeniami,
 *    za którymi nie stoi żaden turysta.
 *
 * Wskazanie mapy witryny jest tu ważniejsze niż same zakazy: to po niej
 * Google znajduje 130 podstron, do których nie prowadzi żadne menu.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/szukaj', '/panel', '/qr'],
      },
    ],
    sitemap: `${PORTAL.adres}/sitemap.xml`,
    host: PORTAL.adres,
  }
}
