/**
 * Pamięć dat zmian dla mapy witryny.
 *
 * **Problem, który to rozwiązuje.** Mapa stron powstaje przy budowaniu, a tam
 * najprościej sięgnąć po bieżącą chwilę — i tak właśnie wszystkie adresy
 * dostawały ten sam `lastmod` równy dacie wdrożenia. Wyszukiwarka szybko
 * uczy się, że domena kłamie w `lastmod`, i przestaje go czytać — a to jedyny
 * sygnał, po którym wybiera, co odwiedzić najpierw.
 *
 * **Dlaczego plik w repozytorium, a nie git przy budowaniu.** Prawdziwe daty
 * edycji zna wyłącznie historia gita, a maszyna budująca na Vercelu jej nie
 * ma. Dlatego daty żyją w `daty-stron.json` obok kodu: odświeża go skrypt
 * `narzedzia/zbuduj-daty-stron.ts` (ręcznie `npm run daty`, automatycznie
 * workflow `daty-stron.yml`), a budowanie tylko go czyta.
 *
 * **Jak odróżniamy zmianę od wdrożenia.** Każda strona ma skrót swojej
 * treści źródłowej. Ten sam skrót — data zostaje stara, choćby wdrożeń było
 * dziesięć. Inny skrót — strona naprawdę się zmieniła i dostaje datę zmiany
 * źródeł. Ta część jest czystą funkcją, bo to na niej opiera się cała
 * wiarygodność `lastmod` i musi być sprawdzona testem, nie oglądaniem XML-a.
 */

/** Data w formacie `RRRR-MM-DD` — porównywalna leksykograficznie. */
export type DataDnia = string

export type WpisDaty = {
  /** Skrót treści źródłowej strony w chwili ostatniej zmiany. */
  skrot: string
  zmieniono: DataDnia
}

export type ManifestDat = {
  wersja: 1
  strony: Record<string, WpisDaty>
}

/** Bieżący stan jednej strony: skrót treści i data ostatniej zmiany źródeł. */
export type OdciskStrony = {
  sciezka: string
  skrot: string
  dataZrodel: DataDnia
}

export function scalManifest(
  stary: ManifestDat | null,
  biezace: OdciskStrony[],
): ManifestDat {
  const strony: Record<string, WpisDaty> = {}

  // Porządek alfabetyczny, żeby plik nie przemeblowywał się między
  // uruchomieniami — inaczej każdy diff wyglądałby na zmianę wszystkiego.
  for (const biezacy of [...biezace].sort((a, b) => a.sciezka.localeCompare(b.sciezka))) {
    const poprzedni = stary?.strony[biezacy.sciezka]

    if (poprzedni && poprzedni.skrot === biezacy.skrot) {
      strony[biezacy.sciezka] = poprzedni
      continue
    }

    /*
      Data nie może się cofnąć. Skrót strony bywa liczony z treści złożonej
      (np. kategoria = definicja + karty tras), a data — z plików źródłowych;
      gdy zmiana przyszła okrężną drogą, data pliku potrafi być starsza niż
      już zapisana. `lastmod` wcześniejszy od poprzedniego to dla wyszukiwarki
      nonsens, więc bierzemy późniejszą z dwóch.
    */
    const zmieniono =
      poprzedni && poprzedni.zmieniono > biezacy.dataZrodel
        ? poprzedni.zmieniono
        : biezacy.dataZrodel

    strony[biezacy.sciezka] = { skrot: biezacy.skrot, zmieniono }
  }

  // Strony, których już nie ma, po prostu wypadają — wpis bez adresu w mapie
  // witryny nikomu nie służy, a plik rósłby bez końca.
  return { wersja: 1, strony }
}

/** Najpóźniejsza data w manifeście — `lastmod` całej mapy stron w indeksie. */
export function najnowszaData(manifest: ManifestDat): DataDnia | null {
  let najnowsza: DataDnia | null = null
  for (const wpis of Object.values(manifest.strony)) {
    if (najnowsza === null || wpis.zmieniono > najnowsza) najnowsza = wpis.zmieniono
  }
  return najnowsza
}
