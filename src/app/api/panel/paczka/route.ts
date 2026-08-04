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
 * zwykłym przypadkiem: drukujemy to, czego jeszcze nie ma w terenie.
 */
export async function GET(zadanie: NextRequest) {
  const status = zadanie.nextUrl.searchParams.get('status')

  const kody = await baza.kodQr.findMany({
    where: status === 'ZAPAS' || status === 'AKTYWNY' || status === 'NIEAKTYWNY' ? { status } : {},
    orderBy: { kod: 'asc' },
    select: { kod: true, nazwa: true, nazwaLokalizacji: true, kategoria: true, status: true },
  })

  if (kody.length === 0) {
    return NextResponse.json({ blad: 'Brak kodów do spakowania' }, { status: 404 })
  }

  const paczka = new JSZip()
  const svg = paczka.folder('svg')!
  const png = paczka.folder('png')!

  for (const k of kody) {
    svg.file(`${k.kod}.svg`, await kodJakoSvg(k.kod))
    png.file(`${k.kod}.png`, await kodJakoPng(k.kod))
  }

  /*
    Separator średnik, a nie przecinek. Polski Excel otwiera pliki rozdzielone
    przecinkiem jako jedną kolumnę i drukarnia dostaje nieczytelną kolumnę
    tekstu. Znacznik BOM na początku sprawia, że polskie znaki nie zamieniają
    się w krzaczki.
  */
  const naglowek = 'kod;nazwa;lokalizacja;kategoria;status;adres\n'
  const wiersze = kody
    .map((k) =>
      [
        k.kod,
        wCudzyslowie(k.nazwa),
        wCudzyslowie(k.nazwaLokalizacji ?? ''),
        k.kategoria,
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
