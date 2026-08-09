import { baza } from '@/lib/baza'

import { kluczDostepny, MODELE, zapytajOJson } from './model-jezykowy'

/**
 * Ocena wszystkich znalezisk, nie tylko wybranego.
 *
 * **Po co, skoro redakcja i tak wybiera sama.** Bo przy trzystu pozycjach
 * w wykazie administrator nie ma jak stwierdzić, czy pod artykułem dnia nie
 * leży coś lepszego. Ocena przy każdym wpisie zamienia siedem stron do
 * przewinięcia w listę posortowaną od rzeczy wartych uwagi — i pokazuje przy
 * okazji, czy redakcja ocenia tak samo jak człowiek.
 *
 * **Dlaczego to osobny krok, a nie rozszerzenie rozmowy wyboru.** Rozmowa
 * wyboru jest krytyczna: bez niej nie ma notki. Ta odpowiadała już za trzy
 * awarie z rzędu, wszystkie przez zbyt długą odpowiedź. Doklejenie do niej
 * dwudziestu pięciu dodatkowych liczb byłoby proszeniem się o czwartą.
 * Ocenianie jest funkcją ozdobną — może się nie udać i nikt tego nie odczuje.
 *
 * **Dlaczego przy obchodzie, a nie osobnym zadaniem.** Obchód i tak przynosi
 * te artykuły i i tak jest wołany dwa razy dziennie. Osobne zadanie znaczyłoby
 * kolejny wpis w harmonogramie i kolejne miejsce, w którym coś może przestać
 * działać po cichu.
 */

const ROLA_OCENIAJACEGO = `Jesteś redaktorem portalu turystycznego szlakipienin.pl.
Portal opisuje Pieniny, Szczawnicę, Krościenko nad Dunajcem, Czorsztyn, Jaworki
i Dunajec: szlaki, przyrodę, atrakcje, uzdrowisko, wydarzenia i sprawy, które
dotyczą turysty albo mieszkańca tych miejsc.

Dostajesz ponumerowaną listę artykułów. Każdemu wystawiasz ocenę 0-100 mówiącą,
na ile warto napisać o tym notkę na TYM portalu.

Wysoko (60-100):
- otwarcia, zamknięcia i zmiany na szlakach, w parku narodowym, na wyciągach
- wydarzenia, na które czytelnik może pojechać
- przyroda, pogoda w górach, warunki na szlakach, ostrzeżenia
- inwestycje i zmiany, które zobaczy turysta albo mieszkaniec
- historia i kultura regionu

Nisko (0-30):
- polityka partyjna, sesje rady, spory personalne w urzędzie
- kroniki policyjne i wypadki drogowe bez związku z górami
- ogłoszenia, reklamy, konkursy komercyjne, nekrologi
- treści spoza regionu Pienin
- artykuły, których tytuł nic nie mówi

Oceniaj surowo i nie opisuj rozumowania. Sam obiekt JSON, nic więcej.`

/**
 * Ile artykułów w jednej rozmowie.
 *
 * Tyle samo, co przy wyborze. Większa paczka to dłuższa odpowiedź, a długość
 * odpowiedzi była już źródłem trzech awarii w tym module.
 */
const W_PACZCE = 25

/** Ile czasu dajemy jednej rozmowie. */
const CZAS_PACZKI_MS = 20_000

type OdpowiedzOcen = { oceny?: [number, number][] }

export type WynikOceniania = {
  ocenione: number
  paczki: number
  /** Ile pozycji nadal czeka na ocenę — dokończy je następny obchód. */
  zostalo: number
}

/**
 * Ocenia znaleziska, które nie mają jeszcze oceny.
 *
 * Mieści się w podanym budżecie czasu i kończy na granicy paczki. Przy
 * pierwszym uruchomieniu zaległość liczy setki pozycji, więc rozkłada się ona
 * na kilka obchodów — nie ma powodu robić tego naraz i ryzykować ucięcia
 * funkcji dla czegoś, co nie jest pilne.
 */
export async function ocenNieocenione(budzetMs: number): Promise<WynikOceniania> {
  const start = Date.now()

  if (!kluczDostepny()) {
    return { ocenione: 0, paczki: 0, zostalo: await ileCzeka() }
  }

  let ocenione = 0
  let paczki = 0

  while (Date.now() - start + CZAS_PACZKI_MS < budzetMs) {
    const paczka = await baza.znalezionyArtykul.findMany({
      where: { stan: 'NOWY', ocena: null },
      orderBy: [{ opublikowano: 'desc' }, { znaleziono: 'desc' }],
      take: W_PACZCE,
      include: { zrodlo: { select: { nazwa: true } } },
    })
    if (paczka.length === 0) break

    let odpowiedz: OdpowiedzOcen
    try {
      odpowiedz = await zapytajOJson<OdpowiedzOcen>({
        model: MODELE.wybor,
        rolaSystemowa: ROLA_OCENIAJACEGO,
        najwiecejZnakow: 700,
        czasMs: CZAS_PACZKI_MS,
        tresc:
          paczka
            .map(
              (artykul, numer) =>
                `${numer + 1}. [${artykul.zrodlo.nazwa}] ${artykul.tytul}` +
                (artykul.opis ? `\n   ${artykul.opis.slice(0, 160)}` : ''),
            )
            .join('\n') +
          '\n\nOdpowiedz obiektem JSON o jednym polu "oceny": tablica par ' +
          '[numer, ocena] dla KAŻDEGO artykułu z listy, np. ' +
          '{"oceny":[[1,72],[2,15],[3,44]]}.',
      })
    } catch {
      /*
        Nie udało się — kończymy spokojnie. Reszta poczeka do następnego
        obchodu, a artykuły bez oceny i tak są widoczne w wykazie. Ocenianie
        nie ma prawa przewrócić obchodu, którego jest dodatkiem.
      */
      break
    }

    const pary = Array.isArray(odpowiedz.oceny) ? odpowiedz.oceny : []
    let zapisane = 0

    for (const para of pary) {
      if (!Array.isArray(para) || para.length < 2) continue

      const artykul = paczka[Number(para[0]) - 1]
      const ocena = Number(para[1])
      if (!artykul || !Number.isFinite(ocena)) continue

      await baza.znalezionyArtykul.update({
        where: { id: artykul.id },
        data: { ocena: Math.max(0, Math.min(100, Math.round(ocena))) },
      })
      zapisane += 1
    }

    paczki += 1
    ocenione += zapisane

    /*
      Model odpowiedział, ale nie ocenił niczego z tej paczki. Powtarzanie jej
      w pętli skończyłoby się wyczerpaniem budżetu na tych samych artykułach —
      przerywamy i zostawiamy je następnemu obchodowi.
    */
    if (zapisane === 0) break
  }

  return { ocenione, paczki, zostalo: await ileCzeka() }
}

function ileCzeka(): Promise<number> {
  return baza.znalezionyArtykul.count({ where: { stan: 'NOWY', ocena: null } })
}
