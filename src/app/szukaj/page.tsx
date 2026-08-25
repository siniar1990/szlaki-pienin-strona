import type { Metadata } from 'next'

import { Wyszukiwarka } from '@/components/szukaj/wyszukiwarka'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { zbudujIndeks } from '@/lib/szukaj/indeks'

export const metadata: Metadata = {
  title: 'Szukaj',
  description: 'Przeszukaj trasy, atrakcje i kategorie w portalu Szlaki Pienin.',
  alternates: { canonical: '/szukaj' },
  // Strona wyszukiwania nie ma własnej treści — w indeksie Google byłaby
  // pustym wynikiem, więc prosimy, by jej nie indeksował. Odnośniki z niej
  // wychodzące mają być nadal odwiedzane, stąd `follow`.
  robots: { index: false, follow: true },
}

export default function StronaSzukania() {
  const indeks = zbudujIndeks()

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Szukaj', adres: '/szukaj' }]}
        tytul="Szukaj w portalu"
        lead="Trasy, szczyty, punkty widokowe, schroniska i kategorie — wszystko w jednym polu."
      />

      <div className="obszar py-14 lg:py-20">
        <Wyszukiwarka indeks={indeks} />
      </div>
    </>
  )
}
