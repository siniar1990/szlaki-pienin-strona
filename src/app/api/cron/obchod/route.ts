import { NextResponse, type NextRequest } from 'next/server'

import { sprawdzZadanieCykliczne } from '@/lib/panel/zadania'
import { obejdzZrodla } from '@/lib/wiadomosci/obchod'

/**
 * Obchód źródeł co dwanaście godzin.
 *
 * **Dlaczego woła to GitHub, a nie Vercel.** Darmowy plan Vercela dopuszcza
 * wyłącznie zadania dobowe i tylko jedno — to jedno zajmuje już konserwacja
 * statystyk tabliczek. Harmonogram GitHuba nie ma tego ograniczenia i stoi
 * w repozytorium, więc widać go obok kodu, którego dotyczy. Wywołanie
 * przedstawia się tym samym sekretem, co zadania Vercela.
 *
 * **Dlaczego dwanaście godzin, a nie godzina.** Lokalne serwisy publikują
 * kilka razy dziennie, nie kilka razy na godzinę. Częstszy obchód nie
 * przyniósłby nic poza ruchem na cudzych serwerach.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(zadanie: NextRequest) {
  const odmowa = sprawdzZadanieCykliczne(zadanie)
  if (odmowa) return odmowa

  const wynik = await obejdzZrodla()
  return NextResponse.json(wynik)
}
