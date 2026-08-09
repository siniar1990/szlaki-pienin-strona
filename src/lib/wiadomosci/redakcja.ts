import { baza } from '@/lib/baza'

import { wydobadzTresc } from './kanal'
import { BladModelu, kluczDostepny, MODELE, zapytajOJson } from './model-jezykowy'
import { pobierzTekst } from './siec'
import { wolnySlug } from './slug'
import { sprawdzZapozyczenia, udzialWspolnychTrojek } from './zapozyczenia'

/**
 * Redakcja: wybór artykułu dnia i napisanie własnej notki.
 *
 * **Co tu jest tak naprawdę robione.** Nie „przepisywanie cudzego tekstu
 * innymi słowami" — to byłoby dzieło zależne i dokładnie ten problem
 * z prawami autorskimi, którego chcemy uniknąć. Redakcja pisze **własną
 * krótką notkę o faktach**, które w cudzym artykule opisano, zawsze krótszą
 * od oryginału, zawsze z podaniem źródła i odnośnikiem do niego. To jest
 * przegląd prasy, praktyka stara jak sama prasa: fakty nie podlegają prawu
 * autorskiemu, podlega mu ich konkretne sformułowanie. Dlatego sformułowanie
 * musi być nasze — i dlatego sprawdzamy to maszynowo, a nie na słowo.
 *
 * **Dlaczego nie bierzemy zdjęć.** Zdjęcie w serwisie informacyjnym jest
 * licencjonowane osobno od tekstu i bywa kupione na jedno użycie. Skopiowane
 * jest najkrótszą drogą do wezwania od agencji fotograficznej. Zdjęcie główne
 * dokłada człowiek w panelu, ze świadomością, skąd je ma.
 *
 * **Dlaczego szkic, a nie publikacja.** Bo model bywa pewny siebie i przy tym
 * w błędzie, a portal firmuje właściciel. Nic nie wychodzi na stronę bez
 * kliknięcia człowieka.
 */

/**
 * Ile znalezisk pokazujemy modelowi przy wyborze.
 *
 * Było czterdzieści i to okazało się za dużo — nie objętościowo, tylko
 * czasowo: im dłuższa lista, tym dłużej trwa odpowiedź, a cała redakcja ma
 * jedno wywołanie funkcji na wszystko. Dwadzieścia pięć spokojnie pokrywa
 * dobowy przyrost ze wszystkich źródeł, a lista jest posortowana od
 * najnowszych, więc obcinamy najstarsze, nie najlepsze.
 */
const NAJWIECEJ_KANDYDATOW = 25

/** Do tylu skracamy listę, gdy pierwsza próba nie zdążyła z odpowiedzią. */
const KANDYDACI_PRZY_PONOWIENIU = 12

/** Ile znaków cudzego artykułu wystarczy, żeby napisać o nim notkę. */
const NAJWIECEJ_ZNAKOW_ZRODLA = 12_000

/**
 * Poniżej tej oceny nie powstaje nic.
 *
 * Dzień bez wiadomości jest lepszy niż wiadomość o niczym. Portal, który
 * codziennie musi coś opublikować, po tygodniu publikuje komunikaty o zmianie
 * godzin pracy urzędu — a wtedy nikt nie zagląda do działu, w którym raz na
 * tydzień trafia się rzecz naprawdę ciekawa.
 */
const PROG_OCENY = 60

/** Ile godzin musi minąć od ostatniego szkicu maszynowego. */
const ODSTEP_GODZIN = 20

/**
 * Ile czasu ma cała redakcja.
 *
 * Trasa deklaruje sześćdziesiąt sekund, więc pięćdziesiąt pięć zostawia zapas
 * na zapis do bazy i odesłanie odpowiedzi. Wszystko poniżej musi się w tym
 * zmieścić: wybór, pobranie cudzego artykułu i napisanie notki.
 *
 * **Dlaczego budżet dzielony, a nie stały limit na każdą rozmowę.** Pierwsza
 * wersja dawała obu rozmowom po dwadzieścia pięć sekund niezależnie. Wybór
 * przekroczył swój limit i całość padła — mimo że na napisanie notki czasu
 * było w bród. Teraz każdy krok dostaje tyle, ile naprawdę zostało, więc
 * wolniejszy wybór zabiera czas pisaniu, zamiast wywracać zadanie.
 */
const BUDZET_CALOSCI_MS = 55_000

/** Ile czasu daje się wyborowi. Ma być szybki — prosimy o kilkanaście słów. */
const BUDZET_WYBORU_MS = 20_000

/** Poniżej tylu milisekund nie ma sensu zaczynać kolejnej rozmowy. */
const MINIMUM_NA_ROZMOWE_MS = 12_000

const ROLA_WYBIERAJACEGO = `Jesteś redaktorem portalu turystycznego szlakipienin.pl.
Portal opisuje Pieniny, Szczawnicę, Krościenko nad Dunajcem, Czorsztyn, Jaworki
i Dunajec: szlaki, przyrodę, atrakcje, uzdrowisko, wydarzenia i sprawy, które
dotyczą turysty albo mieszkańca tych miejsc.

Dostajesz listę artykułów znalezionych w lokalnych serwisach. Twoim zadaniem
jest wskazać JEDEN, o którym warto napisać notkę, i odrzucić te, które
w ogóle nie pasują do portalu.

Wybieraj wysoko:
- otwarcia, zamknięcia i zmiany na szlakach, w parku narodowym, na wyciągach
- wydarzenia, na które czytelnik może pojechać
- przyroda, pogoda w górach, warunki na szlakach, ostrzeżenia
- inwestycje i zmiany, które zobaczy turysta albo mieszkaniec
- historia i kultura regionu

Odrzucaj:
- polityka partyjna, sesje rady, spory personalne w urzędzie
- kroniki policyjne i wypadki drogowe bez związku z górami
- ogłoszenia, reklamy, konkursy komercyjne, nekrologi
- treści spoza regionu
- artykuły, których tytuł nic nie mówi

Oceniaj surowo. Ocena to liczba 0-100 mówiąca, na ile warto o tym napisać
na tym konkretnym portalu. Jeżeli żaden artykuł nie zasługuje na notkę,
zwróć wybrany: null.

Odpowiadasz numerami porządkowymi artykułów z listy, nie ich tytułami.`

const ROLA_PISZACEGO = `Jesteś redaktorem portalu turystycznego szlakipienin.pl.
Piszesz krótkie notki informacyjne po polsku.

ZASADA NADRZĘDNA — PRAWO AUTORSKIE.
Dostajesz cudzy artykuł WYŁĄCZNIE jako źródło faktów. Nie wolno Ci go
przepisywać ani parafrazować zdanie po zdaniu. Masz zrozumieć, co się stało,
i napisać o tym własnymi słowami, od zera, własną strukturą.
- ani jeden ciąg siedmiu słów nie może być identyczny jak w źródle
- nie przenoś metafor, gier słownych ani charakterystycznych sformułowań autora
- nie cytuj, chyba że to wypowiedź konkretnej osoby — wtedy krótko,
  w cudzysłowie, z nazwiskiem
- notka ma być KRÓTSZA od źródła: trzy, najwyżej cztery akapity

STYL PORTALU.
- rzeczowo i konkretnie, bez zachwytów i bez języka reklamy
- zaczynaj od tego, co się stało, nie od wstępu o pięknie Pienin
- konkret przed ogólnikiem: nazwy, daty, liczby, godziny
- pisz dla kogoś, kto planuje wyjazd albo tu mieszka
- nie udawaj, że byłeś na miejscu
- nie wymyślaj żadnych faktów, liczb, dat ani cytatów; jeżeli źródło czegoś
  nie podaje, po prostu o tym nie pisz

CZEGO NIE ROBIĆ.
- żadnych wykrzykników, żadnego "warto zaznaczyć", "nie da się ukryć"
- żadnych zachęt w rodzaju "koniecznie odwiedź"
- żadnego podsumowania na końcu, które powtarza początek`

export type WynikRedakcji = {
  stan: 'utworzono' | 'brak-kandydatow' | 'nic-nie-warte' | 'brak-klucza' | 'za-wczesnie' | 'blad'
  szczegoly?: string
  wiadomoscId?: string
  ocena?: number
  odrzucone?: number
  czasMs: number
}

type OdpowiedzWyboru = {
  /** Numer porządkowy z listy w poleceniu, nie identyfikator z bazy. */
  wybrany: number | null
  ocena?: number
  uzasadnienie?: string
  /** Numery porządkowe artykułów spoza tematyki portalu. */
  odrzucone?: number[]
}

type OdpowiedzNotki = {
  tytul: string
  lid: string
  akapity: string[]
}

export async function napiszNotkeDnia(): Promise<WynikRedakcji> {
  const start = Date.now()
  const zakoncz = (wynik: Omit<WynikRedakcji, 'czasMs'>): WynikRedakcji => ({
    ...wynik,
    czasMs: Date.now() - start,
  })

  if (!kluczDostepny()) {
    return zakoncz({
      stan: 'brak-klucza',
      szczegoly:
        'Znaleziska czekają w panelu — notkę można napisać ręcznie. ' +
        'Ustaw KLUCZ_ANTHROPIC, żeby włączyć pisanie automatyczne.',
    })
  }

  /*
    Zabezpieczenie przed dwoma szkicami tego samego dnia. Harmonogram woła tę
    trasę raz dziennie, ale zadania cykliczne bywają powtarzane przy awariach,
    a ręczne wywołanie z panelu jest jedno kliknięcie od przypadku.
  */
  const swiezy = await baza.wiadomosc.findFirst({
    where: {
      odRedakcjiMaszynowej: true,
      utworzono: { gte: new Date(Date.now() - ODSTEP_GODZIN * 60 * 60 * 1000) },
    },
    select: { id: true },
  })
  if (swiezy) {
    return zakoncz({ stan: 'za-wczesnie', szczegoly: `Szkic z ostatnich ${ODSTEP_GODZIN} godzin już istnieje.` })
  }

  const kandydaci = await baza.znalezionyArtykul.findMany({
    where: { stan: 'NOWY' },
    orderBy: [{ opublikowano: 'desc' }, { znaleziono: 'desc' }],
    take: NAJWIECEJ_KANDYDATOW,
    include: { zrodlo: { select: { nazwa: true } } },
  })

  if (kandydaci.length === 0) return zakoncz({ stan: 'brak-kandydatow' })

  /* ── Wybór ────────────────────────────────────────────────────────────── */

  /*
    Kandydaci są ponumerowani, a nie oznaczeni identyfikatorami z bazy.

    Pierwsza wersja wysyłała identyfikatory cuid i prosiła o listę odrzuconych
    w postaci obiektów z powodem. Przy czterdziestu artykułach sama ta lista
    zajmowała prawie dwa tysiące tokenów wyjścia — odpowiedź nie mieściła się
    w limicie długości i urywała w połowie, a JSON przestawał się rozkładać.

    Numery porządkowe rozwiązują to przy okazji dwóch innych rzeczy: model nie
    ma jak przekręcić dwudziestopięcioznakowego identyfikatora, a lista
    odrzuconych to teraz `[1,4,7]` zamiast trzydziestu obiektów.
  */
  const zapytajOWybor = (lista: typeof kandydaci, czasMs: number) =>
    zapytajOJson<OdpowiedzWyboru>({
      model: MODELE.wybor,
      rolaSystemowa: ROLA_WYBIERAJACEGO,
      // Krótka odpowiedź to szybka odpowiedź. Poprzednia wersja prosiła
      // o wyjaśnienia przy każdym odrzuconym artykule i generowanie tego
      // trwało dłużej niż limit czasu całej rozmowy.
      najwiecejZnakow: 400,
      czasMs,
      tresc:
        'Artykuły do oceny:\n\n' +
        lista
          .map(
            (artykul, numer) =>
              `${numer + 1}. [${artykul.zrodlo.nazwa}] ${artykul.tytul}` +
              (artykul.opis ? `\n   ${artykul.opis.slice(0, 200)}` : ''),
          )
          .join('\n') +
        '\n\nOdpowiedz obiektem JSON o polach:\n' +
        '"wybrany" — numer wybranego artykułu albo null,\n' +
        '"ocena" — liczba 0-100,\n' +
        '"uzasadnienie" — jedno krótkie zdanie,\n' +
        '"odrzucone" — tablica samych numerów artykułów rażąco spoza tematyki ' +
        'portalu, najwyżej dziesięć, np. [1,4,7].\n\n' +
        'Nie opisuj swojego rozumowania. Sam obiekt JSON, nic więcej.',
    })

  /*
    Jedno ponowienie na krótszej liście.

    Wolna odpowiedź przy wyborze potrafiła zabrać cały dzień: zadanie kończyło
    się błędem, a notka nie powstawała wcale. Skrócenie listy o połowę zwykle
    wystarcza, żeby model zdążył, a że jest posortowana od najnowszych,
    obcinamy najstarsze pozycje — czyli te, które i tak miały najmniejsze
    szanse. Ponawiamy tylko wtedy, gdy zostało dość czasu, żeby po udanym
    wyborze napisać jeszcze notkę.
  */
  let uzytaLista = kandydaci
  let wybor: OdpowiedzWyboru
  try {
    wybor = await zapytajOWybor(uzytaLista, BUDZET_WYBORU_MS)
  } catch (pierwszyBlad) {
    const zostalo = BUDZET_CALOSCI_MS - (Date.now() - start)
    if (zostalo < MINIMUM_NA_ROZMOWE_MS * 2) {
      return zakoncz({
        stan: 'blad',
        szczegoly:
          pierwszyBlad instanceof BladModelu ? pierwszyBlad.message : 'Nie udało się wybrać artykułu',
      })
    }

    uzytaLista = kandydaci.slice(0, KANDYDACI_PRZY_PONOWIENIU)
    try {
      wybor = await zapytajOWybor(uzytaLista, MINIMUM_NA_ROZMOWE_MS)
    } catch (drugiBlad) {
      return zakoncz({
        stan: 'blad',
        szczegoly:
          drugiBlad instanceof BladModelu
            ? `${drugiBlad.message} (także przy skróconej liście)`
            : 'Nie udało się wybrać artykułu',
      })
    }
  }

  /** Numer z odpowiedzi na artykuł z listy. Poza zakresem znaczy `null`. */
  const poNumerze = (numer: unknown) => {
    const indeks = Number(numer) - 1
    // Numeracja dotyczy listy faktycznie wysłanej — przy ponowieniu jest ona
    // krótsza od pełnej puli i sięganie do `kandydaci` dałoby inny artykuł.
    return Number.isInteger(indeks) && indeks >= 0 && indeks < uzytaLista.length
      ? uzytaLista[indeks]
      : null
  }

  /*
    Odrzucone znikają z puli na stałe. Bez tego ten sam komunikat o sesji rady
    wracałby do oceny codziennie i codziennie zajmował miejsce w poleceniu —
    po miesiącu model wybierałby spośród samych śmieci.
  */
  const doOdrzucenia = (Array.isArray(wybor.odrzucone) ? wybor.odrzucone : [])
    .map(poNumerze)
    .filter((artykul): artykul is (typeof kandydaci)[number] => artykul !== null)

  if (doOdrzucenia.length > 0) {
    await baza.znalezionyArtykul.updateMany({
      where: { id: { in: doOdrzucenia.map((artykul) => artykul.id) } },
      data: { stan: 'ODRZUCONE', uzasadnienie: 'Poza tematyką portalu' },
    })
  }

  const wybrany = poNumerze(wybor.wybrany)
  const ocena = wybor.ocena ?? 0

  if (!wybrany || ocena < PROG_OCENY) {
    return zakoncz({
      stan: 'nic-nie-warte',
      szczegoly: wybor.uzasadnienie ?? `Najlepszy kandydat dostał ${ocena}/100, próg to ${PROG_OCENY}.`,
      odrzucone: doOdrzucenia.length,
    })
  }

  const wynik = await napiszDlaArtykulu(wybrany.id, BUDZET_CALOSCI_MS - (Date.now() - start), {
    ocena,
    uzasadnienie: wybor.uzasadnienie,
  })

  return zakoncz({ ...wynik, odrzucone: doOdrzucenia.length })
}

/**
 * Napisanie notki dla wskazanego artykułu.
 *
 * Wydzielone z redakcji dnia, bo ta sama czynność potrzebna jest w dwóch
 * miejscach: po automatycznym wyborze i po ręcznym wskazaniu artykułu
 * w panelu. Wcześniej przycisk „Napisz notkę" tworzył tylko pustą zajawkę
 * z tekstem zachęty — działało, ale znaczyło, że administrator, który zobaczył
 * w wykazie coś lepszego niż wybór redakcji, musiał pisać wszystko sam.
 */
export async function napiszDlaArtykulu(
  znaleziskoId: string,
  budzetMs: number,
  wybor?: { ocena?: number; uzasadnienie?: string },
): Promise<Omit<WynikRedakcji, 'czasMs'>> {
  const start = Date.now()

  const wybrany = await baza.znalezionyArtykul.findUnique({
    where: { id: znaleziskoId },
    include: { zrodlo: { select: { nazwa: true } } },
  })
  if (!wybrany) return { stan: 'blad', szczegoly: 'Nie ma takiego artykułu' }

  /* ── Czytanie źródła ──────────────────────────────────────────────────── */

  let tekstZrodla: string
  try {
    const { tresc } = await pobierzTekst(wybrany.adres)
    tekstZrodla = wydobadzTresc(tresc).slice(0, NAJWIECEJ_ZNAKOW_ZRODLA)
  } catch (blad) {
    await baza.znalezionyArtykul.update({
      where: { id: wybrany.id },
      data: { stan: 'ODRZUCONE', uzasadnienie: 'Nie udało się pobrać treści artykułu' },
    })
    return {
      stan: 'blad',
      szczegoly: blad instanceof Error ? blad.message : 'Nie udało się pobrać artykułu',
    }
  }

  if (tekstZrodla.length < 400) {
    await baza.znalezionyArtykul.update({
      where: { id: wybrany.id },
      data: { stan: 'ODRZUCONE', uzasadnienie: 'Za mało treści, żeby napisać notkę' },
    })
    return { stan: 'nic-nie-warte', szczegoly: 'Artykuł nie ma treści, z której dałoby się pisać.' }
  }

  /* ── Pisanie ──────────────────────────────────────────────────────────── */

  const polecenieNotki = (dodatek = '') =>
    `Źródło: ${wybrany.zrodlo.nazwa}\nTytuł oryginału: ${wybrany.tytul}\n\n` +
    `Treść artykułu (materiał źródłowy, NIE do przepisywania):\n"""\n${tekstZrodla}\n"""\n\n` +
    dodatek +
    'Napisz własną notkę. Odpowiedz wyłącznie obiektem JSON o polach: ' +
    '"tytul" (do 90 znaków, własny, nie kopiuj tytułu oryginału), ' +
    '"lid" (jedno zdanie, do 200 znaków), ' +
    '"akapity" (lista 3-4 akapitów, każdy 2-4 zdania).'

  let notka: OdpowiedzNotki | null = null
  /** Ostatnia napisana wersja — także ta, która nie przeszła kontroli. */
  let ostatnia: OdpowiedzNotki | null = null
  let kontrola = { czyste: false, zbieznosci: [] as string[] }

  for (const podejscie of [0, 1]) {
    const zostalo = budzetMs - (Date.now() - start)
    if (zostalo < MINIMUM_NA_ROZMOWE_MS) {
      if (podejscie === 0) {
        return { stan: 'blad', szczegoly: 'Zabrakło czasu na napisanie notki' }
      }
      // Po pierwszym podejściu mamy już tekst — zapisujemy go z ostrzeżeniem
      // zamiast tracić i jego, i temat.
      break
    }

    let kandydat: OdpowiedzNotki
    try {
      kandydat = await zapytajOJson<OdpowiedzNotki>({
        model: MODELE.pisanie,
        rolaSystemowa: ROLA_PISZACEGO,
        najwiecejZnakow: 2000,
        czasMs: zostalo,
        tresc: polecenieNotki(
          podejscie === 0
            ? ''
            : 'UWAGA: poprzednia wersja przepisywała fragmenty źródła dosłownie. ' +
              `Powtórzone ciągi: ${kontrola.zbieznosci.map((c) => `„${c}"`).join('; ')}. ` +
              'Napisz notkę od nowa, innymi słowami i inną strukturą.\n\n',
        ),
      })
    } catch (blad) {
      if (ostatnia) break
      return {
        stan: 'blad',
        szczegoly: blad instanceof BladModelu ? blad.message : 'Nie udało się napisać notki',
      }
    }

    const akapity = (kandydat.akapity ?? []).map((akapit) => String(akapit).trim()).filter(Boolean)
    if (!kandydat.tytul || !kandydat.lid || akapity.length === 0) {
      if (ostatnia) break
      return { stan: 'blad', szczegoly: 'Model zwrócił niekompletną notkę' }
    }

    kandydat.akapity = akapity
    ostatnia = kandydat
    kontrola = sprawdzZapozyczenia(
      [kandydat.tytul, kandydat.lid, ...akapity].join('\n'),
      tekstZrodla,
    )

    if (kontrola.czyste) {
      notka = kandydat
      break
    }
  }

  /*
    Notka po dwóch podejściach nadal powiela źródło.

    Pierwsza wersja wyrzucała ją i odkładała artykuł — i to była zła decyzja.
    Nic nie trafia na portal bez kliknięcia człowieka, więc jedyne, co dawało
    wyrzucenie, to stracony temat i pusty panel. Człowiek, który widzi notkę
    razem z wypisanymi fragmentami do przepisania, jest w lepszej sytuacji niż
    człowiek, który nie widzi nic.

    Szkic powstaje więc mimo wszystko, ale z zapisanymi zbieżnościami — panel
    pokazuje je na czerwono i mówi wprost, co poprawić przed publikacją.
  */
  const doZapisu = notka ?? ostatnia
  if (!doZapisu) return { stan: 'blad', szczegoly: 'Nie udało się napisać notki' }

  /* ── Zapis szkicu ─────────────────────────────────────────────────────── */

  const wiadomosc = await baza.wiadomosc.create({
    data: {
      slug: await wolnySlug(doZapisu.tytul),
      tytul: doZapisu.tytul.slice(0, 200),
      lid: doZapisu.lid.slice(0, 400),
      tresc: doZapisu.akapity.join('\n\n'),
      zapozyczenia: notka ? null : kontrola.zbieznosci.join('\n'),
      zrodloNazwa: wybrany.zrodlo.nazwa,
      zrodloAdres: wybrany.adres,
      odRedakcjiMaszynowej: true,
      stan: 'SZKIC',
      znaleziskoId: wybrany.id,
    },
    select: { id: true },
  })

  await baza.znalezionyArtykul.update({
    where: { id: wybrany.id },
    data: {
      stan: 'WYKORZYSTANE',
      ocena: wybor?.ocena ?? wybrany.ocena,
      uzasadnienie: [
        wybor?.uzasadnienie,
        `zbieżność ze źródłem: ${udzialWspolnychTrojek(doZapisu.akapity.join(' '), tekstZrodla)}%`,
      ]
        .filter(Boolean)
        .join(' · ')
        .slice(0, 300),
    },
  })

  return {
    stan: 'utworzono',
    szczegoly: notka
      ? undefined
      : `Szkic wymaga przepisania ${kontrola.zbieznosci.length} fragmentów zapożyczonych ze źródła`,
    wiadomoscId: wiadomosc.id,
    ocena: wybor?.ocena,
  }
}
