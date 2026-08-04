import { cn } from '@/lib/utils'

/**
 * Kolumna tekstu ciągłego — polityka prywatności, wsparcie, artykuły.
 *
 * Szerokość ograniczona do 68 znaków, bo dłuższy wiersz męczy: oko gubi
 * początek następnej linii. Style potomków opisujemy tutaj zamiast wtyczką
 * typografii Tailwinda — jest ich kilkanaście, a tak widać je wszystkie
 * w jednym miejscu i nie trzeba dokładać zależności.
 */
export function Proza({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-[68ch] text-[1.0625rem] leading-[1.75] text-kamien-700',
        '[&_h2]:mt-14 [&_h2]:text-sekcja [&_h2]:font-semibold [&_h2]:text-kamien-900',
        '[&_h3]:mt-10 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-kamien-900',
        '[&_h2+p]:mt-4 [&_h3+p]:mt-3',
        '[&_p]:mt-5 [&_ul]:mt-5 [&_ol]:mt-5',
        '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
        '[&_li]:mt-2 [&_li]:pl-1',
        '[&_a]:font-medium [&_a]:text-las-700 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-las-800',
        '[&_strong]:font-semibold [&_strong]:text-kamien-900',
        '[&_table]:mt-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-base',
        '[&_th]:border-b [&_th]:border-kamien-300 [&_th]:pb-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-kamien-900',
        '[&_td]:border-b [&_td]:border-kamien-200 [&_td]:py-3 [&_td]:pr-4 [&_td]:align-top',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Wyróżniona ramka na to, co czytelnik powinien zobaczyć nawet skanując wzrokiem. */
export function Uwaga({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-2xl border border-las-200 bg-las-50 p-6 text-kamien-800 [&_p]:mt-0">
      {children}
    </div>
  )
}
