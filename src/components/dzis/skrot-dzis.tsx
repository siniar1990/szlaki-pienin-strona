import Link from 'next/link'

import { godzina } from '@/lib/dzis/kafelki'
import { opisPogody, PROG_WARTY_UWAGI, type DaneDnia } from '@/lib/dzis'

import {
  IkonaChmury,
  IkonaGrani,
  IkonaObiektow,
  IkonaRzeki,
  IkonaSlonca,
  IkonaWschodu,
} from './ikony'
import { progUV } from './siatka-dzis'

import './kafelki.css'

/**
 * Warunki w Pieninach na stronie głównej — sześć odczytów w siatce trzy na dwa.
 *
 * **Te same dane co na `/dzis`, ale bez mikroilustracji.** Chmury, fale i luk
 * słońca mają sens w karcie wysokiej na dwieście pikseli, na stronie
 * poświęconej wyłącznie warunkom. Tutaj są przystankiem w drodze do reszty
 * portalu i nie mogą zajmować pół ekranu — sześć pełnych kafelków spychało
 * kategorie tras poniżej krawędzi.
 *
 * **Siatka, nie pasek.** Przewijanie w poziomie na stronie przewijanej w pionie
 * jest ruchem, o którym trzeba wiedzieć; szósty kafelek czekał wtedy za
 * krawędzią, aż ktoś się domyśli. Wszystkie sześć widać naraz i nic się nie
 * chowa.
 *
 * **Kafelek bez danych po prostu nie powstaje.** W skrócie nie ma miejsca na
 * kreskę i wyjaśnienie; na `/dzis` jest odwrotnie — tam brak odczytu trzeba
 * pokazać wprost, bo to jest strona o odczytach.
 */

type Mini = {
  klucz: string
  ikona: React.ReactNode
  wartosc: string
  etykieta: string
  /**
   * Zdanie dla czytnika ekranu.
   *
   * Osobne od pary „wartość + etykieta", bo te dwie są układem graficznym:
   * duża liczba, pod nią drobny podpis. Sklejone w jedno czytają się wspak
   * („Szczawnica · bezchmurnie: 19 stopni”), a to jest zdanie, którego nikt
   * nie wypowiedziałby na głos.
   */
  opis: string
  alert?: boolean
}

export function SkrotDzis({ dane }: { dane: DaneDnia }) {
  const kafelki = zbierz(dane)
  if (kafelki.length === 0) return null

  return (
    <section aria-labelledby="skrot-dzis-naglowek" className="border-y border-kamien-200 bg-white">
      <div className="obszar py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2
            id="skrot-dzis-naglowek"
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-las-800"
          >
            <span className="zywa-kropka" aria-hidden />
            Dziś w Pieninach
          </h2>
          <p className="text-xs text-kamien-500">
            ostatni odczyt {godzina(dane.odczyt)}
            <span className="mx-2" aria-hidden>
              ·
            </span>
            <Link href="/dzis" className="font-medium text-las-700 hover:underline">
              pełne warunki
            </Link>
          </p>
        </div>

        {/*
          Trzy kolumny na komputerze, dwie na tablecie, jedna na telefonie —
          ten sam podział co siatka na `/dzis`, żeby oba widoki łamały się
          w tych samych miejscach.
        */}
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kafelki.map((mini) => (
            <li key={mini.klucz}>
              <Link
                href="/dzis"
                aria-label={`${mini.opis} — zobacz pełne warunki`}
                className={`flex items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 transition-colors hover:border-las-300 ${
                  mini.alert ? 'border-amber-300' : 'border-kamien-200'
                }`}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-las-50 text-las-700 [&_svg]:size-4"
                  aria-hidden
                >
                  {mini.ikona}
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-tight text-kamien-900 tabular-nums">
                    {mini.wartosc}
                  </span>
                  <span className="block truncate text-xs leading-tight text-kamien-500">
                    {mini.etykieta}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function zbierz(dane: DaneDnia): Mini[] {
  const { pogoda, dunajec, powietrze, slonce } = dane
  const kafelki: Mini[] = []

  if (pogoda) {
    kafelki.push({
      klucz: 'szczawnica',
      ikona: <IkonaChmury />,
      wartosc: `${pogoda.dolina.temperatura}°`,
      etykieta: `Szczawnica · ${opisPogody(pogoda.dolina.kod).tekst}`,
      opis: `Szczawnica: ${pogoda.dolina.temperatura} stopni, ${opisPogody(pogoda.dolina.kod).tekst}`,
      alert: Boolean(powietrze && powietrze.indeks > PROG_WARTY_UWAGI),
    })

    kafelki.push({
      klucz: 'gran',
      ikona: <IkonaGrani />,
      wartosc: `${pogoda.gran.temperatura}°`,
      etykieta: `Trzy Korony · wiatr ${pogoda.gran.wiatr} km/h`,
      opis: `Trzy Korony: ${pogoda.gran.temperatura} stopni, wiatr ${pogoda.gran.wiatr} kilometrów na godzinę`,
    })
  }

  if (dunajec) {
    kafelki.push({
      klucz: 'dunajec',
      ikona: <IkonaRzeki />,
      wartosc: `${dunajec.poziom} cm`,
      etykieta: `Dunajec · ${dunajec.stacja}`,
      opis: `Dunajec w ${dunajec.stacja}: ${dunajec.poziom} centymetrów`,
    })
  }

  const wSezonie = dane.obiekty.filter((stan) => stan.stan !== 'poza-sezonem')
  if (wSezonie.length > 0) {
    kafelki.push({
      klucz: 'obiekty',
      ikona: <IkonaObiektow />,
      wartosc: `${wSezonie.filter((s) => s.stan === 'otwarte').length} z ${wSezonie.length}`,
      etykieta: 'obiektów otwartych',
      opis: `Otwartych obiektów: ${wSezonie.filter((s) => s.stan === 'otwarte').length} z ${wSezonie.length}`,
    })
  }

  if (slonce) {
    const przedSwitem = slonce.faza === 'przed-switem'
    kafelki.push({
      klucz: 'slonce',
      ikona: <IkonaWschodu />,
      wartosc: godzina(przedSwitem ? slonce.wschod : slonce.zachod),
      etykieta: przedSwitem ? 'wschód słońca' : 'zachód słońca',
      opis: `${przedSwitem ? 'Wschód' : 'Zachód'} słońca o ${godzina(przedSwitem ? slonce.wschod : slonce.zachod)}`,
    })
  }

  if (pogoda) {
    const prog = progUV(pogoda.uv)
    kafelki.push({
      klucz: 'uv',
      ikona: <IkonaSlonca />,
      wartosc: `UV ${pogoda.uv}`,
      etykieta: prog.tekst,
      opis: `Indeks UV ${pogoda.uv} — ${prog.tekst}`,
      alert: prog.alert,
    })
  }

  return kafelki
}
