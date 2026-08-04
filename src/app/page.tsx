import Link from 'next/link'
import { ArrowUpRight, Map as MapIcon, Sparkles } from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { KafelkiKategorii } from '@/components/glowna/kafelki-kategorii'
import { PasmoMalowane } from '@/components/glowna/pasmo-malowane'
import { MakietaTelefonu } from '@/components/glowna/makieta-telefonu'
import { Powitanie } from '@/components/glowna/powitanie'
import { NaglowekSekcji } from '@/components/uklad/naglowek-sekcji'
import { KATEGORIE_APLIKACJI } from '@/lib/dane/kategorie'
import { pobierzAtrakcje, pobierzStatystyki, pobierzTrasy } from '@/lib/dane/zrodlo'
import { liczba } from '@/lib/format'

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

  // Szczyty do malowanego pasma — od najwyższego w dół.
  const szczytyNaKarty = pobierzAtrakcje()
    .filter((atrakcja) => atrakcja.typ === 'szczyt' && atrakcja.wysokoscM !== null)
    .sort((a, b) => (b.wysokoscM ?? 0) - (a.wysokoscM ?? 0))
    .map((szczyt) => ({
      slug: szczyt.slug,
      nazwa: szczyt.nazwa,
      wysokoscM: szczyt.wysokoscM!,
      liczbaTras: szczyt.trasy.length,
    }))

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
            opis="Ten sam podział co w aplikacji — od krótkiego wyjścia na pół dnia po całodniowe wyprawy w graniach."
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

      {/* ── Najwyższe szczyty ───────────────────────────────────────────── */}
      <section className="sekcja">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Szczyty"
            tytul="Najwyższe szczyty Pienin"
            opis="Od Radziejowej w dół — każdy z opisaną trasą dojścia, czasem przejścia i punktami po drodze."
            odnosnik={{ adres: '/atrakcje#szczyty', etykieta: 'Całe pasmo' }}
          />

          <div className="mt-12">
            <PasmoMalowane szczyty={szczytyNaKarty} />
          </div>
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

          <MakietaTelefonu
            zrzut="/marka/aplikacja/nawigacja.webp"
            opis="Ekran nawigacji w aplikacji Szlaki Pienin: mapa Szczawnicy ze śladem trasy, najbliższe wejście na szlak i pozostały dystans"
          />
        </div>
      </section>

      {/* ── Ciekawostki ─────────────────────────────────────────────────── */}
      <section className="sekcja bg-kamien-50">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Zajrzyj do przewodnika"
            tytul="To dopiero zajawka przewodnika"
            opis={`Przy każdej trasie czekają opisy odcinek po odcinku, wskazówki nawigacyjne, ostrzeżenia i historie przypięte do konkretnych miejsc. Razem ${liczba(statystyki.liczbaTras)} tras, ${liczba(statystyki.liczbaSzczytow)} szczytów i ${liczba(statystyki.liczbaCiekawostek)} ciekawostek — poniżej trzy wyjęte na chybił trafił.`}
            odnosnik={{ adres: '/szlaki', etykieta: 'Przeglądaj trasy' }}
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {ciekawostki.map((ciekawostka) => (
              <article
                key={`${ciekawostka.trasa.id}-${ciekawostka.tytul}`}
                className="group flex flex-col rounded-2xl border border-kamien-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony"
              >
                <Sparkles className="size-5 text-las-600" aria-hidden />
                <h3 className="mt-4 font-heading text-xl font-semibold leading-snug text-kamien-900">
                  {ciekawostka.tytul}
                </h3>
                <p className="mt-3 line-clamp-6 flex-1 leading-relaxed text-kamien-600">
                  {ciekawostka.tekst}
                </p>
                <Link
                  href={`/szlaki/${ciekawostka.trasa.slug}`}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-las-700 hover:underline"
                >
                  Trasa: {ciekawostka.trasa.nazwa}
                  <ArrowUpRight
                    className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-kamien-500">
            Reszta — wraz z mapami offline i nawigacją — czeka w aplikacji i na{' '}
            <Link href="/szlaki" className="font-medium text-las-700 hover:underline">
              stronach poszczególnych tras
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Aplikacja ───────────────────────────────────────────────────── */}
      <section className="sekcja">
        <div className="obszar">
          <div className="rounded-3xl bg-las-800 px-8 py-16 text-center text-white sm:px-16">
            <h2 className="mx-auto max-w-[20ch] text-tytul font-semibold">
              Weź cały przewodnik w kieszeń
            </h2>
            <p className="mx-auto mt-5 max-w-[54ch] text-lg text-white/80">
              Mapa offline, nawigacja GPS, nagrywanie marszu i eksport do GPX.
              Bez konta, bez opłat, bez reklam.
            </p>
            {/* Ten sam komponent i ten sam wariant, co w sekcji powitalnej —
                przyciski mają wyglądać identycznie, tylko wyśrodkowane. */}
            <div className="mt-10 flex justify-center">
              <PrzyciskiSklepow wariant="jasny" className="items-center" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
