/**
 * Autorzy i licencje zdjęć atrakcji.
 *
 * Zdjęcia pochodzą z Wikimedia Commons i **wszystkie** są na licencjach
 * wymagających podania autora: Creative Commons BY albo BY-SA. To nie jest
 * uprzejmość wobec fotografów, tylko warunek, na jakim wolno ich zdjęcia
 * pokazywać — bez podpisu użycie jest naruszeniem licencji.
 *
 * Dlatego dane siedzą tutaj, a nie w komentarzu obok pliku: komponent karty
 * czyta je i wypisuje przy zdjęciu, więc podpis nie może się zgubić przy
 * przenoszeniu obrazka.
 *
 * Plik powstaje ręcznie przy dobieraniu zdjęć — każde zostało obejrzane
 * i potwierdzone, że pokazuje właśnie tę atrakcję, a nie ogólny widok Pienin.
 *
 * Atrakcje, których tu nie ma, nie mają zdjęcia: w Commons nie było ani jednego
 * ujęcia na wolnej licencji, które faktycznie pokazywałoby to miejsce. Karta
 * dostaje wtedy spokojne pole w barwach marki. To lepsze niż zdjęcie „czegoś
 * podobnego" podpisane nazwą konkretnej atrakcji.
 */

export type PodpisZdjecia = {
  autor: string
  licencja: string
  /** Strona pliku w Commons — wymagany odnośnik do źródła i pełnej licencji. */
  strona: string
}

export const PODPISY_ZDJEC: Record<string, PodpisZdjecia> = {
  'cerkwie-w-jaworkach-i-szlachtowej': {
    autor: 'Drozdp',
    licencja: 'CC BY-SA 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3ACerkiew_Jaworki.jpg',
  },
  'kladka-do-czerwonego-klasztoru': {
    autor: 'Henryk Bielamowicz',
    licencja: 'CC BY-SA 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3ACzerwony_Klasztor%2Ck%C5%82adka_na_Dunajcu_%28HB1%29.jpg',
  },
  'kolej-na-palenice': {
    autor: 'Andrzej Otrębski',
    licencja: 'CC BY-SA 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3ASzczawnica_kolej_Palenica_1.jpg',
  },
  'kosciol-wszystkich-swietych-w-kroscienku': {
    autor: 'Happa',
    licencja: 'CC BY-SA 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3AAll_Saints_church_in_Kro%C5%9Bcienko_nad_Dunajcem_-_general_view_in_November.jpg',
  },
  'muzeum-pieninskie-w-szlachtowej': {
    autor: 'mik Krakow',
    licencja: 'CC BY-SA 2.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3AMUZEUM_PIENI%C5%83SKIE_IM._J%C3%93ZEFA_SZALAYA_W_SZCZAWNICY%2C_fot._M._Klag_%28MIK%2C_2002%29_%283533924164%29.jpg',
  },
  'plac-dietla-i-architektura-szalayowska': {
    autor: 'Mach240390',
    licencja: 'CC BY 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3AWillaPa%C5%82ac-PlacDietla-POL%2C_Szczawnica.jpg',
  },
  'przystan-flisacka-katy': {
    autor: 'Andrzej Otrębski',
    licencja: 'CC BY-SA 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3ASromowce_Wyzne_przystan_flisacka_3.jpg',
  },
  'ruiny-zamku-czorsztyn': {
    autor: 'Mqrcin79',
    licencja: 'CC BY 3.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3AZamek_Czorsztyn_3.jpg',
  },
  'wyciag-w-jaworkach': {
    autor: 'Andrzej Otrębski',
    licencja: 'CC BY-SA 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3AJaworki_wyciag_Homole_1.jpg',
  },
  'zamek-dunajec-w-niedzicy': {
    autor: 'Wiktor Baron | www.baronphotography.eu',
    licencja: 'CC BY-SA 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3AZamek_w_Niedzicy_Wiktor_Baron.jpg',
  },
  'zdroje-szczawnicy': {
    autor: 'Henryk Bielamowicz',
    licencja: 'CC BY-SA 4.0',
    strona: 'https://commons.wikimedia.org/wiki/File%3ASzczawnica%2C_Park_Dolny%2C_grota_M._Zyblikiewicza_%28HB7%29.jpg',
  },
}

export function podpisZdjecia(slug: string): PodpisZdjecia | null {
  return PODPISY_ZDJEC[slug] ?? null
}
