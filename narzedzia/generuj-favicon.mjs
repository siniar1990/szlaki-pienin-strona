/**
 * Ikona portalu w karcie przeglądarki.
 *
 * **Po co skrypt do jednego pliku.** Bo `.ico` to kontener na kilka rozmiarów
 * naraz i nie da się go zrobić „zapisz jako". Format jest wymagany: to jego
 * pyta przeglądarka, gdy sięga po `/favicon.ico` bez czytania HTML-a — robią
 * tak czytniki RSS, podglądy w komunikatorach i część wyszukiwarek.
 *
 * Uruchomienie:
 *   node narzedzia/generuj-favicon.mjs
 *
 * **Dlaczego cztery rozmiary.** 16 px to karta przeglądarki i pasek zakładek,
 * 32 px — ta sama karta na ekranie o podwójnej gęstości, 48 px skrót na
 * pulpicie Windows, 256 px podgląd w menedżerze plików. Przeglądarka bierze
 * ten, który jej pasuje; brak małego oznacza, że sama zmniejszy duży i znak
 * rozmyje się dokładnie tam, gdzie widać go najczęściej.
 *
 * **Dlaczego plik ląduje w `src/app/`, a nie w `public/`.** Next.js traktuje
 * `app/favicon.ico` jako konwencję i wypisuje go w HTML-u PRZED ikonami
 * z `metadata.icons` — z pierwszeństwem, którego nie da się przestawić.
 * Dopóki leżała tam domyślna ikona Next.js, portal pokazywał w karcie czarny
 * trójkąt mimo poprawnie zadeklarowanego znaku „SP".
 */

import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const KORZEN = path.join(import.meta.dirname, '..')
const ZRODLO = path.join(KORZEN, 'public/marka/favicon-512.png')
const WYNIK = path.join(KORZEN, 'src/app/favicon.ico')

const ROZMIARY = [16, 32, 48, 256]

/**
 * Do tego rozmiaru włącznie kadrujemy znak ciaśniej.
 *
 * Źródło ma spory margines wokół znaku — dobry w ikonie aplikacji na ekranie
 * telefonu, marnotrawny przy szesnastu pikselach w karcie przeglądarki, gdzie
 * każdy piksel idzie na czytelność liter. Przycięcie marginesu daje literom
 * o dwa piksele więcej, a to jest różnica między „SP" a szarą plamką.
 *
 * Falka Dunajca zostaje także tutaj: przy kwadratowym kadrze nie da się
 * jednocześnie zmieścić szerokich liter i uciąć falki, która leży tuż pod
 * nimi. Przy szesnastu pikselach schodzi do jednej niebieskiej kreski i tyle
 * — nie przeszkadza literom, a znak zostaje znakiem marki, nie samym skrótem.
 */
const CIASNY_KADR_DO = 16

/**
 * Ciaśniejszy kadr znaku w źródłowym obrazie 512 × 512.
 *
 * Wartości zmierzone na pliku, nie wzięte z projektu — logo bywa
 * przerysowywane, a wtedy lepiej, żeby dało się je sprawdzić ponownie niż
 * odtwarzać z pamięci. Litery zajmują w źródle prostokąt x 65–446, y 149–351;
 * kadr jest kwadratem wyśrodkowanym na nich, z marginesem trzydziestu pięciu
 * pikseli. Litery wypełniają dzięki temu 84 procent kadru zamiast 74 i przy
 * szesnastu pikselach zostaje z nich o dwa piksele więcej.
 *
 * Tło pochodzi z oryginału, więc gradient wygląda tak samo jak w większych
 * rozmiarach — kadrujemy, a nie rysujemy od nowa.
 */
const KADR_ZNAKU = { lewy: 30, gorny: 24, bok: 451 }

/**
 * Składa plik ICO z gotowych obrazów PNG.
 *
 * Format jest prosty: sześciobajtowa główka, po niej katalog z pozycją każdego
 * obrazu, na końcu same obrazy. Nowoczesne przeglądarki czytają wewnątrz ICO
 * skompresowany PNG, więc nie musimy zapisywać nieskompresowanej mapy bitowej.
 */
function zlozIco(obrazy) {
  const glowka = Buffer.alloc(6)
  glowka.writeUInt16LE(0, 0) // zarezerwowane
  glowka.writeUInt16LE(1, 2) // typ: ikona
  glowka.writeUInt16LE(obrazy.length, 4)

  const katalog = Buffer.alloc(16 * obrazy.length)
  let pozycja = glowka.length + katalog.length

  obrazy.forEach(({ rozmiar, dane }, indeks) => {
    const wpis = indeks * 16
    // 256 zapisuje się jako zero — bajt nie pomieści większej liczby.
    katalog.writeUInt8(rozmiar >= 256 ? 0 : rozmiar, wpis)
    katalog.writeUInt8(rozmiar >= 256 ? 0 : rozmiar, wpis + 1)
    katalog.writeUInt8(0, wpis + 2) // paleta: pełny kolor
    katalog.writeUInt8(0, wpis + 3) // zarezerwowane
    katalog.writeUInt16LE(1, wpis + 4) // płaszczyzny
    katalog.writeUInt16LE(32, wpis + 6) // bitów na piksel
    katalog.writeUInt32LE(dane.length, wpis + 8)
    katalog.writeUInt32LE(pozycja, wpis + 12)
    pozycja += dane.length
  })

  return Buffer.concat([glowka, katalog, ...obrazy.map((o) => o.dane)])
}

const obrazy = await Promise.all(
  ROZMIARY.map(async (rozmiar) => ({
    rozmiar,
    /*
      `kernel: 'lanczos3'` przy zmniejszaniu do 16 px — domyślne uśrednianie
      rozmywa poprzeczkę litery „P" tak, że znak przestaje być czytelny.
    */
    dane: await (rozmiar <= CIASNY_KADR_DO
      ? sharp(ZRODLO).extract({
          left: KADR_ZNAKU.lewy,
          top: KADR_ZNAKU.gorny,
          width: KADR_ZNAKU.bok,
          height: KADR_ZNAKU.bok,
        })
      : sharp(ZRODLO)
    )
      .resize(rozmiar, rozmiar, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  })),
)

const ico = zlozIco(obrazy)
await writeFile(WYNIK, ico)

console.log(
  `Zapisano ${path.relative(KORZEN, WYNIK)} — ${ROZMIARY.join(', ')} px, ${Math.round(ico.length / 1024)} kB`,
)
