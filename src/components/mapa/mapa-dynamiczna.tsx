'use client'

import dynamic from 'next/dynamic'

/**
 * Opakowanie ładujące mapę dopiero w przeglądarce.
 *
 * `ssr: false` wolno użyć wyłącznie w komponencie klienckim, a strony tras
 * są serwerowe — stąd ten cienki pośrednik. Dzięki niemu MapLibre nie trafia
 * do głównej paczki JavaScriptu i nie próbuje sięgać do `window` w trakcie
 * budowania, gdzie żadnego okna nie ma.
 */
export const MapaDynamiczna = dynamic(
  () => import('./mapa').then((moduł) => moduł.Mapa),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[20rem] w-full place-items-center rounded-2xl bg-kamien-100 text-sm text-kamien-500">
        Wczytywanie mapy…
      </div>
    ),
  },
)
