import { utworzSkrotHasla } from '../src/lib/panel/sesja'

/**
 * Wytwarza skrót hasła do wpisania w zmiennej `HASLO_PANELU`.
 *
 *     npm run haslo -- "moje-nowe-haslo"
 *
 * Samo hasło nie jest nigdzie zapisywane — ani w repozytorium, ani w bazie,
 * ani w zmiennych środowiskowych. Do wdrożenia trafia wyłącznie ten skrót,
 * z którego nie da się odtworzyć hasła.
 */

// Wszystko w funkcji, bo `tsx` kompiluje ten plik do modułu, w którym
// oczekiwanie na najwyższym poziomie nie jest dostępne.
async function main() {
  const haslo = process.argv[2]

  if (!haslo) {
    console.error('Podaj hasło: npm run haslo -- "twoje-haslo"')
    process.exit(1)
  }

  if (haslo.length < 12) {
    // Panel stoi pod publicznym adresem, więc krótkie hasło jest realnym
    // ryzykiem, a nie formalnością. Dwanaście znaków to absolutne minimum.
    console.error('Hasło musi mieć co najmniej 12 znaków.')
    process.exit(1)
  }

  const skrot = await utworzSkrotHasla(haslo)

  console.log('\nWpisz to jako HASLO_PANELU:\n')
  console.log(skrot)
  console.log('\nSamego hasła nigdzie nie zapisuj — zapamiętaj je albo trzymaj w menedżerze haseł.\n')
}

main()
