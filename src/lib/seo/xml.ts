/**
 * Budowanie kanałów XML: map witryny, mapy Google News i RSS.
 *
 * **Dlaczego czyste funkcje, a nie generowanie wprost w trasach.** Bo to jest
 * jedyna część SEO, którą da się sprawdzić testem bez uruchamiania serwera
 * i bez bazy. Trasa dokłada tylko dane i nagłówki; cała logika — co wchodzi
 * do mapy, co z niej wypada, jak wygląda data — siedzi tutaj i jest
 * przetestowana. Wymaganie „szkic nie może trafić do mapy witryny" to
 * warunek, którego nie chcę weryfikować oglądaniem strony.
 *
 * **Dlaczego składamy XML z napisów, a nie biblioteką.** Dokumenty są płaskie
 * i mają po cztery znaczniki. Biblioteka byłaby zależnością do utrzymywania
 * przez lata w zamian za oszczędzenie dwudziestu linii — a jedyne realne
 * ryzyko, czyli znaki specjalne w tytułach, i tak trzeba obsłużyć świadomie.
 */

/**
 * Ucieczka znaków specjalnych XML.
 *
 * Tytuły notek przychodzą od modelu językowego i z cudzych serwisów, więc
 * prędzej czy później trafi się w nich ampersand albo cudzysłów prosty.
 * Bez tego jeden taki tytuł psuje cały dokument — a wtedy Google przestaje
 * czytać nie ten artykuł, tylko całą mapę witryny.
 */
export function uciekaj(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Data w formacie W3C, którego oczekują mapy witryny. */
export function dataW3C(data: Date): string {
  return data.toISOString()
}

/** Data w formacie RFC 822, którego oczekuje RSS 2.0. */
export function dataRfc822(data: Date): string {
  return data.toUTCString()
}

export type WpisMapy = {
  adres: string
  zmieniono?: Date
  czestotliwosc?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  waga?: number
}

export function mapaWitryny(wpisy: WpisMapy[]): string {
  const pozycje = wpisy
    .map((wpis) =>
      [
        '  <url>',
        `    <loc>${uciekaj(wpis.adres)}</loc>`,
        wpis.zmieniono ? `    <lastmod>${dataW3C(wpis.zmieniono)}</lastmod>` : null,
        wpis.czestotliwosc ? `    <changefreq>${wpis.czestotliwosc}</changefreq>` : null,
        wpis.waga !== undefined ? `    <priority>${wpis.waga.toFixed(1)}</priority>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pozycje}
</urlset>`
}

export function indeksMap(mapy: { adres: string; zmieniono: Date }[]): string {
  const pozycje = mapy
    .map(
      (mapa) =>
        `  <sitemap>\n    <loc>${uciekaj(mapa.adres)}</loc>\n` +
        `    <lastmod>${dataW3C(mapa.zmieniono)}</lastmod>\n  </sitemap>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pozycje}
</sitemapindex>`
}

/* ── Google News ────────────────────────────────────────────────────────── */

/**
 * Ile dni wstecz wchodzi do mapy Google News.
 *
 * Google podaje wprost: „only include recent URLs for articles that were
 * created in the last two days". Starsze mają zostać usunięte. Trzymanie tam
 * całego archiwum nie przyspiesza indeksowania, tylko zaśmieca kanał, który
 * ma jedno zadanie — powiedzieć „to jest świeże".
 */
export const DNI_W_MAPIE_NEWS = 2

/** Google przyjmuje najwyżej tyle pozycji w jednej mapie wiadomości. */
export const LIMIT_MAPY_NEWS = 1000

export type WpisNews = {
  adres: string
  tytul: string
  opublikowano: Date
}

export function mapaNews(
  wpisy: WpisNews[],
  publikacja: { nazwa: string; jezyk: string },
): string {
  const pozycje = wpisy
    .slice(0, LIMIT_MAPY_NEWS)
    .map((wpis) =>
      [
        '  <url>',
        `    <loc>${uciekaj(wpis.adres)}</loc>`,
        '    <news:news>',
        '      <news:publication>',
        `        <news:name>${uciekaj(publikacja.nazwa)}</news:name>`,
        `        <news:language>${uciekaj(publikacja.jezyk)}</news:language>`,
        '      </news:publication>',
        `      <news:publication_date>${dataW3C(wpis.opublikowano)}</news:publication_date>`,
        `      <news:title>${uciekaj(wpis.tytul)}</news:title>`,
        '    </news:news>',
        '  </url>',
      ].join('\n'),
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${pozycje}
</urlset>`
}

/** Odsiewa notki spoza okna Google News. Wydzielone, żeby dało się to sprawdzić testem. */
export function wOknieNews(opublikowano: Date, teraz = new Date()): boolean {
  const granica = new Date(teraz.getTime() - DNI_W_MAPIE_NEWS * 24 * 60 * 60 * 1000)
  return opublikowano >= granica
}

/* ── RSS ────────────────────────────────────────────────────────────────── */

export type WpisRss = {
  adres: string
  tytul: string
  opis: string
  opublikowano: Date
  zdjecie?: string
}

export function kanalRss(
  wpisy: WpisRss[],
  kanal: { tytul: string; adres: string; opis: string; jezyk: string },
): string {
  const pozycje = wpisy
    .map((wpis) =>
      [
        '    <item>',
        `      <title>${uciekaj(wpis.tytul)}</title>`,
        `      <link>${uciekaj(wpis.adres)}</link>`,
        // `isPermaLink` wprost, bo domyślnie czytniki traktują guid jak adres
        // i część z nich próbuje go otworzyć. Tutaj akurat jest adresem, więc
        // deklarujemy to zamiast liczyć na domysł.
        `      <guid isPermaLink="true">${uciekaj(wpis.adres)}</guid>`,
        `      <pubDate>${dataRfc822(wpis.opublikowano)}</pubDate>`,
        `      <description>${uciekaj(wpis.opis)}</description>`,
        wpis.zdjecie
          ? `      <enclosure url="${uciekaj(wpis.zdjecie)}" type="image/jpeg" />`
          : null,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n')

  const teraz = wpisy[0]?.opublikowano ?? new Date()

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${uciekaj(kanal.tytul)}</title>
    <link>${uciekaj(kanal.adres)}</link>
    <description>${uciekaj(kanal.opis)}</description>
    <language>${uciekaj(kanal.jezyk)}</language>
    <lastBuildDate>${dataRfc822(teraz)}</lastBuildDate>
    <atom:link href="${uciekaj(kanal.adres)}/rss.xml" rel="self" type="application/rss+xml" />
${pozycje}
  </channel>
</rss>`
}
