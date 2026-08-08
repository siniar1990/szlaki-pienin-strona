import { PrismaClient } from '@prisma/client'

/**
 * Dane startowe do testów.
 *
 *     npx prisma db seed
 *
 * Pięć tabliczek w miejscach, które naprawdę istnieją i mają swoje strony
 * w portalu — dzięki temu od razu widać, czy powiązanie działa. Współrzędne
 * są przybliżone i służą wyłącznie do sprawdzenia mapy; przed montażem
 * trzeba je zmierzyć na miejscu.
 */

const baza = new PrismaClient()

const TABLICZKI = [
  {
    kod: 'P001',
    nazwa: 'Sokolica',
    nazwaLokalizacji: 'Szczyt Sokolicy, przy tablicy PPN',
    kategoria: 'PUNKT_WIDOKOWY' as const,
    szerokosc: 49.4218,
    dlugosc: 20.3986,
  },
  {
    kod: 'P002',
    nazwa: 'Trzy Korony',
    nazwaLokalizacji: 'Platforma widokowa na Okrąglicy',
    kategoria: 'PUNKT_WIDOKOWY' as const,
    szerokosc: 49.4189,
    dlugosc: 20.4131,
  },
  {
    kod: 'P003',
    nazwa: 'Wąwóz Homole',
    nazwaLokalizacji: 'Wejście do wąwozu, Jaworki',
    kategoria: 'ATRAKCJA' as const,
    szerokosc: 49.4067,
    dlugosc: 20.5581,
  },
  {
    kod: 'P004',
    nazwa: 'Przystań flisacka',
    nazwaLokalizacji: 'Szczawnica, koniec spływu',
    kategoria: 'MIASTO' as const,
    szerokosc: 49.4232,
    dlugosc: 20.4741,
  },
  {
    kod: 'P005',
    nazwa: 'Dolna stacja kolei na Palenicę',
    nazwaLokalizacji: 'Szczawnica, ul. Główna',
    kategoria: 'SZLAK' as const,
    szerokosc: 49.4267,
    dlugosc: 20.4802,
  },
]

async function main() {
  for (const tabliczka of TABLICZKI) {
    await baza.kodQr.upsert({
      where: { kod: tabliczka.kod },
      // Aktualizujemy tylko opis i położenie — statusu i liczników nie
      // ruszamy, żeby ponowne uruchomienie nie kasowało wyników testów.
      update: {
        nazwa: tabliczka.nazwa,
        nazwaLokalizacji: tabliczka.nazwaLokalizacji,
        szerokosc: tabliczka.szerokosc,
        dlugosc: tabliczka.dlugosc,
      },
      create: { ...tabliczka, status: 'AKTYWNY' },
    })
    console.log(`  ${tabliczka.kod}  ${tabliczka.nazwa}`)
  }
  console.log(`\nGotowe: ${TABLICZKI.length} tabliczek.`)
}

main()
  .catch((blad) => {
    console.error(blad)
    process.exit(1)
  })
  .finally(() => baza.$disconnect())
