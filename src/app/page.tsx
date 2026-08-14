import Link from 'next/link'
import { Map as MapIcon } from 'lucide-react'

import { KartaWiadomosci } from '@/components/aktualnosci/karta-wiadomosci'
import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { PasekDzis } from '@/components/dzis/pasek-dzis'
import { KafelkiKategorii } from '@/components/glowna/kafelki-kategorii'
import { KafelkiWyzwan } from '@/components/glowna/kafelki-wyzwan'
import { MakietaTelefonu } from '@/components/glowna/makieta-telefonu'
import { Powitanie } from '@/components/glowna/powitanie'
import { NaglowekSekcji } from '@/components/uklad/naglowek-sekcji'
import { KATEGORIE_APLIKACJI } from '@/lib/dane/kategorie'
import { pobierzStatystyki, pobierzTrasy, pobierzWyzwania } from '@/lib/dane/zrodlo'
import { pobierzDaneDnia } from '@/lib/dzis'
import { liczba } from '@/lib/format'
import { pobierzWiadomosci } from '@/lib/wiadomosci/zapytania'

/**
 * Strona główna portalu.
 *
 * Wszystkie dane są czytane przy budowaniu — to komponent serwerowy, więc do
 * przeglądarki trafia gotowy HTML, bez ani jednego kilobajta logiki ładowania.
 */

/*
  Kwadrans, odkąd pod powitaniem stoi pasek „Dziś w Pieninach".

  Wcześniej strona główna odświeżała się wyłącznie przy publikacji notki, bo
  tylko notki się na niej zmieniały. Teraz zmienia się też temperatura i stan
  wody — a strona główna pokazująca wczorajszą pogodę podważa wiarygodność
  wszystkiego innego, co na niej stoi. Ta sama wartość co pamięć podręczna
  źródeł: krótszy odstęp i tak trafiałby w zapamiętany wynik.
*/
export const revalidate = 900

export default async function StronaGlowna() {
  const trasy = pobierzTrasy()
  const statystyki = pobierzStatystyki()

  /*
    Kategorie na siatce.

    Aplikacja ma ich dziesięć, a siatka trzy na trzy mieści dziewięć. Poza
    siatkę wypada „Korony Pienin ze Szczawnicy" — nie dlatego, że jest
    najmniej ważna, tylko dlatego, że jako jedyna jest kolekcją szczytów,
    a nie zbiorem tras. Szczyty mają swoje miejsce na /atrakcje.
  */
  const kategorieNaSiatce = KATEGORIE_APLIKACJI.filter(
    (kategoria) => kategoria.slug !== 'korony-pienin',
  )

  /*
    Pienińskie wyzwania na kafelki.

    Bierzemy tylko dostępne — w danych aplikacji czeka jeszcze „Mała i Wielka
    Korona Pienin" z `dostepne: false` i bez żadnej treści. Kafelek prowadzący
    na pustą stronę byłby gorszy niż jego brak.

    Długość pochodzi z trasy, którą wyzwanie wskazuje przez `id_trasy` —
    nie przepisujemy jej drugi raz obok.
  */
  const wyzwaniaNaKafelki = pobierzWyzwania()
    .filter((wyzwanie) => wyzwanie.dostepne)
    .map((wyzwanie) => {
      const trasa = wyzwanie.idTrasy ? trasy.find((t) => t.id === wyzwanie.idTrasy) : undefined
      return { wyzwanie, dlugoscKm: trasa?.dlugoscKm ?? null }
    })

  /*
    Trzy najnowsze notki. Odczyt z bazy, więc strona główna przestała być
    w całości statyczna — ale `unstable_cache` trzyma wynik aż do publikacji
    następnej wiadomości, więc w praktyce baza jest odpytywana raz na dobę,
    a nie raz na odsłonę.
  */
  /*
    Notki i warunki na dziś naraz, a nie jedno po drugim: pierwsze sięga do
    bazy, drugie do trzech cudzych serwerów, a żadne nie potrzebuje wyniku
    drugiego. Szeregowo doszłoby to do sekundy przy pustej pamięci podręcznej.
  */
  const [wiadomosci, daneDnia] = await Promise.all([pobierzWiadomosci(3), pobierzDaneDnia()])

  return (
    <>
      <Powitanie statystyki={statystyki} />

      {/*
        Pasek warunków od razu pod powitaniem, przed kategoriami. To jedyna
        treść na stronie głównej, która zmienia się w ciągu dnia — i jedyny
        powód, żeby wejść tu jutro po tym, jak się już wszystko przeczytało.
      */}
      <PasekDzis dane={daneDnia} />

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

          {/*
            Wyzwania osobnym rzędem pod kategoriami, a nie wmieszane między nie.
            Kategoria to zbiór tras do przeglądania, wyzwanie to jedna trasa
            z regulaminem i odznaką — wrzucone do jednej siatki sugerowałyby, że
            po kliknięciu stanie się to samo, a nie stanie się.
          */}
          {wyzwaniaNaKafelki.length > 0 && (
            <div className="mt-16 border-t border-kamien-200 pt-12">
              <h3 className="font-heading text-xl font-semibold text-kamien-900">
                Pienińskie wyzwania
              </h3>
              <p className="mt-2 max-w-[65ch] text-kamien-600">
                Odznaki turystyczne PTTK Szczawnica. Każda to jedna trasa do
                przejścia w ciągu jednego dnia, z regulaminem i odznaką na koniec.
              </p>
              <div className="mt-8">
                <KafelkiWyzwan wyzwania={wyzwaniaNaKafelki} />
              </div>
            </div>
          )}
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
            zrzut="/marka/aplikacja/profil.webp"
            opis="Nawigacja w aplikacji Szlaki Pienin: ślad trasy na mapie z warstwicami, rozwinięty profil wysokości z punktami etapowymi oraz wskazówka na najbliższy zakręt"
          />
        </div>
      </section>

      {/* ── Aktualności ─────────────────────────────────────────────────── */}
      {wiadomosci.length > 0 && (
        <section className="sekcja bg-kamien-50">
          <div className="obszar">
            <NaglowekSekcji
              nadtytul="Co słychać w Pieninach"
              tytul="Aktualności"
              opis="Zmiany na szlakach, wydarzenia, warunki w górach i sprawy Szczawnicy, Krościenka i Czorsztyna."
              odnosnik={{ adres: '/aktualnosci', etykieta: 'Wszystkie wiadomości' }}
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {wiadomosci.map((wiadomosc) => (
                <KartaWiadomosci key={wiadomosc.slug} wiadomosc={wiadomosc} />
              ))}
            </div>
          </div>
        </section>
      )}

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
