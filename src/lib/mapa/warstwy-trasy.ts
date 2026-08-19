import type { ExpressionSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl'

import { BARWY_SZLAKOW, KOLOR_BEZ_ZNAKOWANIA, KOLOR_OBRYSU_WSTEGI, NAZWY_BARW } from './barwy-szlakow'

/**
 * Warstwy mapy przebiegu trasy — odpowiednik `wstega_trasy.dart`
 * i `szlaki_znakowane.dart` z aplikacji.
 *
 * Wartości są przepisane co do jednej. Szerokości w aplikacji podane są
 * w punktach logicznych, a w MapLibre GL JS w pikselach CSS — to jest 1:1,
 * więc przenoszą się dosłownie. Zmieniając cokolwiek tutaj, zmień to najpierw
 * w aplikacji: to ona jest wzorcem, a rozjazd między mapą w telefonie
 * a mapą na stronie zauważy pierwszy turysta, który spojrzy na oba ekrany.
 *
 * ## Podział ról: barwa i kształt
 *
 * * **Barwa** mówi, ZA CZYM iść — ta sama na wstędze i na drzewie.
 * * **Kształt** mówi, KTÓRA linia jest twoja — wstęga jest kilka razy szersza
 *   od szlaków w tle, ma ciemny obrys i strzałki, których żadna inna linia
 *   na mapie nie ma.
 *
 * Nie odwracaj tego podziału. Wcześniejsza wersja aplikacji malowała trasę
 * jednolitą magentą, a barwę znakowania wpuszczała cienkim paskiem w środek
 * wstęgi. W terenie okazało się to nieczytelne: pierwsze pytanie na rozdrożu
 * brzmi „za jakim kolorem teraz idę", a odpowiadał na nie pasek szeroki na
 * jedną piątą wstęgi, widoczny dopiero od 13. przybliżenia. Zostało wycofane.
 *
 * Szerokość i strzałki niosą tę różnicę także przy daltonizmie, w pełnym
 * słońcu i na zdjęciu satelitarnym — wszędzie tam, gdzie odcienie zawodzą.
 */

export const ZRODLO_SZLAKOW = 'szlaki-znakowane'
export const ZRODLO_WSTEGI = 'trasa-wstega'
export const ZRODLO_ZNAKOWANIA = 'trasa-znakowanie'

export const WARSTWA_OBWODKI_WSTEGI = 'trasa-wstega-obwodka'
export const WARSTWA_WSTEGI = 'trasa-wstega-podklad'
export const WARSTWA_ZNAKOWANIA = 'trasa-wstega-barwa'
export const WARSTWA_STRZALEK = 'trasa-strzalki'
export const IKONA_STRZALKI = 'trasa-strzalka'

/** Plik ze wszystkimi znakowanymi szlakami okolicy — 2110 przebiegów z OSM. */
export const ADRES_SZLAKOW = '/dane/szlaki/szlaki_turystyczne.geojson'

/**
 * Przesunięcie linii w pikselach, osobne dla każdej barwy.
 *
 * Szlaki nagminnie biegną wspólnym odcinkiem — pod Homolami żółty i niebieski
 * idą tą samą ścieżką. Rysowane jeden na drugim pokazywałyby tylko wierzchni;
 * rozsunięte widać oba naraz, dokładnie jak na papierowej mapie turystycznej.
 */
const PRZESUNIECIE: Record<string, number> = {
  czerwony: 0,
  niebieski: 3.5,
  zolty: -3.5,
  zielony: 7,
  czarny: -7,
}

/**
 * Szerokość wstęgi zależna od przybliżenia, przeskalowana wagą.
 *
 * Waga 1,45 to obrys, 1,0 sama wstęga. Obrys jest szerszy o tyle, żeby wystawał
 * spod wstęgi równym marginesem na każdym przybliżeniu — dlatego mnożnik,
 * a nie stała liczba pikseli dodana do szerokości.
 */
function szerokoscWstegi(waga: number): ExpressionSpecification {
  return ['interpolate', ['linear'], ['zoom'], 11, 5.0 * waga, 14, 11.0 * waga, 17, 18.0 * waga]
}

/**
 * Warstwy oficjalnych szlaków znakowanych — dziesięć, po dwie na barwę.
 *
 * Idą POD wstęgą trasy: wstęga jest treścią, one tłem, po którym turysta się
 * orientuje. Bez nich z mapy nie widać, że obok biegnie niebieski, a od
 * skrzyżowania w górę żółty.
 */
export function warstwySzlakow(): LineLayerSpecification[] {
  return NAZWY_BARW.flatMap((nazwa): LineLayerSpecification[] => [
    {
      // Biała obwódka — bez niej żółty ginie na jasnej mapie, a czarny
      // na cieniowanym zboczu.
      id: `szlak-${nazwa}-obwodka`,
      type: 'line',
      source: ZRODLO_SZLAKOW,
      filter: ['==', ['get', 'kolor'], nazwa],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#FFFFFF',
        'line-opacity': 0.75,
        'line-offset': PRZESUNIECIE[nazwa],
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 3.0, 14, 5.5, 17, 8.0],
      },
    },
    {
      // Kreskowana linia w barwie znaków — tak samo jak na tabliczkach w terenie.
      id: `szlak-${nazwa}`,
      type: 'line',
      source: ZRODLO_SZLAKOW,
      filter: ['==', ['get', 'kolor'], nazwa],
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': BARWY_SZLAKOW[nazwa],
        'line-offset': PRZESUNIECIE[nazwa],
        'line-dasharray': [2.5, 1.6],
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.6, 14, 3.0, 17, 4.5],
      },
    },
  ])
}

/** Ciemny obrys pod wstęgą — kładziony jako pierwszy z trzech. */
export function warstwaObrysuWstegi(): LineLayerSpecification {
  return {
    id: WARSTWA_OBWODKI_WSTEGI,
    type: 'line',
    source: ZRODLO_WSTEGI,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': KOLOR_OBRYSU_WSTEGI,
      'line-opacity': 0.9,
      'line-width': szerokoscWstegi(1.45),
    },
  }
}

/**
 * Szara podkładka na całą trasę — jedna cecha, pod barwami.
 *
 * Wypełnia każdą dziurę: odcinki bez znakowania, trasy, dla których barw
 * jeszcze nie policzono, i styki między odcinkami. Bez niej wstęga potrafiła
 * się urwać w połowie i wyglądać na błąd danych.
 */
export function warstwaPodkladuWstegi(): LineLayerSpecification {
  return {
    id: WARSTWA_WSTEGI,
    type: 'line',
    source: ZRODLO_WSTEGI,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': KOLOR_BEZ_ZNAKOWANIA,
      'line-opacity': 0.97,
      'line-width': szerokoscWstegi(1.0),
    },
  }
}

/**
 * Barwy znakowania odcinek po odcinku — na pełnej szerokości wstęgi.
 *
 * Krycie niemal pełne i bez kreskowania: to ma być odpowiedź na pytanie „za
 * czym teraz idę", czytelna z rzutu oka na każdym przybliżeniu.
 *
 * **Dlaczego `match`, a nie `['get', 'kolor']`.** Plik `.kolory.geojson` trzyma
 * nazwy barw tak, jak mówi o nich przewodnik („zolty", „brak"), a nie wartości
 * szesnastkowe. Aplikacja przepisuje je w Dart przed podaniem mapie; tutaj
 * robi to samo wyrażenie stylu, dzięki czemu źródłem warstwy może być wprost
 * adres pliku — bez pobierania go do JavaScriptu i przerabiania cecha po
 * cesze. Wynik jest ten sam, roboty mniej.
 *
 * Ostatnia gałąź `match` to wartość domyślna: nazwa, której nie znamy —
 * i „brak" też — dostaje szarość „bez znakowania". Nie zgadujemy barwy
 * i nie pomijamy odcinka, bo pominięty zrobiłby dziurę we wstędze.
 */
export function warstwaZnakowania(): LineLayerSpecification {
  // Wypisane wprost, a nie złożone pętlą z `NAZWY_BARW`: `match` jest w typach
  // MapLibre krotką o ustalonym kształcie i rozwinięcie tablicy gubi ten
  // kształt. Pięć barw i tak się nie zmieni — przybywa ich rzadziej niż raz
  // na sto lat.
  const naHex: ExpressionSpecification = [
    'match',
    ['get', 'kolor'],
    'zolty',
    BARWY_SZLAKOW.zolty,
    'niebieski',
    BARWY_SZLAKOW.niebieski,
    'czerwony',
    BARWY_SZLAKOW.czerwony,
    'zielony',
    BARWY_SZLAKOW.zielony,
    'czarny',
    BARWY_SZLAKOW.czarny,
    KOLOR_BEZ_ZNAKOWANIA,
  ]

  return {
    id: WARSTWA_ZNAKOWANIA,
    type: 'line',
    source: ZRODLO_ZNAKOWANIA,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': naHex,
      'line-opacity': 0.97,
      'line-width': szerokoscWstegi(1.0),
    },
  }
}

/** Strzałki kierunku marszu wzdłuż wstęgi — kładzione na samym wierzchu. */
export function warstwaStrzalek(): SymbolLayerSpecification {
  return {
    id: WARSTWA_STRZALEK,
    type: 'symbol',
    source: ZRODLO_WSTEGI,
    minzoom: 12,
    layout: {
      'icon-image': IKONA_STRZALKI,
      // Rozmiar dobrany tak, by grot był o włos niższy od wstęgi na każdym
      // przybliżeniu — leży w niej, a nie na niej.
      'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.33, 14, 0.55, 17, 0.9],
      'symbol-placement': 'line',
      // Odstęp w pikselach ekranu, więc gęstość strzałek jest ta sama przy
      // każdym przybliżeniu — mapa nie zamienia się w sznur grotów.
      'symbol-spacing': 92,
      'icon-rotation-alignment': 'map',
      'icon-pitch-alignment': 'map',
      /*
        KLUCZOWE: `icon-keep-upright` obraca ikonę, gdy ta „stanęłaby na
        głowie". Dla napisu to ratunek, dla strzałki katastrofa — odwróciłaby
        znaczenie na każdym odcinku biegnącym z powrotem na zachód.
      */
      'icon-keep-upright': false,
      'icon-allow-overlap': false,
      'icon-ignore-placement': false,
    },
  }
}
