import { z } from 'zod'

/**
 * Kształt plików, które przychodzą z aplikacji mobilnej.
 *
 * Te schematy opisują dane *takie, jakie są w repozytorium aplikacji* —
 * po polsku, z podkreśleniami, czasem z polem opcjonalnym. Nie próbujemy ich
 * tutaj upiększać; od zamiany na wygodny model domenowy jest `trasy.ts`.
 *
 * Po co w ogóle walidacja, skoro dane są „nasze"? Bo strona buduje się
 * z katalogu synchronizowanego skryptem z drugiego repozytorium. Gdy ktoś
 * zmieni tam nazwę pola albo wyśle trasę z połową danych, chcemy przerwać
 * budowanie z czytelnym komunikatem — a nie opublikować stronę, na której
 * dystans wyświetla się jako „undefined km".
 */

/** Współrzędne w kolejności GeoJSON: [długość, szerokość], opcjonalnie wysokość. */
export const SchematWspolrzednych = z.union([
  z.tuple([z.number(), z.number()]),
  z.tuple([z.number(), z.number(), z.number()]),
])

/** Wartość podana osobno dla marszu w jedną i w drugą stronę. */
const SchematTamPowrot = z.object({
  tam: z.number(),
  powrot: z.number(),
})

export const SchematPunktu = z.object({
  nazwa: z.string(),
  /** Typ z aplikacji: szczyt, przelecz, schronisko, punkt_widokowy, zamek… */
  typ: z.string(),
  coord: SchematWspolrzednych,
  czas_narast_min: SchematTamPowrot,
  wysokosc_m: z.number().nullish(),
  zdjecie: z.string().nullish(),
})

export const SchematSegmentu = z.object({
  od: z.string(),
  do: z.string(),
  tekst: z.string(),
  /**
   * Krótka wskazówka nawigacyjna. Bywa pominięta, ale bywa też wpisana wprost
   * jako `null` — stąd `nullish()`, a nie `optional()`. Rozróżnienie „brak
   * klucza" i „klucz z pustą wartością" nic tu nie wnosi, a rozsypywałoby
   * budowanie za każdym razem, gdy w aplikacji ktoś wyczyści pole.
   */
  wskazowka: z.string().nullish(),
})

/**
 * Zdjęcie z przewodnika.
 *
 * W danych występuje jako obiekt z nazwą pliku i podpisem. Dopuszczamy też
 * sam napis, bo starsze wpisy tak wyglądały i nie ma powodu, by strona się
 * o to wywracała.
 */
export const SchematZdjecia = z.union([
  z.string(),
  z.object({
    plik: z.string(),
    podpis: z.string().nullish(),
  }),
])

/** „Ramka" w przewodniku: ciekawostka przypięta do konkretnego miejsca. */
export const SchematRamki = z.object({
  coord: SchematWspolrzednych,
  tytul: z.string(),
  tekst: z.string(),
})

export const SchematKoloruOdcinka = z.object({
  kolor: z.string(),
  /** Nazwa punktu, do którego sięga ten kolor szlaku. Brak = do końca trasy. */
  do: z.string().optional(),
})

export const SchematTrasy = z.object({
  id: z.string(),
  nazwa: z.string(),
  kategoria: z.string(),
  kategorie_dodatkowe: z.array(z.string()).optional(),
  dlugosc_km: z.number(),
  czas_min: SchematTamPowrot,
  suma_podejsc_m: SchematTamPowrot,
  /** Wydatek energetyczny wyliczony w aplikacji dla trzech mas ciała. */
  kcal: z.record(z.string(), z.number()),
  granica: z.boolean(),
  petla: z.boolean().nullish(),
  pttk: z.boolean(),
  szlaki: z.array(z.string()),
  opis: z.string().nullish(),
  ostrzezenia: z.array(z.string()),
  punkty: z.array(SchematPunktu),
  segmenty_opisu: z.array(SchematSegmentu),
  ramki: z.array(SchematRamki),
  zdjecia: z.array(SchematZdjecia),
  ilustracja: z.string().nullish(),
  /** Ścieżka do śladu w repozytorium aplikacji, np. `assets/trasy/gpx/1A.geojson`. */
  geometry: z.string().nullish(),
  wysokosc_szczytu_m: z.number().nullish(),
  grupa_gorska: z.string().nullish(),
  kolory_odcinkow: z.array(SchematKoloruOdcinka).nullish(),
  _zrodlo_czasow: z.string().nullish(),
  _zrodlo_geometrii: z.string().nullish(),
})

export const SchematWpisuIndeksu = z.object({
  id: z.string(),
  nazwa: z.string(),
  kategoria: z.string(),
  plik: z.string(),
})

export const SchematIndeksu = z.object({
  trasy: z.array(SchematWpisuIndeksu),
})

/** Punkt użytkowy z okolicy: nocleg, sklep, restauracja. */
export const SchematMiejsca = z.object({
  nazwa: z.string(),
  typ: z.string(),
  lat: z.number(),
  lon: z.number(),
})

/** Kapliczka, krzyż lub figura przydrożna z osobnego przewodnika. */
export const SchematKapliczki = z.object({
  nr: z.number().nullish(),
  rejon: z.string().nullish(),
  nazwa: z.string(),
  /**
   * Część kapliczek z przewodnika nie ma jeszcze ustalonych współrzędnych —
   * w danych stoi przy nich `null`. Takie wpisy po prostu pomijamy na mapie,
   * zamiast przerywać budowanie: kapliczka bez pozycji nie jest błędem,
   * tylko pracą, której nikt jeszcze nie zrobił.
   */
  lat: z.number().nullish(),
  lon: z.number().nullish(),
  opis: z.string().nullish(),
})

export const SchematKapliczek = z.object({
  nazwa: z.string().nullish(),
  zrodlo: z.string().nullish(),
  kapliczki: z.array(SchematKapliczki),
})

/**
 * Wyzwanie — pienińska odznaka turystyczna.
 *
 * Schemat obejmuje wszystkie pola, jakie aplikacja trzyma w `wyzwania.json`.
 * Pierwsza wersja brała z niego tylko nazwę, odznakę i odnośnik do regulaminu,
 * a cztery akapity opisu, listę szczytów i wskazówki zostawiała w pliku —
 * strona pokazywała więc uboższą wersję tego samego wyzwania niż telefon.
 *
 * `okres` jest w danych jawnym `null` dla wyzwań bez ograniczenia terminu,
 * więc `nullish`, a nie `optional`.
 */
export const SchematWyzwania = z.object({
  id: z.string(),
  nazwa: z.string(),
  podtytul: z.string().optional(),
  kolejnosc: z.number().optional(),
  dostepne: z.boolean().optional(),
  id_trasy: z.string().optional(),
  odznaka: z.string().optional(),
  film: z.string().optional(),
  film_zrodlo: z.string().optional(),
  regulamin: z.string().optional(),
  opis: z.string().optional(),
  haslo: z.string().optional(),
  akapity: z.array(z.string()).optional(),
  szczyty: z.array(z.string()).optional(),
  wskazowki: z.array(z.string()).optional(),
  okres: z.string().nullish(),
  okres_uwaga: z.string().optional(),
})

export const SchematWyzwan = z.object({
  wyzwania: z.array(SchematWyzwania),
})

export type SurowaTrasa = z.infer<typeof SchematTrasy>
export type SurowyPunkt = z.infer<typeof SchematPunktu>
export type SurowaRamka = z.infer<typeof SchematRamki>
export type SurowySegment = z.infer<typeof SchematSegmentu>
export type SuroweMiejsce = z.infer<typeof SchematMiejsca>
export type SuroweWyzwanie = z.infer<typeof SchematWyzwania>
