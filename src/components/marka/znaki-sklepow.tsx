/**
 * Znaki firmowe sklepów z aplikacjami.
 *
 * Wcześniej stały tu ikony z biblioteki Lucide — a jej „Apple" to rysunek
 * jabłka jako owocu, nie znak firmowy Apple. Na przycisku „Pobierz na App
 * Store" wyglądało to jak sklep spożywczy. Tu są prawdziwe znaki obu firm,
 * narysowane jako ścieżki SVG.
 *
 * Obu wolno używać wyłącznie do oznaczenia odnośnika prowadzącego do sklepu
 * z aplikacją — i tak właśnie są tu użyte. Znaków nie przerabiamy: zachowują
 * oryginalne proporcje, a kolor dziedziczą po przycisku (`currentColor`),
 * co obie firmy dopuszczają dla wariantu jednobarwnego.
 */

/** Nadgryzione jabłko — znak firmowy Apple. */
export function ZnakApple({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d="M17.05 12.54c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.15 9.21.77 1.11 1.68 2.36 2.87 2.31 1.15-.05 1.59-.74 2.98-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.41-.93-2.43-3.69zM14.79 5.4c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.68-1.09 1.77-.95 2.81 1.02.08 2.05-.52 2.68-1.28z" />
    </svg>
  )
}

/**
 * Trójkątny znak Google Play.
 *
 * Oryginał jest czterobarwny; w wersji jednobarwnej — takiej jak tu — Google
 * dopuszcza wypełnienie jednym kolorem, byle zachować kształt.
 */
export function ZnakGooglePlay({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d="M3.6 1.85a1.5 1.5 0 0 0-.5 1.13v18.04c0 .45.19.86.5 1.13l.06.06 10.1-10.1v-.24L3.66 1.79l-.06.06zM17.2 15.6l-3.37-3.37v-.24l3.37-3.37.08.05 3.99 2.27c1.14.65 1.14 1.71 0 2.36l-3.99 2.27-.08.03zM17.28 15.57 13.83 12.1 3.6 22.15c.38.4.99.45 1.68.06l12-6.64zM17.28 8.43 5.28 1.79c-.69-.39-1.3-.34-1.68.06l10.23 10.03 3.45-3.45z" />
    </svg>
  )
}
