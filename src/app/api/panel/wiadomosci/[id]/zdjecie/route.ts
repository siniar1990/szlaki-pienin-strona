import { NextResponse } from 'next/server'

import { baza } from '@/lib/baza'

/**
 * Zdjęcie notki dla panelu.
 *
 * **Dlaczego osobna trasa, skoro publiczna już istnieje.** Tamta oddaje
 * wyłącznie notki opublikowane — i słusznie, bo służy wyszukiwarkom
 * i serwisom społecznościowym. Panel pokazuje przede wszystkim szkice,
 * których nikt z zewnątrz widzieć nie powinien. Ta trasa leży pod
 * `/api/panel`, więc osłania ją ta sama warstwa pośrednicząca, co resztę
 * panelu: bez ciasteczka sesji odpowiada kodem 401.
 *
 * **Dlaczego w ogóle.** Lista panelu wybierała zdjęcia razem z wierszami
 * i wstawiała je jako `data:` URL — przy stu notkach ze zdjęciem po megabajcie
 * strona ważyłaby sto megabajtów i nie dałoby się jej otworzyć.
 */
export const dynamic = 'force-dynamic'

export async function GET(_zadanie: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const notka = await baza.wiadomosc.findUnique({ where: { id }, select: { zdjecie: true } })
  if (!notka?.zdjecie) return new NextResponse('Brak zdjęcia', { status: 404 })

  const dopasowanie = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(notka.zdjecie)
  if (!dopasowanie) return new NextResponse('Nieprawidłowy format zdjęcia', { status: 404 })

  const [, typ, zawartosc] = dopasowanie
  const bajty = Buffer.from(zawartosc, 'base64')

  return new NextResponse(new Uint8Array(bajty), {
    headers: {
      'content-type': typ,
      'content-length': String(bajty.length),
      /*
        Krótka pamięć podręczna i wyłącznie prywatna. Zdjęcie szkicu potrafi
        się zmienić w trakcie pracy nad notką, a treść panelu nie ma prawa
        wylądować w pamięci pośredniczącej po drodze.
      */
      'cache-control': 'private, max-age=60',
    },
  })
}
