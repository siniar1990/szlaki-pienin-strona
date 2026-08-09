'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { baza } from '@/lib/baza'
import { kluczDostepny } from '@/lib/wiadomosci/model-jezykowy'
import { obejdzZrodla } from '@/lib/wiadomosci/obchod'
import { napiszDlaArtykulu, napiszNotkeDnia } from '@/lib/wiadomosci/redakcja'
import { wolnySlug } from '@/lib/wiadomosci/slug'
import { ZNACZNIK_WIADOMOSCI } from '@/lib/wiadomosci/zapytania'

/**
 * Operacje panelu aktualności.
 *
 * **Dlaczego publikacja jest osobną akcją, a nie polem w formularzu edycji.**
 * Zapisanie zmian i wypuszczenie tekstu na portal to dwie różne decyzje.
 * Pole „opublikowana" w formularzu prędzej czy później zostałoby zaznaczone
 * przy okazji poprawiania literówki — a wtedy szkic wychodzi na stronę razem
 * z niedokończonym zdaniem. Osobny przycisk wymaga świadomego kliknięcia.
 *
 * **Dlaczego przy każdej zmianie unieważniamy znacznik.** Strony publiczne
 * czytają aktualności przez `unstable_cache`. Bez unieważnienia opublikowana
 * notka pojawiłaby się dopiero po następnym wdrożeniu.
 */

export type WynikAkcji = { blad?: string; ok?: string }

/** Ten sam znacznik, co w formularzu — „skasuj zdjęcie". */
const USUN_ZDJECIE = 'usun'

/**
 * Zdjęcie główne notki bywa większe niż zdjęcie tabliczki: tam chodzi
 * o rozpoznanie słupka, tu o obraz na całą szerokość artykułu. Przeglądarka
 * zmniejsza je do 1600 px, co daje zwykle 300–500 kB po zakodowaniu.
 */
const NAJWIEKSZE_ZDJECIE = 2_500_000

const SchematWiadomosci = z.object({
  tytul: z.string().trim().min(5, 'Tytuł musi mieć co najmniej pięć znaków').max(200),
  lid: z.string().trim().min(10, 'Lid musi mieć co najmniej dziesięć znaków').max(400),
  tresc: z.string().trim().min(50, 'Treść jest za krótka — napisz choć akapit').max(20_000),
  zdjecieOpis: z.string().trim().max(300).optional().or(z.literal('')),
  zrodloNazwa: z.string().trim().max(120).optional().or(z.literal('')),
  zrodloAdres: z
    .string()
    .trim()
    .max(500)
    .refine(
      (wartosc) => wartosc === '' || /^https?:\/\//.test(wartosc),
      'Adres źródła musi zaczynać się od http:// albo https://',
    )
    .optional()
    .or(z.literal('')),
  zdjecie: z
    .string()
    .max(NAJWIEKSZE_ZDJECIE, 'Zdjęcie jest za duże')
    .refine(
      (wartosc) => wartosc === '' || wartosc === USUN_ZDJECIE || wartosc.startsWith('data:image/'),
      'Nieprawidłowy format zdjęcia',
    )
    .optional(),
})

function zFormularza(dane: FormData) {
  return SchematWiadomosci.safeParse({
    tytul: dane.get('tytul'),
    lid: dane.get('lid'),
    tresc: dane.get('tresc'),
    zdjecieOpis: dane.get('zdjecieOpis'),
    zrodloNazwa: dane.get('zrodloNazwa'),
    zrodloAdres: dane.get('zrodloAdres'),
    zdjecie: dane.get('zdjecie') ?? undefined,
  })
}

/**
 * Puste pole zdjęcia znaczy „nie ruszaj", znacznik — „skasuj".
 * Bez tego rozróżnienia każdy zapis bez wybrania nowego pliku kasowałby stare.
 */
function zmianaZdjecia(wartosc: string | undefined) {
  if (wartosc === undefined || wartosc === '') return {}
  if (wartosc === USUN_ZDJECIE) return { zdjecie: null }
  return { zdjecie: wartosc }
}

/**
 * Ile czasu ma pisanie wywołane ręcznie z panelu.
 *
 * Mniej niż nocna redakcja, bo tam całość ma sześćdziesiąt sekund funkcji dla
 * siebie, a tutaj czeka człowiek patrzący na kręcące się kółko. Czterdzieści
 * sekund starcza na dwa podejścia i nie zamienia kliknięcia w zawieszenie.
 */
const BUDZET_RECZNEGO_PISANIA_MS = 40_000

function odswiez() {
  revalidateTag(ZNACZNIK_WIADOMOSCI, 'max')
  revalidatePath('/panel/aktualnosci')
}

export async function zapiszWiadomosc(
  id: string,
  _stan: WynikAkcji,
  dane: FormData,
): Promise<WynikAkcji> {
  const wynik = zFormularza(dane)
  if (!wynik.success) return { blad: wynik.error.issues[0].message }

  const { tytul, lid, tresc, zdjecieOpis, zrodloNazwa, zrodloAdres, zdjecie } = wynik.data

  await baza.wiadomosc.update({
    where: { id },
    data: {
      tytul,
      lid,
      tresc,
      zdjecieOpis: zdjecieOpis || null,
      zrodloNazwa: zrodloNazwa || null,
      zrodloAdres: zrodloAdres || null,
      /*
        Ręczna poprawka zdejmuje ostrzeżenie o zapożyczeniach.

        Znacznik mówi „model powielił te fragmenty" i traci sens w chwili,
        gdy człowiek przeszedł przez tekst. Zostawienie go na stałe zrobiłoby
        z niego ozdobę, którą po tygodniu każdy przewija wzrokiem — a wtedy
        następne prawdziwe ostrzeżenie też zostanie przewinięte.
      */
      zapozyczenia: null,
      // Adres notki idzie za tytułem tylko dopóki nic nie jest opublikowane.
      // Po publikacji zmiana adresu zepsułaby odnośniki, które ktoś mógł już
      // gdzieś wkleić — a to gorsze niż adres nieprzystający do tytułu.
      slug: await nowySlugJesliSzkic(id, tytul),
      ...zmianaZdjecia(zdjecie),
    },
  })

  odswiez()
  revalidatePath(`/panel/aktualnosci/${id}`)
  return { ok: 'Zapisano.' }
}

async function nowySlugJesliSzkic(id: string, tytul: string): Promise<string | undefined> {
  const notka = await baza.wiadomosc.findUnique({ where: { id }, select: { stan: true } })
  if (!notka || notka.stan === 'OPUBLIKOWANA') return undefined
  return wolnySlug(tytul, id)
}

export async function opublikujWiadomosc(id: string): Promise<void> {
  const notka = await baza.wiadomosc.findUnique({
    where: { id },
    select: { opublikowano: true },
  })

  await baza.wiadomosc.update({
    where: { id },
    data: {
      stan: 'OPUBLIKOWANA',
      // Data pierwszej publikacji zostaje. Ponowne wypuszczenie notki po
      // poprawce nie powinno przesuwać jej na początek listy — czytelnik
      // zobaczyłby „nowość" sprzed tygodnia.
      opublikowano: notka?.opublikowano ?? new Date(),
    },
  })

  odswiez()
  revalidatePath('/aktualnosci')
  revalidatePath('/')
}

export async function cofnijPublikacje(id: string): Promise<void> {
  await baza.wiadomosc.update({ where: { id }, data: { stan: 'SZKIC' } })
  odswiez()
  revalidatePath('/aktualnosci')
  revalidatePath('/')
}

export async function odrzucWiadomosc(id: string): Promise<void> {
  await baza.wiadomosc.update({ where: { id }, data: { stan: 'ODRZUCONA' } })
  odswiez()
}

/**
 * Usunięcie notki zwraca jej artykuł źródłowy do puli.
 *
 * Bez tego kroku artykuł zostawał na zawsze oznaczony jako wykorzystany,
 * choć nic z niego nie powstało — przepadał z wykazu znalezisk i nie mógł
 * już zostać wybrany ani ręcznie, ani przez redakcję. Skasowanie szkicu,
 * który wyszedł źle, powinno cofać sytuację do stanu sprzed jego napisania,
 * a nie kasować temat razem z nieudaną próbą.
 */
export async function usunWiadomosc(id: string): Promise<void> {
  const notka = await baza.wiadomosc.findUnique({
    where: { id },
    select: { znaleziskoId: true },
  })

  await baza.wiadomosc.delete({ where: { id } })

  if (notka?.znaleziskoId) {
    await baza.znalezionyArtykul.update({
      where: { id: notka.znaleziskoId },
      data: { stan: 'NOWY', ocena: null, uzasadnienie: null },
    })
  }

  odswiez()
  revalidatePath('/panel/aktualnosci/znaleziska')
  redirect('/panel/aktualnosci')
}

/** Notka pisana od zera, bez źródła. */
export async function utworzWlasnaNotke(): Promise<void> {
  const notka = await baza.wiadomosc.create({
    data: {
      slug: await wolnySlug('Nowa wiadomość'),
      tytul: 'Nowa wiadomość',
      lid: 'Jedno zdanie streszczenia — pokazuje się na kartach i w wynikach wyszukiwania.',
      tresc: 'Treść notki. Akapity rozdziela pusta linia.',
      stan: 'SZKIC',
    },
    select: { id: true },
  })

  odswiez()
  redirect(`/panel/aktualnosci/${notka.id}`)
}

/**
 * Notka dla artykułu wskazanego ręcznie w wykazie.
 *
 * **Dlaczego to samo, co robi redakcja dnia.** Bo różnica jest wyłącznie
 * w tym, kto wskazał artykuł. Wcześniej ten przycisk tworzył pustą zajawkę
 * z tekstem zachęty — działało, ale znaczyło, że administrator, który zobaczył
 * w wykazie coś lepszego niż wybór redakcji, musiał pisać wszystko sam.
 * Teraz wskazanie tematu i napisanie o nim notki to jedno kliknięcie.
 *
 * **Dlaczego bez klucza nadal powstaje szkic.** Żeby przycisk zawsze coś
 * robił. Bez modelu dostajemy zajawkę do wypełnienia razem z odnośnikiem do
 * źródła — mniej niż notka, ale więcej niż komunikat o błędzie.
 */
export async function notkaZeZnaleziska(znaleziskoId: string): Promise<void> {
  const znalezisko = await baza.znalezionyArtykul.findUnique({
    where: { id: znaleziskoId },
    include: { zrodlo: { select: { nazwa: true } }, wiadomosc: { select: { id: true } } },
  })
  if (!znalezisko) redirect('/panel/aktualnosci/znaleziska')

  // Znalezisko może już mieć notkę — wtedy prowadzimy do niej zamiast tworzyć
  // drugą. Pole `znaleziskoId` ma warunek unikalności, więc i tak by się nie
  // udało, ale komunikat bazy nie tłumaczy nikomu, co się stało.
  if (znalezisko.wiadomosc) redirect(`/panel/aktualnosci/${znalezisko.wiadomosc.id}`)

  if (kluczDostepny()) {
    const wynik = await napiszDlaArtykulu(znaleziskoId, BUDZET_RECZNEGO_PISANIA_MS)
    if (wynik.wiadomoscId) {
      odswiez()
      revalidatePath('/panel/aktualnosci/znaleziska')
      redirect(`/panel/aktualnosci/${wynik.wiadomoscId}`)
    }
    // Nie udało się — schodzimy do zajawki niżej. Powód jest zapisany przy
    // znalezisku, więc nie ginie.
  }

  const notka = await baza.wiadomosc.create({
    data: {
      slug: await wolnySlug(znalezisko.tytul),
      tytul: znalezisko.tytul.slice(0, 200),
      lid: (znalezisko.opis ?? 'Do napisania.').slice(0, 400),
      tresc:
        'Napisz notkę własnymi słowami na podstawie faktów z artykułu źródłowego.\n\n' +
        'Nie kopiuj zdań z oryginału — podaj to, co się wydarzyło, po swojemu ' +
        'i krócej. Odnośnik do źródła pokaże się pod treścią automatycznie.',
      zrodloNazwa: znalezisko.zrodlo.nazwa,
      zrodloAdres: znalezisko.adres,
      stan: 'SZKIC',
      znaleziskoId: znalezisko.id,
    },
    select: { id: true },
  })

  await baza.znalezionyArtykul.update({
    where: { id: znaleziskoId },
    data: { stan: 'WYKORZYSTANE' },
  })

  odswiez()
  revalidatePath('/panel/aktualnosci/znaleziska')
  redirect(`/panel/aktualnosci/${notka.id}`)
}

export async function odrzucZnalezisko(id: string): Promise<void> {
  await baza.znalezionyArtykul.update({
    where: { id },
    data: { stan: 'ODRZUCONE', uzasadnienie: 'Odrzucone ręcznie w panelu' },
  })
  revalidatePath('/panel/aktualnosci/znaleziska')
}

/* ── Źródła ───────────────────────────────────────────────────────────── */

const SchematZrodla = z.object({
  nazwa: z.string().trim().min(2, 'Podaj nazwę serwisu').max(120),
  adres: z
    .string()
    .trim()
    .max(500)
    .refine((wartosc) => /^https?:\/\//.test(wartosc), 'Adres musi zaczynać się od https://'),
})

export async function dodajZrodlo(_stan: WynikAkcji, dane: FormData): Promise<WynikAkcji> {
  const wynik = SchematZrodla.safeParse({ nazwa: dane.get('nazwa'), adres: dane.get('adres') })
  if (!wynik.success) return { blad: wynik.error.issues[0].message }

  const istnieje = await baza.zrodloWiadomosci.findUnique({
    where: { adres: wynik.data.adres },
    select: { id: true },
  })
  if (istnieje) return { blad: 'To źródło jest już na liście.' }

  await baza.zrodloWiadomosci.create({ data: wynik.data })
  revalidatePath('/panel/aktualnosci/zrodla')
  return { ok: 'Dodano źródło. Zostanie odwiedzone przy najbliższym obchodzie.' }
}

export async function przelaczZrodlo(id: string): Promise<void> {
  const zrodlo = await baza.zrodloWiadomosci.findUnique({
    where: { id },
    select: { aktywne: true },
  })
  if (!zrodlo) return

  await baza.zrodloWiadomosci.update({ where: { id }, data: { aktywne: !zrodlo.aktywne } })
  revalidatePath('/panel/aktualnosci/zrodla')
}

export async function usunZrodlo(id: string): Promise<void> {
  await baza.zrodloWiadomosci.delete({ where: { id } })
  revalidatePath('/panel/aktualnosci/zrodla')
}

/* ── Ręczne uruchomienie zadań ────────────────────────────────────────── */

/**
 * Przyciski „zrób to teraz".
 *
 * Harmonogram chodzi sam, ale bez możliwości wywołania go ręcznie każde
 * sprawdzenie, czy nowe źródło w ogóle działa, wymagałoby czekania do nocy.
 */
export async function uruchomObchod(): Promise<WynikAkcji> {
  const wynik = await obejdzZrodla()
  revalidatePath('/panel/aktualnosci/zrodla')
  revalidatePath('/panel/aktualnosci/znaleziska')

  const czesci = [
    `odwiedzono ${wynik.odwiedzone} z ${wynik.zrodla} źródeł`,
    `nowych artykułów: ${wynik.nowe}`,
  ]
  if (wynik.ocenianie.ocenione > 0) czesci.push(`ocenionych: ${wynik.ocenianie.ocenione}`)
  if (wynik.ocenianie.zostalo > 0) czesci.push(`czeka na ocenę: ${wynik.ocenianie.zostalo}`)
  if (wynik.bledy.length > 0) czesci.push(`źródeł z błędem: ${wynik.bledy.length}`)

  return { ok: `Obchód zakończony — ${czesci.join(', ')}.` }
}

const OPISY_REDAKCJI: Record<string, string> = {
  utworzono: 'Szkic notki czeka na liście aktualności.',
  'brak-kandydatow': 'Nie ma nowych artykułów do wyboru — uruchom najpierw obchód.',
  'nic-nie-warte': 'Żaden artykuł nie przekroczył progu oceny. Dziś notki nie ma.',
  'brak-klucza': 'Redakcja maszynowa jest wyłączona — brakuje klucza do modelu.',
  'za-wczesnie': 'Szkic z ostatnich godzin już istnieje.',
}

export async function uruchomRedakcje(): Promise<WynikAkcji> {
  const wynik = await napiszNotkeDnia()
  odswiez()
  revalidatePath('/panel/aktualnosci/znaleziska')

  const opis = OPISY_REDAKCJI[wynik.stan]
  const szczegoly = wynik.szczegoly ? ` ${wynik.szczegoly}` : ''

  /*
    Wynik wraca do panelu zamiast znikać. Obie te trasy odpowiadają „w porządku"
    także wtedy, gdy świadomie nic nie zrobiły — bez komunikatu przycisk
    wyglądał na niedziałający dokładnie wtedy, gdy zadziałał poprawnie.
  */
  return wynik.stan === 'blad'
    ? { blad: `Redakcja nie napisała notki.${szczegoly}` }
    : { ok: `${opis ?? 'Gotowe.'}${szczegoly}` }
}
