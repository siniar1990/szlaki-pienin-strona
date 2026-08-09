import {
  Baby,
  CalendarDays,
  Fish,
  Map as MapIcon,
  Backpack,
  Route,
  ShieldCheck,
  Ticket,
  Zap,
} from 'lucide-react'

import type { KluczIkony } from '@/lib/tresc/atrakcje-turystyczne'

/**
 * Praktyczny przewodnik przy atrakcji — punkty z ikonami.
 *
 * Jest po to, żeby dało się znaleźć jedną informację bez czytania całości.
 * Kto chce wiedzieć, czy wejdzie tu z dzieckiem, szuka wzrokiem ikony dziecka
 * i czyta dwa zdania — zamiast przeglądać cztery akapity opisu.
 *
 * Ikony są dekoracją, nie treścią: każdy punkt ma tytuł, który mówi to samo
 * słowami, a same ikony mają `aria-hidden`. Inaczej czytnik ekranu ogłaszałby
 * „obrazek" przed każdą pozycją i nic by z tego nie wynikało.
 */

const IKONY: Record<KluczIkony, React.ComponentType<{ className?: string }>> = {
  ryba: Fish,
  zasady: ShieldCheck,
  mapa: MapIcon,
  sprzet: Backpack,
  dziecko: Baby,
  zezwolenie: Ticket,
  sezon: CalendarDays,
  trasa: Route,
  adrenalina: Zap,
}

export function PrzewodnikAtrakcji({
  tytul,
  punkty,
}: {
  tytul: string
  punkty: { ikona: KluczIkony; tytul: string; tekst: string }[]
}) {
  if (punkty.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="font-heading text-xl font-semibold text-kamien-900">{tytul}</h2>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {punkty.map((punkt) => {
          const Ikona = IKONY[punkt.ikona]
          return (
            <li
              key={punkt.tytul}
              className="flex gap-4 rounded-2xl border border-kamien-200 bg-white p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-las-50 text-las-700">
                <Ikona className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-base font-semibold text-kamien-900">
                  {punkt.tytul}
                </h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-kamien-600">
                  {punkt.tekst}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
