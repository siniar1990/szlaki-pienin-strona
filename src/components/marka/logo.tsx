import Image from 'next/image'

import { cn } from '@/lib/utils'

/**
 * Logo Szlaków Pienin.
 *
 * Dwa warianty z księgi znaku: ciemny na jasne tła i biały na zdjęcia oraz
 * ciemne tła. Nie robimy jednego pliku przebarwianego filtrami CSS — znak ma
 * gradientowy kafel i wstęgę Dunajca w osobnym kolorze, więc filtr zamieniłby
 * go w plamę.
 *
 * Wysokość podajemy w pikselach, szerokość wynika z proporcji pliku (1800×520).
 * Księga znaku wymaga minimum 32 px wysokości kafla — poniżej wstęga rzeki
 * przestaje być czytelna; w nagłówku trzymamy 36 px.
 */

const PROPORCJA = 1800 / 520

export function Logo({
  wariant = 'ciemny',
  wysokosc = 36,
  className,
}: {
  wariant?: 'ciemny' | 'bialy'
  wysokosc?: number
  className?: string
}) {
  return (
    <Image
      src={wariant === 'bialy' ? '/marka/logo-poziome-biale.svg' : '/marka/logo-poziome-ciemne.svg'}
      alt="Szlaki Pienin"
      width={Math.round(wysokosc * PROPORCJA)}
      height={wysokosc}
      priority
      className={cn('w-auto', className)}
      style={{ height: `${wysokosc}px` }}
    />
  )
}

/**
 * Sam monogram SP, bez logotypu — na ciasne miejsca: ikonę w treści,
 * znacznik przy nagłówku sekcji, kafelek w stopce.
 */
export function ZnakSP({
  wariant = 'ciemny',
  rozmiar = 32,
  className,
}: {
  wariant?: 'ciemny' | 'jasny'
  rozmiar?: number
  className?: string
}) {
  return (
    <Image
      src={wariant === 'jasny' ? '/marka/znak-sp-jasny.svg' : '/marka/znak-sp-ciemny.svg'}
      alt=""
      width={rozmiar}
      height={rozmiar}
      aria-hidden
      className={className}
    />
  )
}
