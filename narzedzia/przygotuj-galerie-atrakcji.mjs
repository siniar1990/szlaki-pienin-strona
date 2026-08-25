/**
 * Przygotowuje zdjęcia do galerii atrakcji.
 *
 *     node narzedzia/przygotuj-galerie-atrakcji.mjs <slug> <katalog ze zdjęciami>
 *
 * Zdjęcia lądują w `public/marka/atrakcje/galeria/<slug>/` jako `01.webp`,
 * `02.webp` i tak dalej. Numer w nazwie ustala kolejność w galerii i jest
 * jedynym miejscem, w którym da się ją zmienić — porządek alfabetyczny nazw
 * z aparatu (`IMG_9260`) bywa przypadkowy, a na stronie liczy się, żeby
 * zaczynać od widoku z zewnątrz, po którym poznaje się miejsce.
 *
 * **Dlaczego bez kadrowania.** Zdjęcia z telefonu bywają pionowe i poziome,
 * a galeria pokazuje jedne i drugie w tej samej siatce — kadrowaniem zajmuje
 * się przeglądarka (`object-cover`), więc pełny obrazek zostaje do obejrzenia
 * po kliknięciu. Ścinanie go tutaj zabrałoby to, czego nie da się odzyskać.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

/*
  1600 px na dłuższym boku. Galeria pokazuje zdjęcia w kafelkach szerokich na
  jakieś 400 px, a po kliknięciu otwiera pełny plik — 1600 px wystarcza na
  ekran 2× i nie robi z każdej fotografii megabajta.
*/
const DLUZSZY_BOK = 1600
const JAKOSC = 82

const [slug, zrodlo] = process.argv.slice(2)
if (!slug || !zrodlo) {
  console.error('Użycie: node narzedzia/przygotuj-galerie-atrakcji.mjs <slug> <katalog>')
  process.exit(1)
}

const CEL = path.join(process.cwd(), 'public', 'marka', 'atrakcje', 'galeria', slug)

// Katalog składamy od nowa: inaczej po zmianie liczby zdjęć zostawałyby
// osierocone pliki o wyższych numerach i galeria pokazywałaby stare ujęcia.
if (existsSync(CEL)) rmSync(CEL, { recursive: true })
mkdirSync(CEL, { recursive: true })

const pliki = readdirSync(zrodlo)
  .filter((n) => /\.(jpe?g|png|webp|heic)$/i.test(n))
  .sort()

let numer = 0
for (const plik of pliki) {
  numer += 1
  const nazwa = `${String(numer).padStart(2, '0')}.webp`

  await sharp(path.join(zrodlo, plik))
    // `rotate()` bez argumentu stosuje obrót zapisany w EXIF-ie. Bez tego
    // zdjęcia z telefonu trzymanego pionowo wychodzą położone na boku.
    .rotate()
    .resize(DLUZSZY_BOK, DLUZSZY_BOK, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: JAKOSC })
    .toFile(path.join(CEL, nazwa))

  const kb = Math.round(readFileSync(path.join(CEL, nazwa)).length / 1024)
  console.log(`${nazwa}  ${String(kb).padStart(4)} kB  ←  ${plik}`)
}

console.log(`\nGotowe: ${numer} zdjęć w public/marka/atrakcje/galeria/${slug}/`)
