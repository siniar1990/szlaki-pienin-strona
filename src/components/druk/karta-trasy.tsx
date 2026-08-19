import type { DaneKarty } from '@/lib/druk/dane-karty'
import { SZEROKOSC as SZEROKOSC_MAPY, WYSOKOSC as WYSOKOSC_MAPY, nazwaBarwy } from '@/lib/druk/mapa'
import { SZEROKOSC as SZEROKOSC_PROFILU, WYSOKOSC as WYSOKOSC_PROFILU } from '@/lib/druk/profil'
import { KOLOR_BEZ_ZNAKOWANIA, hexBarwy } from '@/lib/mapa/barwy-szlakow'
import { kreskaBarwy } from '@/lib/druk/mapa'

/**
 * Karta trasy A4 — jedna strona, cztery panele, po złożeniu na dwa razy A6.
 *
 * **Kolejność paneli jest ustalona i nie wolno jej zmieniać:**
 *
 *   lewy górny  — okładka z mapą     prawy górny — punkty i profil
 *   lewy dolny  — opis po odcinkach  prawy dolny — praktyczne, GOPR, QR
 *
 * Lewy górny jest tym, co widać po złożeniu kartki — dlatego mapa siedzi
 * właśnie tam. Przestawienie paneli znaczyłoby, że po złożeniu na wierzchu
 * ląduje spis punktów, czyli rzecz, do której zagląda się co pół godziny,
 * zamiast tej, na którą patrzy się na rozdrożu.
 *
 * Komponent jest czysto prezentacyjny: cały rachunek siedzi w `daneKarty`.
 * Dzięki temu ten sam kod składa podgląd HTML i PDF budowany skryptem —
 * dwa renderowania nie mają jak się rozjechać.
 */

/**
 * Próbka w legendzie rysuje dokładnie to, co widać na mapie — z kreskowaniem
 * włącznie. Legenda pokazująca ciągłą kreskę przy kreskowanym szlaku byłaby
 * gorsza niż jej brak: kazałaby szukać na mapie czegoś, czego tam nie ma.
 */
function probkaLegendy(barwa: string | null): React.CSSProperties {
  const kolor = barwa === null ? KOLOR_BEZ_ZNAKOWANIA : hexBarwy(barwa)
  const kreska = kreskaBarwy(barwa)

  if (!kreska) {
    return {
      background: kolor,
      outline: barwa === 'zolty' ? '0.3pt solid #5a4a00' : undefined,
    }
  }

  // Wzór z mapy podany w jednostkach rysunku; w legendzie odwzorowujemy jego
  // proporcje, nie wartości — próbka ma 5 mm, mapa tysiąc jednostek.
  const [kreskaDl, przerwa] = kreska.split(' ').map(Number)
  const skala = 0.045
  return {
    background: `repeating-linear-gradient(90deg, ${kolor} 0 ${(kreskaDl * skala).toFixed(2)}mm, transparent ${(kreskaDl * skala).toFixed(2)}mm ${((kreskaDl + przerwa) * skala).toFixed(2)}mm)`,
  }
}

const GOPR = '601 100 300'
const GOPR_SKROCONY = '985'

export function KartaTrasy({
  dane,
  oszczednie = false,
}: {
  dane: DaneKarty
  /** Blok „Ratunek w górach" bez wypełnienia — mniej tuszu, ta sama treść. */
  oszczednie?: boolean
}) {
  return (
    <div className={`karta${oszczednie ? ' oszczednie' : ''}`}>
      <div className="arkusz">
        <PanelOkladki dane={dane} />
        <PanelPunktow dane={dane} />
        <PanelOpisu dane={dane} />
        <PanelPraktyczny dane={dane} />

        <div className="zagiecie zagiecie-pion" aria-hidden />
        <div className="zagiecie zagiecie-poziom" aria-hidden />
        <div className="zagiecie-podpis zagiecie-podpis-1" aria-hidden>
          zagięcie
        </div>
        <div className="zagiecie-podpis zagiecie-podpis-2" aria-hidden>
          zagięcie
        </div>
      </div>
    </div>
  )
}

/* ── Lewy górny: okładka z mapą ──────────────────────────────────────── */

function PanelOkladki({ dane }: { dane: DaneKarty }) {
  const { mapa } = dane

  return (
    <section className="panel" data-panel="okladka">
      <p className="nadtytul">Szlaki Pienin · karta trasy</p>
      <h1>{dane.nazwa}</h1>
      <p className="podtytul">{dane.podtytul}</p>

      <div className="plakietki">
        {dane.metryki.map((metryka) => (
          <span
            key={metryka.etykieta}
            className={`plakietka${metryka.wyrozniona ? ' plakietka-mocna' : ''}`}
          >
            {metryka.etykieta}
          </span>
        ))}
      </div>

      <div className="mapa">
        {mapa ? (
          <svg
            viewBox={`0 0 ${SZEROKOSC_MAPY} ${WYSOKOSC_MAPY}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={mapa.opis}
          >
            <defs>
              <pattern id="siatka" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M100 0 L0 0 0 100" fill="none" stroke="#F1F0EC" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width={SZEROKOSC_MAPY} height={WYSOKOSC_MAPY} fill="url(#siatka)" />

            <g fill="none" strokeLinejoin="round" strokeLinecap="round">
              {/*
                Biała aureola pod każdą kolorową linią. Bez niej trasa
                krzyżująca samą siebie zlewa się w plamę i nie widać, który
                odcinek przechodzi górą.
              */}
              {mapa.odcinki.map((odcinek, i) => (
                <path key={`aureola-${i}`} d={odcinek.d} stroke="#fff" strokeWidth={18} />
              ))}

              {/* Ciemny obrys wyłącznie pod żółtym — na białym papierze sam ginie. */}
              {mapa.odcinki.map((odcinek, i) =>
                odcinek.zObrysem ? (
                  <path key={`obrys-${i}`} d={odcinek.d} stroke="#5a4a00" strokeWidth={13} />
                ) : null,
              )}

              {mapa.odcinki.map((odcinek, i) => (
                <path
                  key={`odcinek-${i}`}
                  d={odcinek.d}
                  stroke={odcinek.hex}
                  strokeWidth={odcinek.barwa === null ? 8 : 9}
                  strokeDasharray={odcinek.kreska}
                />
              ))}
            </g>

            {mapa.znaczniki.map((znacznik) => (
              <g key={znacznik.numer}>
                <circle
                  cx={znacznik.x}
                  cy={znacznik.y}
                  r={17}
                  fill="#fff"
                  stroke="#14211c"
                  strokeWidth={4}
                />
                <text x={znacznik.x} y={znacznik.y + 7} className="mapa-numer">
                  {znacznik.numer}
                </text>
                <text
                  x={znacznik.podpisX}
                  y={znacznik.podpisY}
                  className="mapa-podpis"
                  textAnchor={znacznik.kotwica}
                >
                  {znacznik.nazwa}
                </text>
              </g>
            ))}

            <g transform={`translate(70, ${WYSOKOSC_MAPY - 55})`}>
              <line
                x1={0}
                y1={0}
                x2={mapa.podzialka.dlugoscPx}
                y2={0}
                stroke="#14211c"
                strokeWidth={4}
              />
              <line x1={0} y1={-8} x2={0} y2={8} stroke="#14211c" strokeWidth={4} />
              <line
                x1={mapa.podzialka.dlugoscPx}
                y1={-8}
                x2={mapa.podzialka.dlugoscPx}
                y2={8}
                stroke="#14211c"
                strokeWidth={4}
              />
              <text
                x={mapa.podzialka.dlugoscPx / 2}
                y={-16}
                className="mapa-podpis"
                textAnchor="middle"
              >
                {mapa.podzialka.etykieta}
              </text>
            </g>

            <g transform={`translate(${SZEROKOSC_MAPY - 70}, 75)`} aria-hidden>
              <path d="M0 -30 L11 16 L0 6 L-11 16 Z" fill="#14211c" />
              <text x={0} y={42} className="mapa-podpis" textAnchor="middle">
                N
              </text>
            </g>
          </svg>
        ) : (
          <p className="mapa-zrodlo" style={{ position: 'static', padding: '4mm' }}>
            Ślad tej trasy czeka na zdigitalizowanie — przebieg znajdziesz w opisie odcinków.
          </p>
        )}
        <div className="mapa-zrodlo">© OpenStreetMap contributors · ślad {dane.id}</div>
      </div>

      {mapa && mapa.barwyWystepujace.length > 0 && (
        <div className="legenda">
          {mapa.barwyWystepujace.map((barwa) => (
            <span key={barwa ?? 'brak'}>
              <i
                className="probka"
                aria-hidden
                style={probkaLegendy(barwa)}
              />
              {nazwaBarwy(barwa)}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

/* ── Prawy górny: punkty i profil ────────────────────────────────────── */

const ZNACZNIKI: Record<string, string> = {
  start: 'start',
  meta: 'meta',
  max: 'max',
  schron: 'schron',
}

function PanelPunktow({ dane }: { dane: DaneKarty }) {
  /*
    Od dwunastu punktów tabela idzie na dwie kolumny zamiast zjeżdżać
    z rozmiarem pisma — patrz `karta.css`.

    Próg wzięty z danych, nie z sufitu: w całym przewodniku dokładnie jedna
    trasa ma więcej niż dziesięć punktów — „Diament Pienin" ma ich dwanaście,
    w tym nazwy po trzydzieści siedem znaków. Przy progu „powyżej dwunastu"
    wypadała tuż pod nim i jako jedyna z pięćdziesięciu czterech nie mieściła
    się w panelu.
  */
  const dwieKolumny = dane.punkty.length >= 12

  return (
    <section className="panel" data-panel="punkty">
      <p className="naglowek-panelu">
        Punkty na trasie <span>{dane.punkty.length} punktów</span>
      </p>

      <div className={dwieKolumny ? 'punkty-dwie-kolumny' : undefined}>
        <table>
          <thead>
            <tr>
              <th className="lewo" scope="col">
                Punkt
              </th>
              <th scope="col">m n.p.m.</th>
              <th scope="col">czas</th>
            </tr>
          </thead>
          <tbody>
            {dane.punkty.map((punkt) => (
              <tr key={punkt.numer}>
                <td className="lewo">
                  <span className="numer">{punkt.numer}</span>
                  <span className="nazwa-punktu">{punkt.nazwa}</span>
                  {punkt.znacznik && <span className="znacznik">{ZNACZNIKI[punkt.znacznik]}</span>}
                </td>
                <td className="wysokosc">{punkt.wysokoscM ?? '—'}</td>
                <td className="czas">{punkt.czas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dane.profil && (
        <div className="profil">
          <p className="naglowek-panelu" style={{ marginBottom: '2mm' }}>
            Profil wysokości <span>↑ {dane.sumaPodejscM} m</span>
          </p>
          <svg
            viewBox={`0 0 ${SZEROKOSC_PROFILU} ${WYSOKOSC_PROFILU}`}
            preserveAspectRatio="none"
            style={{ height: '30mm' }}
            role="img"
            aria-label={`Profil wysokości od ${dane.profil.minM} do ${dane.profil.maxM} metrów nad poziomem morza.`}
          >
            <defs>
              <linearGradient id="wypelnienie-profilu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1E8A3C" stopOpacity=".18" />
                <stop offset="1" stopColor="#1E8A3C" stopOpacity=".02" />
              </linearGradient>
            </defs>
            <line
              x1={0}
              y1={dane.profil.podstawaY}
              x2={SZEROKOSC_PROFILU}
              y2={dane.profil.podstawaY}
              stroke="#d8d3c8"
              strokeWidth={2}
            />
            <path d={dane.profil.wypelnienie} fill="url(#wypelnienie-profilu)" />
            <path
              d={dane.profil.linia}
              fill="none"
              stroke="#1E8A3C"
              strokeWidth={5}
              strokeLinejoin="round"
            />
            {dane.profil.kropki.map((kropka, i) => (
              <circle
                key={i}
                cx={kropka.x}
                cy={kropka.y}
                r={5}
                fill="#fff"
                stroke="#1E8A3C"
                strokeWidth={3.5}
              />
            ))}
            {dane.profil.podpisy.map((podpis, i) => (
              <text
                key={i}
                x={podpis.x}
                y={286}
                className="profil-podpis"
                textAnchor={podpis.kotwica}
              >
                {podpis.tekst}
              </text>
            ))}
            {dane.profil.najwyzszy && (
              <text
                x={dane.profil.najwyzszy.x}
                y={Math.max(dane.profil.najwyzszy.y - 14, 16)}
                className="profil-wysokosc"
                textAnchor="middle"
              >
                {dane.profil.najwyzszy.tekst}
              </text>
            )}
          </svg>
        </div>
      )}

      {/*
        Te dwa bloki są jedyną rzeczą w panelu, którą wolno poświęcić.
        Tabeli punktów i profilu nie ruszamy — po nie się tu zagląda. Kolejność
        w kodzie jest kolejnością cięcia: najpierw znika nota o metodzie,
        potem ramka „Start i meta". Nota mówi, skąd wzięły się liczby;
        w terenie jest to ciekawostka, nie narzędzie.
      */}
      <div data-skracalne>
        <div className="ramka" style={{ marginTop: '3.5mm' }}>
          <h4>Start i meta</h4>
          <p>{dane.startMeta}</p>
        </div>

        <p className="stopka-panelu">
          Czasy przejścia wg przewodnika, dla przeciętnego tempa, bez postojów. Wysokości
          z modelu terenu. Kalorie liczone dla 70 kg.
        </p>
      </div>
    </section>
  )
}

/* ── Lewy dolny: opis po odcinkach ───────────────────────────────────── */

function PanelOpisu({ dane }: { dane: DaneKarty }) {
  const maWskazowki = dane.odcinki.some((o) => o.wskazowka)

  return (
    <section className="panel" data-panel="opis">
      <p className="naglowek-panelu">
        Opis trasy <span>{dane.odcinki.length} odcinków</span>
      </p>

      <div data-skracalne>
        {dane.odcinki.map((odcinek) => (
          <div className="odcinek" key={odcinek.zakres}>
            <h3>
              <span className="zakres">{odcinek.zakres}</span>
              {odcinek.tytul}
              {odcinek.minuty && <span className="minuty">{odcinek.minuty}</span>}
            </h3>
            <p>
              {odcinek.tekst}
              {odcinek.wskazowka && (
                <>
                  {' '}
                  <span className="uwaga-znak" aria-hidden>
                    ▲
                  </span>{' '}
                  <b>{odcinek.wskazowka}</b>
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      {maWskazowki && (
        <p className="stopka-panelu">
          <span className="uwaga-znak" aria-hidden>
            ▲
          </span>{' '}
          oznacza miejsce, w którym łatwo zgubić ścieżkę — zwolnij i sprawdź opis.
        </p>
      )}
    </section>
  )
}

/* ── Prawy dolny: praktyczne, ratunek, QR ────────────────────────────── */

function PanelPraktyczny({ dane }: { dane: DaneKarty }) {
  return (
    <section className="panel" data-panel="praktyczne">
      <p className="naglowek-panelu">
        Praktyczne <span>zanim wyjdziesz</span>
      </p>

      {/*
        Ostrzeżenia idą pierwsze i nigdy nie są skracane — ani przez
        autodopasowanie, ani ręcznie. To jedyna treść na karcie, której brak
        może kogoś kosztować więcej niż zawrócenie z trasy.
      */}
      {dane.ostrzezenia.length > 0 && (
        <div className="ramka ramka-uwaga" data-nieskracalne>
          <h4>
            <span aria-hidden>▲</span> Uwaga na orientację
          </h4>
          {dane.ostrzezenia.map((ostrzezenie, i) => (
            <p key={i}>{ostrzezenie}</p>
          ))}
        </div>
      )}

      <div data-skracalne>
        {dane.ciekawostki.map((ciekawostka, i) => (
          <div className="ramka" key={i}>
            <h4>{ciekawostka.tytul}</h4>
            <p>{ciekawostka.tekst}</p>
          </div>
        ))}
      </div>

      <div className="ramka ratunek" data-nieskracalne>
        <h4>Ratunek w górach</h4>
        <p>GOPR / TOPR — numer ratunkowy</p>
        <p className="ratunek-numer">
          {GOPR} &nbsp;·&nbsp; {GOPR_SKROCONY}
        </p>
        <p style={{ fontSize: '0.58em', marginTop: '1.2mm' }}>
          Ogólny alarmowy 112. Aplikacja Szlaki Pienin ma przycisk SOS z Twoimi
          współrzędnymi.
        </p>
      </div>

      <div className="qr-wiersz">
        <svg
          className="qr"
          viewBox={`0 0 ${dane.qr.bok} ${dane.qr.bok}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label={`Kod QR do strony trasy: ${dane.adres}`}
        >
          <g fill="#14211c">
            {dane.qr.moduly.map((modul) => (
              <rect
                key={`${modul.x}-${modul.y}`}
                x={modul.x}
                y={modul.y}
                width={1.02}
                height={1.02}
              />
            ))}
          </g>
        </svg>
        <div className="qr-tekst">
          <b>{dane.adres}</b>
          Zeskanuj, aby otworzyć trasę z mapą na żywo, plikiem GPX i aktualnymi warunkami.
          Aplikacja mobilna działa offline.
        </div>
      </div>

      <p className="stopka-karty">
        Wydrukowano ze szlakipienin.pl · stan na {dane.data} · sprawdź aktualne komunikaty
        przed wyjściem
      </p>
    </section>
  )
}
