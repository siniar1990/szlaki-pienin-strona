import { przeliczJesliTrzeba } from '../src/lib/qr/agregacja'
import { pobierzPodsumowanie, pobierzRuchOdsiany } from '../src/lib/qr/statystyki'
import { odczytajZakres } from '../src/lib/qr/zakres'
import { baza } from '../src/lib/baza'

async function main() {
  const zakres = odczytajZakres(undefined)
  console.log('zakres:', zakres.opis)

  const przeliczono = await przeliczJesliTrzeba()
  console.log('przeliczono przy wejściu:', przeliczono)

  const [podsumowanie, odsiane] = await Promise.all([
    pobierzPodsumowanie(zakres),
    pobierzRuchOdsiany(zakres),
  ])

  console.log('\nPULPIT')
  console.log('  Skany (ludzie):', podsumowanie.lacznieSkanow)
  console.log('  Dzisiaj:', podsumowanie.dzisiaj)
  console.log('  Najpopularniejsza:', podsumowanie.najpopularniejszy?.nazwa, podsumowanie.najpopularniejszy?.liczbaSkanow)
  console.log('  Platformy:', podsumowanie.udzialPlatform)

  console.log('\nODSIANE')
  console.log('  ludzie:', odsiane.ludzie, '| boty:', odsiane.boty, '| niepewne:', odsiane.niepewne)
  for (const p of odsiane.powody) console.log(`   ${p.powod.padEnd(22)} ${p.liczba}`)
}
void main().catch((b) => { console.error('BŁĄD:', b); process.exitCode = 1 }).finally(() => baza.$disconnect())
