import type { Metadata } from 'next'
import Link from 'next/link'
import { Bot, Eye, PenLine, Plus } from 'lucide-react'

import { odslonyPozycji } from '@/lib/analityka/statystyki'
import { baza } from '@/lib/baza'
import { ETYKIETY_STANU, ileTemu } from '@/lib/wiadomosci/etykiety'
import { liczba, odmien } from '@/lib/format'

import { utworzWlasnaNotke } from './dzialania'

export const metadata: Metadata = {
  title: 'Aktualności',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Lista notek w panelu.
 *
 * **Dlaczego szkice na górze, niezależnie od dat.** To jest lista rzeczy do
 * zrobienia, a nie archiwum. Administrator wchodzi tu, żeby zobaczyć, co
 * czeka na decyzję — opublikowane notki są tylko po to, żeby dało się do nich
 * wrócić i poprawić literówkę.
 */
export default async function StronaAktualnosciPanelu() {
  const notki = await baza.wiadomosc.findMany({
    orderBy: [{ stan: 'asc' }, { utworzono: 'desc' }],
    take: 100,
    select: {
      id: true,
      tytul: true,
      lid: true,
      stan: true,
      odRedakcjiMaszynowej: true,
      zrodloNazwa: true,
      slug: true,
      utworzono: true,
      opublikowano: true,
    },
  })

  /*
    Odsłony dobierane jednym zapytaniem dla całej listy, a nie po jednym na
    notkę. Przy pięćdziesięciu wpisach różnica to pięćdziesiąt zapytań kontra
    jedno — a strona i tak nie jest buforowana.
  */
  const odslony = await odslonyPozycji(
    'AKTUALNOSC',
    notki.filter((notka) => notka.stan === 'OPUBLIKOWANA').map((notka) => notka.slug),
  )

  /*
    Sama obecność zdjęcia, nie jego zawartość. Wybieranie kolumny `zdjecie`
    razem z wierszami ciągnęło z bazy megabajty na miniaturki — przy stu
    notkach ze zdjęciem po megabajcie strona nie dałaby się otworzyć.
  */
  const zeZdjeciem = new Set(
    (
      await baza.wiadomosc.findMany({
        where: { zdjecie: { not: null } },
        select: { id: true },
      })
    ).map((wiersz) => wiersz.id),
  )

  const szkice = notki.filter((notka) => notka.stan === 'SZKIC')

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">
          Aktualności
          <span className="ml-3 text-base font-normal text-kamien-500">{notki.length}</span>
        </h1>

        <form action={utworzWlasnaNotke}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
          >
            <Plus className="size-4" aria-hidden />
            Napisz własną
          </button>
        </form>
      </div>

      {szkice.length > 0 && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {szkice.length} {odmien(szkice.length, ['szkic czeka', 'szkice czekają', 'szkiców czeka'])}{' '}
          na decyzję. Nic nie trafia na portal bez zatwierdzenia.
        </p>
      )}

      {notki.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-kamien-300 p-12 text-center">
          <p className="text-kamien-500">
            Nie ma jeszcze żadnej wiadomości. Dodaj{' '}
            <Link href="/panel/aktualnosci/zrodla" className="font-medium text-las-700 hover:underline">
              źródła
            </Link>
            , poczekaj na obchód — albo napisz notkę sam.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {notki.map((notka) => {
            const stan = ETYKIETY_STANU[notka.stan]
            return (
              <li key={notka.id}>
                <Link
                  href={`/panel/aktualnosci/${notka.id}`}
                  className="flex gap-5 rounded-2xl border border-kamien-200 bg-white p-5 transition-colors hover:border-las-300 hover:bg-kamien-50"
                >
                  {/* Miniatura mówi od razu, czy notka ma zdjęcie — a to jest
                      najczęstszy powód, dla którego szkic nie nadaje się
                      jeszcze do publikacji. */}
                  <span className="hidden size-20 shrink-0 overflow-hidden rounded-xl bg-kamien-100 sm:block">
                    {zeZdjeciem.has(notka.id) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/panel/wiadomosci/${notka.id}/zdjecie`}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${stan.klasa}`}
                      >
                        {stan.tekst}
                      </span>
                      {notka.odRedakcjiMaszynowej ? (
                        <span className="inline-flex items-center gap-1 text-xs text-kamien-500">
                          <Bot className="size-3.5" aria-hidden />
                          redakcja maszynowa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-kamien-500">
                          <PenLine className="size-3.5" aria-hidden />
                          własna
                        </span>
                      )}
                      {notka.zrodloNazwa && (
                        <span className="text-xs text-kamien-400">· {notka.zrodloNazwa}</span>
                      )}
                    </span>

                    <span className="mt-2 block font-heading text-lg font-semibold text-kamien-900">
                      {notka.tytul}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-kamien-600">
                      {notka.lid}
                    </span>
                  </span>

                  <span className="hidden shrink-0 text-right text-xs text-kamien-500 sm:block">
                    {notka.stan === 'OPUBLIKOWANA'
                      ? `opublikowano ${ileTemu(notka.opublikowano)}`
                      : `utworzono ${ileTemu(notka.utworzono)}`}

                    {/* Odsłony tylko przy opublikowanych — przy szkicu byłyby
                        zawsze zerem i zajmowały miejsce bez powodu. */}
                    {notka.stan === 'OPUBLIKOWANA' && (
                      <span className="mt-1.5 flex items-center justify-end gap-1 font-medium text-kamien-700">
                        <Eye className="size-3.5" aria-hidden />
                        {liczba(odslony.get(notka.slug) ?? 0)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
