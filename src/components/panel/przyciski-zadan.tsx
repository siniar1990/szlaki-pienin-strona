'use client'

import { useActionState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'

import { uruchomObchod, uruchomRedakcje, type WynikAkcji } from '@/app/panel/aktualnosci/dzialania'

/**
 * Przyciski ręcznego uruchomienia obchodu i redakcji.
 *
 * **Dlaczego to komponent kliencki, skoro akcje serwerowe działają bez niego.**
 * Bo bez informacji zwrotnej te przyciski wyglądały na zepsute. Obie czynności
 * trwają kilkanaście sekund i obie kończą się często tym, że świadomie nic nie
 * zrobiły: obchód nie znalazł nic nowego, redakcja nie znalazła nic wartego
 * notki. Strona przeładowywała się wtedy bez żadnej zmiany i jedynym
 * rozsądnym wnioskiem było „nie działa".
 *
 * Teraz przycisk mówi, co się stało — łącznie z tym, że nie stało się nic
 * i dlaczego.
 */
export function PrzyciskiZadan({ kluczDostepny }: { kluczDostepny: boolean }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-3">
        <Zadanie
          akcja={uruchomObchod}
          etykieta="Obejdź źródła teraz"
          wTrakcieEtykieta="Obchodzę źródła…"
          ikona={RefreshCw}
        />
        <Zadanie
          akcja={uruchomRedakcje}
          etykieta="Napisz notkę dnia"
          wTrakcieEtykieta="Piszę notkę…"
          ikona={Sparkles}
          glowny
          wylaczony={!kluczDostepny}
          powodWylaczenia="Ustaw KLUCZ_ANTHROPIC, żeby włączyć redakcję maszynową"
        />
      </div>
    </div>
  )
}

function Zadanie({
  akcja,
  etykieta,
  wTrakcieEtykieta,
  ikona: Ikona,
  glowny = false,
  wylaczony = false,
  powodWylaczenia,
}: {
  akcja: () => Promise<WynikAkcji>
  etykieta: string
  wTrakcieEtykieta: string
  ikona: React.ComponentType<{ className?: string }>
  glowny?: boolean
  wylaczony?: boolean
  powodWylaczenia?: string
}) {
  /*
    `useActionState` przyjmuje akcję o kształcie (stan, dane) => stan, a nasze
    akcje nie potrzebują żadnych danych z formularza. Opakowanie jest po to,
    żeby dopasować kształty, a nie żeby cokolwiek przekazać.
  */
  const [stan, wyslij, wTrakcie] = useActionState<WynikAkcji, FormData>(
    async () => akcja(),
    {},
  )

  return (
    <form action={wyslij} className="flex flex-col items-end gap-2">
      <button
        type="submit"
        disabled={wTrakcie || wylaczony}
        title={wylaczony ? powodWylaczenia : undefined}
        className={
          'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
          (glowny
            ? 'bg-las-700 text-white hover:bg-las-800'
            : 'border border-kamien-300 text-kamien-700 hover:border-las-400 hover:text-las-800')
        }
      >
        <Ikona className={`size-4 ${wTrakcie ? 'animate-spin' : ''}`} aria-hidden />
        {wTrakcie ? wTrakcieEtykieta : etykieta}
      </button>

      {(stan.ok || stan.blad) && (
        <p
          role="status"
          className={
            'max-w-[26rem] rounded-lg px-3 py-2 text-right text-xs leading-relaxed ' +
            (stan.blad ? 'bg-red-50 text-red-800' : 'bg-las-50 text-las-900')
          }
        >
          {stan.blad ?? stan.ok}
        </p>
      )}
    </form>
  )
}
