import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ExternalLink, Search } from 'lucide-react'

import { czyPodlaczone, witryna } from '@/lib/search-console/dostep'
import {
  frazy,
  podstrony,
  podsumowanie,
  type WierszWyszukiwania,
} from '@/lib/search-console/zapytania'
import { liczba } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Google',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Dane z Google Search Console.
 *
 * **Czym to się różni od zakładki „Odsłony".** Tamta liczy, co ludzie robią,
 * gdy już są na portalu. Ta pokazuje, jak trafiają na niego z wyszukiwarki —
 * i jakie pytania zadają, zanim trafią. Drugie jest ciekawsze przy planowaniu
 * treści: jeśli ludzie szukają „czy Sokolica otwarta", a portal nie ma na to
 * odpowiedzi, to jest gotowy temat.
 *
 * **Dlaczego dane bywają starsze niż wczorajsze.** Search Console przetwarza
 * je z opóźnieniem dwóch, trzech dni — nie jest to usterka portalu i nie da
 * się tego przyspieszyć.
 */
export default async function StronaGoogle() {
  if (!czyPodlaczone()) return <NiePodlaczone />

  let wynikFraz: WierszWyszukiwania[]
  let wynikPodstron: WierszWyszukiwania[]

  try {
    ;[wynikFraz, wynikPodstron] = await Promise.all([frazy(28, 25), podstrony(28, 25)])
  } catch (blad) {
    return <Blad tresc={blad instanceof Error ? blad.message : 'Nieznany błąd'} />
  }

  const suma = podsumowanie(wynikPodstron)

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">Google</h1>
        <p className="text-sm text-kamien-500">
          Ostatnie 28 dni · witryna <code className="font-mono text-xs">{witryna()}</code>
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Kafelek etykieta="Kliknięcia" wartosc={liczba(suma.klikniecia)} opis="wejścia z wyszukiwarki" wyroznij />
        <Kafelek etykieta="Wyświetlenia" wartosc={liczba(suma.wyswietlenia)} opis="pokazań w wynikach" />
        <Kafelek etykieta="Skuteczność" wartosc={`${suma.skutecznosc}%`} opis="klikają po zobaczeniu" />
        <Kafelek etykieta="Średnia pozycja" wartosc={String(suma.pozycja)} opis="im niżej, tym lepiej" />
      </div>

      <p className="mt-4 max-w-[80ch] text-sm leading-relaxed text-kamien-500">
        Google przetwarza te dane z kilkudniowym opóźnieniem, więc ostatnie dni bywają
        niepełne. To jedyne miejsce w panelu, które mówi o faktycznym stanie w wyszukiwarce —
        pozostałe zakładki opisują wyłącznie to, co robi sam portal.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Tabela
          tytul="Czego szukają"
          opis="Zapytania, po których ludzie trafiają na portal. Fraza bez odpowiedzi na stronie to gotowy temat."
          wiersze={wynikFraz}
        />
        <Tabela
          tytul="Które podstrony"
          opis="Adresy dostające ruch z wyszukiwarki."
          wiersze={wynikPodstron}
          adresy
        />
      </div>
    </>
  )
}

function Tabela({
  tytul,
  opis,
  wiersze,
  adresy = false,
}: {
  tytul: string
  opis: string
  wiersze: WierszWyszukiwania[]
  adresy?: boolean
}) {
  return (
    <section className="rounded-2xl border border-kamien-200 bg-white p-6">
      <h2 className="font-heading text-lg font-semibold text-kamien-900">{tytul}</h2>
      <p className="mt-1 text-sm text-kamien-500">{opis}</p>

      {wiersze.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-kamien-300 p-8 text-center text-sm text-kamien-500">
          Google jeszcze nic tu nie pokazuje. Przy nowej witrynie to normalne — dane pojawiają
          się po kilku tygodniach od zaindeksowania.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-kamien-500">
              <tr>
                <th scope="col" className="pb-2 font-semibold">
                  {adresy ? 'Adres' : 'Fraza'}
                </th>
                <th scope="col" className="pb-2 text-right font-semibold">Klik.</th>
                <th scope="col" className="pb-2 text-right font-semibold">Wyśw.</th>
                <th scope="col" className="pb-2 text-right font-semibold">Poz.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kamien-100">
              {wiersze.map((wiersz) => (
                <tr key={wiersz.klucz}>
                  <td className="max-w-[18rem] truncate py-2 pr-3 text-kamien-800">
                    {adresy ? (
                      <a
                        href={wiersz.klucz}
                        target="_blank"
                        rel="noopener"
                        className="hover:text-las-700"
                      >
                        {wiersz.klucz.replace(/^https?:\/\/[^/]+/, '') || '/'}
                      </a>
                    ) : (
                      wiersz.klucz
                    )}
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums text-kamien-900">
                    {wiersz.klikniecia}
                  </td>
                  <td className="py-2 text-right tabular-nums text-kamien-600">
                    {wiersz.wyswietlenia}
                  </td>
                  <td className="py-2 text-right tabular-nums text-kamien-500">{wiersz.pozycja}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Kafelek({
  etykieta,
  wartosc,
  opis,
  wyroznij = false,
}: {
  etykieta: string
  wartosc: string
  opis: string
  wyroznij?: boolean
}) {
  return (
    <div
      className={
        'rounded-2xl border p-5 ' +
        (wyroznij ? 'border-las-200 bg-las-50' : 'border-kamien-200 bg-white')
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-kamien-500">{etykieta}</p>
      <p
        className={
          'mt-2 font-heading text-3xl font-semibold tabular-nums ' +
          (wyroznij ? 'text-las-800' : 'text-kamien-900')
        }
      >
        {wartosc}
      </p>
      <p className="mt-1 text-sm text-kamien-500">{opis}</p>
    </div>
  )
}

/**
 * Stan „jeszcze nie podłączono".
 *
 * Nie jest błędem i nie wygląda jak błąd. Portal działa bez tego połączenia
 * w całości — Search Console dokłada wyłącznie widok od strony wyszukiwarki.
 */
function NiePodlaczone() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-kamien-900">Google</h1>

      <div className="mt-6 max-w-[70ch] rounded-2xl border border-kamien-200 bg-white p-6">
        <p className="inline-flex items-center gap-2 font-medium text-kamien-900">
          <Search className="size-4" aria-hidden />
          Search Console nie jest jeszcze podłączony
        </p>
        <p className="mt-2 text-sm leading-relaxed text-kamien-600">
          Portal działa bez tego w całości — mapy witryny, kanał RSS i dane strukturalne
          nie wymagają żadnego połączenia. To podłączenie dokłada jedno: widok od strony
          wyszukiwarki, czyli czego ludzie szukają i które podstrony dostają ruch.
        </p>

        <ol className="mt-5 space-y-3 text-sm leading-relaxed text-kamien-700">
          <Krok numer={1}>
            W Google Cloud utwórz konto usługi i pobierz jego klucz w formacie JSON.
            Włącz dla projektu <strong>Google Search Console API</strong>.
          </Krok>
          <Krok numer={2}>
            W Search Console otwórz <strong>Ustawienia → Użytkownicy i uprawnienia</strong>{' '}
            i dodaj adres e-mail konta usługi z uprawnieniem <strong>Pełny</strong> albo{' '}
            <strong>Ograniczony</strong>.
          </Krok>
          <Krok numer={3}>
            W Vercelu dodaj trzy zmienne:{' '}
            <code className="rounded bg-kamien-100 px-1.5 py-0.5 font-mono text-xs">
              GOOGLE_KONTO_USLUGI_EMAIL
            </code>
            ,{' '}
            <code className="rounded bg-kamien-100 px-1.5 py-0.5 font-mono text-xs">
              GOOGLE_KONTO_USLUGI_KLUCZ
            </code>{' '}
            (pole <code className="font-mono text-xs">private_key</code> z pliku JSON, w całości)
            oraz{' '}
            <code className="rounded bg-kamien-100 px-1.5 py-0.5 font-mono text-xs">
              GOOGLE_WITRYNA
            </code>{' '}
            — i przewdróż.
          </Krok>
        </ol>

        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-las-700 hover:underline"
        >
          Otwórz Search Console
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <p className="mt-6 max-w-[70ch] text-sm leading-relaxed text-kamien-500">
        Jeśli szukasz tylko potwierdzenia własności witryny, wystarczy zmienna{' '}
        <code className="rounded bg-kamien-100 px-1.5 py-0.5 font-mono text-xs">
          GOOGLE_WERYFIKACJA
        </code>{' '}
        z kodem, który Search Console podaje przy metodzie „Tag HTML" — portal wstawi go
        wtedy w nagłówek każdej strony.
      </p>
    </>
  )
}

function Krok({ numer, children }: { numer: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-kamien-200 text-xs font-semibold text-kamien-700">
        {numer}
      </span>
      <span>{children}</span>
    </li>
  )
}

function Blad({ tresc }: { tresc: string }) {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-kamien-900">Google</h1>

      <div className="mt-6 max-w-[70ch] rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="inline-flex items-center gap-2 font-medium text-amber-900">
          <AlertTriangle className="size-4" aria-hidden />
          Nie udało się pobrać danych
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/80">{tresc}</p>
        <Link
          href="/panel/analityka"
          className="mt-4 inline-block text-sm font-medium text-amber-900 hover:underline"
        >
          Wróć do odsłon
        </Link>
      </div>
    </>
  )
}
