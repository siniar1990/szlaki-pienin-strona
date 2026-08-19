import { readFileSync } from 'node:fs'
import path from 'node:path'

import type { Trasa } from '@/lib/dane/typy'
import { PORTAL } from '@/lib/konfiguracja'

import { type MapaKarty, odcinkiZDanych, zbudujMape } from './mapa'
import { type ProfilKarty, zbudujProfil } from './profil'
import { type KodQr, kodQr } from './qr'

/**
 * Wszystko, co trafia na kartę do druku — policzone raz, po stronie serwera.
 *
 * Karta powstaje w dwóch miejscach: jako podgląd HTML i jako PDF składany przy
 * budowaniu. Oba biorą ten sam model, więc nie ma jak się rozjechać — a gdyby
 * dane liczył komponent, PDF i podgląd zaczęłyby się różnić przy pierwszej
 * poprawce w jednym z nich.
 *
 * Zero wartości wpisanych z ręki poza numerami ratunkowymi. Znaczniki „start",
 * „meta", „max" i „schron" wyliczamy z danych, a nie z listy w kodzie.
 */

export type PunktKarty = {
  numer: number
  nazwa: string
  wysokoscM: number | null
  czas: string
  znacznik: 'start' | 'meta' | 'max' | 'schron' | null
}

export type OdcinekOpisu = {
  zakres: string
  tytul: string
  minuty: string
  tekst: string
  /** Wskazówka z danych — miejsce, w którym łatwo zgubić ścieżkę. */
  wskazowka: string | null
}

export type DaneKarty = {
  slug: string
  id: string
  nazwa: string
  podtytul: string
  metryki: { etykieta: string; wyrozniona: boolean }[]
  mapa: MapaKarty | null
  profil: ProfilKarty | null
  punkty: PunktKarty[]
  odcinki: OdcinekOpisu[]
  ostrzezenia: string[]
  ciekawostki: { tytul: string; tekst: string }[]
  startMeta: string
  qr: KodQr
  adres: string
  data: string
  sumaPodejscM: number
}

/** Godziny i minuty z minut narastających — `2:55`, jak w mockupie. */
function zegar(minuty: number): string {
  const h = Math.floor(minuty / 60)
  const m = Math.round(minuty % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

/** Czas odcinka słownie — `45 min`, `2 h 10`. */
function trwanie(minuty: number): string {
  if (minuty < 60) return `${Math.round(minuty)} min`
  const h = Math.floor(minuty / 60)
  const m = Math.round(minuty % 60)
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

const TRUDNOSC: Record<string, string> = {
  latwa: 'Łatwa',
  srednia: 'Średnia',
  trudna: 'Trudna',
}

function wczytaj(adresPubliczny: string | null): unknown | null {
  if (!adresPubliczny) return null
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), 'public', adresPubliczny), 'utf8'))
  } catch {
    // Brak pliku nie może wywrócić budowania — karta poradzi sobie bez mapy,
    // a strona trasy i tak zostaje pełnym źródłem.
    return null
  }
}

function sladZPliku(dane: unknown): [number, number, number?][] {
  const cechy = (dane as { features?: unknown })?.features
  if (!Array.isArray(cechy)) return []

  const linia = cechy.find(
    (c) => (c as { geometry?: { type?: string } })?.geometry?.type === 'LineString',
  ) as { geometry?: { coordinates?: unknown } } | undefined

  const wspolrzedne = linia?.geometry?.coordinates
  if (!Array.isArray(wspolrzedne)) return []

  return (wspolrzedne as number[][])
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .map((p) => [p[0], p[1], p[2]] as [number, number, number?])
}

export async function daneKarty(trasa: Trasa, dzis: Date): Promise<DaneKarty> {
  const slad = sladZPliku(wczytaj(trasa.slad))
  const kolory = wczytaj(trasa.kolory)

  const punktyEtapowe = trasa.punkty.map((p) => ({
    nazwa: p.nazwa,
    wspolrzedne: [p.wspolrzedne[0], p.wspolrzedne[1]] as [number, number],
  }))

  const mapa =
    slad.length >= 2
      ? zbudujMape(
          odcinkiZDanych(
            kolory,
            slad.map((p) => [p[0], p[1]] as [number, number]),
          ),
          punktyEtapowe,
        )
      : null

  const profil = slad.length >= 2 ? zbudujProfil(slad, punktyEtapowe) : null

  // Najwyższy punkt etapowy — znacznik „max" należy do niego, a nie do
  // najwyższego miejsca na śladzie, bo tabela mówi o punktach.
  const najwyzszaWysokosc = Math.max(
    ...trasa.punkty.map((p) => p.wysokoscM ?? Number.NEGATIVE_INFINITY),
  )

  const punkty: PunktKarty[] = trasa.punkty.map((punkt, indeks) => ({
    numer: indeks + 1,
    nazwa: punkt.nazwa,
    wysokoscM: punkt.wysokoscM,
    czas: zegar(punkt.czasNarastMin.tam),
    znacznik:
      indeks === 0
        ? 'start'
        : indeks === trasa.punkty.length - 1
          ? 'meta'
          : punkt.typ === 'schronisko'
            ? 'schron'
            : punkt.wysokoscM !== null && punkt.wysokoscM === najwyzszaWysokosc
              ? 'max'
              : null,
  }))

  const czasPunktu = new Map(trasa.punkty.map((p) => [p.nazwa, p.czasNarastMin.tam]))

  const odcinki: OdcinekOpisu[] = trasa.segmenty.map((segment, indeks) => {
    const od = czasPunktu.get(segment.od)
    const doCzasu = czasPunktu.get(segment.do)
    const minuty = od !== undefined && doCzasu !== undefined ? doCzasu - od : null

    return {
      zakres: `${indeks + 1} → ${indeks + 2}`,
      tytul: `${skroc(segment.od)} → ${skroc(segment.do)}`,
      minuty: minuty !== null && minuty > 0 ? trwanie(minuty) : '',
      tekst: segment.tekst,
      wskazowka: segment.wskazowka,
    }
  })

  const metryki = [
    { etykieta: `${trasa.dlugoscKm.toFixed(1).replace('.', ',')} km`, wyrozniona: true },
    { etykieta: trwanie(trasa.czasMin.tam), wyrozniona: true },
    { etykieta: `↑ ${Math.round(trasa.sumaPodejscM.tam)} m`, wyrozniona: false },
    { etykieta: TRUDNOSC[trasa.trudnosc] ?? 'Średnia', wyrozniona: false },
    /*
      Kalorie dla 70 kg — ta sama masa odniesienia, którą podaje strona trasy.
      Wpisanie innej liczby na karcie znaczyłoby, że portal mówi dwie rzeczy.
    */
    { etykieta: `${trasa.kcal['70kg'] ?? 0} kcal`, wyrozniona: false },
    { etykieta: trasa.petla ? 'Pętla' : 'Tam i z powrotem', wyrozniona: false },
  ]

  const adres = `${PORTAL.adres}/szlaki/${trasa.slug}`

  return {
    slug: trasa.slug,
    id: trasa.id,
    nazwa: trasa.nazwa,
    podtytul: podtytul(trasa),
    metryki,
    mapa,
    profil,
    punkty,
    odcinki,
    ostrzezenia: trasa.ostrzezenia,
    ciekawostki: trasa.ciekawostki.map((c) => ({ tytul: c.tytul, tekst: c.tekst })),
    startMeta: startMeta(trasa),
    qr: await kodQr(adres),
    adres: adres.replace(/^https:\/\//, ''),
    data: dzis.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    sumaPodejscM: Math.round(trasa.sumaPodejscM.tam),
  }
}

/** Nazwa punktu bez dopowiedzeń — w nagłówku odcinka liczy się miejsce. */
function skroc(nazwa: string): string {
  return nazwa.split(',')[0].trim()
}

function podtytul(trasa: Trasa): string {
  const czesci: string[] = [
    `${trasa.petla ? 'Pętla' : 'Trasa'} z ${trasa.miejscowoscStartu}`,
  ]

  if (trasa.szlaki.length > 0) {
    const nazwy = trasa.szlaki.map((s) => NAZWY_SZLAKOW[s] ?? s)
    czesci.push(nazwy.length === 1 ? `szlak ${nazwy[0]}` : `szlaki: ${nazwy.join(', ')}`)
  }

  return czesci.join(' · ')
}

const NAZWY_SZLAKOW: Record<string, string> = {
  zolty: 'żółty',
  niebieski: 'niebieski',
  czerwony: 'czerwony',
  zielony: 'zielony',
  czarny: 'czarny',
}

function startMeta(trasa: Trasa): string {
  const start = trasa.punkty[0]?.nazwa ?? trasa.miejscowoscStartu
  const koniec = trasa.punkty[trasa.punkty.length - 1]?.nazwa

  if (trasa.petla) {
    return `Start i meta: ${start}. Trasa jest pętlą — kończysz w miejscu startu, więc możesz zostawić samochód na miejscu.`
  }

  return `Start: ${start}. Meta: ${koniec ?? '—'}. Trasa nie jest pętlą — zaplanuj powrót do punktu startu.`
}
