import Image from 'next/image'

import { cn } from '@/lib/utils'

/**
 * Makieta telefonu ze zrzutem z aplikacji.
 *
 * Zrzut sam w sobie wygląda jak wklejony obrazek — dopiero obudowa mówi
 * „to jest aplikacja w telefonie". Rysujemy ją czystym CSS-em: dwie ramki
 * jedna w drugiej dają metaliczny kant, zaokrąglenia odpowiadają obudowie
 * współczesnego telefonu, a wysepka na górze i kreska na dole domykają
 * skojarzenie.
 *
 * Podmiana zrzutu to zmiana jednego pliku: `public/marka/aplikacja/`.
 * Proporcje 19,5:9 są wymuszone, więc każdy nowy zrzut z telefonu
 * z ekranem tej klasy wpasuje się bez kadrowania.
 */
export function MakietaTelefonu({
  zrzut,
  opis,
  children,
  szerokosc = 'max-w-[19rem]',
  priorytet = false,
  className,
}: {
  /** Adres zrzutu ekranu. Pomiń, gdy zawartość ekranu podajesz jako `children`. */
  zrzut?: string
  /** Co widać na ekranie — trafia do atrybutu `alt`. */
  opis?: string
  /** Dowolna zawartość ekranu, np. odtwarzacz wideo. */
  children?: React.ReactNode
  /** Klasa ograniczająca szerokość makiety. */
  szerokosc?: string
  priorytet?: boolean
  className?: string
}) {
  return (
    <div className={cn('relative mx-auto w-full', szerokosc, className)}>
      {/*
        Poświata za telefonem. Bez niej ciemna obudowa na ciemnozielonym tle
        sekcji zlewa się z nim i makieta traci kształt.
      */}
      <div
        aria-hidden
        className="absolute -inset-8 rounded-full bg-las-400/20 blur-3xl"
      />

      {/* Obudowa: zewnętrzny kant + wewnętrzna ramka ekranu. */}
      <div
        className={cn(
          'relative rounded-[2.75rem] bg-gradient-to-b from-kamien-700 to-kamien-900 p-[3px]',
          'shadow-[0_2px_4px_rgb(0_0_0_/_0.2),0_24px_60px_-12px_rgb(0_0_0_/_0.55)]',
          'transition-transform duration-700 ease-out motion-safe:hover:-translate-y-2',
        )}
      >
        <div className="relative overflow-hidden rounded-[2.6rem] bg-black p-[7px]">
          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.1rem] bg-kamien-100">
            {children ??
              (zrzut && (
                <Image
                  src={zrzut}
                  alt={opis ?? ''}
                  fill
                  sizes="(max-width: 1024px) 60vw, 19rem"
                  priority={priorytet}
                  loading={priorytet ? undefined : 'lazy'}
                  className="object-cover object-top"
                />
              ))}

            {/*
              Wysepka na górze ekranu. Rysowana nad zrzutem, bo zrzut
              z symulatora ma ją wtopioną w obraz — dwie na raz wyglądałyby
              jak usterka, więc nasza przykrywa tamtą.
            */}
            <div
              aria-hidden
              className="absolute left-1/2 top-[10px] h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black"
            />

            {/* Kreska gestu u dołu. */}
            <div
              aria-hidden
              className="absolute bottom-[7px] left-1/2 h-[4px] w-[104px] -translate-x-1/2 rounded-full bg-white/70"
            />
          </div>
        </div>

        {/* Przyciski boczne — drobiazg, ale bez nich obudowa wygląda płasko. */}
        <span
          aria-hidden
          className="absolute -left-[2px] top-[7.5rem] h-12 w-[3px] rounded-l-sm bg-kamien-600"
        />
        <span
          aria-hidden
          className="absolute -left-[2px] top-[10.5rem] h-12 w-[3px] rounded-l-sm bg-kamien-600"
        />
        <span
          aria-hidden
          className="absolute -right-[2px] top-[9rem] h-20 w-[3px] rounded-r-sm bg-kamien-600"
        />
      </div>
    </div>
  )
}
