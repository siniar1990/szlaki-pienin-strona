import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { ArrowRight, Mountain } from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { PotwierdzenieSkanu } from '@/components/qr/potwierdzenie-skanu'
import { baza } from '@/lib/baza'
import { pobierzStatystyki } from '@/lib/dane/zrodlo'
import { kilometry, odmien } from '@/lib/format'
import { przytnijUserAgenta, sklasyfikuj, sygnalyZNaglowkow } from '@/lib/qr/klasyfikacja'
import { rozpoznajUrzadzenie } from '@/lib/qr/rozpoznaj-urzadzenie'
import { nowyIdentyfikator, wystawToken } from '@/lib/qr/token-trafienia'
import { ZNACZNIK_TABLICZEK } from '@/lib/qr/znaczniki'
import { daneZNaglowkow, zapiszSkan } from '@/lib/qr/zapisz-skan'
import { SKLEPY } from '@/lib/konfiguracja'

/**
 * Trasa skanowania tabliczki.
 *
 * Kolejność działań jest tu ważniejsza niż sam kod:
 *
 *  1. odczyt tabliczki z bazy (jedno zapytanie po indeksowanej kolumnie),
 *  2. rozpoznanie platformy z nagłówka i wstępna klasyfikacja ruchu,
 *  3. **zarejestrowanie zapisu przez `after()`** — wykona się po odesłaniu
 *     odpowiedzi, więc nie opóźnia przekierowania ani o milisekundę,
 *  4. wyświetlenie strony, która potwierdza skan i ewentualnie przenosi do sklepu.
 *
 * Zamiana punktów 3 i 4 miejscami wyglądałaby niewinnie, a kosztowała każdego
 * turystę czekanie na zapis do bazy.
 *
 * **Dlaczego do sklepu przenosi przeglądarka, a nie serwer.** Wcześniej było
 * tu `redirect()` i to było prostsze. Ale odpowiedź 307 nie wykonuje
 * JavaScriptu, a bez wykonanego JavaScriptu nie ma potwierdzenia, że po
 * drugiej stronie stoi człowiek — wszystkie skany z telefonów zniknęłyby ze
 * statystyk w dniu, w którym aplikacja trafi do sklepów. Strona przejściowa
 * kosztuje sto pięćdziesiąt milisekund i rozwiązuje to raz na zawsze.
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
  const { typ, przegladarka } = rozpoznajUrzadzenie(naglowki.get('user-agent'), {
    platforma: naglowki.get('sec-ch-ua-platform'),
    mobilne: naglowki.get('sec-ch-ua-mobile'),
  })

  /*
    Klasyfikacja dzieje się przed odpowiedzią, bo korzysta z adresu IP, a ten
    żyje tylko tyle, co żądanie. Do bazy idzie sam werdykt i numer sieci —
    adresu nie zapisujemy w żadnej postaci.
  */
  const sygnaly = sygnalyZNaglowkow(naglowki)
  const werdykt = sklasyfikuj(sygnaly)

  // Identyfikator trafienia wiąże wiersz w bazie ze stroną w przeglądarce.
  // Token to ten identyfikator z podpisem i terminem ważności.
  const identyfikator = nowyIdentyfikator()
  const token = await wystawToken(identyfikator)

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
      userAgent: przytnijUserAgenta(sygnaly.userAgent),
      asn: werdykt.asn,
      klasyfikacja: werdykt.klasyfikacja,
      powodBota: werdykt.powodBota,
      tokenTrafienia: token ? identyfikator : null,
    })
  })

  if (przekierowanie) {
    return <PrzejscieDoSklepu adres={adresSklepu} token={token} />
  }

  return (
    <>
      {token && <PotwierdzenieSkanu token={token} />}
      <ZaproszenieDoAplikacji />
    </>
  )
}

/**
 * Strona przejściowa w drodze do sklepu.
 *
 * Widać ją ułamek sekundy i tylko po to istnieje: przez ten ułamek zdąży
 * pójść potwierdzenie skanu. Bez niej skany z telefonów byłyby nie do
 * odróżnienia od crawlerów — jedne i drugie tylko pobierają adres i znikają.
 *
 * `noscript` nie jest ozdobą. Turysta z wyłączonym JavaScriptem nie wyśle
 * potwierdzenia i trudno; ale musi trafić do sklepu, a nie utknąć na napisie
 * „przenoszę". Odświeżenie w `meta` i widoczny odnośnik załatwiają oba
 * przypadki: automatyczny i ręczny.
 */
function PrzejscieDoSklepu({ adres, token }: { adres: string; token: string | null }) {
  return (
    <div className="obszar flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      {token && <PotwierdzenieSkanu token={token} doSklepu={adres} />}

      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${adres}`} />
      </noscript>

      <Mountain className="size-8 text-las-700" aria-hidden />
      <p className="mt-4 text-prowadzacy text-kamien-700">Przenoszę do sklepu z aplikacją…</p>

      <a
        href={adres}
        className="mt-6 text-sm font-medium text-las-700 underline underline-offset-4"
      >
        Przejdź od razu
      </a>
    </div>
  )
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
