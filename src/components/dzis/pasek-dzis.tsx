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
import { Ozywienie } from './ozywienie'
import { progUV } from './siatka-dzis'

import './kafelki.css'

/**
 * Pasek warunków na stronie głównej.
 *
 * **Te same odczyty i te same barwy co na `/dzis`, bez mikroilustracji.**
 * Chmury, fale i grzbiety mają sens w karcie wysokiej na dwieście pikseli;
 * w pasku wysokim na pięćdziesiąt zamieniłyby się w migający szum tuż pod
 * sekcją powitalną. Z ruchu zostaje jedna rzecz — kropka „na żywo", która
 * mówi, że to nie jest statyczna grafika.
 *
 * **Każdy mini-kafelek prowadzi do `/dzis`**, bo to jest cała jego rola:
 * pokazać, że portal wie, co się dzieje teraz, i wpuścić dalej.
 *
 * **Ramka alertowa dokładnie tam, gdzie na dużym odpowiedniku** — przy wysokim
 * UV. Gdyby pasek pokazywał spokój, a strona `/dzis` ostrzeżenie, przestałby
 * cokolwiek znaczyć.
 */

type Mini = {
  klucz: string
  klasa: string
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

export function PasekDzis({ dane }: { dane: DaneDnia }) {
  const kafelki = zbierz(dane)
  if (kafelki.length === 0) return null

  return (
    <section aria-labelledby="pasek-dzis-naglowek" className="border-y border-kamien-200 bg-kamien-50">
      <div className="obszar py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2
            id="pasek-dzis-naglowek"
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
          Przewijanie w poziomie ze snapem zamiast zawijania: sześć kafelków
          w drugim rzędzie zrobiłoby z paska drugą sekcję, a to ma być jeden
          rzut oka po drodze do reszty strony.
        */}
        <Ozywienie className="dzis-pasek mt-4">
          {kafelki.map((mini) => (
            <Link
              key={mini.klucz}
              href="/dzis"
              className={`mini ${mini.klasa}${mini.alert ? ' alert' : ''}`}
              aria-label={`${mini.opis} — zobacz pełne warunki`}
            >
              <span className="mini-ikona">{mini.ikona}</span>
              <span className="mini-tresc">
                <span className="mini-wartosc">{mini.wartosc}</span>
                <span className="mini-etykieta">{mini.etykieta}</span>
              </span>
            </Link>
          ))}
        </Ozywienie>
      </div>
    </section>
  )
}

/**
 * Które odczyty trafiają do paska.
 *
 * Kafelek bez danych po prostu nie powstaje — w pasku nie ma miejsca na
 * kreskę i wyjaśnienie, a sześć pozycji z jedną pustą wygląda na usterkę.
 * Na `/dzis` jest odwrotnie: tam brak odczytu trzeba pokazać wprost.
 */
function zbierz(dane: DaneDnia): Mini[] {
  const { pogoda, dunajec, powietrze, slonce } = dane
  const kafelki: Mini[] = []

  if (pogoda) {
    kafelki.push({
      klucz: 'szczawnica',
      klasa: 'k-sky',
      ikona: <IkonaChmury />,
      wartosc: `${pogoda.dolina.temperatura}°`,
      etykieta: `Szczawnica · ${opisPogody(pogoda.dolina.kod).tekst}`,
      opis: `Szczawnica: ${pogoda.dolina.temperatura} stopni, ${opisPogody(pogoda.dolina.kod).tekst}`,
      alert: Boolean(powietrze && powietrze.indeks > PROG_WARTY_UWAGI),
    })

    kafelki.push({
      klucz: 'gran',
      klasa: 'k-peak',
      ikona: <IkonaGrani />,
      wartosc: `${pogoda.gran.temperatura}°`,
      etykieta: `Trzy Korony · wiatr ${pogoda.gran.wiatr} km/h`,
      opis: `Trzy Korony: ${pogoda.gran.temperatura} stopni, wiatr ${pogoda.gran.wiatr} kilometrów na godzinę`,
    })
  }

  if (dunajec) {
    kafelki.push({
      klucz: 'dunajec',
      klasa: 'k-river',
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
      klasa: 'k-open',
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
      klasa: 'k-dawn',
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
      klasa: 'k-uv',
      ikona: <IkonaSlonca />,
      wartosc: `UV ${pogoda.uv}`,
      etykieta: prog.tekst,
      opis: `Indeks UV ${pogoda.uv} — ${prog.tekst}`,
      alert: prog.alert,
    })
  }

  return kafelki
}
