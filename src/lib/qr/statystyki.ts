import { baza } from '@/lib/baza'

/**
 * Zapytania statystyczne pulpitu.
 *
 * Wszystkie czytają z sum dziennych, nie z surowych zdarzeń — z jednym
 * wyjątkiem, którym są skany dzisiejsze. Agregacja chodzi co pięć minut, więc
 * bieżący dzień bywa nieaktualny o kilka minut; przy kafelku podpisanym „dziś"
 * to widać, dlatego akurat tę liczbę bierzemy wprost ze zdarzeń.
 */

export type PodsumowaniePulpitu = {
  lacznieSkanow: number
  dzisiaj: number
  aktywnychKodow: number
  wszystkichKodow: number
  najpopularniejszy: { kod: string; nazwa: string; liczbaSkanow: number } | null
  udzialPlatform: { ios: number; android: number; desktop: number }
}

export async function pobierzPodsumowanie(): Promise<PodsumowaniePulpitu> {
  const poczatekDnia = new Date()
  poczatekDnia.setHours(0, 0, 0, 0)

  const [sumy, dzisiaj, aktywnych, wszystkich, najpopularniejszy, platformy] = await Promise.all([
    baza.skanDzienny.aggregate({ _sum: { liczba: true } }),
    baza.skanQr.count({ where: { czas: { gte: poczatekDnia } } }),
    baza.kodQr.count({ where: { status: 'AKTYWNY' } }),
    baza.kodQr.count(),
    baza.kodQr.findFirst({
      where: { liczbaSkanow: { gt: 0 } },
      orderBy: { liczbaSkanow: 'desc' },
      select: { kod: true, nazwa: true, liczbaSkanow: true },
    }),
    baza.skanDzienny.aggregate({ _sum: { ios: true, android: true, desktop: true } }),
  ])

  return {
    lacznieSkanow: sumy._sum.liczba ?? 0,
    dzisiaj,
    aktywnychKodow: aktywnych,
    wszystkichKodow: wszystkich,
    najpopularniejszy,
    udzialPlatform: {
      ios: platformy._sum.ios ?? 0,
      android: platformy._sum.android ?? 0,
      desktop: platformy._sum.desktop ?? 0,
    },
  }
}

export type PunktWykresu = { dzien: string; liczba: number }

/**
 * Skany dzień po dniu za ostatnie `ile` dni.
 *
 * Dni bez ani jednego skanu też muszą się pojawić — inaczej wykres skleiłby
 * poniedziałek ze środą i sugerował ciągłość ruchu, której nie było.
 */
export async function pobierzWykresDzienny(ile = 30): Promise<PunktWykresu[]> {
  const od = new Date()
  od.setUTCHours(0, 0, 0, 0)
  od.setUTCDate(od.getUTCDate() - (ile - 1))

  const wiersze = await baza.skanDzienny.groupBy({
    by: ['dzien'],
    where: { dzien: { gte: od } },
    _sum: { liczba: true },
  })

  const wgDnia = new Map(wiersze.map((w) => [w.dzien.toISOString().slice(0, 10), w._sum.liczba ?? 0]))

  return Array.from({ length: ile }, (_, i) => {
    const dzien = new Date(od)
    dzien.setUTCDate(od.getUTCDate() + i)
    const klucz = dzien.toISOString().slice(0, 10)
    return { dzien: klucz, liczba: wgDnia.get(klucz) ?? 0 }
  })
}

export type KodNaMapie = {
  id: string
  kod: string
  nazwa: string
  kategoria: string
  status: string
  szerokosc: number
  dlugosc: number
  liczbaSkanow: number
  ostatniSkan: string | null
}

/** Tabliczki z ustalonym położeniem — tylko one mogą trafić na mapę. */
export async function pobierzKodyNaMape(): Promise<KodNaMapie[]> {
  const kody = await baza.kodQr.findMany({
    where: { szerokosc: { not: null }, dlugosc: { not: null } },
    select: {
      id: true,
      kod: true,
      nazwa: true,
      kategoria: true,
      status: true,
      szerokosc: true,
      dlugosc: true,
      liczbaSkanow: true,
      ostatniSkan: true,
    },
    orderBy: { liczbaSkanow: 'desc' },
  })

  return kody.map((k) => ({
    ...k,
    szerokosc: k.szerokosc!,
    dlugosc: k.dlugosc!,
    ostatniSkan: k.ostatniSkan?.toISOString() ?? null,
  }))
}
