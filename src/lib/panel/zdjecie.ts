/**
 * Przygotowanie zdjęcia w przeglądarce przed wysłaniem do panelu.
 *
 * **Problem, który to rozwiązuje.** Zdjęcia trafiają do bazy jako `data:` URL,
 * a formularze panelu wysyłają je akcją serwerową. Next.js ma na taką akcję
 * **twardy limit jednego megabajta** i po jego przekroczeniu odrzuca żądanie
 * kodem 413 — zanim wykona się jakikolwiek nasz kod. Przeglądarka pokazuje
 * wtedy „This page couldn't load", bo to nie jest błąd formularza, tylko
 * odmowa przyjęcia danych.
 *
 * Wcześniej zdjęcie było kodowane jedną, stałą jakością. Dla większości zdjęć
 * wychodziło 300–500 kB i wszystko działało; dla zdjęcia gęstego w szczegóły —
 * a więc dokładnie dla lasu, skał i panoramy, czyli tego, co się tu publikuje —
 * wychodziło ponad megabajt i zapis się wywracał. Błąd, który pojawiał się
 * „czasami", i to akurat przy najładniejszych zdjęciach.
 *
 * **Dlaczego pętla, a nie po prostu niższa jakość na stałe.** Bo stała jakość
 * to znowu zakład o to, jak wygląda zdjęcie. Schodzimy jakością tak długo, aż
 * wynik zmieści się w limicie, i dopiero gdy to nie wystarcza, zmniejszamy
 * obraz. Zdjęcie proste zachowuje pełną jakość, a skomplikowane samo się
 * dociska — zamiast psuć oba tak samo.
 *
 * **Dlaczego JPEG, a nie WebP.** WebP dałby przy tej samej jakości pliki
 * mniejsze o jakąś trzecią część, ale te same obrazy służą za `og:image`,
 * a roboty serwisów społecznościowych wciąż bywają na nie ślepe. Karta bez
 * grafiki kosztuje więcej niż kilkadziesiąt kilobajtów transferu.
 */

/**
 * Największy dopuszczalny `data:` URL, w znakach.
 *
 * Z zapasem poniżej megabajtowego limitu akcji serwerowej: do zdjęcia dochodzi
 * jeszcze treść notki, pozostałe pola i narzut kodowania formularza. Zapas ma
 * być na tyle duży, żeby nie trzeba go było przeliczać przy każdym nowym polu.
 */
export const NAJWIEKSZY_LADUNEK = 900_000

/** Poniżej tej jakości JPEG zaczyna być widocznie brzydki. */
const NAJNIZSZA_JAKOSC = 0.45

/** Kolejne zmniejszenia obrazu, gdy sama jakość nie wystarcza. */
const ZMNIEJSZENIA = [1, 0.85, 0.7, 0.55]

export class ZdjecieZaDuze extends Error {
  constructor() {
    super('Nie udało się zmniejszyć zdjęcia na tyle, żeby dało się je zapisać')
  }
}

/**
 * Wczytuje plik i zwraca `data:` URL mieszczący się w limicie.
 *
 * @param dluzszyBok docelowa długość dłuższego boku w pikselach
 * @param jakosc jakość wyjściowa; funkcja schodzi niżej tylko gdy musi
 */
export async function zdjecieZPliku(
  plik: File,
  dluzszyBok: number,
  jakosc: number,
): Promise<string> {
  const obraz = await createImageBitmap(plik)

  try {
    for (const zmniejszenie of ZMNIEJSZENIA) {
      const skala = Math.min(1, (dluzszyBok * zmniejszenie) / Math.max(obraz.width, obraz.height))

      const plotno = document.createElement('canvas')
      plotno.width = Math.max(1, Math.round(obraz.width * skala))
      plotno.height = Math.max(1, Math.round(obraz.height * skala))
      plotno.getContext('2d')?.drawImage(obraz, 0, 0, plotno.width, plotno.height)

      /*
        Jakości próbujemy na już narysowanym płótnie — `toDataURL` koduje
        od nowa, ale nie rysuje od nowa, więc pętla jest tania.
      */
      for (let q = jakosc; q >= NAJNIZSZA_JAKOSC; q -= 0.09) {
        const dane = plotno.toDataURL('image/jpeg', q)
        if (dane.length <= NAJWIEKSZY_LADUNEK) return dane
      }
    }

    /*
      Dla zdjęcia z aparatu czy telefonu nie powinniśmy tu nigdy dojść:
      880 px przy jakości 0,45 to kilkadziesiąt kilobajtów. To jest zabezpieczenie
      na wypadek obrazu, którego nie przewidzieliśmy — i istnieje po to, żeby
      taki przypadek skończył się komunikatem przy polu, a nie wysłaniem czegoś
      za dużego i białym ekranem, od którego cała ta poprawka się zaczęła.
    */
    throw new ZdjecieZaDuze()
  } finally {
    obraz.close()
  }
}
