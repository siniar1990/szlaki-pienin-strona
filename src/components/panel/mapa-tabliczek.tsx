'use client'

import dynamic from 'next/dynamic'

import type { MarkerMapy } from '@/components/mapa/mapa'
import { liczba } from '@/lib/format'
import type { KodNaMapie } from '@/lib/qr/statystyki'

const Mapa = dynamic(() => import('@/components/mapa/mapa').then((m) => m.Mapa), {
  ssr: false,
  loading: () => (
    <div className="grid h-[70vh] place-items-center rounded-2xl bg-kamien-100 text-sm text-kamien-500">
      Wczytywanie mapy…
    </div>
  ),
})

/**
 * Mapa tabliczek w panelu.
 *
 * Korzysta z tego samego komponentu MapLibre, co mapa szlaków na portalu —
 * ten sam podkład, ta sama obsługa znaczników i dymków. Pisanie drugiej mapy
 * tylko dlatego, że stoi w panelu, byłoby utrzymywaniem dwóch rzeczy zamiast
 * jednej.
 *
 * Barwa znacznika niesie informację o ruchu: im ciemniejsza zieleń, tym więcej
 * skanów. Tabliczki bez ani jednego skanu są szare — na mapie od razu widać,
 * które wiszą i milczą, a to najważniejsze pytanie przy przeglądaniu tej strony.
 *
 * Liczba skanów jest wypisana przy każdym punkcie na stałe. Barwa daje wrażenie
 * ogólne — gdzie jest ruch, a gdzie cisza — ale na pytanie „ile dokładnie"
 * odpowiada dopiero liczba, a otwieranie dymka nad każdym punktem po kolei
 * uniemożliwia porównanie ich ze sobą.
 */
export function MapaTabliczek({ kody }: { kody: KodNaMapie[] }) {
  const najwiecej = Math.max(1, ...kody.map((k) => k.liczbaSkanow))

  const markery: MarkerMapy[] = kody
    // Rosnąco po liczbie skanów, bo znaczniki układają się w kolejności dodania.
    // Dzięki temu przy nakładających się tabliczkach na wierzchu zostaje ta
    // z większym ruchem — czyli ta, o którą przy tej mapie chodzi.
    .toSorted((a, b) => a.liczbaSkanow - b.liczbaSkanow)
    .map((kod) => ({
      id: kod.kod,
      nazwa: `${kod.kod} · ${kod.nazwa}`,
      wspolrzedne: [kod.dlugosc, kod.szerokosc],
      typ: kod.kategoria,
      kolor: barwa(kod.liczbaSkanow, najwiecej, kod.status),
      adres: `/panel/kody/${kod.kod}`,
      // Sama liczba, bez słowa „skanów" — przy dwustu tabliczkach każdy zbędny
      // znak to podpis szerszy o połowę i o tyle częściej zachodzący na sąsiedni.
      etykieta: liczba(kod.liczbaSkanow),
      opis: [
        kod.liczbaSkanow > 0 ? `${liczba(kod.liczbaSkanow)} skanów` : 'brak skanów',
        kod.ostatniSkan ? `ostatni ${ileTemu(kod.ostatniSkan)}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }))

  return (
    <div className="h-[70vh] min-h-[30rem] overflow-hidden rounded-2xl border border-kamien-200">
      <Mapa markery={markery} dopasujDoSladow={false} klasa="size-full rounded-none border-0" />
    </div>
  )
}

/**
 * Zieleń tym ciemniejsza, im więcej skanów. Skala pierwiastkowa, nie liniowa —
 * przy jednym punkcie z tysiącem skanów i dwudziestu z kilkunastoma skala
 * liniowa pomalowałaby wszystkie poza jednym na ten sam odcień.
 */
function barwa(skany: number, najwiecej: number, status: string): string {
  if (status !== 'AKTYWNY') return '#94a3b8'
  if (skany === 0) return '#cbd5e1'

  const udzial = Math.sqrt(skany / najwiecej)
  const jasnosc = Math.round(62 - udzial * 34)
  return `hsl(152 45% ${jasnosc}%)`
}

function ileTemu(iso: string): string {
  const sekundy = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sekundy < 60) return 'przed chwilą'
  if (sekundy < 3600) return `${Math.floor(sekundy / 60)} min temu`
  if (sekundy < 86400) return `${Math.floor(sekundy / 3600)} h temu`
  return `${Math.floor(sekundy / 86400)} dni temu`
}
