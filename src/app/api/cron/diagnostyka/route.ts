import { NextResponse, type NextRequest } from 'next/server'


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
    schematAdresu: process.env.DATABASE_URL?.split(':')[0] ?? null,
    czyPrzezPule: process.env.DATABASE_URL?.includes('-pooler') ?? null,
    // Host, port i parametry — bez nazwy użytkownika i hasła. To one najczęściej
    // kryją literówkę albo doklejony parametr, którego Prisma nie rozumie.
    adresBezDanychLogowania: bezDanychLogowania(process.env.DATABASE_URL),
    adresBezposredniBezDanych: bezDanychLogowania(process.env.DIRECT_URL),
    region: process.env.VERCEL_REGION ?? null,
    // Nazwa użytkownika nie jest tajemnicą, a długość hasła nie pozwala go
    // odtworzyć — obie za to natychmiast pokazują ucięcie albo wklejenie
    // wartości ze spacją czy cudzysłowem.
    daneLogowania: opiszDaneLogowania(process.env.DATABASE_URL),
  }

  const [przezPule, bezposrednio] = await Promise.all([
    sprobuj(process.env.DATABASE_URL),
    // Drugie podejście adresem bezpośrednim. Jeśli zadziała, wina leży po
    // stronie puli; jeśli oba padną — po stronie sieci albo silnika zapytań.
    sprobuj(process.env.DIRECT_URL),
  ])

  const ok = przezPule.polaczenie === 'ok'
  return NextResponse.json({ srodowisko, przezPule, bezposrednio }, { status: ok ? 200 : 500 })
}

/**
 * Opis danych logowania bez ich ujawniania.
 *
 * Zwraca nazwę użytkownika, długość hasła i informację, czy zawiera znaki
 * wymagające zakodowania w adresie. Najczęstsze przyczyny odrzuconego hasła to
 * ucięcie przy wklejaniu, doklejony cudzysłów albo znak w rodzaju `@` czy `#`,
 * który rozbija adres na części — każdą z nich widać po tych trzech liczbach.
 */
function opiszDaneLogowania(adres: string | undefined) {
  if (!adres) return null
  try {
    const u = new URL(adres)
    const haslo = decodeURIComponent(u.password)
    return {
      uzytkownik: u.username || '(brak)',
      dlugoscHasla: haslo.length,
      // Znaki, które w adresie muszą być zakodowane procentowo.
      maZnakiWymagajaceKodowania: /[@#/?:[\]% ]/.test(haslo),
      zaczynaSie: haslo.slice(0, 4),
      konczySie: haslo.slice(-2),
    }
  } catch {
    return { blad: 'adres nie daje się rozłożyć na części' }
  }
}

/** Adres bez `uzytkownik:haslo@` — reszta nie jest tajemnicą. */
function bezDanychLogowania(adres: string | undefined): string | null {
  if (!adres) return null
  try {
    const u = new URL(adres)
    return `${u.protocol}//${u.host}${u.pathname}${u.search}`
  } catch {
    return '(nie da się odczytać jako adres)'
  }
}

async function sprobuj(adres: string | undefined) {
  if (!adres) return { polaczenie: 'brak adresu' }

  const [{ PrismaNeon }, { PrismaClient }] = await Promise.all([
    import('@prisma/adapter-neon'),
    import('@prisma/client'),
  ])
  const klient = new PrismaClient({ adapter: new PrismaNeon({ connectionString: adres }) })
  const start = Date.now()

  try {
    const tabliczek = await klient.kodQr.count()
    return { polaczenie: 'ok', tabliczek, czasMs: Date.now() - start }
  } catch (blad) {
    return {
      polaczenie: 'błąd',
      czasMs: Date.now() - start,
      rodzaj: blad instanceof Error ? blad.name : typeof blad,
      komunikat:
        blad instanceof Error ? blad.message.split('\n').filter(Boolean).slice(0, 5).join(' | ') : String(blad),
    }
  } finally {
    await klient.$disconnect().catch(() => {})
  }
}
