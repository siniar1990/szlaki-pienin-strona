'use client'

import dynamic from 'next/dynamic'

import type { MarkerMapy } from '@/components/mapa/mapa'
import { liczba } from '@/lib/format'
import type { KodNaMapie } from '@/lib/qr/statystyki'
import { wygladZnacznika } from '@/lib/qr/wyglad-znacznika'

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
 * ten sam podkład, ta sama obsługa znaczników i dymków.
 *
 * Ruch niesie **wielkość kropki**, stan — jej **kształt**. Uzasadnienie obu
 * decyzji stoi przy samej zasadzie, w `lib/qr/wyglad-znacznika.ts`.
 *
 */
export function MapaTabliczek({ kody }: { kody: KodNaMapie[] }) {
  const najwiecej = Math.max(1, ...kody.map((k) => k.liczbaSkanow))

  const markery: MarkerMapy[] = kody
    // Malejąco po liczbie skanów, bo znaczniki układają się w kolejności
    // dodania. Największe kropki lądują więc na spodzie i nie przykrywają
    // mniejszych — przy proporcjonalnych znacznikach odwrotna kolejność
    // potrafi schować cały punkt pod sąsiadem.
    .toSorted((a, b) => b.liczbaSkanow - a.liczbaSkanow)
    .map((kod) => {
      const wyglad = wygladZnacznika(kod.liczbaSkanow, najwiecej, kod.status)

      return {
        id: kod.kod,
        nazwa: `${kod.kod} · ${kod.nazwa}`,
        wspolrzedne: [kod.dlugosc, kod.szerokosc],
        typ: kod.kategoria,
        adres: `/panel/kody/${kod.kod}`,
        ...wyglad,
        // Sama liczba, bez słowa „skanów" — przy dwustu tabliczkach każdy
        // zbędny znak to podpis szerszy o połowę i o tyle częściej zachodzący
        // na sąsiedni.
        etykieta: liczba(kod.liczbaSkanow),
        opis: [
          kod.liczbaSkanow > 0 ? `${liczba(kod.liczbaSkanow)} skanów` : 'brak skanów',
          kod.ostatniSkan ? `ostatni ${ileTemu(kod.ostatniSkan)}` : null,
          kod.status !== 'AKTYWNY' ? kod.status.toLowerCase() : null,
        ]
          .filter(Boolean)
          .join(' · '),
      }
    })

  return (
    <div className="h-[70vh] min-h-[30rem] overflow-hidden rounded-2xl border border-kamien-200">
      <Mapa markery={markery} dopasujDoSladow={false} klasa="size-full rounded-none border-0" />
    </div>
  )
}

function ileTemu(iso: string): string {
  const sekundy = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sekundy < 60) return 'przed chwilą'
  if (sekundy < 3600) return `${Math.floor(sekundy / 60)} min temu`
  if (sekundy < 86400) return `${Math.floor(sekundy / 3600)} h temu`
  return `${Math.floor(sekundy / 86400)} dni temu`
}
