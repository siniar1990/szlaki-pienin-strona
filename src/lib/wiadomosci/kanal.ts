import { pelnyAdres, pobierzTekst } from './siec'

/**
 * Czytanie list artykułów ze stron źródłowych.
 *
 * **Dlaczego najpierw kanał RSS, a dopiero potem strona.** Kanał to interfejs
 * wystawiony po to, żeby maszyny z niego korzystały: ma tytuł, adres, datę
 * i zajawkę w ustalonych polach, nie zmienia się przy każdej zmianie szablonu
 * i nie obciąża serwera renderowaniem strony. Wyciąganie tego samego
 * z HTML-a jest zgadywaniem, które psuje się przy pierwszej przebudowie
 * cudzego serwisu. Dlatego obchód najpierw pyta o kanał, sam go szuka
 * w nagłówku strony, a po HTML sięga dopiero, gdy kanału nie ma.
 *
 * **Dlaczego bez biblioteki do parsowania XML.** Potrzebujemy czterech pól
 * z prostego, płaskiego dokumentu. Wyrażenia regularne wystarczą, a nie
 * dokładają zależności, która musiałaby przeżyć następne dziesięć lat razem
 * z portalem. Gdyby kiedyś doszły kanały o zagnieżdżonej strukturze, będzie
 * to widać po pustych wynikach i wtedy warto wrócić do tej decyzji.
 */

export type WpisKanalu = {
  adres: string
  tytul: string
  opis: string | null
  opublikowano: Date | null
}

/** Ile wpisów bierzemy z jednego źródła przy jednym obchodzie. */
const NAJWIECEJ_WPISOW = 40

/* ── Pomocnicze ─────────────────────────────────────────────────────────── */

/** Zamienia encje HTML na znaki. Tylko te, które faktycznie się trafiają. */
function odkoduj(tekst: string): string {
  return tekst
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, kod: string) => String.fromCodePoint(Number(kod)))
    .replace(/&#x([0-9a-f]+);/gi, (_, kod: string) => String.fromCodePoint(parseInt(kod, 16)))
    // Ampersand na końcu, inaczej rozkodowałby własne encje z poprzednich kroków.
    .replace(/&amp;/g, '&')
}

/** Usuwa znaczniki i ściska białe znaki — z zajawki chcemy samo zdanie. */
function bezZnacznikow(tekst: string): string {
  return odkoduj(tekst.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function trescZnacznika(fragment: string, nazwa: string): string | null {
  const wynik = new RegExp(`<${nazwa}[^>]*>([\\s\\S]*?)</${nazwa}>`, 'i').exec(fragment)
  return wynik ? odkoduj(wynik[1]).trim() : null
}

function dataAlbNull(tekst: string | null): Date | null {
  if (!tekst) return null
  const data = new Date(tekst)
  return Number.isNaN(data.getTime()) ? null : data
}

/* ── Kanały ─────────────────────────────────────────────────────────────── */

/**
 * Czy to kanał, a nie strona.
 *
 * Sprawdzenie nagłówka musi być wąskie. Pierwsza wersja szukała w nim
 * podciągu „xml" — i uznała za kanał stronę podaną jako `application/
 * xhtml+xml`, po czym wyciągnęła z niej zero wpisów i zgłosiła sukces.
 * Dlatego nagłówek liczy się tylko wtedy, gdy nazywa kanał wprost, a poza tym
 * decyduje początek treści, którego nie da się pomylić.
 */
function czyKanal(tresc: string, typ: string): boolean {
  if (/application\/(rss|atom)\+xml|(application|text)\/xml/i.test(typ)) return true
  return /^\s*(<\?xml[\s\S]{0,200}?<(rss|feed)\b|<rss\b|<feed\b)/i.test(tresc)
}

/** Rozkłada kanał RSS 2.0 albo Atom na wpisy. */
function przeczytajKanal(tresc: string, wzgledem: string): WpisKanalu[] {
  const wpisy: WpisKanalu[] = []

  for (const dopasowanie of tresc.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)) {
    const fragment = dopasowanie[0]

    /*
      RSS trzyma adres w treści `<link>`, Atom w atrybucie `href` pustego
      znacznika. Atom bywa też wielokrotny — bierzemy ten o typie `alternate`
      albo pierwszy bez wskazanego typu, bo `self` i `enclosure` prowadzą
      gdzie indziej niż do artykułu.
    */
    const zAtoma =
      /<link[^>]+rel=["']?alternate["']?[^>]*href=["']([^"']+)["']/i.exec(fragment) ??
      /<link(?![^>]+rel=)[^>]+href=["']([^"']+)["']/i.exec(fragment)
    const surowyAdres = zAtoma ? zAtoma[1] : trescZnacznika(fragment, 'link')
    if (!surowyAdres) continue

    const adres = pelnyAdres(odkoduj(surowyAdres).trim(), wzgledem)
    if (!adres) continue

    const tytul = bezZnacznikow(trescZnacznika(fragment, 'title') ?? '')
    if (!tytul) continue

    const opis = bezZnacznikow(
      trescZnacznika(fragment, 'description') ??
        trescZnacznika(fragment, 'summary') ??
        trescZnacznika(fragment, 'content:encoded') ??
        '',
    )

    wpisy.push({
      adres,
      tytul,
      opis: opis ? opis.slice(0, 600) : null,
      opublikowano:
        dataAlbNull(trescZnacznika(fragment, 'pubDate')) ??
        dataAlbNull(trescZnacznika(fragment, 'published')) ??
        dataAlbNull(trescZnacznika(fragment, 'updated')) ??
        dataAlbNull(trescZnacznika(fragment, 'dc:date')),
    })
  }

  return wpisy.slice(0, NAJWIECEJ_WPISOW)
}

/**
 * Zbiera adresy kanałów podane w nagłówku strony.
 *
 * Zwraca listę, a nie pierwsze trafienie, bo WordPress ogłasza w tym samym
 * miejscu kanał wpisów i kanał komentarzy. Wzięcie pierwszego z brzegu
 * kończyło się czytaniem pustego kanału komentarzy i uznaniem, że serwis nic
 * nie publikuje. Kanały komentarzy odsuwamy na koniec listy zamiast wyrzucać
 * — jeśli jakiś serwis nazywa swój kanał nietypowo, lepiej spróbować go
 * ostatniego niż nie spróbować wcale.
 */
function znajdzKanalyWStronie(tresc: string, wzgledem: string): string[] {
  const kanaly: string[] = []

  for (const dopasowanie of tresc.matchAll(/<link\b[^>]*>/gi)) {
    const znacznik = dopasowanie[0]
    if (!/rel=["']?alternate/i.test(znacznik)) continue
    if (!/type=["']?application\/(rss|atom)\+xml/i.test(znacznik)) continue

    const adres = /href=["']([^"']+)["']/i.exec(znacznik)
    if (!adres) continue

    const pelny = pelnyAdres(odkoduj(adres[1]).trim(), wzgledem)
    if (pelny && !kanaly.includes(pelny)) kanaly.push(pelny)
  }

  const komentarze = (adres: string) => /comments|komentarz/i.test(adres)
  return [...kanaly.filter((a) => !komentarze(a)), ...kanaly.filter(komentarze)]
}

/* ── Zapasowe czytanie strony ───────────────────────────────────────────── */

/**
 * Zbiera odnośniki ze strony, gdy kanału nie ma.
 *
 * Świadomie prymitywne i świadomie ostrożne. Nie próbujemy odgadnąć, który
 * odnośnik jest artykułem, tylko odsiewamy te, które na pewno nim nie są:
 * prowadzące poza serwis, do plików, do stron z listami i do kotwic. Reszta
 * przechodzi dalej z samym tytułem z treści odnośnika, a o tym, czy jest
 * ciekawa, i tak zdecyduje redakcja.
 */
function przeczytajStrone(tresc: string, wzgledem: string): WpisKanalu[] {
  const gospodarz = (() => {
    try {
      return new URL(wzgledem).host
    } catch {
      return null
    }
  })()

  const wpisy = new Map<string, WpisKanalu>()

  for (const dopasowanie of tresc.matchAll(
    /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi,
  )) {
    const adres = pelnyAdres(odkoduj(dopasowanie[1]).trim(), wzgledem)
    if (!adres) continue
    if (gospodarz && new URL(adres).host !== gospodarz) continue
    if (/\.(jpe?g|png|gif|webp|pdf|zip|mp4|mp3|docx?|xlsx?)$/i.test(adres)) continue

    const tytul = bezZnacznikow(dopasowanie[2])
    /*
      Próg długości robi tu całą robotę. Odnośniki nawigacyjne („Kontakt",
      „Więcej", „Czytaj dalej") są krótkie; tytuły artykułów prawie zawsze
      mają kilka słów. Nie jest to reguła bez wyjątków, ale kosztuje jedną
      linię i odsiewa większość śmieci.
    */
    if (tytul.length < 25 || tytul.length > 200) continue
    if (wpisy.has(adres)) continue

    wpisy.set(adres, { adres, tytul, opis: null, opublikowano: null })
    if (wpisy.size >= NAJWIECEJ_WPISOW) break
  }

  return [...wpisy.values()]
}

/* ── Wejście ────────────────────────────────────────────────────────────── */

export type OdczytZrodla = {
  wpisy: WpisKanalu[]
  /** Adres kanału, jeśli udało się go użyć — zapisujemy go przy źródle. */
  adresKanalu: string | null
  sposob: 'kanal' | 'strona'
}

/**
 * Czyta listę artykułów ze źródła.
 *
 * `znanyKanal` to adres zapamiętany przy poprzednim obchodzie. Podanie go
 * oszczędza jedno pobranie strony na źródło i przebieg — przy dwudziestu
 * kilku źródłach to różnica, którą widać w czasie wykonania funkcji.
 */
export async function odczytajZrodlo(
  adres: string,
  znanyKanal?: string | null,
): Promise<OdczytZrodla> {
  if (znanyKanal) {
    const { tresc, typ } = await pobierzTekst(znanyKanal)
    if (czyKanal(tresc, typ)) {
      const wpisy = przeczytajKanal(tresc, znanyKanal)
      if (wpisy.length > 0) return { wpisy, adresKanalu: znanyKanal, sposob: 'kanal' }
    }
    // Kanał zniknął, opustoszał albo zmienił postać — wykrywamy od zera.
  }

  const { tresc, typ } = await pobierzTekst(adres)

  if (czyKanal(tresc, typ)) {
    const wpisy = przeczytajKanal(tresc, adres)
    if (wpisy.length > 0) return { wpisy, adresKanalu: adres, sposob: 'kanal' }
    // Adres wygląda na kanał, ale nic w nim nie ma — nie da się z niego czytać
    // strony, więc kończymy pustą listą zamiast zgadywać.
    return { wpisy: [], adresKanalu: null, sposob: 'kanal' }
  }

  /*
    Kanały próbujemy po kolei aż do pierwszego, który coś zwróci. Pusty kanał
    trafia się przy stronach tagowych i przy kanałach komentarzy — wtedy sama
    strona jest lepszym źródłem niż formalnie poprawny, ale niczego
    niezawierający XML.
  */
  for (const kanal of znajdzKanalyWStronie(tresc, adres)) {
    const zKanalu = await pobierzTekst(kanal).catch(() => null)
    if (!zKanalu || !czyKanal(zKanalu.tresc, zKanalu.typ)) continue

    const wpisy = przeczytajKanal(zKanalu.tresc, kanal)
    if (wpisy.length > 0) return { wpisy, adresKanalu: kanal, sposob: 'kanal' }
  }

  return { wpisy: przeczytajStrone(tresc, adres), adresKanalu: null, sposob: 'strona' }
}

/**
 * Zamienia fragment HTML-a na czytelny tekst.
 *
 * Akapity i nagłówki schodzą do łamań wiersza, żeby streszczenie widziało
 * strukturę tekstu, a nie jedną ścianę słów.
 */
function naTekst(html: string): string {
  return odkoduj(html.replace(/<\/(p|h[1-6]|li|div|br)>/gi, '\n').replace(/<[^>]*>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

/**
 * Jaką część tekstu strony musi mieć `<article>`, żeby uznać go za treść.
 *
 * Miara jest względna, nie bezwzględna, i to jest sedno: kafelek zajawki bywa
 * dłuższy niż krótka notka prasowa, więc próg w znakach myli się w obie
 * strony. Za to proporcja rozdziela te przypadki czysto — artykuł zajmuje
 * większość tekstu swojej strony, zajawka kilka procent.
 *
 * Na stronie, która to ujawniła, najdłuższy kafelek miał 168 znaków przy
 * 4682 znakach całej strony, czyli cztery procent. Prawdziwy artykuł ma
 * zwykle ponad połowę; jedna piąta to próg z zapasem w obie strony.
 */
const UDZIAL_TRESCI = 0.2

/**
 * Wyciąga czytelny tekst z pojedynczego artykułu.
 *
 * Służy wyłącznie temu, żeby redakcja miała z czego pisać — tekst nigdy nie
 * trafia do bazy ani na portal.
 *
 * **Dlaczego najdłuższy `<article>`, a nie pierwszy.** Bo na stronie zbudowanej
 * w popularnych kreatorach każdy kafelek „przeczytaj też" jest osobnym
 * znacznikiem `<article>` — i wszystkie stoją w kodzie PRZED właściwym
 * tekstem. Wersja biorąca pierwszy trafiony wyciągała z takiej strony tytuł
 * i datę cudzej zajawki, po czym redakcja odrzucała artykuł jako pozbawiony
 * treści. Trafiło to na prawdziwy artykuł o spływie flisackim: szesnaście
 * kafelków po kilkadziesiąt znaków, z których żaden nie był tym tekstem.
 *
 * **Dlaczego `<body>` bywa lepszy niż najdłuższy `<article>`.** Bo bywa i tak,
 * że treść w ogóle nie leży w `<article>` — a wtedy każdy kandydat jest
 * zajawką. Rozstrzyga proporcja: artykuł zajmuje większość tekstu swojej
 * strony, zajawka kilka procent. Gdy żaden kandydat nie sięga jednej piątej,
 * bierzemy całe `<body>`. Wchodzi wtedy trochę menu i podpisów, ale model
 * dostaje tekst, o który chodziło, zamiast czterech słów o niczym.
 */
export function wydobadzTresc(html: string): string {
  const bezSmieci = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, ' ')

  const najdluzszyArtykul = [...bezSmieci.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)]
    .map((dopasowanie) => naTekst(dopasowanie[1]))
    .reduce((najlepszy, tekst) => (tekst.length > najlepszy.length ? tekst : najlepszy), '')

  const cialo = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(bezSmieci)
  const zCiala = naTekst(cialo?.[1] ?? bezSmieci)

  return najdluzszyArtykul.length >= zCiala.length * UDZIAL_TRESCI ? najdluzszyArtykul : zCiala
}
