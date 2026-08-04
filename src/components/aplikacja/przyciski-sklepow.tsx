import { ZnakApple, ZnakGooglePlay } from '@/components/marka/znaki-sklepow'
import { SKLEPY } from '@/lib/konfiguracja'
import { cn } from '@/lib/utils'

/**
 * Para przycisków pobrania aplikacji — najważniejszy element portalu.
 *
 * Aplikacja nie jest jeszcze w sklepach, więc przyciski mają dwa stany.
 * Gdy adres w `SKLEPY` jest pusty, renderujemy `span`, a nie `a` — element
 * bez atrybutu `href` nie trafia do kolejności fokusu i czytnik ekranu nie
 * zapowiada go jako odnośnika. To lepsze niż odnośnik z `aria-disabled`,
 * bo ten nadal daje się kliknąć i prowadzi donikąd.
 *
 * Po wpisaniu adresów w `konfiguracja.ts` te same przyciski stają się
 * zwykłymi odnośnikami — bez zmiany czegokolwiek tutaj.
 */

type Wariant = 'jasny' | 'ciemny'

const STYL_PRZYCISKU =
  'group inline-flex min-w-[13.5rem] items-center gap-3 rounded-2xl px-5 py-3.5 ' +
  'text-left transition-all duration-300'

function Sklep({
  adres,
  ikona,
  gora,
  dol,
  wariant,
}: {
  adres: string
  ikona: React.ReactNode
  gora: string
  dol: string
  wariant: Wariant
}) {
  const dostepny = adres.length > 0

  const wyglad = cn(
    STYL_PRZYCISKU,
    wariant === 'jasny'
      ? 'bg-white text-las-900 shadow-uniesiony'
      : 'bg-las-800 text-white shadow-uniesiony',
    dostepny
      ? 'hover:-translate-y-0.5 hover:shadow-wysoki'
      : 'cursor-default opacity-60',
  )

  const zawartosc = (
    <>
      <span className="shrink-0" aria-hidden>
        {ikona}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] opacity-70">
          {gora}
        </span>
        <span className="font-heading text-lg font-semibold">{dol}</span>
      </span>
    </>
  )

  if (!dostepny) {
    return (
      <span className={wyglad}>
        {zawartosc}
        <span className="sr-only">— jeszcze niedostępne</span>
      </span>
    )
  }

  return (
    <a href={adres} className={wyglad} rel="noopener">
      {zawartosc}
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
      <div className="flex flex-wrap gap-3">
        <Sklep
          adres={SKLEPY.appStore}
          ikona={<ZnakApple className="size-7" />}
          gora={SKLEPY.appStore ? 'Pobierz na' : 'Wkrótce na'}
          dol="App Store"
          wariant={wariant}
        />
        <Sklep
          adres={SKLEPY.googlePlay}
          ikona={<ZnakGooglePlay className="size-7" />}
          gora={SKLEPY.googlePlay ? 'Pobierz w' : 'Wkrótce w'}
          dol="Google Play"
          wariant={wariant}
        />
      </div>

      {!wSklepach && (
        <p
          className={cn(
            'max-w-[28rem] text-sm',
            wariant === 'jasny' ? 'text-white/80' : 'text-kamien-600',
          )}
        >
          Aplikacja czeka na publikację w sklepach. Wszystkie trasy, opisy
          i mapy z aplikacji są już dostępne na tej stronie.
        </p>
      )}
    </div>
  )
}
