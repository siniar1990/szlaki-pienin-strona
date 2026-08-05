'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

/**
 * Pobranie wszystkich kodów QR w jednym archiwum.
 *
 * Trzy warianty, bo służą do trzech różnych rzeczy:
 *
 *  - **PNG** — pliki nazwane wprost kodem tabliczki (`P001.png`), gotowe do
 *    wrzucenia do szablonu albo wysłania komuś, kto nie zna się na formatach.
 *  - **SVG** — to samo w krzywych, do druku wielkoformatowego; kod QR
 *    powiększony z PNG rozmywa się i przestaje się skanować.
 *  - **Wszystko** — oba formaty w osobnych katalogach plus zestawienie CSV,
 *    czyli komplet dla drukarni.
 *
 * Zwykłe odnośniki, nie wywołania z JavaScriptu: przeglądarka sama pokaże
 * postęp pobierania i sama zapisze plik, a przy dwustu kodach składanie
 * archiwum trwa i pasek postępu jest jedyną informacją, że coś się dzieje.
 */
export function PobierzKody() {
  const [otwarty, ustawOtwarty] = useState(false)

  if (!otwarty) {
    return (
      <button
        type="button"
        onClick={() => ustawOtwarty(true)}
        className="inline-flex items-center gap-2 rounded-full border border-kamien-300 bg-white px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
      >
        <Download className="size-4" aria-hidden />
        Pobierz kody
      </button>
    )
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-kamien-300 bg-white p-1">
      {(
        [
          ['png', 'PNG'],
          ['svg', 'SVG'],
          ['oba', 'Wszystko'],
        ] as const
      ).map(([format, etykieta]) => (
        <a
          key={format}
          href={`/api/panel/paczka?format=${format}`}
          className="rounded-full px-3.5 py-1.5 text-sm text-kamien-700 transition-colors hover:bg-las-50 hover:text-las-800"
        >
          {etykieta}
        </a>
      ))}
      <button
        type="button"
        onClick={() => ustawOtwarty(false)}
        className="px-2.5 text-sm text-kamien-500 hover:text-kamien-800"
        aria-label="Zamknij wybór formatu"
      >
        ×
      </button>
    </div>
  )
}
