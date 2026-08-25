import { baza } from '../src/lib/baza'
async function main() {
  const skany = await baza.skanQr.findMany({
    where: { kodQr: { kod: 'P009' }, czas: { gte: new Date(Date.now() - 20 * 60_000) } },
    select: { czas: true, urzadzenie: true, klasyfikacja: true, powodBota: true, liczone: true, userAgent: true },
    orderBy: { czas: 'asc' },
  })
  for (const s of skany) {
    console.log(
      `${s.czas.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw' })} ${s.urzadzenie.padEnd(7)} ` +
        `${String(s.klasyfikacja).padEnd(9)} ${(s.powodBota ?? '—').padEnd(20)} ` +
        `liczone=${s.liczone ? 'TAK' : 'nie'} | ${(s.userAgent ?? '—').slice(0, 28)}`,
    )
  }
  console.log(`\nrazem w oknie: ${skany.length}, liczonych: ${skany.filter((s) => s.liczone).length}`)
}
void main().catch(console.error).finally(() => baza.$disconnect())
