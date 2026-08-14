import dane from './sieci-centrow.json'

/**
 * Rozpoznanie, czy adres należy do centrum danych.
 *
 * Turysta pod tabliczką przychodzi z sieci operatora komórkowego. Crawler
 * budujący podgląd odnośnika przychodzi z Meta, AWS-a albo Google'a. To nie
 * jest dowód — przez VPN da się wyjść z Hetznera, a operator może przepuścić
 * ruch przez chmurę — ale to najtańszy sygnał, jaki mamy, i drugi po
 * potwierdzeniu z przeglądarki.
 *
 * **Adresu nie zapisujemy.** Wchodzi tu, wychodzi numer sieci; polityka
 * prywatności portalu obiecuje, że adresu nie trzymamy w żadnej postaci,
 * także jako skrótu, i tak zostaje.
 *
 * Zakresy leżą w `sieci-centrow.json` — pliku generowanym przez
 * `narzedzia/pobierz-sieci-centrow.ts`, do odświeżenia raz na kwartał.
 */

type ZakresyIpv4 = [number, number, number][]
type ZakresyIpv6 = [string, string, number][]

const CZWORKI = dane.ipv4 as ZakresyIpv4
const SZOSTKI_TEKSTOWE = dane.ipv6 as ZakresyIpv6

/** Data pobrania listy — panel pokazuje ją przy statystykach botów. */
export const SIECI_POBRANO = dane.pobrano

/*
  Tabela IPv6 powstaje przy pierwszym użyciu, nie przy wczytaniu modułu.
  Zamiana trzech tysięcy tekstów na liczby 128-bitowe kosztuje kilka
  milisekund — niewiele, ale nie ma powodu płacić tego przy każdym zimnym
  starcie funkcji, skoro większość ruchu przychodzi po IPv4.
*/
let szostki: [bigint, bigint, number][] | null = null

function tabelaSzostek(): [bigint, bigint, number][] {
  szostki ??= SZOSTKI_TEKSTOWE.map(([a, b, asn]) => [BigInt(`0x${a}`), BigInt(`0x${b}`), asn])
  return szostki
}

/**
 * Numer sieci, do której należy adres, albo `null`.
 *
 * Zwraca `null` także dla adresów spoza listy — brak odpowiedzi znaczy tu
 * „to nie jest znane nam centrum danych", a nie „to człowiek".
 */
export function siecCentrumDanych(ip: string | null): number | null {
  if (!ip) return null

  if (ip.includes(':')) {
    const liczba = zIpv6(ip)
    return liczba === null ? null : szukaj(tabelaSzostek(), liczba)
  }

  const liczba = zIpv4(ip)
  return liczba === null ? null : szukaj(CZWORKI, liczba)
}

/**
 * Wyszukiwanie binarne po posortowanych zakresach.
 *
 * Osiem tysięcy zakresów przejrzanych po kolei to osiem tysięcy porównań przy
 * każdym skanie. Binarnie wystarcza trzynaście.
 */
function szukaj<T extends number | bigint>(
  zakresy: [T, T, number][],
  adres: T,
): number | null {
  let dol = 0
  let gora = zakresy.length - 1

  while (dol <= gora) {
    const srodek = (dol + gora) >> 1
    const [poczatek, koniec, asn] = zakresy[srodek]!

    if (adres < poczatek) gora = srodek - 1
    else if (adres > koniec) dol = srodek + 1
    else return asn
  }

  return null
}

function zIpv4(adres: string): number | null {
  const czesci = adres.split('.')
  if (czesci.length !== 4) return null

  let wynik = 0
  for (const czesc of czesci) {
    const liczba = Number(czesc)
    if (!Number.isInteger(liczba) || liczba < 0 || liczba > 255) return null
    // Mnożenie zamiast przesunięcia bitowego: w JavaScripcie `<<` liczy na
    // liczbach ze znakiem, więc adresy powyżej 127.x.x.x wyszłyby ujemne.
    wynik = wynik * 256 + liczba
  }
  return wynik
}

function zIpv6(adres: string): bigint | null {
  // Adres w nawiasach kwadratowych z portem („[::1]:443") bywa w nagłówkach
  // proxy — obcinamy, zanim cokolwiek policzymy.
  const czysty = adres.startsWith('[') ? adres.slice(1, adres.indexOf(']')) : adres

  const [przed, po] = czysty.split('::')
  const lewe = przed ? przed.split(':').filter(Boolean) : []
  const prawe = po ? po.split(':').filter(Boolean) : []

  const skrocony = czysty.includes('::')
  const brakujace = skrocony ? 8 - lewe.length - prawe.length : 0
  if (brakujace < 0) return null

  const grupy = [...lewe, ...Array<string>(brakujace).fill('0'), ...prawe]
  if (grupy.length !== 8) return null

  let wynik = BigInt(0)
  for (const grupa of grupy) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(grupa)) return null
    wynik = (wynik << BigInt(16)) | BigInt(`0x${grupa}`)
  }
  return wynik
}
