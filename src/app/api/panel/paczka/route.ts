import JSZip from 'jszip'
import { NextResponse, type NextRequest } from 'next/server'

import { baza } from '@/lib/baza'
import { adresKodu, kodJakoPng, kodJakoSvg } from '@/lib/qr/generuj-kod'

/**
 * Paczka plików do drukarni.
 *
 * Zwraca archiwum ZIP z kodami w SVG i PNG oraz zestawieniem CSV. To CSV jest
 * ważniejsze, niż się wydaje: drukarnia dostaje dwieście plików o nazwach
 * P001…P200 i musi wiedzieć, który z nich trafia na którą tabliczkę. Bez
 * zestawienia ktoś prędzej czy później przyklei kod Sokolicy pod Trzema
 * Koronami — a takiego błędu nie widać aż do pierwszego skanu.
 *
 * `?status=ZAPAS` ogranicza paczkę do kodów jeszcze niezamontowanych, co jest
 * zwykłym przypadkiem: drukujemy to, czego jeszcze nie ma w terenie. Bez tego
 * parametru pakujemy wszystkie tabliczki.
 *
 * `?format=png` albo `?format=svg` daje archiwum, w którym pliki leżą wprost
 * w korzeniu i nazywają się dokładnie kodem tabliczki — `P001.png`. Domyślne
 * `oba` rozdziela je na katalogi `png/` i `svg/`, bo dwóch plików o nazwie
 * `P001` nie da się położyć obok siebie.
 */
export async function GET(zadanie: NextRequest) {
  const status = zadanie.nextUrl.searchParams.get('status')
  const zadanyFormat = zadanie.nextUrl.searchParams.get('format')
  const format = zadanyFormat === 'png' || zadanyFormat === 'svg' ? zadanyFormat : 'oba'

  const kody = await baza.kodQr.findMany({
    where: status === 'ZAPAS' || status === 'AKTYWNY' || status === 'NIEAKTYWNY' ? { status } : {},
    orderBy: { kod: 'asc' },
    select: { kod: true, nazwa: true, nazwaLokalizacji: true, status: true },
  })

  if (kody.length === 0) {
    return NextResponse.json({ blad: 'Brak kodów do spakowania' }, { status: 404 })
  }

  const paczka = new JSZip()

  for (const k of kody) {
    if (format === 'png') {
      paczka.file(`${k.kod}.png`, await kodJakoPng(k.kod))
    } else if (format === 'svg') {
      paczka.file(`${k.kod}.svg`, await kodJakoSvg(k.kod))
    } else {
      paczka.folder('png')!.file(`${k.kod}.png`, await kodJakoPng(k.kod))
      paczka.folder('svg')!.file(`${k.kod}.svg`, await kodJakoSvg(k.kod))
    }
  }

  /*
    Separator średnik, a nie przecinek. Polski Excel otwiera pliki rozdzielone
    przecinkiem jako jedną kolumnę i drukarnia dostaje nieczytelną kolumnę
    tekstu. Znacznik BOM na początku sprawia, że polskie znaki nie zamieniają
    się w krzaczki.
  */
  const naglowek = 'kod;nazwa;lokalizacja;status;adres\n'
  const wiersze = kody
    .map((k) =>
      [
        k.kod,
        wCudzyslowie(k.nazwa),
        wCudzyslowie(k.nazwaLokalizacji ?? ''),
        k.status,
        adresKodu(k.kod),
      ].join(';'),
    )
    .join('\n')

  paczka.file('zestawienie.csv', `﻿${naglowek}${wiersze}\n`)

  const archiwum = await paczka.generateAsync({ type: 'arraybuffer' })
  const data = new Date().toISOString().slice(0, 10)

  return new NextResponse(archiwum, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="tabliczki-${data}.zip"`,
    },
  })
}

/** Pole CSV w cudzysłowie, z podwojeniem cudzysłowów w środku. */
function wCudzyslowie(tekst: string): string {
  return `"${tekst.replace(/"/g, '""')}"`
}
