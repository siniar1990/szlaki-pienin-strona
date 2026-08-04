import Link from 'next/link'
import { Map as MapIcon, Mountain, Sparkles } from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { KafelkiKategorii } from '@/components/glowna/kafelki-kategorii'
import { PodgladMapy } from '@/components/glowna/podglad-mapy'
import { Powitanie } from '@/components/glowna/powitanie'
import { NaglowekSekcji } from '@/components/uklad/naglowek-sekcji'
import { KATEGORIE_APLIKACJI } from '@/lib/dane/kategorie'
import { pobierzStatystyki, pobierzTrasy } from '@/lib/dane/zrodlo'
import { kilometry, liczba, metry } from '@/lib/format'

/**
 * Strona główna portalu.
 *
 * Wszystkie dane są czytane przy budowaniu — to komponent serwerowy, więc do
 * przeglądarki trafia gotowy HTML, bez ani jednego kilobajta logiki ładowania.
 */

export default function StronaGlowna() {
  const trasy = pobierzTrasy()
  const statystyki = pobierzStatystyki()


  /*
    Kategorie na siatce.

    Aplikacja ma ich dziesięć, a siatka trzy na trzy mieści dziewięć. Poza
    siatkę wypada „Korony Pienin ze Szczawnicy" — nie dlatego, że jest
    najmniej ważna, tylko dlatego, że jako jedyna jest kolekcją szczytów,
    a nie zbiorem tras. Dostaje za to własną sekcję niżej, z numeracją
    od najwyższego.
  */
  const kategorieNaSiatce = KATEGORIE_APLIKACJI.filter(
    (kategoria) => kategoria.slug !== 'korony-pienin',
  )

  const korony = trasy
    .filter((trasa) => trasa.kategoria === 'korony-pienin')
    .sort((a, b) => (b.wysokoscSzczytuM ?? 0) - (a.wysokoscSzczytuM ?? 0))

  const ciekawostki = trasy
    .flatMap((trasa) => trasa.ciekawostki.map((c) => ({ ...c, trasa })))
    .slice(0, 3)

  return (
    <>
      <Powitanie statystyki={statystyki} />

      {/* ── Kategorie ───────────────────────────────────────────────────── */}
      <section id="odkrywaj" className="sekcja bg-kamien-50">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Wybierz po swojemu"
            tytul="Kategorie tras"
            opis="Ten sam podział co w aplikacji — od krótkiego wyjścia na pół dnia po całodniowe wyprawy i kolekcję dwudziestu czterech szczytów."
            odnosnik={{ adres: '/szlaki', etykieta: 'Wszystkie trasy' }}
          />

          <div className="mt-12">
            <KafelkiKategorii
              kategorie={kategorieNaSiatce}
              liczba={(kategoria) => trasy.filter(kategoria.pasuje).length}
            />
          </div>
        </div>
      </section>

      {/* ── Korony Pienin ───────────────────────────────────────────────── */}
      <section className="sekcja">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Kolekcja"
            tytul="Korony Pienin ze Szczawnicy"
            opis={`Dwadzieścia cztery szczyty do zdobycia, uszeregowane od najwyższego. Każdy ma własną trasę dojścia opisaną odcinek po odcinku.`}
            odnosnik={{
              adres: '/szlaki/kategorie/korony-pienin',
              etykieta: `Wszystkie korony (${korony.length})`,
            }}
          />

          {/*
            Numer przy szczycie nie jest ozdobą — kolekcja jest uszeregowana
            od najwyższego, więc „01" naprawdę znaczy „najwyższy z dwudziestu
            czterech".
          */}
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {korony.slice(0, 8).map((trasa, indeks) => (
              <li key={trasa.id}>
                <Link
                  href={`/szlaki/${trasa.slug}`}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-kamien-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Mountain className="size-6 text-las-600" aria-hidden />
                    <span className="font-plakat text-2xl leading-none text-kamien-200 transition-colors group-hover:text-las-200">
                      {String(indeks + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="mt-8">
                    <h3 className="font-heading text-lg font-semibold leading-snug text-kamien-900 group-hover:text-las-700">
                      {trasa.nazwa}
                    </h3>
                    <p className="mt-1 text-sm text-kamien-500">
                      {trasa.wysokoscSzczytuM !== null && (
                        <>{metry(trasa.wysokoscSzczytuM)} n.p.m. · </>
                      )}
                      {kilometry(trasa.dlugoscKm)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
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

          {/*
            Podgląd to prawdziwe ślady wszystkich tras, rysowane przy
            budowaniu z tego samego pliku, którego używa mapa interaktywna.
            Dochodzi trasa w aplikacji — dochodzi kreska tutaj.
          */}
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-las-950/40 p-6">
            <PodgladMapy className="h-auto w-full" />
            <p className="mt-2 text-center text-xs uppercase tracking-[0.18em] text-white/40">
              {liczba(trasy.length)} tras · {liczba(statystyki.sumaKm)} km
            </p>
          </div>
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
