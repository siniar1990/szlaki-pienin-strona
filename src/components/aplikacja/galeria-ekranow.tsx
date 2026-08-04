import { MakietaTelefonu } from '@/components/glowna/makieta-telefonu'

/**
 * Galeria ekranów aplikacji.
 *
 * Sześć telefonów w rzędzie, przewijanym w poziomie na węższych ekranach.
 * Każdy z podpisem, bo zrzut bez podpisu wymaga od oglądającego, żeby sam
 * odgadł, co widzi — a przy ekranie mapy z profilem wysokości to nie jest
 * oczywiste nawet dla kogoś, kto w górach bywa.
 *
 * Makiety są lekko obrócone naprzemiennie i uniesione co drugą. Rząd
 * idealnie równych prostokątów wygląda jak zestawienie porównawcze,
 * a nie jak zapowiedź.
 */

export type EkranAplikacji = {
  plik: string
  tytul: string
  opis: string
}

export const EKRANY: EkranAplikacji[] = [
  {
    plik: 'start',
    tytul: 'Ekran startowy',
    opis: 'Pogoda na szlaku z prognozą na najbliższe godziny i porą zachodu słońca.',
  },
  {
    plik: 'kategorie',
    tytul: 'Kategorie tras',
    opis: 'Ten sam podział co na tej stronie — od krótkich wyjść po Korony Pienin.',
  },
  {
    plik: 'lista',
    tytul: 'Lista tras',
    opis: 'Czas, dystans, przewyższenie i kolory szlaków widoczne od razu na karcie.',
  },
  {
    plik: 'nawigacja',
    tytul: 'Nawigacja na szlaku',
    opis: 'Najbliższe wejście na szlak, pozostały dystans i wskazówka na następny odcinek.',
  },
  {
    plik: 'profil',
    tytul: 'Profil wysokości',
    opis: 'Przekrój trasy z punktami etapowymi, do sprawdzenia w każdej chwili marszu.',
  },
  {
    plik: 'blisko',
    tytul: 'Blisko mnie',
    opis: 'Trasy zaczynające się w pobliżu, posortowane według odległości do szlaku.',
  },
]

export function GaleriaEkranow() {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 [&::-webkit-scrollbar]:hidden">
      <ul className="flex snap-x snap-mandatory gap-8 lg:gap-10">
        {EKRANY.map((ekran, indeks) => (
          <li key={ekran.plik} className="w-[15rem] shrink-0 snap-start sm:w-[16rem]">
            <div
              className={
                indeks % 2 === 0
                  ? 'motion-safe:lg:-translate-y-4 motion-safe:lg:-rotate-1'
                  : 'motion-safe:lg:rotate-1'
              }
            >
              <MakietaTelefonu
                zrzut={`/marka/aplikacja/${ekran.plik}.webp`}
                opis={`${ekran.tytul} — ${ekran.opis}`}
                szerokosc="max-w-full"
                priorytet={indeks < 2}
              />
            </div>
            <div className="mt-6 px-1">
              <h3 className="font-heading text-lg font-semibold text-kamien-900">{ekran.tytul}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-kamien-600">{ekran.opis}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
