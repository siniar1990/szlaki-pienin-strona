'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { baza } from '@/lib/baza'
import { hasloPoprawne, utworzSesje } from '@/lib/panel/sesja'
import { nastepneKody, nastepnyKod } from '@/lib/qr/nastepny-kod'
import { ZNACZNIK_TABLICZEK } from '@/lib/qr/znaczniki'

// Profil `max` przy unieważnianiu: Next 16 wymaga wskazania, jak długo wpis
// mógł żyć. Nasz zapis ma minutę, więc każdy profil zadziała — `max` jest
// najbezpieczniejszy, bo obejmuje także wpisy o dłuższym czasie życia.

/**
 * Operacje panelu jako akcje serwerowe.
 *
 * Akcje zamiast tras API, bo formularz w panelu nie potrzebuje kontraktu
 * sieciowego — potrzebuje wysłać dane i dostać odpowiedź. Akcja daje to bez
 * pisania warstwy pośredniczącej po obu stronach, a przy wyłączonym
 * JavaScripcie formularz nadal działa, bo przeglądarka wysyła go zwyczajnie.
 *
 * Każda akcja waliduje wejście schematem Zod. Dane z formularza to dane
 * z zewnątrz, nawet jeśli formularz stoi za logowaniem.
 */

/**
 * Największe zdjęcie, jakie przyjmiemy.
 *
 * Przeglądarka dociska zdjęcie do 900 kB przed wysłaniem, więc typowe ma
 * 150–250 kB po zakodowaniu. Półtora megabajta zostawia zapas na nietypowe
 * przypadki i jednocześnie odcina próbę wgrania pliku prosto z aparatu, która
 * wpisałaby do bazy kilkanaście megabajtów tekstu.
 *
 * Wartość musi zostać poniżej `bodySizeLimit` z `next.config.ts` — powyżej
 * niego żądanie jest odrzucane przez Next kodem 413, zanim ten komunikat
 * ma szansę powstać.
 */
const NAJWIEKSZE_ZDJECIE = 1_500_000

const SchematKodu = z.object({
  nazwa: z.string().trim().min(2, 'Nazwa musi mieć co najmniej dwa znaki').max(120),
  opis: z.string().trim().max(2000).optional().or(z.literal('')),
  nazwaLokalizacji: z.string().trim().max(120).optional().or(z.literal('')),
  // Współrzędne przychodzą jako tekst z pola formularza. Puste znaczy „jeszcze
  // nie wiadomo", a nie zero — tabliczka bez pozycji jest dozwolona.
  szerokosc: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  dlugosc: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
  // Najniższy punkt Pienin leży poniżej 400 m, najwyższy szczyt ma 1266 m.
  // Progi są luźne, żeby nie odrzucać odczytu GPS, który potrafi się mylić
  // o kilkadziesiąt metrów, ale odcinają wartość wpisaną w złej jednostce.
  wysokosc: z.coerce.number().min(-100).max(4000).optional().or(z.literal('')),
  status: z.enum(['AKTYWNY', 'NIEAKTYWNY', 'ZAPAS']),
  dataMontazu: z.string().optional().or(z.literal('')),
  zdjecie: z
    .string()
    .max(NAJWIEKSZE_ZDJECIE, 'Zdjęcie jest za duże')
    .refine(
      (wartosc) => wartosc === '' || wartosc === USUN_ZDJECIE || wartosc.startsWith('data:image/'),
      'Nieprawidłowy format zdjęcia',
    )
    .optional()
    .or(z.literal('')),
})

export type WynikAkcji = { blad?: string; ok?: string }

/** Znacznik z formularza: „usuń dotychczasowe zdjęcie". Pusty ciąg znaczy
 *  „nie ruszaj", więc do skasowania potrzebna jest osobna wartość. */
const USUN_ZDJECIE = 'usun'

function zFormularza(dane: FormData) {
  return SchematKodu.safeParse({
    nazwa: dane.get('nazwa'),
    opis: dane.get('opis'),
    nazwaLokalizacji: dane.get('nazwaLokalizacji'),
    szerokosc: dane.get('szerokosc') || undefined,
    dlugosc: dane.get('dlugosc') || undefined,
    wysokosc: dane.get('wysokosc') || undefined,
    status: dane.get('status'),
    dataMontazu: dane.get('dataMontazu'),
    zdjecie: dane.get('zdjecie'),
  })
}

function naDaneBazy(dane: z.infer<typeof SchematKodu>) {
  return {
    nazwa: dane.nazwa,
    opis: dane.opis || null,
    nazwaLokalizacji: dane.nazwaLokalizacji || null,
    szerokosc: typeof dane.szerokosc === 'number' ? dane.szerokosc : null,
    dlugosc: typeof dane.dlugosc === 'number' ? dane.dlugosc : null,
    wysokosc: typeof dane.wysokosc === 'number' ? dane.wysokosc : null,
    status: dane.status,
    dataMontazu: dane.dataMontazu ? new Date(dane.dataMontazu) : null,
  }
}

/**
 * Zdjęcie zmieniamy tylko wtedy, gdy formularz coś o nim powiedział.
 *
 * Pole puste znaczy „nie dotykaj" — inaczej każdy zapis nazwy kasowałby
 * zdjęcie, bo przeglądarka nie odsyła obrazka, którego nikt nie wybrał.
 */
function zmianaZdjecia(zdjecie: string | undefined) {
  if (zdjecie === USUN_ZDJECIE) return { zdjecie: null }
  if (zdjecie && zdjecie.startsWith('data:image/')) return { zdjecie }
  return {}
}

export async function utworzKod(_stan: WynikAkcji, dane: FormData): Promise<WynikAkcji> {
  const wynik = zFormularza(dane)
  if (!wynik.success) return { blad: wynik.error.issues[0].message }

  const kod = await nastepnyKod()
  await baza.kodQr.create({
    data: { kod, ...naDaneBazy(wynik.data), ...zmianaZdjecia(wynik.data.zdjecie) },
  })

  revalidatePath('/panel/kody')
  revalidateTag(ZNACZNIK_TABLICZEK, 'max')
  redirect(`/panel/kody/${kod}`)
}

export async function zapiszKod(kod: string, _stan: WynikAkcji, dane: FormData): Promise<WynikAkcji> {
  const wynik = zFormularza(dane)
  if (!wynik.success) return { blad: wynik.error.issues[0].message }

  await baza.kodQr.update({
    where: { kod },
    data: { ...naDaneBazy(wynik.data), ...zmianaZdjecia(wynik.data.zdjecie) },
  })

  revalidatePath('/panel/kody')
  revalidatePath(`/panel/kody/${kod}`)
  // Bez tego zmieniony cel tabliczki dotarłby do skanujących dopiero po
  // minucie — przy wyłączaniu uszkodzonej tabliczki to za długo.
  revalidateTag(ZNACZNIK_TABLICZEK, 'max')
  return { ok: 'Zapisano zmiany' }
}

/**
 * Wygenerowanie paczki tabliczek do druku.
 *
 * Kody powstają ze statusem ZAPAS — są wydrukowane, ale jeszcze nie wiszą
 * w terenie. Lokalizację i kategorię dostaną przy montażu. Bez tego stanu
 * pośredniego dwieście kodów z drukarni musiałoby udawać, że już działają,
 * i psuło statystyki „aktywnych tabliczek".
 */
export async function utworzPaczke(_stan: WynikAkcji, dane: FormData): Promise<WynikAkcji> {
  const ile = z.coerce.number().int().min(1).max(500).safeParse(dane.get('ile'))
  if (!ile.success) return { blad: 'Podaj liczbę od 1 do 500' }

  const kody = await nastepneKody(ile.data)

  await baza.kodQr.createMany({
    data: kody.map((kod) => ({
      kod,
      nazwa: `Tabliczka ${kod}`,
      status: 'ZAPAS' as const,
    })),
  })

  revalidatePath('/panel/kody')
  revalidateTag(ZNACZNIK_TABLICZEK, 'max')
  return { ok: `Utworzono ${kody.length} kodów: od ${kody[0]} do ${kody[kody.length - 1]}` }
}

export async function zmienStatus(kod: string, status: 'AKTYWNY' | 'NIEAKTYWNY'): Promise<void> {
  await baza.kodQr.update({ where: { kod }, data: { status } })
  revalidateTag(ZNACZNIK_TABLICZEK, 'max')
  revalidatePath('/panel/kody')
  revalidatePath(`/panel/kody/${kod}`)
}

/* ── Logowanie ──────────────────────────────────────────────────────────── */

export async function zaloguj(_stan: WynikAkcji, dane: FormData): Promise<WynikAkcji> {
  const skrot = process.env.HASLO_PANELU
  const sekret = process.env.SEKRET_SESJI

  if (!skrot || !sekret) {
    return { blad: 'Panel nie jest skonfigurowany — brak HASLO_PANELU lub SEKRET_SESJI.' }
  }

  const haslo = String(dane.get('haslo') ?? '')
  if (!(await hasloPoprawne(haslo, skrot))) {
    // Komunikat celowo ogólny: nie zdradzamy, czy hasło było blisko.
    return { blad: 'Nieprawidłowe hasło' }
  }

  const sesja = await utworzSesje(sekret)
  const ciasteczka = await cookies()
  ciasteczka.set(sesja.nazwa, sesja.wartosc, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sesja.maxAge,
  })

  const wroc = String(dane.get('wroc') ?? '/panel')
  // Adres powrotu pochodzi z parametru w adresie, więc musi zostać sprawdzony —
  // inaczej byłaby to gotowa furtka do przekierowania na obcą stronę.
  redirect(wroc.startsWith('/panel') ? wroc : '/panel')
}

export async function wyloguj(): Promise<void> {
  const ciasteczka = await cookies()
  ciasteczka.delete('sesja_panelu')
  redirect('/panel/logowanie')
}
