import Link from 'next/link'
import {
  Baby,
  Bike,
  Compass,
  Footprints,
  Map as MapIcon,
  Medal,
  Mountain,
  Sparkles,
} from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { Powitanie } from '@/components/glowna/powitanie'
import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekSekcji } from '@/components/uklad/naglowek-sekcji'
import {
  naListe,
  pobierzAtrakcje,
  pobierzStatystyki,
  pobierzTrasy,
  pobierzWyzwania,
} from '@/lib/dane/zrodlo'
import { liczba, metry } from '@/lib/format'

/**
 * Strona główna portalu.
 *
 * Wszystkie dane są czytane przy budowaniu — to komponent serwerowy, więc do
 * przeglądarki trafia gotowy HTML, bez ani jednego kilobajta logiki ładowania.
 */

const KATEGORIE = [
  { adres: '/szlaki/kategorie/piesze', etykieta: 'Szlaki piesze', ikona: Footprints },
  { adres: '/szlaki/kategorie/rowerowe', etykieta: 'Trasy rowerowe', ikona: Bike },
  { adres: '/szlaki/kategorie/rodzinne', etykieta: 'Z dziećmi', ikona: Baby },
  { adres: '/szlaki/kategorie/panoramy', etykieta: 'Najpiękniejsze panoramy', ikona: Compass },
  { adres: '/szlaki/kategorie/latwe', etykieta: 'Łatwe', ikona: Footprints },
  { adres: '/szlaki/kategorie/calodniowe', etykieta: 'Całodniowe', ikona: Mountain },
]

export default function StronaGlowna() {
  const trasy = pobierzTrasy()
  const statystyki = pobierzStatystyki()
  const atrakcje = pobierzAtrakcje()
  const wyzwania = pobierzWyzwania()

  /*
    „Od czego zacząć" zamiast „najpopularniejsze".

    Portal nie zbiera statystyk odwiedzin, więc nie wie, które trasy są
    popularne — a wpisanie tego z palca byłoby zwykłym zmyślaniem. Zamiast
    tego pokazujemy trasy najlepiej opisane: takie, które mają ślad na mapie,
    komplet segmentów i ciekawostki. To akurat da się policzyć uczciwie.
  */
  const polecane = [...trasy]
    .filter((trasa) => trasa.slad !== null && trasa.opis !== null)
    .sort(
      (a, b) =>
        b.segmenty.length + b.ciekawostki.length - (a.segmenty.length + a.ciekawostki.length),
    )
    .slice(0, 6)

  const szczyty = atrakcje
    .filter((a) => a.typ === 'szczyt' && a.wysokoscM !== null)
    .sort((a, b) => (b.wysokoscM ?? 0) - (a.wysokoscM ?? 0))
    .slice(0, 8)

  const ciekawostki = trasy
    .flatMap((trasa) => trasa.ciekawostki.map((c) => ({ ...c, trasa })))
    .slice(0, 3)

  return (
    <>
      <Powitanie statystyki={statystyki} />

      {/* ── Od czego zacząć ─────────────────────────────────────────────── */}
      <section id="odkrywaj" className="sekcja">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Trasy"
            tytul="Od czego zacząć w Pieninach"
            opis="Trasy z pełnym opisem odcinek po odcinku, śladem na mapie i ciekawostkami z przewodnika PTTK."
            odnosnik={{ adres: '/szlaki', etykieta: `Wszystkie trasy (${trasy.length})` }}
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {polecane.map((trasa, indeks) => (
              <KafelekTrasy key={trasa.id} trasa={naListe(trasa)} priorytet={indeks < 3} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Kategorie ───────────────────────────────────────────────────── */}
      <section className="sekcja bg-kamien-50">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Wybierz po swojemu"
            tytul="Kategorie tras"
            opis="Na pół dnia z dzieckiem, na cały dzień w graniach albo na rower wzdłuż Dunajca."
          />

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KATEGORIE.map(({ adres, etykieta, ikona: Ikona }) => (
              <li key={adres}>
                <Link
                  href={adres}
                  className="group flex items-center gap-4 rounded-2xl border border-kamien-200 bg-white p-6 shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-las-50 text-las-700 transition-colors group-hover:bg-las-100">
                    <Ikona className="size-6" aria-hidden />
                  </span>
                  <span className="font-heading text-lg font-semibold text-kamien-900">
                    {etykieta}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Szczyty ─────────────────────────────────────────────────────── */}
      <section className="sekcja">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Atrakcje"
            tytul="Szczyty, na które prowadzą nasze trasy"
            opis={`W przewodniku opisaliśmy ${liczba(statystyki.liczbaSzczytow)} szczytów i ${liczba(statystyki.liczbaPunktowWidokowych)} punktów widokowych.`}
            odnosnik={{ adres: '/atrakcje', etykieta: 'Wszystkie atrakcje' }}
          />

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {szczyty.map((szczyt) => (
              <li key={szczyt.slug}>
                <Link
                  href={`/atrakcje/${szczyt.slug}`}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-kamien-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony"
                >
                  <Mountain className="size-6 text-las-600" aria-hidden />
                  <div className="mt-8">
                    <h3 className="font-heading text-lg font-semibold text-kamien-900 group-hover:text-las-700">
                      {szczyt.nazwa}
                    </h3>
                    <p className="mt-1 text-sm text-kamien-500">
                      {szczyt.wysokoscM !== null && <>{metry(szczyt.wysokoscM)} n.p.m. · </>}
                      {szczyt.trasy.length}{' '}
                      {szczyt.trasy.length === 1 ? 'trasa' : szczyt.trasy.length < 5 ? 'trasy' : 'tras'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Mapa ────────────────────────────────────────────────────────── */}
      <section className="sekcja bg-las-900 text-white">
        <div className="obszar grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-las-300">
              Mapa interaktywna
            </p>
            <h2 className="mt-3 text-sekcja font-semibold">
              Wszystkie szlaki na jednej mapie
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              Ślady {liczba(trasy.filter((t) => t.slad).length)} tras, schroniska, punkty
              widokowe, kapliczki i miejsca, w których zjesz i przenocujesz. Filtruj,
              klikaj, planuj.
            </p>
            <Link
              href="/mapa"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-medium text-las-900 transition-transform hover:-translate-y-0.5"
            >
              <MapIcon className="size-5" aria-hidden />
              Otwórz mapę
            </Link>
          </div>

          <div className="aspect-[4/3] rounded-3xl border border-white/15 bg-las-800/60" />
        </div>
      </section>

      {/* ── Wyzwania ────────────────────────────────────────────────────── */}
      {wyzwania.length > 0 && (
        <section className="sekcja">
          <div className="obszar">
            <NaglowekSekcji
              nadtytul="Odznaki"
              tytul="Pienińskie wyzwania"
              opis="Dwie odznaki przyznawane przez PTTK Szczawnica. Aplikacja liczy postęp na szlaku."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {wyzwania.map((wyzwanie) => (
                <article
                  key={wyzwanie.id}
                  className="flex items-center gap-6 rounded-2xl border border-kamien-200 bg-white p-8 shadow-miekki"
                >
                  <Medal className="size-10 shrink-0 text-las-600" aria-hidden />
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-kamien-900">
                      {wyzwanie.nazwa}
                    </h3>
                    {wyzwanie.podtytul && (
                      <p className="mt-1 text-kamien-600">{wyzwanie.podtytul}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Ciekawostki ─────────────────────────────────────────────────── */}
      <section className="sekcja bg-kamien-50">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Z przewodnika"
            tytul="Pieniny w szczegółach"
            opis={`${liczba(statystyki.liczbaCiekawostek)} ciekawostek przypiętych do konkretnych miejsc na szlaku.`}
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {ciekawostki.map((ciekawostka) => (
              <article
                key={`${ciekawostka.trasa.id}-${ciekawostka.tytul}`}
                className="rounded-2xl border border-kamien-200 bg-white p-8"
              >
                <Sparkles className="size-5 text-las-600" aria-hidden />
                <h3 className="mt-4 font-heading text-lg font-semibold text-kamien-900">
                  {ciekawostka.tytul}
                </h3>
                <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-kamien-600">
                  {ciekawostka.tekst}
                </p>
                <Link
                  href={`/szlaki/${ciekawostka.trasa.slug}`}
                  className="mt-5 inline-block text-sm font-medium text-las-700 hover:underline"
                >
                  Trasa: {ciekawostka.trasa.nazwa}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Aplikacja ───────────────────────────────────────────────────── */}
      <section className="sekcja">
        <div className="obszar">
          <div className="rounded-3xl bg-las-800 px-8 py-16 text-center text-white sm:px-16">
            <h2 className="mx-auto max-w-[20ch] text-tytul font-semibold">
              Weź cały przewodnik w kieszeni
            </h2>
            <p className="mx-auto mt-5 max-w-[54ch] text-lg text-white/80">
              Mapa offline, nawigacja GPS, nagrywanie marszu i eksport do GPX.
              Bez konta, bez opłat, bez reklam.
            </p>
            <div className="mt-10 flex justify-center">
              <PrzyciskiSklepow wariant="jasny" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
