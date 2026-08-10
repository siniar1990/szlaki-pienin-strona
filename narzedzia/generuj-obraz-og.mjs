/**
 * Domyślny obraz Open Graph portalu.
 *
 * Powstaje raz i leży w repozytorium jako `public/marka/og/portal.jpg`.
 * Wskazuje na niego `OBRAZ_PORTALU` i trafia do każdej strony, która nie ma
 * własnego zdjęcia. Skrypt jest tu po to, żeby dało się go odtworzyć po
 * zmianie zdjęcia albo logo, a nie po to, żeby chodził przy każdym budowaniu.
 *
 * **Dlaczego nie plik `src/app/opengraph-image.jpg`**, który Next rozpoznaje
 * po nazwie. Bo tamtej konwencji NIE dziedziczy strona, która podaje własny
 * obiekt `openGraph` — a robi to u nas większość podstron. Kolekcje tras
 * zostały przez to bez obrazu mimo poprawnie wygenerowanego pliku. Jawny
 * adres w jednym miejscu jest przewidywalny: obraz albo jest podany, albo
 * nie ma go nigdzie.
 *
 * Uruchomienie:
 *   node narzedzia/generuj-obraz-og.mjs
 *
 * **Dlaczego JPEG, a nie WebP, w którym leżą oryginały.** Bo to jest obrazek
 * dla cudzych robotów, nie dla przeglądarki. Facebook i WhatsApp radzą sobie
 * dziś z WebP, ale LinkedIn bywa na niego ślepy, a karta bez grafiki kosztuje
 * więcej niż czterdzieści kilobajtów oszczędności.
 *
 * **Dlaczego 1200 × 630.** To proporcja 1,91:1, której oczekują Facebook,
 * LinkedIn i X. Mniejszy obraz bywa pokazywany jako mała miniatura obok
 * tekstu zamiast dużej karty nad nim.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const KORZEN = path.join(import.meta.dirname, '..')
const ZRODLO = path.join(KORZEN, 'public/marka/tlo/pieniny-hero.webp')
const LOGO = path.join(KORZEN, 'public/marka/logo-poziome-biale.svg')
const WYNIK = path.join(KORZEN, 'public/marka/og/portal.jpg')

const SZEROKOSC = 1200
const WYSOKOSC = 630

/*
  Przyciemnienie dołu kadru. Białe logo na jasnym niebie byłoby nieczytelne,
  a przyciemnienie całości zabiłoby zdjęcie — więc cień idzie tylko tam, gdzie
  leży napis, i wychodzi z przezroczystości u góry.
*/
const CIEN = Buffer.from(
  `<svg width="${SZEROKOSC}" height="${WYSOKOSC}">
     <defs>
       <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
         <stop offset="45%" stop-color="#0b1f18" stop-opacity="0"/>
         <stop offset="100%" stop-color="#0b1f18" stop-opacity="0.78"/>
       </linearGradient>
     </defs>
     <rect width="${SZEROKOSC}" height="${WYSOKOSC}" fill="url(#c)"/>
   </svg>`,
)

const logo = await sharp(LOGO, { density: 300 }).resize({ width: 420 }).png().toBuffer()

const obraz = await sharp(ZRODLO)
  // `attention` wybiera kadr wokół najbardziej kontrastowego miejsca zdjęcia,
  // czyli zwykle wokół grani — lepiej niż ślepe cięcie po środku.
  .resize(SZEROKOSC, WYSOKOSC, { fit: 'cover', position: 'attention' })
  .composite([
    { input: CIEN, top: 0, left: 0 },
    { input: logo, left: 64, top: WYSOKOSC - 64 - (await sharp(logo).metadata()).height },
  ])
  .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toBuffer()

await mkdir(path.dirname(WYNIK), { recursive: true })
await writeFile(WYNIK, obraz)

console.log(`Zapisano ${path.relative(KORZEN, WYNIK)} — ${Math.round(obraz.length / 1024)} kB`)
