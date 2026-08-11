/**
 * Ikony kafelków „Dziś w Pieninach" — przepisane z mockupu.
 *
 * Wprost w kodzie, a nie z biblioteki: to sześć rysunków po kilka ścieżek,
 * dobranych do konkretnych znaczeń (chmura, grań, fala, dach, wschód, słońce).
 * Portal używa gdzie indziej `lucide-react`, ale żadna z tamtych ikon nie
 * odpowiada tym rysunkom, a podmiana na „najbliższą podobną" zmieniłaby
 * wygląd względem mockupu.
 *
 * Wszystkie są ozdobą stojącą obok podpisu słownego, więc mają `aria-hidden`
 * ustawione przez komponent nadrzędny — nie niosą treści, którą trzeba
 * odczytać.
 */

const WSPOLNE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  'aria-hidden': true,
} as const

export function IkonaChmury() {
  return (
    <svg {...WSPOLNE} strokeLinecap="round">
      <path d="M17.5 19a4.5 4.5 0 0 0 .4-9A7 7 0 1 0 6 17.7" />
      <path d="M6 19h11.5" />
    </svg>
  )
}

export function IkonaGrani() {
  return (
    <svg {...WSPOLNE} strokeLinejoin="round">
      <path d="m3 20 6-12 4 7 3-5 5 10z" />
    </svg>
  )
}

export function IkonaRzeki() {
  return (
    <svg {...WSPOLNE} strokeLinecap="round">
      <path d="M3 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </svg>
  )
}

export function IkonaObiektow() {
  return (
    <svg {...WSPOLNE} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
    </svg>
  )
}

export function IkonaWschodu() {
  return (
    <svg {...WSPOLNE} strokeLinecap="round">
      <path d="M12 3v5M8 6l4-3 4 3M4 18a8 8 0 0 1 16 0M2 21h20" />
    </svg>
  )
}

export function IkonaSlonca() {
  return (
    <svg {...WSPOLNE} strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
    </svg>
  )
}
