'use client'

import { useEffect } from 'react'

/**
 * Potwierdzenie, że stronę tabliczki otworzył człowiek.
 *
 * Cały filtr botów opiera się na jednym fakcie: crawlery pobierają HTML, ale
 * nie wykonują JavaScriptu. Ten komponent jest tym JavaScriptem. Jeśli się
 * wykonał, po drugiej stronie jest przeglądarka; jeśli nie — skan zostaje
 * w bazie oznaczony jako niepotwierdzony i nie wchodzi do statystyk.
 *
 * **Dlaczego `sendBeacon`.** Bo przy tabliczce z kodem QR strona zwykle
 * natychmiast przenosi się do sklepu z aplikacją, a zwykły `fetch` bywa
 * wtedy przerwany razem z całą kartą. `sendBeacon` przekazuje żądanie
 * przeglądarce, która dostarcza je już po opuszczeniu strony — to jedyny
 * sposób, żeby policzyć skan, po którym turysta od razu wychodzi.
 *
 * **Dlaczego z opóźnieniem.** Część automatów wykonuje skrypty, ale nie
 * czeka nawet ćwierć sekundy. Opóźnienie nic nie kosztuje człowieka (i tak
 * patrzy na stronę), a odsiewa te automaty przy okazji.
 */

/** Ile czekamy, gdy turysta zostaje na stronie. */
const OPOZNIENIE_MS = 400

/** Ile czekamy, gdy zaraz przenosimy go do sklepu — tyle, żeby zdążyć wysłać. */
const OPOZNIENIE_PRZED_SKLEPEM_MS = 150

export function PotwierdzenieSkanu({
  token,
  doSklepu,
}: {
  token: string
  doSklepu?: string
}) {
  useEffect(() => {
    let wyslano = false

    const wyslij = () => {
      if (wyslano) return
      wyslano = true

      const tresc = JSON.stringify({ token })
      const adres = '/api/qr/trafienie'

      /*
        `sendBeacon` nie istnieje w starszych przeglądarkach i bywa wyłączony
        przez rozszerzenia. `fetch` z `keepalive` robi to samo, tylko gorzej
        znosi zamknięcie karty — jako zapasowe wyjście wystarcza.
      */
      const wyslany =
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon(adres, new Blob([tresc], { type: 'application/json' }))

      if (!wyslany) {
        void fetch(adres, {
          method: 'POST',
          body: tresc,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {
          // Niepoliczony skan to strata w statystyce, nie w działaniu strony.
        })
      }
    }

    const opoznienie = doSklepu ? OPOZNIENIE_PRZED_SKLEPEM_MS : OPOZNIENIE_MS
    const licznik = setTimeout(() => {
      wyslij()
      // Przeniesienie przez `replace`, nie `assign`: powrót „wstecz" ma
      // wracać tam, skąd turysta przyszedł, a nie na stronę przejściową,
      // która natychmiast wyśle go do sklepu jeszcze raz.
      if (doSklepu) window.location.replace(doSklepu)
    }, opoznienie)

    /*
      Wyjście ze strony przed upływem opóźnienia — zamknięta karta, cofnięcie,
      kliknięcie w odnośnik. Wysyłamy wtedy od razu, żeby nie zgubić skanu
      kogoś, kto tylko zerknął.
    */
    const przyWyjsciu = () => wyslij()
    window.addEventListener('pagehide', przyWyjsciu)

    return () => {
      clearTimeout(licznik)
      window.removeEventListener('pagehide', przyWyjsciu)
    }
  }, [token, doSklepu])

  return null
}
