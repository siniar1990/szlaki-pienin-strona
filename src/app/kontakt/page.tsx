import type { Metadata } from 'next'
import { Mail } from 'lucide-react'

import { FormularzKontaktowy } from '@/components/kontakt/formularz-kontaktowy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { PORTAL } from '@/lib/konfiguracja'

export const metadata: Metadata = {
  title: 'Kontakt',
  description:
    'Napisz do nas — pytania o trasy i atrakcje, zgłoszenia poprawek, ' +
    'współpraca i partnerstwo w kategoriach atrakcji.',
  alternates: { canonical: '/kontakt' },
}

/**
 * Strona kontaktu.
 *
 * Tematy przychodzące z innych miejsc portalu. Formularz podpowiada temat, gdy
 * ktoś trafia tu z konkretnego zaproszenia — dziś jedynym jest miejsce partnera
 * w kategorii atrakcji. Zamiast trzymać tę listę w komponencie klienckim,
 * stoi tutaj: to strona decyduje, po co ktoś przyszedł.
 */
const TEMATY: Record<string, string> = {
  partner: 'Partner kategorii — chcę promować swoją firmę',
  poprawka: 'Poprawka w opisie trasy albo atrakcji',
}

export default async function StronaKontakt({ searchParams }: PageProps<'/kontakt'>) {
  const parametry = await searchParams
  const klucz = Array.isArray(parametry.temat) ? parametry.temat[0] : parametry.temat
  const temat = klucz ? TEMATY[klucz] : undefined

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Kontakt', adres: '/kontakt' }]}
        tytul="Napisz do nas"
        lead="Pytanie o trasę, poprawka w opisie, propozycja współpracy — wszystko trafia w to samo miejsce."
      />

      <div className="obszar py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          <div className="min-w-0 max-w-[42rem]">
            <FormularzKontaktowy temat={temat} />
          </div>

          <aside className="lg:pt-2">
            <h2 className="font-heading text-base font-semibold text-kamien-900">
              Wolisz zwykłą pocztę?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-kamien-600">
              Napisz wprost na adres — czytamy oba kanały tak samo.
            </p>
            <a
              href={`mailto:${PORTAL.kontakt}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-las-700 hover:underline"
            >
              <Mail className="size-4" aria-hidden />
              {PORTAL.kontakt}
            </a>

            {/*
              Uczciwość co do tempa. Portal prowadzą ludzie, którzy robią to
              obok innych zajęć — obietnica odpowiedzi „w ciągu godziny"
              byłaby ładniejsza i nieprawdziwa.
            */}
            <p className="mt-8 rounded-xl border border-kamien-200 bg-kamien-50 p-4 text-sm leading-relaxed text-kamien-600">
              Odpisujemy zwykle w ciągu kilku dni. Jeśli zgłaszasz błąd na
              szlaku albo w opisie trasy — napisz, której trasy dotyczy,
              poprawimy przy najbliższej aktualizacji danych.
            </p>
          </aside>
        </div>
      </div>
    </>
  )
}
