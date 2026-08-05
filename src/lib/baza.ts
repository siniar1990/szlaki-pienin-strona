import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

/**
 * Klient bazy danych.
 *
 * **Dlaczego sterownik Neona, a nie zwykłe połączenie TCP.** Pierwsze
 * wdrożenie zwracało 500 przy każdym zapytaniu, z komunikatem „Can't reach
 * database server". Diagnostyka pokazała, że zmienne są ustawione poprawnie,
 * adres jest właściwy, a ta sama baza odpowiada z komputera w kilkaset
 * milisekund — zawodziło samo połączenie po surowym TCP na porcie 5432
 * z funkcji bezserwerowej. Sterownik Neona rozmawia z bazą po HTTP i po
 * gnieździe sieciowym zamiast po surowym TCP, więc omija ten problem
 * u źródła. Jest to zresztą sposób zalecany przez samego Neona dla środowisk
 * bezserwerowych.
 *
 * **Dlaczego mimo to zostaje pula.** Adres z członem „-pooler" nadal ma sens:
 * każde wywołanie funkcji chce własnego połączenia, a baza przyjmie ich
 * ograniczoną liczbę.
 *
 * **Dlaczego klient siedzi na `globalThis`.** Na środowisku bezserwerowym
 * moduł ładuje się przy każdym zimnym starcie, a w trybie deweloperskim przy
 * każdym przeładowaniu kodu. Nowy klient to nowa pula połączeń — po kilkudziesięciu
 * przeładowaniach baza odmawia przyjęcia kolejnego i praca staje.
 */

/*
  Sterownik Neona potrzebuje gniazda sieciowego. Node 22 ma je wbudowane,
  starsze wersje nie — podstawiamy implementację z biblioteki tylko wtedy,
  gdy globalnej brakuje. Bezwarunkowe podstawienie działałoby też poprawnie,
  ale odbierałoby środowisku szybszą implementację natywną.
*/
if (typeof globalThis.WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

const globalnie = globalThis as unknown as { prisma?: PrismaClient }

function utworzKlienta(): PrismaClient {
  const adres = process.env.DATABASE_URL
  if (!adres) throw new Error('Brak zmiennej DATABASE_URL')

  // Adapter sam zakłada pulę połączeń na podanym adresie — przyjmuje
  // konfigurację, nie gotowy obiekt puli.
  const adapter = new PrismaNeon({ connectionString: adres })

  return new PrismaClient({
    adapter,
    // W czasie pracy nad kodem chcemy widzieć zapytania, na produkcji tylko
    // ostrzeżenia i błędy — logowanie każdego zapytania kosztuje czas funkcji.
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })
}

/**
 * Klient powstaje przy pierwszym użyciu, nie przy imporcie modułu.
 *
 * Ma to konkretny powód: budowanie strony przechodzi po wszystkich trasach,
 * żeby zebrać ich konfigurację, i importuje przy tym ten moduł — a na maszynie
 * budującej adresu bazy zwykle nie ma i nie powinno być. Klient tworzony
 * natychmiast wywracał budowanie komunikatem o brakującej zmiennej, choć
 * żadne zapytanie nie miało się wtedy wykonać.
 *
 * Pośrednik przekazuje wszystko dalej, więc dla kodu korzystającego z `baza`
 * nic się nie zmienia.
 */
export const baza = new Proxy({} as PrismaClient, {
  get(_cel, wlasciwosc) {
    globalnie.prisma ??= utworzKlienta()
    const wartosc = Reflect.get(globalnie.prisma, wlasciwosc)
    // Metody trzeba dowiązać do klienta — bez tego `this` w środku Prismy
    // wskazywałoby na pośrednika i wywołania by się rozsypały.
    return typeof wartosc === 'function' ? wartosc.bind(globalnie.prisma) : wartosc
  },
})
