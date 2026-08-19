/**
 * Przygotowuje zdjęcia główne tras do `public/marka/trasy/`.
 *
 *     node narzedzia/przygotuj-zdjecia-tras.mjs "~/Downloads/Trasy zdjecia"
 *
 * **Dlaczego osobny katalog, a nie podmiana w `public/dane/ilustracje/`.**
 * Tamten katalog przynosi `synchronizuj-dane.sh` przez `rsync --delete`
 * z repozytorium aplikacji — wrzucone tam zdjęcie zniknęłoby przy pierwszej
 * synchronizacji i nikt by nie wiedział dlaczego. `marka/` jest nasza i nikt
 * jej nie kasuje; działa tak samo jak zdjęcia kategorii i atrakcji.
 *
 * **Dlaczego skrypt, a nie ręczna konwersja.** Zdjęcia z aparatu ważą po
 * kilkanaście megabajtów. Bez wspólnej obróbki jedno trafiłoby na stronę
 * w 6000 px, a drugie w 800 — i strona ważyłaby dwieście megabajtów przy
 * dwudziestu czterech trasach. Tu każde wychodzi tak samo.
 *
 * **Skąd wiadomo, do której trasy należy plik.** Z nazwy: albo zaczyna się od
 * identyfikatora trasy („4b co tam u bacow"), albo cała nazwa jest nazwą trasy
 * („Nie mam roweru"). Porównanie idzie po tekście bez znaków diakrytycznych
 * i wielkości liter, bo nazwy plików przychodzą z telefonu, gdzie ogonków
 * zwykle nie ma. Czego skrypt nie rozpozna, o tym mówi — zamiast po cichu
 * pominąć.
 */

import { existsSync, readdirSync, readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

/*
  Proporcja 16:10 i 1600 px szerokości — to samo, czego wymagają kafelki
  kategorii. Kafelek trasy przycina obrazek do 16:10 (`aspect-[16/10]`),
  a malowane ilustracje z aplikacji mają 420 × 260, czyli praktycznie to samo.
  Gdyby zdjęcia miały własne proporcje, lista tras skakałaby wysokością kart
  w zależności od tego, która trasa ma już zdjęcie, a która jeszcze rysunek.
*/
const SZEROKOSC = 1600
const WYSOKOSC = 1000
const JAKOSC = 82

const ZRODLO = process.argv[2]
if (!ZRODLO) {
  console.error('Podaj katalog ze zdjęciami: node narzedzia/przygotuj-zdjecia-tras.mjs <katalog>')
  process.exit(1)
}

const CEL = path.join(process.cwd(), 'public', 'marka', 'trasy')
mkdirSync(CEL, { recursive: true })

/** Tekst do porównywania: bez ogonków, bez wielkości liter, bez interpunkcji. */
function uprosc(tekst) {
  return tekst
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/gi, 'l')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const indeks = JSON.parse(
  readFileSync(path.join(process.cwd(), 'public', 'dane', 'trasy', 'index.json'), 'utf8'),
)
const poId = new Map(indeks.trasy.map((t) => [t.id.toLowerCase(), t.id]))
const poNazwie = new Map(indeks.trasy.map((t) => [uprosc(t.nazwa), t.id]))

/** Identyfikator trasy dla nazwy pliku albo null, gdy nie da się dopasować. */
function trasaDlaPliku(nazwaPliku) {
  const bezRozszerzenia = path.basename(nazwaPliku, path.extname(nazwaPliku))
  const czlony = uprosc(bezRozszerzenia).split(' ')

  const zPrefiksu = poId.get(czlony[0])
  if (zPrefiksu) return zPrefiksu

  return poNazwie.get(uprosc(bezRozszerzenia)) ?? null
}

const pliki = readdirSync(ZRODLO)
  .filter((n) => /\.(jpe?g|png|webp|heic)$/i.test(n))
  .sort()

const nierozpoznane = []
let zrobione = 0

for (const plik of pliki) {
  const id = trasaDlaPliku(plik)
  if (!id) {
    nierozpoznane.push(plik)
    continue
  }

  const wyjscie = path.join(CEL, `${id}.webp`)
  /*
    Kadrowanie `attention`: zdjęcia są poziome, ale w różnych proporcjach —
    od 16:9 po 4:3 — więc przycinamy tylko po wysokości. Sharp wybiera wtedy
    pas o największej zawartości zamiast ciąć na ślepo po środku, co przy
    kadrach z dużym niebem u góry ratuje szczyt przed obcięciem.
  */
  await sharp(path.join(ZRODLO, plik))
    .rotate()
    .resize(SZEROKOSC, WYSOKOSC, { fit: 'cover', position: 'attention' })
    .webp({ quality: JAKOSC })
    .toFile(wyjscie)

  const kb = Math.round(readFileSync(wyjscie).length / 1024)
  console.log(`${id.padEnd(8)} ${String(kb).padStart(4)} kB  ←  ${plik}`)
  zrobione += 1
}

console.log(`\nGotowe: ${zrobione} zdjęć w public/marka/trasy/`)

if (nierozpoznane.length > 0) {
  console.log('\nNie wiem, do której trasy należą:')
  for (const plik of nierozpoznane) console.log(`  ${plik}`)
  console.log('Zmień nazwę pliku na identyfikator trasy (np. „4B.jpeg") albo na jej pełną nazwę.')
}

/* Trasy, które nadal pokazują malowany rysunek — żeby było wiadomo, ile zostało. */
const bezZdjecia = indeks.trasy.filter((t) => !existsSync(path.join(CEL, `${t.id}.webp`)))
console.log(`\nBez zdjęcia (zostaje ilustracja z aplikacji): ${bezZdjecia.length}`)
console.log(bezZdjecia.map((t) => t.id).join(', '))
