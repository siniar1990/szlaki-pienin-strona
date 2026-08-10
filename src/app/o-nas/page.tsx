import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Handshake, Heart, Map as MapIcon, Mountain } from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { PORTAL, ZRODLA } from '@/lib/konfiguracja'
import { pobierzStatystyki } from '@/lib/dane/zrodlo'
import { liczba } from '@/lib/format'

export const metadata: Metadata = {
  title: 'O nas',
  description:
    'Kto prowadzi Szlaki Pienin: Bartłomiej Siniarski, gospodarz Frankowych Domków ' +
    'i Helenówki w Szczawnicy. Portal i aplikacja powstają we współpracy z PTTK.',
  alternates: { canonical: '/o-nas' },
}

/**
 * Strona „O nas".
 *
 * **Po co istnieje.** Portal publikuje opisy tras, ceny biletów i wiadomości —
 * czyli rzeczy, na podstawie których ktoś planuje dzień w górach. Czytelnik ma
 * prawo wiedzieć, kto za tym stoi, zanim zaufa godzinie odjazdu spływu.
 * Wyszukiwarki oceniają to samo: strona bez autora to strona bez odpowiedzi
 * na pytanie „dlaczego mielibyśmy w to wierzyć".
 *
 * **Dlaczego mówimy wprost o Frankowych Domkach.** Bo gospodarz obiektów
 * noclegowych prowadzący portal turystyczny to zależność, którą lepiej podać
 * samemu, niż pozwolić ją komuś odkryć. Powiedziana wprost jest tym, czym
 * jest naprawdę — powodem, dla którego ktoś zna te szlaki na tyle dobrze,
 * żeby je opisać.
 */
export default function StronaONas() {
  const statystyki = pobierzStatystyki()

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'O nas', adres: '/o-nas' }]}
        tytul="Portal robi jedna rodzina ze Szczawnicy"
        lead="Bez redakcji, bez agencji i bez pieniędzy z reklam. Z przekonania, że Pieniny zasługują na przewodnik lepszy niż przepisane blogi."
      />

      <div className="obszar py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0 max-w-[46rem]">
            <div className="space-y-5 text-lg leading-relaxed text-kamien-700">
              <p>
                Pomysłodawcą Szlaków Pienin jest{' '}
                <strong className="font-semibold text-kamien-900">Bartłomiej Siniarski</strong>,
                który do Szczawnicy przyjeżdża, odkąd pamięta. Najpierw jako dziecko, potem
                z własną rodziną — a od kilku lat także jako gospodarz:{' '}
                <strong className="font-semibold text-kamien-900">Frankowych Domków</strong> i{' '}
                <strong className="font-semibold text-kamien-900">Helenówki</strong>.
              </p>

              <p>
                Pieniny poznaje tak, jak poznaje się góry naprawdę — chodząc po nich razem
                z żoną i dziećmi. Stąd wzięły się i aplikacja, i ten portal: z prostego
                spostrzeżenia, że informacji o Pieninach jest w sieci dużo, a takich, na
                których da się oprzeć plan dnia, mało.
              </p>

              <p>
                Jedno i drugie jest <strong className="font-semibold text-kamien-900">darmowe
                i bez reklam</strong>. To jest cegiełka dokładana do promocji Szczawnicy
                i całych Pienin — nie produkt, na którym ktoś tu zarabia.
              </p>
            </div>

            {/* ── Współpraca ─────────────────────────────────────────────── */}
            <section className="mt-14">
              <h2 className="font-heading text-2xl font-semibold text-kamien-900">
                Nie powstaje w pojedynkę
              </h2>

              <div className="mt-6 space-y-4">
                <Wspolpraca
                  ikona={Mountain}
                  tytul="PTTK Szczawnica"
                  tekst={`Opisy wielu tras powstały dzięki uprzejmości PTTK i są inspirowane przewodnikiem „${ZRODLA.przewodnik.tytul}”. To dlatego trasy w tym przewodniku mają wskazówki, których nie ma nigdzie indziej — pisali je ludzie, którzy chodzą tymi szlakami od dziesięcioleci.`}
                />
                <Wspolpraca
                  ikona={Handshake}
                  tytul="Lokalni przedsiębiorcy"
                  tekst="Godziny, ceny i warunki podajemy za tymi, którzy prowadzą wyciągi, przystanie i muzea. Kontakt z nimi jest też powodem, dla którego da się tu szybko poprawić informację, która przestała być prawdziwa."
                />
                <Wspolpraca
                  ikona={Heart}
                  tytul="Miasto i region"
                  tekst="Portal powstaje w Szczawnicy i o Szczawnicy — razem z Krościenkiem, Czorsztynem, Niedzicą, Jaworkami i Sromowcami. Im więcej osób pozna te miejsca dobrze, tym lepiej dla wszystkich, którzy tu żyją."
                />
              </div>
            </section>

            {/* ── Zasady ─────────────────────────────────────────────────── */}
            <section className="mt-14">
              <h2 className="font-heading text-2xl font-semibold text-kamien-900">
                Czego się trzymamy
              </h2>
              <ul className="mt-6 space-y-3 text-kamien-700">
                <Zasada>
                  <strong className="font-semibold text-kamien-900">Nie wymyślamy danych.</strong>{' '}
                  Jeśli czegoś nie wiemy — ceny, godziny, współrzędnych — piszemy, że nie wiemy.
                  Wymyślona godzina odjazdu jest gorsza niż jej brak.
                </Zasada>
                <Zasada>
                  <strong className="font-semibold text-kamien-900">Podajemy źródła.</strong>{' '}
                  Przy opisach tras stoi PTTK, przy wiadomościach serwis, z którego pochodzi
                  informacja, przy zdjęciach ich autor.
                </Zasada>
                <Zasada>
                  <strong className="font-semibold text-kamien-900">
                    Mówimy, co nas z kim łączy.
                  </strong>{' '}
                  Frankowe Domki i Helenówka to obiekty prowadzone przez autora portalu —
                  i piszemy to wprost, zamiast czekać, aż ktoś to odkryje.
                </Zasada>
                <Zasada>
                  <strong className="font-semibold text-kamien-900">
                    Nie zbieramy danych o ludziach.
                  </strong>{' '}
                  Bez ciasteczek śledzących, bez adresów IP, bez kont. Liczymy odsłony, nie
                  osoby — i dlatego portal nie potrzebuje banera zgody.{' '}
                  <Link href="/prywatnosc" className="font-medium text-las-700 hover:underline">
                    Polityka prywatności
                  </Link>
                  .
                </Zasada>
              </ul>
            </section>
          </div>

          {/* ── Kolumna boczna ───────────────────────────────────────────── */}
          <aside className="lg:pt-2">
            <div className="overflow-hidden rounded-2xl border border-kamien-200">
              <Image
                src="/marka/tlo/pieniny-hero.webp"
                alt="Panorama Pienin"
                width={640}
                height={420}
                sizes="(max-width: 1024px) 100vw, 320px"
                className="h-44 w-full object-cover"
              />
              <div className="bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-kamien-500">
                  Portal w liczbach
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <Liczba etykieta="tras z opisem" wartosc={liczba(statystyki.liczbaTras)} />
                  <Liczba etykieta="szczytów" wartosc={liczba(statystyki.liczbaSzczytow)} />
                  <Liczba etykieta="ciekawostek" wartosc={liczba(statystyki.liczbaCiekawostek)} />
                </dl>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-kamien-200 bg-kamien-50 p-5">
              <p className="inline-flex items-center gap-2 font-heading text-base font-semibold text-kamien-900">
                <MapIcon className="size-4" aria-hidden />
                Weź przewodnik ze sobą
              </p>
              <p className="mt-2 text-sm leading-relaxed text-kamien-600">
                Wszystkie trasy z tej strony działają w telefonie bez zasięgu.
              </p>
              <div className="mt-4">
                <PrzyciskiSklepow wariant="ciemny" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-kamien-200 p-5">
              <p className="font-heading text-base font-semibold text-kamien-900">
                Coś jest nieaktualne?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-kamien-600">
                Napisz — poprawimy przy najbliższej aktualizacji. To najszybsza droga, żeby
                portal pozostał prawdziwy.
              </p>
              <Link
                href="/kontakt"
                className="mt-4 inline-flex items-center rounded-full border border-kamien-300 px-4 py-2 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:text-las-800"
              >
                Napisz do nas
              </Link>
              <p className="mt-3 break-all text-xs text-kamien-500">{PORTAL.kontakt}</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function Wspolpraca({
  ikona: Ikona,
  tytul,
  tekst,
}: {
  ikona: React.ComponentType<{ className?: string }>
  tytul: string
  tekst: string
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-kamien-200 bg-white p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-las-50 text-las-700">
        <Ikona className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 className="font-heading text-base font-semibold text-kamien-900">{tytul}</h3>
        <p className="mt-1.5 leading-relaxed text-kamien-600">{tekst}</p>
      </div>
    </div>
  )
}

function Zasada({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 leading-relaxed">
      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-las-600" />
      <span>{children}</span>
    </li>
  )
}

function Liczba({ etykieta, wartosc }: { etykieta: string; wartosc: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-kamien-600">{etykieta}</dt>
      <dd className="font-heading text-lg font-semibold tabular-nums text-kamien-900">{wartosc}</dd>
    </div>
  )
}
