/**
 * Pobranie zakresów adresów należących do centrów danych.
 *
 * Po co: crawlery Meta, AWS-a i Google'a przychodzą z sieci hostingowych, a
 * turysta pod tabliczką — z sieci operatora komórkowego. Numer sieci (ASN)
 * jest więc dobrym, choć nie jedynym, sygnałem, że po drugiej stronie nie ma
 * człowieka.
 *
 * **Dlaczego lista w repozytorium, a nie zapytanie w locie.** Zapytanie do
 * cudzego API przy każdym skanie oznaczałoby, że skanowanie tabliczki przestaje
 * działać, gdy komuś innemu padnie serwer. Lista zmienia się rzadko — raz na
 * kwartał wystarczy, a plik jest w repozytorium, więc widać w historii, kiedy
 * i co się zmieniło.
 *
 * **Dlaczego RIPEstat, a nie MaxMind.** Bo nie wymaga konta, licencji ani
 * pliku mmdb wielkości dziesięciu megabajtów. Interesuje nas kilkanaście
 * konkretnych sieci, a nie cały internet.
 *
 * Uruchomienie:
 *     npx tsx narzedzia/pobierz-sieci-centrow.ts
 */

import { writeFile } from 'node:fs/promises'

/** Sieci, z których ruch traktujemy jako nie-ludzki. */
const SIECI = [
  { asn: 32934, kto: 'Meta / Facebook' },
  { asn: 16509, kto: 'Amazon AWS' },
  { asn: 14618, kto: 'Amazon AWS (us-east-1)' },
  { asn: 15169, kto: 'Google' },
  { asn: 396982, kto: 'Google Cloud' },
  { asn: 8075, kto: 'Microsoft Azure' },
  { asn: 13335, kto: 'Cloudflare' },
  { asn: 14061, kto: 'DigitalOcean' },
  { asn: 24940, kto: 'Hetzner' },
  { asn: 16276, kto: 'OVH' },
  { asn: 20473, kto: 'Vultr' },
] as const

const PLIK = new URL('../src/lib/qr/sieci-centrow.json', import.meta.url)

type Zakres = [bigint, bigint]
type ZakresZSiecia = [bigint, bigint, number]

async function pobierzPrefiksy(asn: number): Promise<string[]> {
  const adres = `https://stat.ripe.net/data/announced-prefixes/data.json?resource=AS${asn}`
  const odpowiedz = await fetch(adres)
  if (!odpowiedz.ok) throw new Error(`AS${asn}: RIPEstat odpowiedział ${odpowiedz.status}`)

  const tresc = (await odpowiedz.json()) as { data?: { prefixes?: { prefix?: string }[] } }
  const prefiksy = tresc.data?.prefixes ?? []
  return prefiksy.map((p) => p.prefix).filter((p): p is string => Boolean(p))
}

/** „1.2.3.0/24" → para liczb granicznych. IPv4 i IPv6 idą tą samą drogą. */
function naZakres(prefiks: string): { zakres: Zakres; wersja: 4 | 6 } | null {
  const [adres, dlugoscTekst] = prefiks.split('/')
  if (!adres || !dlugoscTekst) return null

  const dlugosc = Number(dlugoscTekst)
  const wersja = adres.includes(':') ? 6 : 4
  const bity = wersja === 4 ? 32 : 128
  if (!Number.isInteger(dlugosc) || dlugosc < 0 || dlugosc > bity) return null

  const podstawa = wersja === 4 ? zIpv4(adres) : zIpv6(adres)
  if (podstawa === null) return null

  // Maska zeruje część hosta; koniec zakresu to ta sama sieć z jedynkami.
  const rozmiar = BigInt(1) << BigInt(bity - dlugosc)
  const poczatek = (podstawa / rozmiar) * rozmiar
  return { zakres: [poczatek, poczatek + rozmiar - BigInt(1)], wersja }
}

function zIpv4(adres: string): bigint | null {
  const czesci = adres.split('.')
  if (czesci.length !== 4) return null

  let wynik = BigInt(0)
  for (const czesc of czesci) {
    const liczba = Number(czesc)
    if (!Number.isInteger(liczba) || liczba < 0 || liczba > 255) return null
    wynik = (wynik << BigInt(8)) | BigInt(liczba)
  }
  return wynik
}

function zIpv6(adres: string): bigint | null {
  const [przed, po] = adres.split('::')
  const lewe = przed ? przed.split(':').filter(Boolean) : []
  const prawe = po ? po.split(':').filter(Boolean) : []
  if (lewe.length + prawe.length > 8) return null

  const brakujace = adres.includes('::') ? 8 - lewe.length - prawe.length : 0
  const grupy = [...lewe, ...Array<string>(brakujace).fill('0'), ...prawe]
  if (grupy.length !== 8) return null

  let wynik = BigInt(0)
  for (const grupa of grupy) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(grupa)) return null
    wynik = (wynik << BigInt(16)) | BigInt(`0x${grupa}`)
  }
  return wynik
}

/**
 * Scalenie zakresów stykających się i zawierających się w sobie.
 *
 * Bez tego plik ma czterdzieści tysięcy wpisów, bo dostawcy chmur ogłaszają
 * te same bloki w kawałkach. Po scaleniu zostaje jedna czwarta i wyszukiwanie
 * binarne ma mniej pracy.
 */
function scal(zakresy: Zakres[]): Zakres[] {
  const posortowane = [...zakresy].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  const wynik: Zakres[] = []

  for (const [poczatek, koniec] of posortowane) {
    const ostatni = wynik.at(-1)
    if (ostatni && poczatek <= ostatni[1] + BigInt(1)) {
      if (koniec > ostatni[1]) ostatni[1] = koniec
    } else {
      wynik.push([poczatek, koniec])
    }
  }

  return wynik
}

/*
  Całość w funkcji, bo `tsx` kompiluje ten plik do modułu CommonJS, a tam
  `await` na najwyższym poziomie nie istnieje.
*/
async function main() {
  /*
    Scalamy osobno w obrębie każdej sieci, a nie wszystko razem. Zakres bez
    numeru AS mówiłby tylko „centrum danych"; z numerem panel potrafi napisać,
    które — a różnica między crawlerem Meta a skanerem z Hetznera bywa
    różnicą między „opublikowaliśmy post" a „ktoś nas obmacuje".
  */
  const czworki: ZakresZSiecia[] = []
  const szostki: ZakresZSiecia[] = []

  for (const siec of SIECI) {
    const prefiksy = await pobierzPrefiksy(siec.asn)
    const doScalenia: { czworki: Zakres[]; szostki: Zakres[] } = { czworki: [], szostki: [] }

    for (const prefiks of prefiksy) {
      const rozpoznany = naZakres(prefiks)
      if (!rozpoznany) continue
      ;(rozpoznany.wersja === 4 ? doScalenia.czworki : doScalenia.szostki).push(rozpoznany.zakres)
    }

    for (const [poczatek, koniec] of scal(doScalenia.czworki)) {
      czworki.push([poczatek, koniec, siec.asn])
    }
    for (const [poczatek, koniec] of scal(doScalenia.szostki)) {
      szostki.push([poczatek, koniec, siec.asn])
    }

    console.log(`AS${siec.asn} (${siec.kto}): ${prefiksy.length} prefiksów`)
  }

  // Wyszukiwanie binarne wymaga porządku po początku zakresu — sieci
  // dokładaliśmy jedna po drugiej, więc trzeba posortować całość.
  const scaloneCzworki = [...czworki].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  const scaloneSzostki = [...szostki].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))

  /*
    IPv4 zapisujemy jako liczby, IPv6 jako szesnastkowe teksty. Liczba
    128-bitowa nie mieści się w typie `number`, a zapis dziesiętny w tekście
    zajmuje o jedną trzecią więcej miejsca niż szesnastkowy.
  */
  const dane = {
    opis: 'Zakresy adresów sieci centrów danych. Plik generowany — patrz narzedzia/pobierz-sieci-centrow.ts',
    pobrano: new Date().toISOString().slice(0, 10),
    sieci: SIECI.map((s) => `AS${s.asn} ${s.kto}`),
    ipv4: scaloneCzworki.map(([a, b, asn]) => [Number(a), Number(b), asn]),
    ipv6: scaloneSzostki.map(([a, b, asn]) => [a.toString(16), b.toString(16), asn]),
  }

  await writeFile(PLIK, `${JSON.stringify(dane)}\n`, 'utf8')

  console.log(
    `\nZapisano ${scaloneCzworki.length} zakresów IPv4 i ${scaloneSzostki.length} IPv6 ` +
      `do ${PLIK.pathname}`,
  )
}

void main().catch((blad) => {
  console.error(blad)
  process.exit(1)
})
