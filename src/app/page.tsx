import Link from 'next/link'
import { Map as MapIcon, Mountain, Sparkles } from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { KafelekAtrakcji, KafelkiKategorii } from '@/components/glowna/kafelki-kategorii'
import { Powitanie } from '@/components/glowna/powitanie'
import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekSekcji } from '@/components/uklad/naglowek-sekcji'
import { KATEGORIE_APLIKACJI } from '@/lib/dane/kategorie'
import { naListe, pobierzAtrakcje, pobierzStatystyki, pobierzTrasy } from '@/lib/dane/zrodlo'
import { liczba, metry } from '@/lib/format'
import { ATRAKCJE_TURYSTYCZNE } from '@/lib/tresc/atrakcje-turystyczne'

/**
 * Strona główna portalu.
 *
 * Wszystkie dane są czytane przy budowaniu — to komponent serwerowy, więc do
 * przeglądarki trafia gotowy HTML, bez ani jednego kilobajta logiki ładowania.
 */

export default function StronaGlowna() {
  const trasy = pobierzTrasy()
  const statystyki = pobierzStatystyki()
  const atrakcje = pobierzAtrakcje()

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
            opis="Ten sam podział co w aplikacji — od krótkiego wyjścia na pół dnia po całodniowe wyprawy i kolekcję dwudziestu czterech szczytów."
            odnosnik={{ adres: '/szlaki', etykieta: 'Wszystkie trasy' }}
          />

          <div className="mt-12">
            <KafelkiKategorii
              kategorie={KATEGORIE_APLIKACJI}
              liczba={(kategoria) => trasy.filter(kategoria.pasuje).length}
            />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <KafelekAtrakcji
              ilustracja="/dane/ilustracje/DP.webp"
              ile={ATRAKCJE_TURYSTYCZNE.length}
            />
          </div>
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
              Wszystkie {liczba(trasy.length)} tras na jednej mapie. Lista po lewej,
              mapa po prawej — kliknij ślad, żeby zobaczyć nazwę, długość i czas
              przejścia, albo wybierz trasę z listy, a mapa sama do niej dojedzie.
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
