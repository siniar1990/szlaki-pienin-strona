import Link from 'next/link'
import { Compass } from 'lucide-react'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nie ma takiej strony',
  robots: { index: false, follow: true },
}

export default function NieZnaleziono() {
  return (
    <div className="obszar flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <Compass className="size-12 text-las-600" aria-hidden />
      <h1 className="mt-8 text-tytul font-semibold text-kamien-900">
        Zeszliśmy ze szlaku
      </h1>
      <p className="mt-4 max-w-[52ch] text-lg text-kamien-600">
        Pod tym adresem nic nie ma. Może strona zmieniła nazwę, a może w adresie
        zgubiła się litera.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/szlaki"
          className="rounded-full bg-las-700 px-6 py-3 font-medium text-white transition-colors hover:bg-las-800"
        >
          Wszystkie trasy
        </Link>
        <Link
          href="/szukaj"
          className="rounded-full border border-kamien-300 px-6 py-3 font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
        >
          Szukaj
        </Link>
        <Link
          href="/"
          className="rounded-full border border-kamien-300 px-6 py-3 font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
        >
          Strona główna
        </Link>
      </div>
    </div>
  )
}
