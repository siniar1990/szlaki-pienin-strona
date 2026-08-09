import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import { nazwaKategorii, partnerKategorii, type KategoriaAtrakcji } from '@/lib/tresc/kategorie-atrakcji'

/**
 * Zaproszenie dla przyszłego partnera kategorii.
 *
 * Stoi w miejscu, w którym kiedyś stanie wyróżnienie partnera — i znika
 * automatycznie w chwili, gdy ta kategoria partnera dostanie. Dzięki temu nie
 * da się zapomnieć o usunięciu zaproszenia po podpisaniu pierwszej umowy.
 *
 * **Dlaczego wygląda inaczej niż karty atrakcji.** Przerywana ramka i brak
 * zdjęcia to sygnał, że to nie jest kolejne miejsce do odwiedzenia. Gdyby
 * wyglądało jak karta, czytelnik kliknąłby w nie w poszukiwaniu atrakcji —
 * a to jest ogłoszenie skierowane do zupełnie innej osoby.
 *
 * **Dlaczego tylko w wybranych kategoriach.** Ogłoszenie przy każdej sekcji
 * zamieniłoby katalog w słup ogłoszeniowy. Włącza się je świadomie, tam gdzie
 * naprawdę szuka się partnera.
 */
export function WolneMiejscePartnera({ kategoria }: { kategoria: KategoriaAtrakcji }) {
  // Gdy kategoria ma już partnera, zaproszenie nie ma po co wisieć.
  if (partnerKategorii(kategoria)) return null

  return (
    <div className="mb-5 rounded-2xl border border-dashed border-kamien-300 bg-kamien-50/60 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
      <div>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-kamien-500">
          <Sparkles className="size-3" aria-hidden />
          Wolne miejsce partnera
        </p>
        <h3 className="mt-2 font-heading text-lg font-semibold text-kamien-900">
          Twoja firma może być tu wyróżniona
        </h3>
        <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-kamien-600">
          Prowadzisz działalność w kategorii „{nazwaKategorii(kategoria)}"? To miejsce
          czeka na jednego partnera — z dużym zdjęciem, opisem i odnośnikiem do oferty.
          Napisz do nas, opowiemy o szczegółach.
        </p>
      </div>

      <Link
        href="/kontakt?temat=partner"
        className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-full border border-kamien-400 bg-white px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50 hover:text-las-800 sm:mt-0"
      >
        Napisz do nas
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  )
}
