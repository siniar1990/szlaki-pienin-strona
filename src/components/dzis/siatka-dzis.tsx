import {
  dlugoscDniaSlownie,
  opisFazy,
  opisPogody,
  opisPowietrza,
  punktNaLuku,
  PROG_WARTY_UWAGI,
  type DaneDnia,
} from '@/lib/dzis'
import { godzina } from '@/lib/dzis/kafelki'
import { odmien } from '@/lib/format'

import {
  IkonaChmury,
  IkonaGrani,
  IkonaObiektow,
  IkonaRzeki,
  IkonaSlonca,
  IkonaWschodu,
} from './ikony'
import { MiernikUV, OdliczanieDoOtwarcia, Ozywienie } from './ozywienie'

import './kafelki.css'

/**
 * Sześć kafelków „Dziś w Pieninach".
 *
 * **Wszystko renderuje serwer.** Wartości są w HTML-u, zanim dojdzie choć
 * jeden bajt JavaScriptu — dzięki temu nie ma przeskoku układu przy wczytaniu
 * danych i nie potrzeba szkieletów ładowania. Do przeglądarki jadą tylko trzy
 * drobiazgi, które muszą żyć: włącznik ruchu, wypełnienie miernika UV
 * i odliczanie do otwarcia.
 *
 * **Kafelki nie są klikalne** — decyzja właściciela. Dlatego nie ma tu stopki
 * z odnośnikiem, którą przewidywał mockup: napis „→ prognoza godzinowa"
 * pod nieklikalną kartą obiecywałby przejście, którego nie ma.
 *
 * **Brak odczytu nie psuje siatki.** Kafelek bez danych pokazuje kreskę
 * w miejscu liczby i zachowuje wysokość; awaria jednego źródła nigdy nie
 * przestawia pozostałych pięciu.
 */

export function SiatkaDzis({ dane }: { dane: DaneDnia }) {
  return (
    <Ozywienie className="dzis-siatka">
      <KafelekSzczawnica dane={dane} />
      <KafelekGran dane={dane} />
      <KafelekDunajec dane={dane} />
      <KafelekObiekty dane={dane} />
      <KafelekSlonce dane={dane} />
      <KafelekUV dane={dane} />
    </Ozywienie>
  )
}

/* ── 1 · Szczawnica ──────────────────────────────────────────────────────── */

function KafelekSzczawnica({ dane }: { dane: DaneDnia }) {
  const { pogoda, powietrze } = dane
  const opis = pogoda ? opisPogody(pogoda.dolina.kod) : null

  /*
    Jakość powietrza jako chip, a nie osobny kafelek: smog w Szczawnicy jest
    zjawiskiem doliny, więc to jest jego naturalne miejsce. Pokazuje się tylko
    po przekroczeniu progu — chip powtarzający codziennie „powietrze dobre"
    przestałby być czytany akurat na ten jeden mroźny tydzień, kiedy ma znaczenie.
  */
  const zlePowietrze = powietrze && powietrze.indeks > PROG_WARTY_UWAGI

  return (
    <article
      className="kafelek k-sky"
      aria-label={
        pogoda
          ? `Szczawnica: ${pogoda.dolina.temperatura} stopni, ${opis!.tekst}, odczuwalna ${pogoda.dolina.odczuwalna} stopni`
          : 'Szczawnica: brak odczytu pogody'
      }
    >
      <div className="chmury" aria-hidden>
        <svg className="chmura c1" viewBox="0 0 96 40">
          <path d="M28 34a12 12 0 1 1 4-23 16 16 0 0 1 30-2 11 11 0 0 1 14 11 10 10 0 0 1-4 14z" />
        </svg>
        <svg className="chmura c2" viewBox="0 0 96 40">
          <path d="M28 34a12 12 0 1 1 4-23 16 16 0 0 1 30-2 11 11 0 0 1 14 11 10 10 0 0 1-4 14z" />
        </svg>
      </div>

      <div className="k-glowa">
        <span className="k-ikona">
          <IkonaChmury />
        </span>
        <span className="k-etykieta">Szczawnica</span>
        {zlePowietrze && <span className="k-chip">powietrze {opisPowietrza(powietrze.indeks).tekst}</span>}
      </div>

      {pogoda ? (
        <>
          <p className="k-wartosc">
            {pogoda.dolina.temperatura}
            <small>°</small>
          </p>
          <p className="k-pod">
            {opis!.tekst}
            <span className="sep">·</span>
            odczuwalna {pogoda.dolina.odczuwalna}°
          </p>
        </>
      ) : (
        <BrakOdczytu />
      )}

      <div className="k-miejsce" />
    </article>
  )
}

/* ── 2 · Trzy Korony ─────────────────────────────────────────────────────── */

function KafelekGran({ dane }: { dane: DaneDnia }) {
  const { pogoda } = dane

  /*
    Śnieg i porywy dopisane w wierszu podrzędnym zamiast osobnych kafelków —
    obie liczby dotyczą grani i mają sens dopiero razem z jej temperaturą.
    Pokazujemy je tylko po przekroczeniu progu, żeby „śnieg 0 cm" w lipcu nie
    zajmował miejsca.
  */
  const dodatki = pogoda
    ? [
        `wiatr ${pogoda.gran.wiatr} km/h`,
        pogoda.gran.snieg >= 5 ? `śnieg ${pogoda.gran.snieg} cm` : null,
        pogoda.porywy >= 45 ? `porywy ${pogoda.porywy} km/h` : null,
        '982 m n.p.m.',
      ].filter(Boolean)
    : []

  return (
    <article
      className="kafelek k-peak"
      aria-label={
        pogoda
          ? `Trzy Korony: ${pogoda.gran.temperatura} stopni na grani, wiatr ${pogoda.gran.wiatr} kilometrów na godzinę`
          : 'Trzy Korony: brak odczytu pogody'
      }
    >
      <svg className="smugi" width="52" height="26" viewBox="0 0 52 26" aria-hidden>
        <path d="M2 8 C 14 8, 20 4, 30 6" />
        <path d="M6 18 C 20 18, 28 14, 44 16" />
      </svg>

      <div className="grzbiety" aria-hidden>
        <svg className="g-tyl" viewBox="0 0 400 74" preserveAspectRatio="none">
          <path d="M0 74 L60 30 L110 52 L170 14 L230 48 L300 22 L360 50 L400 34 L400 74 Z" />
        </svg>
        <svg className="g-srodek" viewBox="0 0 400 74" preserveAspectRatio="none">
          <path d="M0 74 L40 48 L120 26 L190 56 L260 30 L330 58 L400 42 L400 74 Z" />
        </svg>
        <svg className="g-przod" viewBox="0 0 400 74" preserveAspectRatio="none">
          <path d="M0 74 L70 56 L150 40 L230 62 L310 44 L400 60 L400 74 Z" />
        </svg>
      </div>

      <div className="k-glowa">
        <span className="k-ikona">
          <IkonaGrani />
        </span>
        <span className="k-etykieta">Trzy Korony</span>
      </div>

      {pogoda ? (
        <>
          <p className="k-wartosc">
            {pogoda.gran.temperatura}
            <small>°</small>
          </p>
          <p className="k-pod">
            {dodatki.map((tekst, indeks) => (
              <span key={tekst}>
                {indeks > 0 && <span className="sep">·</span>}
                {tekst}
              </span>
            ))}
          </p>
        </>
      ) : (
        <BrakOdczytu />
      )}

      <div className="k-miejsce" />
    </article>
  )
}

/* ── 3 · Dunajec ─────────────────────────────────────────────────────────── */

function KafelekDunajec({ dane }: { dane: DaneDnia }) {
  const { dunajec, wykresDunajca } = dane

  return (
    <article
      className="kafelek k-river"
      aria-label={
        dunajec
          ? `Dunajec w Krościenku: ${dunajec.poziom} centymetrów${
              dunajec.temperaturaWody !== null
                ? `, woda ${dunajec.temperaturaWody} stopni`
                : ''
            }`
          : 'Dunajec: brak odczytu'
      }
    >
      <div className="fale" aria-hidden>
        <svg className="fala f1" viewBox="0 0 800 46" preserveAspectRatio="none">
          <path d="M0 24 C 50 12, 100 12, 150 24 S 250 36, 300 24 S 400 12, 450 24 S 550 36, 600 24 S 700 12, 750 24 L 800 24 L 800 46 L 0 46 Z" />
        </svg>
        <svg className="fala f2" viewBox="0 0 800 46" preserveAspectRatio="none">
          <path d="M0 28 C 60 18, 120 18, 180 28 S 300 38, 360 28 S 480 18, 540 28 S 660 38, 720 28 L 800 28 L 800 46 L 0 46 Z" />
        </svg>
      </div>

      <div className="k-glowa">
        <span className="k-ikona">
          <IkonaRzeki />
        </span>
        <span className="k-etykieta">Dunajec</span>
      </div>

      {dunajec ? (
        <>
          <p className="k-wartosc">
            {dunajec.poziom} <small>cm</small>
          </p>
          <p className="k-pod">
            {dunajec.stacja}
            {dunajec.temperaturaWody !== null && (
              <>
                <span className="sep">·</span>
                woda {String(dunajec.temperaturaWody).replace('.', ',')}°
              </>
            )}
          </p>
        </>
      ) : (
        <BrakOdczytu />
      )}

      <div className="k-miejsce">
        {/*
          Wykres rysujemy dopiero, gdy mamy własną historię z ostatniej doby —
          IMGW udostępnia tylko ostatni pomiar. Do tego czasu miejsce jest
          puste, ale zarezerwowane, więc kafelek nie zmieni wysokości w dniu,
          w którym wykres się pojawi.
        */}
        {wykresDunajca && (
          <svg
            className="sparkline"
            width="132"
            height="26"
            viewBox="0 0 132 26"
            role="img"
            aria-label="Poziom wody z ostatnich 24 godzin"
          >
            <polyline points={wykresDunajca.linia} />
            <circle className="teraz" cx={wykresDunajca.teraz.x} cy={wykresDunajca.teraz.y} r="4" />
          </svg>
        )}
      </div>
    </article>
  )
}

/* ── 4 · Obiekty ─────────────────────────────────────────────────────────── */

function KafelekObiekty({ dane }: { dane: DaneDnia }) {
  const wSezonie = dane.obiekty.filter((stan) => stan.stan !== 'poza-sezonem')
  const otwarte = wSezonie.filter((stan) => stan.stan === 'otwarte').length

  const najblizsze = wSezonie
    .filter((stan) => stan.stan === 'przed-otwarciem' && stan.dzisiaj)
    .map((stan) => stan.dzisiaj!.otwarcie)
    .sort((a, b) => a - b)[0]

  return (
    <article
      className="kafelek k-open"
      aria-label={`Obiekty: ${otwarte} z ${wSezonie.length} otwartych${
        najblizsze !== undefined ? `, pierwszy otwiera się o ${najblizsze}:00` : ''
      }`}
    >
      <div className="k-glowa">
        <span className="k-ikona">
          <IkonaObiektow />
        </span>
        <span className="k-etykieta">
          {odmien(wSezonie.length, ['obiekt otwarty', 'obiekty otwarte', 'obiektów otwartych'])}
        </span>
      </div>

      {wSezonie.length > 0 ? (
        <>
          <p className="k-wartosc">
            {otwarte} <small>z {wSezonie.length}</small>
          </p>
          <p className="k-pod">
            {najblizsze !== undefined ? (
              <>
                pierwszy otwiera się o {najblizsze}:00
                <span className="sep">·</span>
                <OdliczanieDoOtwarcia
                  otwarcieGodzina={najblizsze}
                  poczatkowe={odliczanieZSerwera(najblizsze, dane.odczyt)}
                />
              </>
            ) : otwarte > 0 ? (
              'zamki, muzea i atrakcje'
            ) : (
              'dziś już wszystkie zamknięte'
            )}
          </p>

          <div className="kropki" aria-hidden>
            {wSezonie.map((stan) => (
              <span
                key={stan.obiekt.slug}
                className={[
                  'kropka',
                  stan.stan === 'otwarte' ? 'otwarty' : '',
                  stan.stan === 'przed-otwarciem' && stan.dzisiaj?.otwarcie === najblizsze
                    ? 'nastepny'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))}
          </div>
        </>
      ) : (
        <BrakOdczytu />
      )}

      <div className="k-miejsce" />
    </article>
  )
}

/**
 * Odliczanie policzone na serwerze — trafia do HTML-u, zanim dojdzie
 * JavaScript. Klient przelicza je potem co pół minuty.
 */
function odliczanieZSerwera(otwarcieGodzina: number, odczyt: Date): string {
  const czesci = new Intl.DateTimeFormat('pl-PL', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone: 'Europe/Warsaw',
  }).formatToParts(odczyt)

  const liczba = (typ: string) => Number(czesci.find((c) => c.type === typ)?.value ?? 0)
  const zostalo = otwarcieGodzina * 60 - ((liczba('hour') % 24) * 60 + liczba('minute'))

  if (zostalo <= 0) return 'właśnie się otwiera'
  return zostalo >= 60
    ? `za ${Math.floor(zostalo / 60)} h ${zostalo % 60} min`
    : `za ${zostalo} min`
}

/* ── 5 · Słońce ──────────────────────────────────────────────────────────── */

function KafelekSlonce({ dane }: { dane: DaneDnia }) {
  const { slonce, pogoda } = dane
  const noc = slonce ? slonce.faza !== 'dzien' : false
  const punkt = slonce ? punktNaLuku(slonce.postep) : { x: 8, y: 30 }

  /*
    Przed świtem pokazujemy wschód, w ciągu dnia i po zmierzchu — zachód.
    To jest ta liczba, po którą ktoś tu przychodzi: rano „o której się
    rozjaśni", po południu „ile mam jeszcze światła".
  */
  const przedSwitem = slonce?.faza === 'przed-switem'
  const wartosc = slonce ? godzina(przedSwitem ? slonce.wschod : slonce.zachod) : null

  return (
    <article
      className="kafelek k-dawn"
      aria-label={
        slonce
          ? `${przedSwitem ? 'Wschód' : 'Zachód'} słońca o ${wartosc}, ${dlugoscDniaSlownie(slonce.dlugoscDnia)} światła dziennego`
          : 'Słońce: brak odczytu'
      }
    >
      {/* Gwiazdy tylko wtedy, gdy naprawdę są na niebie. */}
      {noc && (
        <div className="gwiazdy" aria-hidden>
          <span className="gwiazda" style={{ top: 22, right: 34 }} />
          <span className="gwiazda g2" style={{ top: 44, right: 78 }} />
          <span className="gwiazda g3" style={{ top: 30, right: 120 }} />
        </div>
      )}

      <div className="k-glowa">
        <span className="k-ikona">
          <IkonaWschodu />
        </span>
        <span className="k-etykieta">{przedSwitem ? 'wschód słońca' : 'zachód słońca'}</span>
      </div>

      {slonce && pogoda ? (
        <>
          <p className="k-wartosc godzina">{wartosc}</p>
          <p className="k-pod">
            {opisFazy(slonce.faza)}
            <span className="sep">·</span>
            {dlugoscDniaSlownie(slonce.dlugoscDnia)} światła
          </p>
        </>
      ) : (
        <BrakOdczytu />
      )}

      <div className="k-miejsce">
        {slonce && (
          <svg className="luk" width="150" height="34" viewBox="0 0 150 34" aria-hidden>
            <path className="tor" d="M8 30 A 113 113 0 0 1 142 30" />
            <line className="horyzont" x1="0" y1="30" x2="150" y2="30" />
            <circle className="poswiata" cx={punkt.x} cy={punkt.y} r="9" />
            <circle className="slonce" cx={punkt.x} cy={punkt.y} r="4.5" />
          </svg>
        )}
      </div>
    </article>
  )
}

/* ── 6 · UV ──────────────────────────────────────────────────────────────── */

/** Skala miernika kończy się na 11+; wyżej pasek jest po prostu pełny. */
const SKALA_UV = 11

export function progUV(uv: number): { tekst: string; zalecenie: string; alert: boolean } {
  if (uv <= 2) return { tekst: 'niski', zalecenie: 'ochrona niepotrzebna', alert: false }
  if (uv <= 5) return { tekst: 'umiarkowany', zalecenie: 'w południe szukaj cienia', alert: false }
  if (uv <= 7) return { tekst: 'wysoki', zalecenie: 'krem i nakrycie głowy', alert: true }
  if (uv <= 10) return { tekst: 'bardzo wysoki', zalecenie: 'unikaj słońca 11–16', alert: true }
  return { tekst: 'ekstremalny', zalecenie: 'zostań w cieniu', alert: true }
}

function KafelekUV({ dane }: { dane: DaneDnia }) {
  const { pogoda } = dane
  if (!pogoda) {
    return (
      <article className="kafelek k-uv" aria-label="Indeks UV: brak odczytu">
        <div className="k-glowa">
          <span className="k-ikona">
            <IkonaSlonca />
          </span>
          <span className="k-etykieta">indeks UV</span>
        </div>
        <BrakOdczytu />
        <div className="k-miejsce" />
      </article>
    )
  }

  /*
    Pokazujemy szczyt dnia, a nie wartość bieżącą: o siódmej rano UV wynosi
    zero i kafelek mówiłby „ochrona niepotrzebna" komuś, kto właśnie wychodzi
    na całodniową grań. Bieżąca wartość stoi w wierszu podrzędnym.
  */
  const prog = progUV(pogoda.uv)
  const poziom = Math.min(100, (pogoda.uv / SKALA_UV) * 100)

  return (
    <article
      className={`kafelek k-uv${prog.alert ? ' alert' : ''}`}
      aria-label={`Indeks UV ${pogoda.uv} — ${prog.tekst}. ${prog.zalecenie}`}
    >
      <svg
        className="uv-slonce"
        width="46"
        height="46"
        viewBox="0 0 46 46"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <g>
          <path d="M23 4v5M23 37v5M4 23h5M37 23h5M9.6 9.6l3.5 3.5M32.9 32.9l3.5 3.5M36.4 9.6l-3.5 3.5M13.1 32.9l-3.5 3.5" />
        </g>
      </svg>

      <div className="k-glowa">
        <span className="k-ikona">
          <IkonaSlonca />
        </span>
        <span className="k-etykieta">indeks UV</span>
        {pogoda.szczytUV && (
          <span className="k-chip">
            szczyt {pogoda.szczytUV.od}–{pogoda.szczytUV.do}
          </span>
        )}
      </div>

      <p className="k-wartosc">UV {pogoda.uv}</p>
      <p className="k-pod">
        {prog.tekst}
        <span className="sep">·</span>
        {prog.zalecenie}
      </p>

      <div className="k-miejsce">
        <MiernikUV
          poziom={poziom}
          opis={`Indeks UV ${pogoda.uv} na ${SKALA_UV} — ${prog.tekst}`}
        />
      </div>
    </article>
  )
}

/* ── stan zastępczy ──────────────────────────────────────────────────────── */

/**
 * Kafelek bez odczytu.
 *
 * Kreska zamiast liczby i zdanie o tym, co się stało. Nigdy wartość ostatnio
 * znana bez oznaczenia ani — tym bardziej — przykładowa: liczba na tym kafelku
 * jest podstawą decyzji o wyjściu w góry.
 */
function BrakOdczytu() {
  return (
    <>
      <p className="k-wartosc brak" aria-hidden>
        —
      </p>
      <p className="k-pod">brak odczytu ze źródła</p>
    </>
  )
}
