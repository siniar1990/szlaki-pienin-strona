import { baza } from '../src/lib/baza'

/**
 * Podgląd zapisanych skanów — narzędzie robocze do przeglądania danych przed
 * przeklasyfikowaniem. Tylko odczyt.
 *
 *     npx tsx --env-file-if-exists=.env narzedzia/podglad-skanow.ts
 */
async function main() {
  const kody = await baza.kodQr.findMany({
    select: { kod: true, nazwa: true, liczbaSkanow: true, ostatniSkan: true },
    orderBy: { liczbaSkanow: 'desc' },
    take: 10,
  })
  console.log('Tabliczki wg licznika:')
  for (const k of kody) {
    console.log(`  ${k.kod.padEnd(6)} ${String(k.liczbaSkanow).padStart(4)}  ${k.nazwa}`)
  }

  const skany = await baza.skanQr.findMany({
    select: { czas: true, urzadzenie: true, przegladarka: true, kraj: true, miasto: true, kodQr: { select: { kod: true } } },
    orderBy: { czas: 'asc' },
  })

  console.log(`\nZdarzenia (${skany.length}), czas miejscowy:`)
  for (const s of skany) {
    const czas = s.czas.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' })
    console.log(
      `  ${czas}  ${s.kodQr.kod.padEnd(6)} ${s.urzadzenie.padEnd(8)} ` +
        `${(s.przegladarka ?? '—').padEnd(16)} ${s.miasto ?? s.kraj ?? '—'}`,
    )
  }
}

void main()
  .catch((blad) => {
    console.error(blad)
    process.exitCode = 1
  })
  .finally(() => baza.$disconnect())
