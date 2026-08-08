import { readdir, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

/**
 * Odznaki wyzwań z przezroczystym tłem.
 *
 * **Po co ten krok.** Odznaki przychodzą z aplikacji w trzech różnych stanach:
 * `diament.png` ma kanał przezroczystości, `rubin.png` jest paletowy, a
 * `szmaragd.png` to zwykły RGB z białym kwadratem wokół okrągłej odznaki. Na
 * kafelku i na jasnym tle ten kwadrat widać jako biały prostokąt pod odznaką.
 *
 * **Dlaczego nie poprawić pliku w aplikacji.** Można i warto, ale to nie
 * wystarczy: `synchronizuj-dane.sh` kopiuje `assets/wyzwania/` jeden do jednego,
 * więc pierwsza osoba, która wrzuci do aplikacji kolejną odznakę bez
 * przezroczystości, wróciłaby do punktu wyjścia. Ten krok czyści każdą odznakę
 * przy każdym budowaniu, więc problem nie może wrócić — a plik w aplikacji
 * zostaje nietknięty.
 *
 * **Jak działa.** Zalewanie od krawędzi: biały piksel przy brzegu i każdy biały
 * z nim połączony stają się przezroczyste. Nie „wszystkie białe piksele", bo
 * wewnątrz odznaki biel też występuje — w logo PTTK i w napisach. Odcięcie po
 * kolorze zjadłoby te miejsca i zrobiło w odznace dziury.
 */

const ZRODLO = path.join(process.cwd(), 'public', 'dane', 'wyzwania')
const CEL = path.join(process.cwd(), 'public', 'marka', 'wyzwania')

/** Ile piksel może odstawać od bieli, żeby nadal uznać go za tło. Odznaki są
 *  zapisane w formacie z kompresją stratną albo przeskalowane, więc „tło" nie
 *  jest idealnie białe — przy progu 255 zostawałaby brudna obwódka. */
const PROG_BIELI = 236

async function wyczysc(plik: string): Promise<{ nazwa: string; zmienione: number }> {
  const { data, info } = await sharp(path.join(ZRODLO, plik))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width: w, height: h, channels: k } = info
  const odwiedzone = new Uint8Array(w * h)
  const kolejka: number[] = []

  const bialy = (i: number) =>
    data[i * k] >= PROG_BIELI && data[i * k + 1] >= PROG_BIELI && data[i * k + 2] >= PROG_BIELI

  // Start z całej ramki obrazu — nie tylko z narożników. Odznaka mogłaby mieć
  // tło rozdzielone na kilka obszarów, np. gdy dotyka krawędzi w dwóch miejscach.
  const dodaj = (i: number) => {
    if (odwiedzone[i] || !bialy(i)) return
    odwiedzone[i] = 1
    kolejka.push(i)
  }
  for (let x = 0; x < w; x++) {
    dodaj(x)
    dodaj((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    dodaj(y * w)
    dodaj(y * w + w - 1)
  }

  let zmienione = 0
  while (kolejka.length > 0) {
    const i = kolejka.pop()!
    data[i * k + 3] = 0
    zmienione++

    const x = i % w
    const y = (i - x) / w
    if (x > 0) dodaj(i - 1)
    if (x < w - 1) dodaj(i + 1)
    if (y > 0) dodaj(i - w)
    if (y < h - 1) dodaj(i + w)
  }

  const nazwa = `${path.basename(plik, path.extname(plik))}-odznaka.png`
  /*
    Zostajemy przy PNG, nie przechodzimy na WebP. Odznaka to grafika z ostrymi
    krawędziami i drobnym tekstem — dokładnie ten materiał, na którym kompresja
    stratna zostawia widoczne artefakty wokół liter. Pliki mają po kilkadziesiąt
    kilobajtów, więc nie ma czego oszczędzać.

    Odznaki powiększamy do 320 px, bo na stronie wyzwania stoją w rozmiarze
    192 px, a na ekranach o podwójnej gęstości potrzebują dwa razy tyle.
  */
  const wyjscie = await sharp(data, { raw: { width: w, height: h, channels: k } })
    .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()

  await writeFile(path.join(CEL, nazwa), wyjscie)
  return { nazwa, zmienione }
}

// Zawinięte w funkcję, bo `tsx` kompiluje ten plik do modułu CommonJS,
// a ten nie obsługuje `await` na najwyższym poziomie.
async function main() {
  await mkdir(CEL, { recursive: true })
  const pliki = (await readdir(ZRODLO)).filter((p) => /\.(png|jpe?g|webp)$/i.test(p))

  for (const plik of pliki) {
    const { nazwa, zmienione } = await wyczysc(plik)
    console.log(
      `  ${nazwa.padEnd(24)} ${zmienione === 0 ? 'tło już było przezroczyste' : `${zmienione} pikseli tła usunięto`}`,
    )
  }
}

main().catch((blad) => {
  console.error(blad)
  process.exit(1)
})
