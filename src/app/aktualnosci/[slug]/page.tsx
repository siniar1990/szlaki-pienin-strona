import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { LicznikOdslon } from '@/components/analityka/licznik-odslon'
import { KartaWiadomosci } from '@/components/aktualnosci/karta-wiadomosci'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { OBRAZ_PORTALU } from '@/lib/seo/open-graph'
import { PORTAL } from '@/lib/konfiguracja'
import {
  adresZdjecia,
  akapity,
  dataZGodzina,
  ostatniaZmiana,
  pobierzWiadomosc,
  pobierzWiadomosci,
} from '@/lib/wiadomosci/zapytania'

/**
 * Pojedyncza notka.
 *
 * **Dlaczego przypis do źródła jest osobnym blokiem, a nie zdaniem w tekście.**
 * Notka powstaje z cudzego artykułu i podanie źródła nie jest uprzejmością,
 * tylko warunkiem uczciwości całego działu. Blok na końcu, zawsze w tym samym
 * miejscu i tej samej formie, jest sprawdzalny — zdanie wplecione w tekst
 * prędzej czy później zniknęłoby przy redakcji.
 *
 * **Dlaczego `noopener` przy odnośniku do źródła.** Otwieramy cudzą stronę
 * w nowej karcie, a bez tego atrybutu dostaje ona uchwyt do naszej.
 */
/*
  Świadomie bez `generateStaticParams`. Lista notek żyje w bazie, więc
  budowanie musiałoby się z nią połączyć — a wtedy chwilowa niedostępność bazy
  wywraca całe wdrożenie portalu, którego 99 procent nie ma z aktualnościami
  nic wspólnego. Strony i tak są tanie: `unstable_cache` trzyma odczyt aż do
  publikacji następnej notki.
*/
export async function generateMetadata({
  params,
}: PageProps<'/aktualnosci/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const wiadomosc = await pobierzWiadomosc(slug)
  if (!wiadomosc) return { title: 'Nie znaleziono wiadomości' }

  /*
    Notka bez własnego zdjęcia dostaje obraz portalu, a nie żaden. Wcześniej
    zostawała bez `og:image` — i akurat notki są tym, co najczęściej trafia
    do wklejenia na Facebooku.
  */
  const obrazek = wiadomosc.maZdjecie ? `${PORTAL.adres}${adresZdjecia(slug)}` : OBRAZ_PORTALU
  const zmieniono = ostatniaZmiana(wiadomosc)

  return {
    title: wiadomosc.tytul,
    description: wiadomosc.lid,
    /*
      Adres kanoniczny bez parametrów. Odnośnik z `?utm_source=facebook`
      prowadzi do tej samej strony, a bez tego wpisu wyszukiwarka mogłaby
      uznać go za osobny artykuł i podzielić między dwa adresy to, co
      powinno liczyć się jednemu.
    */
    alternates: { canonical: `/aktualnosci/${slug}` },
    openGraph: {
      type: 'article',
      title: wiadomosc.tytul,
      description: wiadomosc.lid,
      url: `${PORTAL.adres}/aktualnosci/${slug}`,
      siteName: PORTAL.nazwa,
      locale: PORTAL.jezyk,
      publishedTime: wiadomosc.opublikowano.toISOString(),
      modifiedTime: zmieniono.toISOString(),
      authors: [PORTAL.redakcja],
      images: [{ url: obrazek, alt: wiadomosc.zdjecieOpis ?? wiadomosc.tytul }],
    },
    twitter: {
      card: 'summary_large_image',
      title: wiadomosc.tytul,
      description: wiadomosc.lid,
      images: [obrazek],
    },
  }
}

export default async function StronaWiadomosci({ params }: PageProps<'/aktualnosci/[slug]'>) {
  const { slug } = await params
  const wiadomosc = await pobierzWiadomosc(slug)
  if (!wiadomosc) notFound()

  const pozostale = (await pobierzWiadomosci(4)).filter((inna) => inna.slug !== slug).slice(0, 3)

  /*
    Opis strukturalny artykułu. Google używa go w wynikach wyszukiwania —
    data publikacji obok tytułu robi różnicę w dziale, którego cała wartość
    polega na tym, że jest świeży.
  */
  const zmieniono = ostatniaZmiana(wiadomosc)
  const obrazek = wiadomosc.maZdjecie ? `${PORTAL.adres}${adresZdjecia(slug)}` : null

  /*
    Opis strukturalny artykułu.

    Każde pole musi odpowiadać temu, co widać na stronie — `dateModified`
    tylko wtedy, gdy notka faktycznie była poprawiana, autor ten sam, którego
    czyta człowiek pod tytułem. Dane strukturalne mówiące co innego niż treść
    są gorsze niż ich brak: Google traktuje rozjazd jako sygnał, że witrynie
    nie można ufać.
  */
  const daneStrukturalne = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: wiadomosc.tytul,
    description: wiadomosc.lid,
    datePublished: wiadomosc.opublikowano.toISOString(),
    dateModified: zmieniono.toISOString(),
    author: { '@type': 'Organization', name: PORTAL.redakcja, url: PORTAL.adres },
    publisher: { '@type': 'Organization', name: PORTAL.nazwa, url: PORTAL.adres },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${PORTAL.adres}/aktualnosci/${slug}`,
    },
    inLanguage: PORTAL.jezyk,
    ...(obrazek ? { image: [obrazek] } : {}),
    ...(wiadomosc.zrodloAdres ? { isBasedOn: wiadomosc.zrodloAdres } : {}),
  }

  return (
    <>
      <LicznikOdslon rodzaj="AKTUALNOSC" klucz={slug} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneStrukturalne) }}
      />

      <NaglowekStrony
        okruszki={[
          { nazwa: 'Aktualności', adres: '/aktualnosci' },
          { nazwa: wiadomosc.tytul, adres: `/aktualnosci/${slug}` },
        ]}
        tytul={wiadomosc.tytul}
        lead={wiadomosc.lid}
        dodatek={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-kamien-500">
            <span className="font-medium text-kamien-700">{PORTAL.redakcja}</span>
            <span aria-hidden>·</span>
            <time dateTime={wiadomosc.opublikowano.toISOString()} className="font-medium">
              {dataZGodzina(wiadomosc.opublikowano)}
            </time>

            {/* Data poprawki tylko wtedy, gdy notka naprawdę była zmieniana —
                w przeciwnym razie sugerowałaby świeżość, której nie ma. */}
            {wiadomosc.zaktualizowano && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={wiadomosc.zaktualizowano.toISOString()}>
                  Zaktualizowano: {dataZGodzina(wiadomosc.zaktualizowano)}
                </time>
              </>
            )}
          </div>
        }
      />

      <article className="obszar py-12 lg:py-16">
        <div className="mx-auto max-w-[46rem]">
          {wiadomosc.maZdjecie && (
            <figure className="mb-10">
              <Image
                src={adresZdjecia(slug)}
                alt={wiadomosc.zdjecieOpis ?? wiadomosc.tytul}
                width={1600}
                height={900}
                /*
                  Zdjęcie główne notki jest największym elementem strony, więc
                  ładuje się z pierwszeństwem — inaczej przeglądarka zaczyna
                  je pobierać dopiero po skryptach i czas do jego pojawienia
                  się rośnie o kilka sekund.
                */
                priority
                sizes="(max-width: 768px) 100vw, 736px"
                className="h-auto w-full rounded-2xl border border-kamien-200 object-cover"
              />
              {wiadomosc.zdjecieOpis && (
                <figcaption className="mt-3 text-sm text-kamien-500">
                  {wiadomosc.zdjecieOpis}
                </figcaption>
              )}
            </figure>
          )}

          <div className="space-y-5">
            {akapity(wiadomosc.tresc).map((akapit, indeks) => (
              <p key={indeks} className="text-lg leading-relaxed text-kamien-700">
                {akapit}
              </p>
            ))}
          </div>

          {wiadomosc.zrodloAdres && (
            <aside className="mt-12 rounded-2xl border border-kamien-200 bg-kamien-50 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-kamien-500">
                Skąd wiemy
              </p>
              <p className="mt-2 leading-relaxed text-kamien-700">
                Notkę napisaliśmy na podstawie informacji opublikowanych przez{' '}
                <strong className="font-semibold">{wiadomosc.zrodloNazwa ?? 'inny serwis'}</strong>.
                Pełny artykuł jest u nich.
              </p>
              <a
                href={wiadomosc.zrodloAdres}
                target="_blank"
                rel="noopener nofollow"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-las-700 hover:underline"
              >
                Przejdź do źródła
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </aside>
          )}

          <Link
            href="/aktualnosci"
            className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-las-700 hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Wszystkie aktualności
          </Link>
        </div>
      </article>

      {pozostale.length > 0 && (
        <section className="border-t border-kamien-200 bg-kamien-50 py-14">
          <div className="obszar">
            <h2 className="font-heading text-xl font-semibold text-kamien-900">Czytaj dalej</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {pozostale.map((inna) => (
                <KartaWiadomosci key={inna.slug} wiadomosc={inna} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
