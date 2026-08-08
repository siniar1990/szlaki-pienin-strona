import { baza } from '@/lib/baza'
import { poczatekZakresu, type Zakres } from '@/lib/qr/zakres'

/**
 * Zapytania statystyczne panelu.
 *
 * Wszystkie czytają z sum dziennych, nie z surowych zdarzeń — z jednym
 * wyjątkiem, którym są skany dzisiejsze. Zdarzenia czyścimy po 90 dniach, więc
 * gdyby zakres „rok" sięgał do nich, pokazywałby kwartał i twierdził, że to
 * rok. Sumy dzienne trzymamy bezterminowo i to one są tu źródłem prawdy.
 *
 * Kafelek „dzisiaj" jest wyjątkiem świadomym: ma być bieżący co do minuty,
 * a suma dzienna bieżącego dnia bywa o kilka minut do tyłu.
 */

/**
 * Suma skanów na tabliczkę w zadanym zakresie.
 *
 * Zwraca `null` dla zakresu „od początku" — wtedy sięgamy po gotowy licznik
 * w wierszu tabliczki zamiast sumować całą historię przy każdym wejściu.
 */
async function sumyWZakresie(zakres: Zakres): Promise<Map<string, number> | null> {
  if (zakres.dni === null) return null

  const wiersze = await baza.skanDzienny.groupBy({
    by: ['kodQrId'],
    where: { dzien: { gte: poczatekZakresu(zakres.dni) } },
    _sum: { liczba: true },
  })

  return new Map(wiersze.map((w) => [w.kodQrId, w._sum.liczba ?? 0]))
}

export type PodsumowaniePulpitu = {
  lacznieSkanow: number
  dzisiaj: number
  aktywnychKodow: number
  wszystkichKodow: number
  najpopularniejszy: { kod: string; nazwa: string; liczbaSkanow: number } | null
  udzialPlatform: { ios: number; android: number; desktop: number }
}

export async function pobierzPodsumowanie(zakres: Zakres): Promise<PodsumowaniePulpitu> {
  const poczatekDnia = new Date()
  poczatekDnia.setHours(0, 0, 0, 0)

  const odDnia = zakres.dni === null ? {} : { dzien: { gte: poczatekZakresu(zakres.dni) } }

  const [sumy, dzisiaj, aktywnych, wszystkich, wZakresie] = await Promise.all([
    baza.skanDzienny.aggregate({
      where: odDnia,
      _sum: { liczba: true, ios: true, android: true, desktop: true },
    }),
    baza.skanQr.count({ where: { czas: { gte: poczatekDnia } } }),
    baza.kodQr.count({ where: { status: 'AKTYWNY' } }),
    baza.kodQr.count(),
    sumyWZakresie(zakres),
  ])

  return {
    lacznieSkanow: sumy._sum.liczba ?? 0,
    dzisiaj,
    aktywnychKodow: aktywnych,
    wszystkichKodow: wszystkich,
    najpopularniejszy: await najpopularniejszaTabliczka(wZakresie),
    udzialPlatform: {
      ios: sumy._sum.ios ?? 0,
      android: sumy._sum.android ?? 0,
      desktop: sumy._sum.desktop ?? 0,
    },
  }
}

/**
 * Tabliczka z największym ruchem w zakresie.
 *
 * Przy „od początku" wystarczy licznik w wierszu i jedno zapytanie. Przy
 * węższym zakresie trzeba najpierw znaleźć zwycięzcę w sumach dziennych,
 * a dopiero potem sięgnąć po jego nazwę — inaczej pulpit pokazywałby
 * bezwzględnego lidera także wtedy, gdy w wybranym tygodniu w ogóle milczał.
 */
async function najpopularniejszaTabliczka(sumy: Map<string, number> | null) {
  if (sumy === null) {
    return baza.kodQr.findFirst({
      where: { liczbaSkanow: { gt: 0 } },
      orderBy: { liczbaSkanow: 'desc' },
      select: { kod: true, nazwa: true, liczbaSkanow: true },
    })
  }

  let najlepszyId: string | null = null
  let najlepszaLiczba = 0
  for (const [id, ile] of sumy) {
    if (ile > najlepszaLiczba) {
      najlepszaLiczba = ile
      najlepszyId = id
    }
  }
  if (!najlepszyId) return null

  const kod = await baza.kodQr.findUnique({
    where: { id: najlepszyId },
    select: { kod: true, nazwa: true },
  })

  return kod ? { ...kod, liczbaSkanow: najlepszaLiczba } : null
}

export type PunktWykresu = { dzien: string; liczba: number }

/** Najdłuższy wykres, jaki ma sens narysować. Powyżej roku słupki schodzą
 *  poniżej piksela i wykres przestaje cokolwiek pokazywać. */
const NAJWIECEJ_SLUPKOW = 365

/**
 * Skany dzień po dniu w zadanym zakresie.
 *
 * Dni bez ani jednego skanu też muszą się pojawić — inaczej wykres skleiłby
 * poniedziałek ze środą i sugerował ciągłość ruchu, której nie było.
 *
 * Przy zakresie „od początku" rysujemy od pierwszego dnia z danymi. Gdyby
 * historia przekroczyła rok, wykres i tak obejmuje ostatni rok: wcześniejsze
 * dni nie zmieściłyby się w słupku szerokości piksela, a liczba łączna stoi
 * i tak w kafelku wyżej.
 */
export async function pobierzWykresDzienny(zakres: Zakres): Promise<PunktWykresu[]> {
  let ile = zakres.dni ?? NAJWIECEJ_SLUPKOW

  if (zakres.dni === null) {
    const pierwszy = await baza.skanDzienny.aggregate({ _min: { dzien: true } })
    if (!pierwszy._min.dzien) return []

    const dni = Math.floor((Date.now() - pierwszy._min.dzien.getTime()) / 86_400_000) + 1
    ile = Math.min(Math.max(dni, 1), NAJWIECEJ_SLUPKOW)
  }

  const od = poczatekZakresu(ile)

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
  status: string
  szerokosc: number
  dlugosc: number
  liczbaSkanow: number
  ostatniSkan: string | null
}

/** Tabliczki z ustalonym położeniem — tylko one mogą trafić na mapę. */
export async function pobierzKodyNaMape(zakres: Zakres): Promise<KodNaMapie[]> {
  const [kody, sumy] = await Promise.all([
    baza.kodQr.findMany({
      where: { szerokosc: { not: null }, dlugosc: { not: null } },
      select: {
        id: true,
        kod: true,
        nazwa: true,
        status: true,
        szerokosc: true,
        dlugosc: true,
        liczbaSkanow: true,
        ostatniSkan: true,
      },
    }),
    sumyWZakresie(zakres),
  ])

  return kody
    .map((k) => ({
      ...k,
      szerokosc: k.szerokosc!,
      dlugosc: k.dlugosc!,
      liczbaSkanow: sumy === null ? k.liczbaSkanow : (sumy.get(k.id) ?? 0),
      // Data ostatniego skanu zostaje bezwzględna. „Ostatni skan: 3 dni temu"
      // przycięte do wybranego zakresu znaczyłoby „ostatni skan w tym zakresie",
      // czyli coś innego niż to, o co pyta się patrząc na tabliczkę.
      ostatniSkan: k.ostatniSkan?.toISOString() ?? null,
    }))
    .sort((a, b) => b.liczbaSkanow - a.liczbaSkanow)
}

export type KodNaLiscie = {
  kod: string
  nazwa: string
  status: string
  nazwaLokalizacji: string | null
  liczbaSkanow: number
  ostatniSkan: Date | null
}

/** Wszystkie tabliczki, z liczbą skanów przyciętą do zakresu. */
export async function pobierzKodyNaListe(zakres: Zakres): Promise<KodNaLiscie[]> {
  const [kody, sumy] = await Promise.all([
    baza.kodQr.findMany({
      select: {
        id: true,
        kod: true,
        nazwa: true,
        status: true,
        nazwaLokalizacji: true,
        liczbaSkanow: true,
        ostatniSkan: true,
      },
    }),
    sumyWZakresie(zakres),
  ])

  return kody
    .map(({ id, ...k }) => ({
      ...k,
      liczbaSkanow: sumy === null ? k.liczbaSkanow : (sumy.get(id) ?? 0),
    }))
    .sort((a, b) => b.liczbaSkanow - a.liczbaSkanow || a.kod.localeCompare(b.kod))
}
