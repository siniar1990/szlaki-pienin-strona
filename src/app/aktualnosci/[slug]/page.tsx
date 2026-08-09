import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { LicznikOdslon } from '@/components/analityka/licznik-odslon'
import { KartaWiadomosci } from '@/components/aktualnosci/karta-wiadomosci'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { PORTAL } from '@/lib/konfiguracja'
import {
  akapity,
  dataPolska,
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

  return {
    title: wiadomosc.tytul,
    description: wiadomosc.lid,
    alternates: { canonical: `/aktualnosci/${slug}` },
    openGraph: {
      type: 'article',
      title: wiadomosc.tytul,
      description: wiadomosc.lid,
      publishedTime: wiadomosc.opublikowano.toISOString(),
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
  const daneStrukturalne = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: wiadomosc.tytul,
    description: wiadomosc.lid,
    datePublished: wiadomosc.opublikowano.toISOString(),
    mainEntityOfPage: `${PORTAL.adres}/aktualnosci/${slug}`,
    publisher: { '@type': 'Organization', name: PORTAL.nazwa },
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
          <time
            dateTime={wiadomosc.opublikowano.toISOString()}
            className="text-sm font-medium text-kamien-500"
          >
            {dataPolska(wiadomosc.opublikowano)}
          </time>
        }
      />

      <article className="obszar py-12 lg:py-16">
        <div className="mx-auto max-w-[46rem]">
          {wiadomosc.zdjecie && (
            <figure className="mb-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wiadomosc.zdjecie}
                alt={wiadomosc.zdjecieOpis ?? wiadomosc.tytul}
                className="w-full rounded-2xl border border-kamien-200 object-cover"
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
