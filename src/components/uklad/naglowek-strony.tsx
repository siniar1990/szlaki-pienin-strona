import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/**
 * Pasek tytułowy podstron plus okruszki nawigacyjne.
 *
 * Okruszki są tu nie tylko dla wygody — Google pokazuje je w wynikach
 * wyszukiwania zamiast surowego adresu, o ile towarzyszy im opis
 * strukturalny. Ten dokłada `DaneOkruszkow` na stronach, które go używają.
 */
export type Okruszek = { nazwa: string; adres: string }

export function NaglowekStrony({
  okruszki,
  tytul,
  tytulOpis,
  lead,
  dodatek,
}: {
  okruszki: Okruszek[]
  tytul: string
  /** Dopowiedzenie pod tytułem — mniejsze, bez własnego stopnia nagłówka. */
  tytulOpis?: string
  lead?: string
  dodatek?: React.ReactNode
}) {
  return (
    <div className="border-b border-kamien-200 bg-kamien-50">
      <div className="obszar py-12 sm:py-16">
        <nav aria-label="Okruszki" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-kamien-500">
            <li>
              <Link href="/" className="hover:text-las-700">
                Start
              </Link>
            </li>
            {okruszki.map((okruszek, indeks) => {
              const ostatni = indeks === okruszki.length - 1
              return (
                <li key={okruszek.adres} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5 text-kamien-400" aria-hidden />
                  {ostatni ? (
                    // Ostatni okruszek to bieżąca strona — nie robimy z niego
                    // odnośnika prowadzącego w to samo miejsce.
                    <span aria-current="page" className="text-kamien-700">
                      {okruszek.nazwa}
                    </span>
                  ) : (
                    <Link href={okruszek.adres} className="hover:text-las-700">
                      {okruszek.nazwa}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

        <h1 className="max-w-[22ch] text-tytul font-semibold text-kamien-900">{tytul}</h1>
        {tytulOpis && (
          <p className="mt-3 max-w-[46ch] font-heading text-xl text-kamien-700">{tytulOpis}</p>
        )}
        {lead && <p className="mt-5 max-w-[62ch] text-prowadzacy text-kamien-600">{lead}</p>}
        {dodatek && <div className="mt-8">{dodatek}</div>}
      </div>
    </div>
  )
}
