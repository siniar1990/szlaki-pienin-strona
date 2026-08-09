'use server'

import { z } from 'zod'

/**
 * Wysłanie wiadomości z formularza kontaktowego.
 *
 * **Dlaczego przez akcję serwerową, a nie prosto z przeglądarki.** Web3Forms
 * jest pomyślany tak, że formularz wysyła się wprost z HTML-a, a klucz dostępu
 * jest publiczny z założenia. Działa, ale ma dwie wady, których łatwo uniknąć:
 * klucz widnieje w kodzie strony i każdy bot go zbierze, a walidacja odbywa
 * się dopiero po stronie usługi. Wysyłając z serwera trzymamy klucz poza
 * przeglądarką i sprawdzamy dane, zanim cokolwiek wyjdzie na zewnątrz.
 *
 * **Pułapka na boty** to ukryte pole, którego człowiek nie widzi i nie wypełni.
 * Wypełnione znaczy „bot" — udajemy wtedy sukces zamiast zwracać błąd, żeby
 * nie podpowiadać, co poszło nie tak.
 */

const ADRES = 'https://api.web3forms.com/submit'

/**
 * Klucz dostępu Web3Forms.
 *
 * Ten klucz jest publiczny z założenia usługi — normalnie leży wprost
 * w formularzu na stronie. Trzymamy go tu, bo to i tak kod serwerowy, a nie
 * w zmiennej środowiskowej: zmienna wymagałaby konfiguracji przy każdym
 * nowym środowisku, a nie chroni niczego, co nie jest już jawne.
 */
const KLUCZ = '25f55b8f-5d20-475a-97cd-14cdeb050128'

const Schemat = z.object({
  imie: z.string().trim().min(2, 'Podaj imię').max(80),
  email: z.string().trim().email('Sprawdź adres e-mail').max(120),
  temat: z.string().trim().max(120).optional().or(z.literal('')),
  wiadomosc: z
    .string()
    .trim()
    .min(10, 'Napisz choć kilka zdań — łatwiej będzie odpowiedzieć')
    .max(4000),
})

export type WynikWiadomosci = { blad?: string; ok?: string }

export async function wyslijWiadomosc(
  _stan: WynikWiadomosci,
  dane: FormData,
): Promise<WynikWiadomosci> {
  // Pułapka na boty — pole ukryte przed człowiekiem.
  if (String(dane.get('strona_www') ?? '').length > 0) {
    return { ok: 'Wiadomość wysłana. Odpowiemy najszybciej, jak się da.' }
  }

  const wynik = Schemat.safeParse({
    imie: dane.get('imie'),
    email: dane.get('email'),
    temat: dane.get('temat'),
    wiadomosc: dane.get('wiadomosc'),
  })

  if (!wynik.success) return { blad: wynik.error.issues[0].message }

  const { imie, email, temat, wiadomosc } = wynik.data

  try {
    const odpowiedz = await fetch(ADRES, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        access_key: KLUCZ,
        // `subject` trafia w temat maila, więc od razu widać, czego dotyczy.
        subject: temat ? `szlakipienin.pl — ${temat}` : 'szlakipienin.pl — wiadomość ze strony',
        from_name: 'Szlaki Pienin',
        // `replyto` sprawia, że odpowiedź z klienta poczty idzie do nadawcy,
        // a nie do Web3Forms.
        replyto: email,
        Imię: imie,
        'Adres e-mail': email,
        Temat: temat || '(nie podano)',
        Wiadomość: wiadomosc,
      }),
    })

    if (!odpowiedz.ok) {
      return {
        blad: 'Nie udało się wysłać wiadomości. Napisz na adres podany niżej.',
      }
    }
  } catch {
    /*
      Sieć zawiodła albo usługa nie odpowiada. Nie pokazujemy szczegółów
      technicznych — dla piszącego liczy się to, że wiadomość nie doszła
      i że jest druga droga.
    */
    return { blad: 'Nie udało się wysłać wiadomości. Napisz na adres podany niżej.' }
  }

  return { ok: 'Wiadomość wysłana. Odpowiemy najszybciej, jak się da.' }
}
