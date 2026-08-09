'use client'

import Image from 'next/image'

import { zglos } from '@/components/analityka/licznik-odslon'
import { SKLEPY } from '@/lib/konfiguracja'
import { cn } from '@/lib/utils'

/**
 * Para przycisków pobrania aplikacji — najważniejszy element portalu.
 *
 * **Oficjalne odznaki zamiast własnych przycisków.** Wcześniej portal składał
 * je sam z logo i napisu. Apple i Google udostępniają gotowe odznaki i wymagają
 * ich użycia bez przerysowywania — poza tym są rozpoznawalne odruchowo,
 * bo wyglądają tak samo na każdej stronie, jaką człowiek widział wcześniej.
 *
 * Odznaki mają dwa stany, bo Google Play jeszcze nie ma adresu. Gdy adres
 * w `SKLEPY` jest pusty, renderujemy `span`, a nie `a` — element bez atrybutu
 * `href` nie trafia do kolejności fokusu i czytnik ekranu nie zapowiada go jako
 * odnośnika. To lepsze niż odnośnik z `aria-disabled`, bo ten nadal daje się
 * kliknąć i prowadzi donikąd.
 *
 * Po wpisaniu adresów w `konfiguracja.ts` te same odznaki stają się zwykłymi
 * odnośnikami — bez zmiany czegokolwiek tutaj.
 */

type Wariant = 'jasny' | 'ciemny'

/*
  Wysokość odznaki. Apple i Google podają w wytycznych minimalną wysokość
  (odpowiednio 40 i 40 px) — 48 px daje zapas i jest wygodnym celem palca
  na telefonie. Szerokość wynika z proporcji pliku, więc nie podajemy jej.
*/
const WYSOKOSC = 48

type Odznaka = { adres: string; plik: string; opis: string; nazwa: string }

function Sklep({ odznaka, wariant }: { odznaka: Odznaka; wariant: Wariant }) {
  const dostepny = odznaka.adres.length > 0

  const obraz = (
    <Image
      src={`/marka/sklepy/${odznaka.plik}.png`}
      alt={odznaka.opis}
      width={162}
      height={WYSOKOSC}
      className="h-12 w-auto"
    />
  )

  const wyglad = cn(
    'inline-flex rounded-xl transition-all duration-300',
    // Odznaki są czarne, więc na ciemnym tle potrzebują jasnej obwódki,
    // inaczej zlewają się z sekcją.
    wariant === 'ciemny' && 'ring-1 ring-white/25',
    dostepny ? 'hover:-translate-y-0.5' : 'cursor-default opacity-50',
  )

  if (!dostepny) {
    return (
      <span className={wyglad}>
        {obraz}
        <span className="sr-only">— jeszcze niedostępne</span>
      </span>
    )
  }

  /*
    Kliknięcie w odznakę to jedyne zdarzenie na portalu, które mówi wprost
    o skuteczności całej strony: człowiek przeszedł od czytania o trasach do
    pobierania aplikacji. Zliczamy je osobno od odsłon, bo to inna informacja.

    Zgłoszenie idzie przez `sendBeacon`, więc nie opóźnia przejścia do sklepu
    i nie wymaga wstrzymywania odnośnika — przeglądarka dostarczy je nawet po
    opuszczeniu strony.
  */
  return (
    <a
      href={odznaka.adres}
      className={wyglad}
      rel="noopener"
      onClick={() => zglos('POBRANIE', odznaka.nazwa)}
    >
      {obraz}
    </a>
  )
}

export function PrzyciskiSklepow({
  wariant = 'jasny',
  className,
}: {
  wariant?: Wariant
  className?: string
}) {
  const wSklepach = SKLEPY.appStore.length > 0 || SKLEPY.googlePlay.length > 0

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Sklep
          odznaka={{
            adres: SKLEPY.appStore,
            plik: 'app-store',
            opis: 'Pobierz z App Store',
            nazwa: 'app-store',
          }}
          wariant={wariant}
        />
        <Sklep
          odznaka={{
            adres: SKLEPY.googlePlay,
            plik: 'google-play',
            opis: 'Pobierz z Google Play',
            nazwa: 'google-play',
          }}
          wariant={wariant}
        />
      </div>

      {/*
        Zdanie o tym, że aplikacja jest darmowa i bez reklam, stoi przy samych
        odznakach — czyli w miejscu, w którym człowiek podejmuje decyzję,
        a nie kilka akapitów niżej, gdzie go już nie przeczyta.
      */}
      <p
        className={cn(
          'max-w-[30rem] text-sm',
          wariant === 'jasny' ? 'text-white/85' : 'text-kamien-600',
        )}
      >
        <span className="font-medium">Aplikacja jest darmowa i bez reklam.</span>{' '}
        {wSklepach
          ? 'Nie wymaga konta ani logowania.'
          : 'Czeka na publikację w sklepach — wszystkie trasy, opisy i mapy są już dostępne na tej stronie.'}
      </p>
    </div>
  )
}
