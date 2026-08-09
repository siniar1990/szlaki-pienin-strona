import type { Metadata } from 'next'
import { Clock, ShieldCheck } from 'lucide-react'

import { FormularzUstawien } from '@/components/panel/formularz-ustawien'
import { godzinyPublikacji, pobierzUstawienia } from '@/lib/wiadomosci/ustawienia'

export const metadata: Metadata = {
  title: 'Ustawienia redakcji',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Ustawienia redakcji.
 *
 * Dwa pokrętła i nic więcej. Każde dodatkowe ustawienie to kolejna rzecz do
 * pamiętania i kolejny sposób, żeby dział aktualności zachował się inaczej,
 * niż się spodziewano — a przy jednej osobie obsługującej portal to gorsze
 * niż brak możliwości.
 */
export default async function StronaUstawien() {
  const ustawienia = await pobierzUstawienia()
  const godziny = godzinyPublikacji(ustawienia.notekDziennie)

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-kamien-900">Ustawienia redakcji</h1>
      <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-kamien-600">
        Jak często redakcja pisze i czy wypuszcza notki sama. Zmiany działają od najbliższej
        pory publikacji — nic nie dzieje się wstecz.
      </p>

      <div className="mt-8 max-w-2xl">
        <FormularzUstawien wartosci={ustawienia} />
      </div>

      {/* ── Podgląd harmonogramu ───────────────────────────────────────── */}
      <section className="mt-8 max-w-2xl rounded-2xl border border-kamien-200 bg-white p-6">
        <h2 className="inline-flex items-center gap-2 font-heading text-base font-semibold text-kamien-900">
          <Clock className="size-4" aria-hidden />
          Dzisiejszy harmonogram
        </h2>
        <p className="mt-1 text-sm text-kamien-500">
          Godziny wynikają z liczby notek — przedział od 5:00 do 23:00 dzielony równo.
          Nie da się ich ustawić osobno i to jest celowe: jedna liczba zamiast dziesięciu pól.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {godziny.map((godzina) => (
            <li
              key={godzina}
              className="rounded-full border border-las-200 bg-las-50 px-3 py-1.5 text-sm font-medium tabular-nums text-las-800"
            >
              {String(godzina).padStart(2, '0')}:00
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-kamien-500">
          Redakcja pisze najwyżej jedną notkę na uruchomienie i sprawdza, ile powinno ich
          dziś już istnieć. Jeśli któraś pora przepadnie — bo zabrakło ciekawych artykułów
          albo model nie odpowiedział — następne uruchomienie ją nadrobi.
        </p>
      </section>

      {ustawienia.publikowanieAutomatyczne && (
        <p className="mt-6 inline-flex max-w-2xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Publikacja automatyczna jest włączona — notki trafiają na portal bez Twojego
            przeczytania. Jeden wyjątek zostaje zawsze: notka, w której kontrola wykryła
            fragmenty przepisane ze źródła, czeka w panelu niezależnie od tego ustawienia.
          </span>
        </p>
      )}
    </>
  )
}
