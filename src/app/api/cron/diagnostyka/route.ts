import { NextResponse, type NextRequest } from 'next/server'

import { baza } from '@/lib/baza'
import { sprawdzZadanieCykliczne } from '@/lib/panel/zadania'

/**
 * Sprawdzenie połączenia z bazą na wdrożonym środowisku.
 *
 * Trasa pomocnicza, do usunięcia po uruchomieniu systemu. Powstała, bo trasa
 * skanowania zwracała 500, a z zewnątrz nie da się odróżnić braku zmiennej
 * środowiskowej od nieodnalezionego silnika zapytań Prismy — obie kończą się
 * tym samym kodem.
 *
 * Osłonięta tym samym sekretem co zadania cykliczne. **Nie zwraca adresu
 * połączenia ani żadnego jego fragmentu** — wyłącznie informację, czy zmienna
 * istnieje, oraz treść błędu, jeśli zapytanie się nie powiodło. Adres bazy
 * w odpowiedzi HTTP byłby wyciekiem hasła.
 */
export const dynamic = 'force-dynamic'

export async function GET(zadanie: NextRequest) {
  const odmowa = sprawdzZadanieCykliczne(zadanie)
  if (odmowa) return odmowa

  const srodowisko = {
    maDatabaseUrl: Boolean(process.env.DATABASE_URL),
    maDirectUrl: Boolean(process.env.DIRECT_URL),
    maSekretSesji: Boolean(process.env.SEKRET_SESJI),
    maHasloPanelu: Boolean(process.env.HASLO_PANELU),
    // Sam schemat adresu, bez hosta i bez danych logowania — pozwala wykryć
    // wklejenie czegoś, co w ogóle nie jest adresem PostgreSQL.
    schematAdresu: process.env.DATABASE_URL?.split(':')[0] ?? null,
    czyPrzezPule: process.env.DATABASE_URL?.includes('-pooler') ?? null,
  }

  try {
    const start = Date.now()
    const tabliczek = await baza.kodQr.count()
    return NextResponse.json({
      srodowisko,
      baza: { polaczenie: 'ok', tabliczek, czasMs: Date.now() - start },
    })
  } catch (blad) {
    return NextResponse.json(
      {
        srodowisko,
        baza: {
          polaczenie: 'błąd',
          // Pierwsze linie komunikatu Prismy wystarczą do rozpoznania
          // przyczyny i nie zawierają danych logowania.
          komunikat:
            blad instanceof Error ? blad.message.split('\n').slice(0, 6).join(' | ') : String(blad),
          rodzaj: blad instanceof Error ? blad.name : typeof blad,
        },
      },
      { status: 500 },
    )
  }
}
