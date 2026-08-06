import type { Metadata } from 'next'

import { Proza, Uwaga } from '@/components/tresc/proza'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { PORTAL } from '@/lib/konfiguracja'

/**
 * Polityka prywatności aplikacji i portalu.
 *
 * Adres tej strony jest podany w App Store Connect, więc `/prywatnosc` musi
 * działać zawsze. Stary adres `/prywatnosc.html` prowadzi tu trwałym
 * przekierowaniem — Apple dostał go przed przeniesieniem portalu na serwer
 * i nikt go już nie poprawi.
 *
 * Dokument opisuje dwie rzeczy naraz: aplikację i tę stronę. Przy każdej
 * zmianie w aplikacji trzeba go tu przenieść ręcznie — nie ma między nimi
 * żadnego automatu, a rozjechana polityka prywatności to nie usterka
 * kosmetyczna.
 */

export const metadata: Metadata = {
  title: 'Polityka prywatności',
  description:
    'Polityka prywatności aplikacji Szlaki Pienin i portalu szlakipienin.pl — ' +
    'bez konta, bez analityki, bez profilowania.',
  alternates: { canonical: '/prywatnosc' },
}

const OBOWIAZUJE_OD = '6 sierpnia 2026'

const USLUGI = [
  ['OpenFreeMap, OpenStreetMap', 'podkład mapy'],
  ['OpenTopoMap', 'mapa w trybie „Teren”'],
  ['Esri ArcGIS', 'zdjęcia satelitarne'],
  ['OSRM (routing.openstreetmap.de)', 'piesza droga dojścia do szlaku'],
  ['Open-Meteo', 'prognoza pogody dla Twojej okolicy'],
  ['Nominatim (OpenStreetMap)', 'nazwa miejscowości w pasku pogody'],
  ['IMGW — dane publiczne', 'ostrzeżenia meteorologiczne'],
  ['GitHub', 'komunikaty o zamknięciach szlaków'],
  ['Google (Firebase Cloud Messaging)', 'dostarczanie powiadomień push'],
  ['Apple (APNs)', 'dostarczanie powiadomień push na iPhone’ach'],
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
              <strong>Krótko: nie mamy konta, logowania ani analityki.</strong> Nie
              wiemy, kim jesteś, co oglądasz w aplikacji ani dokąd chodzisz. Twoje
              nagrane trasy zostają w telefonie. Trzy wyjątki — powiadomienia,
              zapytania o pogodę i liczenie skanów tabliczek — opisujemy niżej
              wprost.
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
            mapie, prowadzić nawigację i nagrywać przebytą trasę. Ślad marszu jest
            przetwarzany <strong>na urządzeniu</strong> i nie jest nikomu przekazywany.
          </p>
          <p>
            Dwie rzeczy wymagają jednak wysłania <strong>przybliżonej</strong> pozycji
            na zewnątrz:
          </p>
          <ul>
            <li>
              <strong>Prognoza pogody</strong> — pytamy o nią dla miejsca, w którym
              jesteś, bo w górach pogoda w dolinie i na grani to dwie różne rzeczy.
              Zapytanie idzie do Open-Meteo najwyżej raz na 30 minut i dopiero po
              przejściu około 2 km.
            </li>
            <li>
              <strong>Nazwa miejscowości</strong> w nagłówku paska pogody — pytamy
              o nią serwis Nominatim (OpenStreetMap), najwyżej raz na 10 minut
              i dopiero po przejściu około 3 km.
            </li>
          </ul>
          <p>
            W obu przypadkach wysyłane są same współrzędne, zaokrąglone, bez żadnego
            identyfikatora użytkownika. Nikt po drugiej stronie nie jest w stanie
            powiązać ich z Tobą ani złożyć z nich Twojej trasy.
          </p>
          <p>
            Zgody na lokalizację możesz w każdej chwili cofnąć w Ustawieniach systemu.
            Bez niej aplikacja nadal działa — pokaże pogodę dla Szczawnicy i nie będzie
            wiedziała, gdzie jesteś.
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
            Zapytanie o drogę dojścia zawiera punkt początkowy i docelowy. Nie
            towarzyszy mu żaden identyfikator użytkownika.
          </p>

          <h2>Powiadomienia</h2>
          <p>
            Aplikacja może powiadamiać o zamknięciach szlaków i ważnych komunikatach.
            Działa to na dwa sposoby:
          </p>
          <ul>
            <li>
              <strong>Powiadomienia lokalne</strong> — aplikacja sama sprawdza kanał
              komunikatów przy uruchomieniu i pokazuje nowe wpisy. Nic nie wychodzi
              poza telefon.
            </li>
            <li>
              <strong>Powiadomienia push</strong> — docierają także wtedy, gdy
              aplikacja jest zamknięta. Do ich działania Twój telefon otrzymuje{' '}
              <strong>token urządzenia</strong> i zapisuje się do tematów w usłudze
              Firebase Cloud Messaging (Google). Na iPhonie wiadomość idzie dalej przez
              Apple Push Notification service.
            </li>
          </ul>
          <p>
            Token to identyfikator urządzenia, nie osoby — nie zawiera Twojego imienia,
            adresu e-mail ani numeru telefonu. My go nigdzie nie przechowujemy i nie
            mamy listy urządzeń: wysyłamy wiadomość do <em>tematu</em>, a nie do
            konkretnych telefonów. Nie wiemy więc, kto powiadomienie dostał ani czy je
            przeczytał. Token trafia natomiast do Google, a na iPhonie także do Apple —
            to firmy, które dostarczają wiadomość.
          </p>
          <p>
            Powiadomienia są dobrowolne. Włączasz je i wyłączasz w aplikacji:{' '}
            <strong>Ustawienia → Powiadomienia o nowościach</strong>. Po wyłączeniu
            telefon zostaje wypisany z tematów i przestaje je dostawać, a komunikaty
            nadal czekają w „Aktualnościach".
          </p>

          <h2>Tabliczki z kodami QR</h2>
          <p>
            W terenie stoją tabliczki z kodami QR prowadzącymi na tę stronę.
            Zeskanowanie kodu zapisuje zdarzenie: <strong>którą tabliczkę
            zeskanowano, kiedy, z jakiego systemu i jakiej przeglądarki</strong>,
            a także kraj i miejscowość wyliczone przez dostawcę hostingu. Dane
            służą jednemu celowi — sprawdzeniu, które miejsca w Pieninach
            przyciągają ruch.
          </p>
          <p>
            <strong>Nie zapisujemy adresu IP</strong> — ani jawnie, ani w postaci
            skrótu. Nie zakładamy ciasteczek, nie tworzymy identyfikatorów
            i nie łączymy skanów w historię jednej osoby. Liczymy skany,
            nie ludzi, dlatego ta strona nie prosi o zgodę na pomiar.
            Pojedyncze zdarzenia usuwamy po 90 dniach; zostają wyłącznie sumy
            dzienne dla każdej tabliczki.
          </p>

          <h2>Strona internetowa</h2>
          <p>
            Portal jest serwowany przez Vercel, a dane o skanach tabliczek trzymamy
            w bazie Neon — obie usługi działają w Unii Europejskiej. Nie ma tu
            analityki, reklam ani plików cookie zakładanych przez nas; jedyne
            ciasteczko, jakie ta strona potrafi założyć, to ciasteczko sesji panelu
            administracyjnego i dostaje je wyłącznie właściciel po zalogowaniu.
          </p>
          <p>
            Jak przy każdej stronie w internecie, serwer widzi adres IP
            odwiedzającego — takie jest działanie protokołu, nie nasz wybór. My tego
            adresu nigdzie nie zapisujemy.
          </p>

          <h2>Dzieci</h2>
          <p>
            Aplikacja nie jest skierowana do dzieci i nie zbiera danych od nikogo —
            niezależnie od wieku.
          </p>

          <h2>Zmiany</h2>
          <p>
            Gdy polityka się zmieni, poprawimy tę stronę i datę na górze. Ostatnia
            zmiana dotyczyła powiadomień push oraz prognozy pogody liczonej dla
            miejsca, w którym jesteś.
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
