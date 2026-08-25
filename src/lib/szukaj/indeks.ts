import type { WpisIndeksu } from '@/components/szukaj/wyszukiwarka'
import { KATEGORIE_TRAS } from '@/lib/dane/kategorie'
import { pobierzAtrakcje, pobierzTrasy } from '@/lib/dane/zrodlo'
import { czas, etykietaTypu, kilometry, metry } from '@/lib/format'
import { ATRAKCJE_TURYSTYCZNE, miejsceAtrakcji } from '@/lib/tresc/atrakcje-turystyczne'
import { nazwaKategorii } from '@/lib/tresc/kategorie-atrakcji'
import { MIEJSCOWOSCI } from '@/lib/tresc/miejscowosci'

/**
 * Indeks wyszukiwarki — wszystko, co da się w portalu znaleźć.
 *
 * **Dlaczego osobny moduł, a nie ciało strony.** Bo indeks jest listą źródeł
 * i właśnie na jej niekompletności wyszukiwarka się przewróciła: katalog
 * czterdziestu sześciu atrakcji — z zamkiem w Niedzicy, spływem i zaporą —
 * nigdy do niej nie trafił, mimo że każda z tych rzeczy ma własną stronę.
 * Ciała strony nie da się sprawdzić testem; funkcji owszem, i `indeks.test.ts`
 * pilnuje teraz, żeby żadne źródło znów nie zostało w tyle.
 */

export function zbudujIndeks(): WpisIndeksu[] {
  /*
    Atrakcje mają w portalu dwa źródła i wyszukiwarka znała tylko jedno.

    `pobierzAtrakcje()` to szczyty, przełęcze i punkty widokowe wyłuskane
    z punktów etapowych tras — trzydzieści siedem pozycji. `ATRAKCJE_TURYSTYCZNE`
    to katalog pisany ręcznie: zamek w Niedzicy, spływ, zapora, rejsy —
    czterdzieści sześć pozycji, których w indeksie nie było wcale. Kto wpisał
    „Niedzica", nie znajdował zamku, choć ten ma na portalu własną stronę
    z godzinami i cenami.

    Slug `palenica` występuje w obu zbiorach. Strona atrakcji rozstrzyga to na
    korzyść katalogu, więc indeks robi tak samo — dwa wyniki prowadzące pod
    ten sam adres wyglądają jak usterka.
  */
  const wKatalogu = new Set(ATRAKCJE_TURYSTYCZNE.map((atrakcja) => atrakcja.slug))

  const indeks: WpisIndeksu[] = [
    ...pobierzTrasy().map((trasa) => ({
      nazwa: trasa.nazwa,
      adres: `/szlaki/${trasa.slug}`,
      rodzaj: 'trasa',
      miejsce: trasa.miejscowoscStartu,
      opis: `${kilometry(trasa.dlugoscKm)} · ${czas(trasa.czasMin.tam)} · ${trasa.punkty
        .map((punkt) => punkt.nazwa)
        .join(', ')}`,
    })),
    ...pobierzAtrakcje()
      .filter((atrakcja) => !wKatalogu.has(atrakcja.slug))
      .map((atrakcja) => ({
        nazwa: atrakcja.nazwa,
        adres: `/atrakcje/${atrakcja.slug}`,
        rodzaj: 'atrakcja',
        opis: [
          etykietaTypu(atrakcja.typ),
          atrakcja.wysokoscM !== null ? `${metry(atrakcja.wysokoscM)} n.p.m.` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    /*
      Nazwa miejscowości wchodzi do przeszukiwanego tekstu i to jest tu
      najważniejsze. Nazwy własne odmieniają się przez przypadki: atrakcja
      nazywa się „Zamek Dunajec w Niedzicy", a szuka się jej wpisując
      „Niedzica". Dopasowanie porównuje teksty wprost, więc te dwie formy
      nigdy by się nie spotkały — ale pole lokalizacji trzyma mianownik
      i to ono łączy jedno z drugim.
    */
    ...ATRAKCJE_TURYSTYCZNE.map((atrakcja) => ({
      nazwa: atrakcja.nazwa,
      adres: `/atrakcje/${atrakcja.slug}`,
      rodzaj: 'atrakcja',
      miejsce: miejsceAtrakcji(atrakcja),
      opis: [
        miejsceAtrakcji(atrakcja),
        atrakcja.kategorie.map((kategoria) => nazwaKategorii(kategoria)).join(' '),
        atrakcja.skrot,
      ]
        .filter(Boolean)
        .join(' · '),
    })),
    /*
      Wsie należące do miejscowości (`obejmuje`) wchodzą do przeszukiwanego
      tekstu: kto wpisze „Jaworki", trafi na stronę Szczawnicy, bo to tam są
      opisane. Bez tego nazwy, które nie mają własnej strony, przepadają.
    */
    ...MIEJSCOWOSCI.map((miejscowosc) => ({
      nazwa: miejscowosc.nazwa,
      adres: `/miejscowosci/${miejscowosc.slug}`,
      rodzaj: 'miejscowosc',
      miejsce: [miejscowosc.nazwa, ...(miejscowosc.obejmuje ?? [])].join(' '),
      opis: [(miejscowosc.obejmuje ?? []).join(' '), miejscowosc.lead].filter(Boolean).join(' · '),
    })),
    ...KATEGORIE_TRAS.map((kategoria) => ({
      nazwa: kategoria.nazwa,
      adres: `/szlaki/kategorie/${kategoria.slug}`,
      rodzaj: 'kategoria',
      opis: kategoria.opis,
    })),
    { nazwa: 'Mapa Pienin', adres: '/mapa', rodzaj: 'strona', opis: 'Interaktywna mapa tras i atrakcji' },
    { nazwa: 'Aplikacja Szlaki Pienin', adres: '/aplikacja', rodzaj: 'strona', opis: 'Mapy offline i nawigacja GPS' },
    { nazwa: 'Pienińskie odznaki', adres: '/wyzwania', rodzaj: 'strona', opis: 'Diament Pienin, Rubin Szczawnicy' },
    { nazwa: 'Wsparcie i kontakt', adres: '/wsparcie', rodzaj: 'strona', opis: 'Pomoc, częste pytania, zgłaszanie błędów' },
  ]

  return indeks
}
