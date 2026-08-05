import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { after } from 'next/server'
import { ArrowRight, Mountain } from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { baza } from '@/lib/baza'
import { pobierzStatystyki } from '@/lib/dane/zrodlo'
import { kilometry, odmien } from '@/lib/format'
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
 *
 * Pobieramy tylko to, co jest potrzebne do obsłużenia żądania: identyfikator do
 * zapisu skanu, status do decyzji o przekierowaniu i wariant do statystyk.
 * Nazwa i opis tabliczki zostają w bazie na użytek panelu — na stronie się nie
 * pojawiają.
 */
const pobierzTabliczke = unstable_cache(
  async (kod: string) =>
    baza.kodQr.findUnique({
      where: { kod },
      select: { id: true, status: true, wariant: true },
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

  return <ZaproszenieDoAplikacji />
}

/**
 * Strona pokazywana na komputerze oraz wszędzie tam, gdzie nie ma dokąd
 * przekierować.
 *
 * Celowo nie ma tu żadnych danych tabliczki — ani nazwy, ani opisu, ani
 * położenia. Człowiek, który przed chwilą przyłożył telefon do tabliczki, stoi
 * pod nią i patrzy na to, co jest na niej napisane; powtarzanie mu tego na
 * ekranie zabiera miejsce jedynej rzeczy, po którą tu przyszedł — aplikacji.
 *
 * Treść nie zakłada niczego o miejscu, w którym wisi tabliczka. Poprzednia
 * wersja mówiła „to miejsce jest opisane w przewodniku", co jest prawdą przy
 * Sokolicy i nieprawdą przy tabliczce w pensjonacie, na parkingu albo na
 * słupie przy przystanku. Obietnica dotyczy więc całych Pienin, a nie punktu
 * pod nogami — i tym samym przemawia też do kogoś, kto akurat nie jest
 * w połowie szlaku.
 *
 * Liczby biorą się z danych aplikacji, a nie z tekstu wpisanego na sztywno.
 * Gdy przybędzie tras, zdanie zaktualizuje się samo.
 */
function ZaproszenieDoAplikacji() {
  const { liczbaTras, sumaKm, liczbaSzczytow } = pobierzStatystyki()

  return (
    <div className="obszar flex min-h-[70vh] flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-kamien-300 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-kamien-600">
          <Mountain className="size-3.5" aria-hidden />
          Szlaki Pienin
        </span>

        <h1 className="mt-6 text-tytul font-semibold text-kamien-900">
          Całe Pieniny w twoim telefonie
        </h1>

        <p className="mt-5 text-prowadzacy leading-relaxed text-kamien-600">
          {liczbaTras} {odmien(liczbaTras, ['trasa', 'trasy', 'tras'])},{' '}
          {liczbaSzczytow} {odmien(liczbaSzczytow, ['szczyt', 'szczyty', 'szczytów'])},
          atrakcje i punkty widokowe — z mapą, która działa bez zasięgu. Także
          tam, gdzie telefon go nie łapie.
        </p>

        <div className="mt-9 flex justify-center">
          <PrzyciskiSklepow wariant="ciemny" />
        </div>

        <p className="mt-8 text-sm text-kamien-500">
          {kilometry(sumaKm)} opisanych szlaków — od spaceru nad Dunajcem po
          całodzienne przejścia grani.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-kamien-500 underline-offset-4 transition-colors hover:text-las-700 hover:underline"
        >
          Zobacz cały portal
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
