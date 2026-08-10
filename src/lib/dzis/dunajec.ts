/**
 * Stan wody na Dunajcu.
 *
 * **Dlaczego to jest tu najważniejsza liczba po pogodzie.** Dunajec jest
 * powodem, dla którego połowa turystów w ogóle przyjeżdża w Pieniny. Przy
 * wysokiej wodzie spływ tratwami i pontonami zostaje wstrzymany, kajaki nie
 * wypływają, a plaże nad Czorsztyńskim znikają. Nikt tego w jednym miejscu
 * nie podaje — a dane są publiczne i darmowe.
 *
 * **Skąd.** Instytut Meteorologii i Gospodarki Wodnej udostępnia odczyty
 * wszystkich stacji w otwartym interfejsie, bez klucza i bez limitu.
 * Bierzemy Krościenko, bo leży w środku pienińskiego odcinka rzeki —
 * poniżej przełomu i powyżej ujścia Grajcarka.
 *
 * **Czego świadomie NIE robimy: nie mówimy „spływ dziś płynie".** Decyzję
 * o wstrzymaniu podejmuje Polskie Stowarzyszenie Flisaków, a nie liczba
 * z wodowskazu, i nie ma jej w żadnym interfejsie. Podanie własnego progu
 * byłoby zgadywaniem, na podstawie którego ktoś przejechałby trzysta
 * kilometrów. Pokazujemy stan i zostawiamy ocenę tym, którzy ją podejmują.
 */

const ADRES = 'https://danepubliczne.imgw.pl/api/data/hydro/'

/** Nazwa stacji tak, jak nazywa ją IMGW. */
const STACJA = 'Krościenko'

export type StanDunajca = {
  stacja: string
  /** Stan wody w centymetrach na wodowskazie. */
  poziom: number
  /** Temperatura wody, jeśli stacja ją mierzy. */
  temperaturaWody: number | null
  pomiar: Date
}

type WierszApi = {
  stacja?: string
  rzeka?: string
  stan_wody?: string | null
  stan_wody_data_pomiaru?: string | null
  temperatura_wody?: string | null
}

export async function pobierzStanDunajca(): Promise<StanDunajca | null> {
  try {
    const odpowiedz = await fetch(ADRES, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!odpowiedz.ok) throw new Error(`IMGW: ${odpowiedz.status}`)

    const dane = (await odpowiedz.json()) as WierszApi[]
    const wiersz = dane.find(
      (stacja) =>
        stacja.stacja === STACJA && (stacja.rzeka ?? '').toLowerCase().includes('dunajec'),
    )
    if (!wiersz?.stan_wody) return null

    const poziom = Number(wiersz.stan_wody)
    if (!Number.isFinite(poziom)) return null

    /*
      Data pomiaru bywa nieaktualna — część stacji przestaje raportować na
      całe miesiące i zwraca wtedy ostatni znany odczyt sprzed roku. Wartość
      sprzed doby jest bezużyteczna, a podana bez ostrzeżenia myląca, więc
      taką odrzucamy zamiast pokazywać.
    */
    const pomiar = wiersz.stan_wody_data_pomiaru
      ? new Date(wiersz.stan_wody_data_pomiaru.replace(' ', 'T'))
      : null
    if (!pomiar || Number.isNaN(pomiar.getTime())) return null
    if (Date.now() - pomiar.getTime() > 24 * 60 * 60 * 1000) return null

    const temperatura = wiersz.temperatura_wody ? Number(wiersz.temperatura_wody) : null

    return {
      stacja: STACJA,
      poziom: Math.round(poziom),
      temperaturaWody: temperatura !== null && Number.isFinite(temperatura) ? temperatura : null,
      pomiar,
    }
  } catch (blad) {
    console.error('Nie udało się pobrać stanu Dunajca:', blad)
    return null
  }
}
