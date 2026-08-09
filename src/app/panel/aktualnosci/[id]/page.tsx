import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  X,
} from 'lucide-react'

import { FormularzWiadomosci } from '@/components/panel/formularz-wiadomosci'
import { baza } from '@/lib/baza'
import { ETYKIETY_STANU, ileTemu } from '@/lib/wiadomosci/etykiety'

import {
  cofnijPublikacje,
  odrzucWiadomosc,
  opublikujWiadomosc,
  usunWiadomosc,
  zapiszWiadomosc,
} from '../dzialania'

export const metadata: Metadata = {
  title: 'Wiadomość',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Edycja notki i decyzja o publikacji.
 *
 * **Dlaczego publikacja stoi nad formularzem, a nie pod nim.** To jest
 * najważniejsza czynność na tej stronie i jedyna nieodwracalna w skutkach
 * (tekst wychodzi na zewnątrz). Schowanie jej pod dwustuwierszowym
 * formularzem znaczyłoby, że trzeba się do niej przewijać — a decyzja, którą
 * trzeba znaleźć, jest decyzją podejmowaną w pośpiechu.
 */
export default async function StronaEdycjiWiadomosci({
  params,
}: PageProps<'/panel/aktualnosci/[id]'>) {
  const { id } = await params

  const notka = await baza.wiadomosc.findUnique({
    where: { id },
    include: {
      znalezisko: {
        select: { ocena: true, uzasadnienie: true, tytul: true, adres: true },
      },
    },
  })
  if (!notka) notFound()

  const stan = ETYKIETY_STANU[notka.stan]
  const opublikuj = opublikujWiadomosc.bind(null, id)
  const cofnij = cofnijPublikacje.bind(null, id)
  const odrzuc = odrzucWiadomosc.bind(null, id)
  const usun = usunWiadomosc.bind(null, id)
  const zapisz = zapiszWiadomosc.bind(null, id)

  return (
    <>
      <Link
        href="/panel/aktualnosci"
        className="inline-flex items-center gap-2 text-sm text-kamien-500 hover:text-las-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Wszystkie wiadomości
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">{notka.tytul}</h1>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${stan.klasa}`}>
          {stan.tekst}
        </span>
      </div>

      <p className="mt-2 text-sm text-kamien-500">
        Utworzono {ileTemu(notka.utworzono)}
        {notka.opublikowano && ` · opublikowano ${ileTemu(notka.opublikowano)}`}
        {notka.stan === 'OPUBLIKOWANA' && (
          <>
            {' · '}
            <Link
              href={`/aktualnosci/${notka.slug}`}
              className="text-las-700 hover:underline"
              target="_blank"
            >
              zobacz na portalu
            </Link>
          </>
        )}
      </p>

      {/* ── Decyzja ────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-kamien-200 bg-white p-4">
        {notka.stan === 'OPUBLIKOWANA' ? (
          <form action={cofnij}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-700 transition-colors hover:border-amber-300 hover:text-amber-900"
            >
              <EyeOff className="size-4" aria-hidden />
              Zdejmij z portalu
            </button>
          </form>
        ) : (
          <form action={opublikuj}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
            >
              <Eye className="size-4" aria-hidden />
              Opublikuj na portalu
            </button>
          </form>
        )}

        {notka.stan === 'SZKIC' && (
          <form action={odrzuc}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-600 transition-colors hover:bg-kamien-50"
            >
              <X className="size-4" aria-hidden />
              Odrzuć
            </button>
          </form>
        )}

        <form action={usun} className="ml-auto">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-kamien-400 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-4" aria-hidden />
            Usuń bezpowrotnie
          </button>
        </form>
      </div>

      {/* ── Zapożyczenia ───────────────────────────────────────────────── */}
      {notka.zapozyczenia && (
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-900">
            <AlertTriangle className="size-4" aria-hidden />
            Te fragmenty są identyczne jak w artykule źródłowym
          </p>
          <p className="mt-2 text-sm leading-relaxed text-red-900/80">
            Model napisał notkę dwa razy i za każdym razem powielił poniższe ciągi słów.
            Przepisz je własnymi słowami przed publikacją — fakty wolno przenosić,
            cudze sformułowania nie. Po poprawieniu treści to ostrzeżenie zniknie.
          </p>
          <ul className="mt-4 space-y-2">
            {notka.zapozyczenia.split('\n').map((fragment) => (
              <li
                key={fragment}
                className="rounded-lg bg-white/70 px-3 py-2 font-mono text-xs text-red-900"
              >
                …{fragment}…
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Skąd to się wzięło ─────────────────────────────────────────── */}
      {notka.odRedakcjiMaszynowej && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Bot className="size-4" aria-hidden />
            Szkic napisany maszynowo
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
            Notka powstała automatycznie na podstawie cudzego artykułu i nikt jej jeszcze
            nie czytał. Sprawdź przede wszystkim liczby, daty i nazwy własne — to w nich
            model myli się najczęściej. Zapożyczenia dosłowne są sprawdzane maszynowo,
            ale sens zdania musi potwierdzić człowiek.
          </p>
          {notka.znalezisko?.uzasadnienie && (
            <p className="mt-3 text-xs text-amber-900/70">
              Ocena wyboru: {notka.znalezisko.ocena ?? '—'}/100 · {notka.znalezisko.uzasadnienie}
            </p>
          )}
          {notka.znalezisko?.adres && (
            <a
              href={notka.znalezisko.adres}
              target="_blank"
              rel="noopener nofollow"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 hover:underline"
            >
              Porównaj z oryginałem
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      )}

      <div className="mt-8 max-w-3xl">
        <FormularzWiadomosci
          akcja={zapisz}
          wartosci={{
            tytul: notka.tytul,
            lid: notka.lid,
            tresc: notka.tresc,
            zdjecie: notka.zdjecie,
            zdjecieOpis: notka.zdjecieOpis,
            zrodloNazwa: notka.zrodloNazwa,
            zrodloAdres: notka.zrodloAdres,
          }}
        />
      </div>
    </>
  )
}
