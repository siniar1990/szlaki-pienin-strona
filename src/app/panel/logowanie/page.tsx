import type { Metadata } from 'next'

import { FormularzLogowania } from '@/components/panel/formularz-logowania'

export const metadata: Metadata = {
  title: 'Logowanie do panelu',
  robots: { index: false, follow: false },
}

export default async function StronaLogowania({ searchParams }: PageProps<'/panel/logowanie'>) {
  const { wroc } = await searchParams

  return (
    <div className="obszar flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">Panel tabliczek</h1>
        <p className="mt-2 text-sm text-kamien-600">
          Zarządzanie kodami QR i statystyki skanowania.
        </p>

        <FormularzLogowania wroc={typeof wroc === 'string' ? wroc : '/panel'} />
      </div>
    </div>
  )
}
