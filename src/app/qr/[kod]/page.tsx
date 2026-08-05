import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { after } from 'next/server'
import { ArrowRight, MapPin, QrCode } from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { baza } from '@/lib/baza'
import { rozpoznajUrzadzenie } from '@/lib/qr/rozpoznaj-urzadzenie'
import { ZNACZNIK_TABLICZEK } from '@/lib/qr/znaczniki'
import { daneZNaglowkow, zapiszSkan } from '@/lib/qr/zapisz-skan'
import { SKLEPY } from '@/lib/konfiguracja'

/**
 * Trasa skanowania tabliczki.
 *
 * Kolejność działań jest tu ważniejsza niż sam kod:
 *
 *  1. odczyt tabliczki z bazy (jedno zapytanie po indeksowanej kolumnie),
 *  2. rozpoznanie platformy z nagłówka,
 *  3. **zarejestrowanie zapisu przez `after()`** — wykona się po odesłaniu
 *     odpowiedzi, więc nie opóźnia przekierowania ani o milisekundę,
 *  4. przekierowanie albo wyświetlenie strony.
 *
 * Zamiana punktów 3 i 4 miejscami wyglądałaby niewinnie, a kosztowała każdego
 * turystę czekanie na zapis do bazy.
 */

// Skan to zdarzenie — nie ma czego zapamiętywać w pamięci podręcznej.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  // Adresy tabliczek nie mają czego szukać w wynikach wyszukiwania. Prowadzą
  // do przekierowania, a nie do treści; zaindeksowane rozmywałyby stronę
  // miejsca, do której i tak kierują.
  robots: { index: false, follow: false },
}

/**
 * Odczyt tabliczki z pamięcią podręczną.
 *
 * Powód nie jest kosmetyczny. Darmowy Neon usypia bazę po kilku minutach bez
 * ruchu, a jej wybudzenie potrafi zająć trzydzieści sekund — zmierzone,
 * nie oszacowane. Bez pamięci podręcznej pierwszy skan po nocy trafiałby na
 * limit czasu funkcji i turysta zobaczyłby błąd zamiast trasy.
 *
 * To, dokąd prowadzi tabliczka, zmienia się raz na kilka miesięcy, więc minuta
 * nieświeżości nic nie psuje. Zmiana w panelu unieważnia zapis od razu przez
 * znacznik, nie czekając na upływ minuty.
 *
 * Zapis skanu nadal idzie do bazy przy każdym żądaniu — ale dzieje się
 * w `after()`, więc jego powolność nie dotyka użytkownika.
 */
const pobierzTabliczke = unstable_cache(
  async (kod: string) =>
    baza.kodQr.findUnique({
      where: { kod },
      select: {
        id: true,
        kod: true,
        nazwa: true,
        opis: true,
        nazwaLokalizacji: true,
        powiazanaStrona: true,
        status: true,
        wariant: true,
      },
    }),
  ['tabliczka-qr'],
  { revalidate: 60, tags: [ZNACZNIK_TABLICZEK] },
)

export default async function StronaSkanu({ params }: PageProps<'/qr/[kod]'>) {
  const { kod } = await params

  const tabliczka = await pobierzTabliczke(kod.toUpperCase())

  if (!tabliczka) notFound()

  const naglowki = await headers()
  const { typ, przegladarka } = rozpoznajUrzadzenie(naglowki.get('user-agent'))

  /*
    Dokąd przekierować.

    Właściciel wybrał natychmiastowe przejście do sklepu. Ale dopóki adresy
    w `konfiguracja.ts` są puste — a są, bo aplikacji nie ma jeszcze
    w sklepach — przekierowanie prowadziłoby w martwą kartę App Store.
    Dlatego pytamy najpierw, czy jest dokąd iść. Po wpisaniu adresów
    zachowanie zmieni się samo, bez dotykania tego pliku.
  */
  const adresSklepu =
    typ === 'IOS' ? SKLEPY.appStore : typ === 'ANDROID' ? SKLEPY.googlePlay : ''
  const przekierowanie = tabliczka.status === 'AKTYWNY' && adresSklepu.length > 0

  after(async () => {
    await zapiszSkan({
      kodQrId: tabliczka.id,
      urzadzenie: typ,
      przegladarka,
      przekierowanoDoSklepu: przekierowanie,
      wariant: tabliczka.wariant,
      ...daneZNaglowkow(naglowki),
    })
  })

  // `redirect` działa przez wyjątek przechwytywany przez Next — musi zostać
  // poza blokiem `try`, inaczej zostałby połknięty jako błąd.
  if (przekierowanie) redirect(adresSklepu)

  return <StronaMiejsca tabliczka={tabliczka} />
}

/**
 * Strona pokazywana na komputerze oraz wszędzie tam, gdzie nie ma dokąd
 * przekierować. Turysta ma tu dostać coś wartościowego od razu, a nie
 * komunikat o błędzie: nazwę miejsca, w którym stoi, odnośnik do jego opisu
 * i możliwość pobrania aplikacji.
 */
function StronaMiejsca({
  tabliczka,
}: {
  tabliczka: {
    kod: string
    nazwa: string
    opis: string | null
    nazwaLokalizacji: string | null
    powiazanaStrona: string | null
    status: string
  }
}) {
  return (
    <div className="obszar flex min-h-[70vh] flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-kamien-300 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-kamien-600">
          <QrCode className="size-3.5" aria-hidden />
          Tabliczka {tabliczka.kod}
        </span>

        <h1 className="mt-6 text-tytul font-semibold text-kamien-900">{tabliczka.nazwa}</h1>

        {tabliczka.nazwaLokalizacji && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-kamien-500">
            <MapPin className="size-4" aria-hidden />
            {tabliczka.nazwaLokalizacji}
          </p>
        )}

        {tabliczka.opis && (
          <p className="mt-5 text-prowadzacy leading-relaxed text-kamien-600">{tabliczka.opis}</p>
        )}

        {tabliczka.status !== 'AKTYWNY' && (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
            Ta tabliczka jest chwilowo nieaktywna. Treści o tym miejscu znajdziesz
            na stronie i w aplikacji.
          </p>
        )}

        {tabliczka.powiazanaStrona && (
          <Link
            href={tabliczka.powiazanaStrona}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-las-700 px-6 py-3.5 font-medium text-white transition-colors hover:bg-las-800"
          >
            Zobacz to miejsce
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}

        <div className="mt-12 border-t border-kamien-200 pt-10">
          <p className="text-kamien-600">
            Cały przewodnik po Pieninach — z mapą offline i nawigacją — masz
            w aplikacji.
          </p>
          <div className="mt-6 flex justify-center">
            <PrzyciskiSklepow wariant="ciemny" />
          </div>
        </div>
      </div>
    </div>
  )
}
