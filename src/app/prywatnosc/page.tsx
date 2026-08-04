import type { Metadata } from 'next'

import { Proza, Uwaga } from '@/components/tresc/proza'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { PORTAL } from '@/lib/konfiguracja'

/**
 * Polityka prywatności aplikacji.
 *
 * Adres tej strony jest podany w App Store Connect, więc `/prywatnosc` musi
 * działać zawsze — przy eksporcie statycznym Next zapisuje ją jako
 * `prywatnosc.html`, czyli pod dokładnie tym adresem, który był tu wcześniej.
 * Treść przeniesiona bez zmian merytorycznych ze starej strony statycznej.
 */

export const metadata: Metadata = {
  title: 'Polityka prywatności',
  description:
    'Polityka prywatności aplikacji Szlaki Pienin. Aplikacja nie zbiera danych, ' +
    'nie ma konta ani analityki.',
  alternates: { canonical: '/prywatnosc' },
}

const OBOWIAZUJE_OD = '4 sierpnia 2026'

const USLUGI = [
  ['OpenFreeMap, OpenStreetMap', 'podkład mapy'],
  ['OpenTopoMap', 'mapa w trybie „Teren”'],
  ['Esri ArcGIS', 'zdjęcia satelitarne'],
  ['OSRM (routing.openstreetmap.de)', 'piesza droga dojścia do szlaku'],
  ['Open-Meteo', 'prognoza pogody'],
  ['IMGW — dane publiczne', 'ostrzeżenia meteorologiczne'],
  ['GitHub', 'komunikaty o zamknięciach szlaków'],
]

export default function StronaPrywatnosc() {
  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Polityka prywatności', adres: '/prywatnosc' }]}
        tytul="Polityka prywatności"
        lead={`Aplikacja Szlaki Pienin · obowiązuje od ${OBOWIAZUJE_OD}`}
      />

      <div className="obszar py-16 lg:py-20">
        <Proza>
          <Uwaga>
            <p>
              <strong>Krótko: nie zbieramy żadnych danych o Tobie.</strong> Aplikacja
              nie ma konta, logowania, analityki ani własnego serwera. Nic, co w niej
              robisz, nie trafia do nas.
            </p>
          </Uwaga>

          <h2>Co zostaje w telefonie</h2>
          <p>
            Wszystkie dane, jakie tworzy aplikacja, zapisują się wyłącznie w pamięci
            Twojego urządzenia:
          </p>
          <ul>
            <li>
              <strong>Nagrane trasy</strong> — ślad marszu, czas, dystans, przewyższenie
              i wysokości. Możesz je skasować w aplikacji albo usuwając aplikację.
            </li>
            <li>
              <strong>Ustawienia</strong> — ulubiony tryb mapy, zgoda na powiadomienia,
              przeczytane komunikaty.
            </li>
            <li>
              <strong>Pobrana mapa</strong> okolicy do użytku bez zasięgu.
            </li>
          </ul>
          <p>
            Nic z tego nie jest wysyłane na żaden serwer. Nagraną trasę opuszcza telefon
            tylko wtedy, gdy <em>sam</em> ją udostępnisz — wybierając „Udostępnij" albo
            eksport do pliku GPX.
          </p>

          <h2>Lokalizacja</h2>
          <p>
            Aplikacja prosi o dostęp do lokalizacji, żeby pokazać Twoje położenie na
            mapie, prowadzić nawigację i nagrywać przebytą trasę. Pozycja jest
            przetwarzana <strong>na urządzeniu</strong> i nie jest nikomu przekazywana.
          </p>
          <p>
            Zgody możesz w każdej chwili cofnąć w Ustawieniach systemu. Bez niej
            aplikacja nadal działa — po prostu nie pokaże, gdzie jesteś.
          </p>

          <h2>Usługi zewnętrzne</h2>
          <p>
            Aplikacja pobiera z internetu mapy, prognozę pogody i drogi dojścia.
            Zapytania do tych usług idą wprost z Twojego telefonu, więc — jak przy
            każdym połączeniu w sieci — ich dostawcy widzą Twój adres IP i to, o co
            pytasz. Nie przekazujemy im Twojego identyfikatora ani historii tras.
          </p>

          <table>
            <thead>
              <tr>
                <th>Usługa</th>
                <th>Do czego</th>
              </tr>
            </thead>
            <tbody>
              {USLUGI.map(([usluga, cel]) => (
                <tr key={usluga}>
                  <td>{usluga}</td>
                  <td>{cel}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            Zapytanie o pogodę zawiera przybliżoną pozycję (miejsce, dla którego
            pokazujemy prognozę). Zapytanie o drogę dojścia zawiera punkt początkowy
            i docelowy. Nie towarzyszy im żaden identyfikator użytkownika.
          </p>

          <h2>Powiadomienia</h2>
          <p>
            Aplikacja może pokazywać powiadomienia o zamknięciach szlaków i ważnych
            komunikatach. Są to <strong>powiadomienia lokalne</strong> — tworzone przez
            aplikację na Twoim telefonie, bez rejestrowania go w jakiejkolwiek usłudze
            wysyłkowej. Nie wiemy, kto je dostał ani czy je przeczytał.
          </p>

          <h2>Strona internetowa</h2>
          <p>
            Ta strona jest zbiorem plików serwowanych przez GitHub Pages. Nie ma na niej
            analityki, reklam ani plików cookie zakładanych przez nas. Jak przy każdej
            stronie w internecie, serwer widzi adres IP odwiedzającego — takie jest
            działanie protokołu, nie nasz wybór.
          </p>

          <h2>Dzieci</h2>
          <p>
            Aplikacja nie jest skierowana do dzieci i nie zbiera danych od nikogo —
            niezależnie od wieku.
          </p>

          <h2>Zmiany</h2>
          <p>
            Gdy polityka się zmieni, poprawimy tę stronę i datę na górze. Aplikacja nie
            zbiera danych, więc nie przewidujemy zmian innych niż porządkowe.
          </p>

          <h2>Kontakt</h2>
          <p>
            Pytania o prywatność: <a href={`mailto:${PORTAL.kontakt}`}>{PORTAL.kontakt}</a>.
          </p>
        </Proza>
      </div>
    </>
  )
}
