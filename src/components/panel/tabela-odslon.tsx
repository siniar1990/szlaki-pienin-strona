import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import { liczba } from '@/lib/format'
import type { PozycjaStatystyk } from '@/lib/analityka/statystyki'

/**
 * Ranking odsłon jednej grupy podstron.
 *
 * **Dlaczego pasek, a nie wykres.** Pytanie brzmi „co ludzi interesuje
 * najbardziej", a nie „ile dokładnie". Pasek proporcjonalny do najwyższej
 * wartości odpowiada na to jednym spojrzeniem; wykres słupkowy z osiami
 * zajmowałby pięć razy więcej miejsca i wymagał czytania liczb.
 *
 * **Dlaczego nazwa jest odnośnikiem do strony publicznej.** Bo pierwsze
 * pytanie po zobaczeniu pozycji na liście brzmi „a jak ta strona wygląda".
 */
export function TabelaOdslon({
  tytul,
  opis,
  pozycje,
  adres,
  nazwy,
}: {
  tytul: string
  opis: string
  pozycje: PozycjaStatystyk[]
  /** Przedrostek adresu publicznego, np. `/atrakcje`. */
  adres: string
  /** Ładne nazwy dla kluczy; brak wpisu znaczy „pokaż sam klucz". */
  nazwy?: Map<string, string>
}) {
  const najwyzsza = pozycje[0]?.liczba ?? 0

  return (
    <section className="rounded-2xl border border-kamien-200 bg-white p-6">
      <h2 className="font-heading text-lg font-semibold text-kamien-900">{tytul}</h2>
      <p className="mt-1 text-sm text-kamien-500">{opis}</p>

      {pozycje.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-kamien-300 p-8 text-center text-sm text-kamien-500">
          Jeszcze nikt tu nie zajrzał — albo licznik działa od niedawna.
        </p>
      ) : (
        <ol className="mt-5 space-y-2">
          {pozycje.map((pozycja, numer) => (
            <li key={pozycja.klucz} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-kamien-400">
                {numer + 1}
              </span>

              <div className="min-w-0 flex-1">
                <Link
                  href={`${adres}/${pozycja.klucz}`}
                  target="_blank"
                  className="inline-flex items-baseline gap-1.5 text-sm text-kamien-800 hover:text-las-700"
                >
                  <span className="truncate">{nazwy?.get(pozycja.klucz) ?? pozycja.klucz}</span>
                  <ExternalLink className="size-3 shrink-0 text-kamien-400" aria-hidden />
                </Link>

                {/* Pasek proporcjonalny do najpopularniejszej pozycji. */}
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-kamien-100">
                  <div
                    className="h-full rounded-full bg-las-500"
                    style={{
                      width: `${najwyzsza > 0 ? Math.max(2, (pozycja.liczba / najwyzsza) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-kamien-900">
                {liczba(pozycja.liczba)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
