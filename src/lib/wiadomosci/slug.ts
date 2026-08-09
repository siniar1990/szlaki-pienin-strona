import { baza } from '@/lib/baza'

/**
 * Adres notki budowany z tytułu.
 *
 * Polskie znaki rozkładamy sami zamiast polegać na normalizacji Unicode:
 * `ł` nie jest `l` z ogonkiem, tylko osobną literą, i żadna normalizacja go
 * nie uprości. Reszta przechodzi przez rozkład kanoniczny.
 */
const ZAMIANY: Record<string, string> = { ł: 'l', Ł: 'l' }

export function naSlug(tytul: string): string {
  const podstawa = tytul
    .replace(/[łŁ]/g, (znak) => ZAMIANY[znak])
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    // Obcięcie do 80 znaków może zostawić myślnik na końcu.
    .replace(/-+$/, '')

  return podstawa || 'wiadomosc'
}

/**
 * Zwraca adres wolny w bazie, dokładając liczbę przy zajętym.
 *
 * `pomin` to identyfikator notki, którą właśnie zapisujemy — bez niego zmiana
 * czegokolwiek innego w istniejącej notce zderzałaby się z jej własnym
 * adresem i przy każdym zapisie doklejałaby kolejną cyfrę.
 */
export async function wolnySlug(tytul: string, pomin?: string): Promise<string> {
  const podstawa = naSlug(tytul)

  for (let numer = 0; numer < 50; numer += 1) {
    const kandydat = numer === 0 ? podstawa : `${podstawa}-${numer + 1}`
    const zajety = await baza.wiadomosc.findUnique({
      where: { slug: kandydat },
      select: { id: true },
    })
    if (!zajety || zajety.id === pomin) return kandydat
  }

  // Pięćdziesiąt notek o tym samym tytule to nie sytuacja do obsłużenia
  // elegancko — wystarczy, żeby zapis się nie wywrócił.
  return `${podstawa}-${Date.now()}`
}
