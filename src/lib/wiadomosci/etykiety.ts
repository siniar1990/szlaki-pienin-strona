/**
 * Wspólne etykiety stanów w panelu.
 *
 * Osobny moduł, bo te same trzy stany opisuje lista notek, strona edycji
 * i wykaz znalezisk. Rozjazd w nazewnictwie między tymi trzema miejscami
 * byłby drobiazgiem, który sprawia, że panel przestaje wyglądać na jedno
 * narzędzie.
 */

export const ETYKIETY_STANU: Record<string, { tekst: string; klasa: string }> = {
  SZKIC: { tekst: 'szkic', klasa: 'border-amber-200 bg-amber-50 text-amber-900' },
  OPUBLIKOWANA: { tekst: 'opublikowana', klasa: 'border-las-200 bg-las-50 text-las-800' },
  ODRZUCONA: { tekst: 'odrzucona', klasa: 'border-kamien-300 bg-kamien-100 text-kamien-600' },
}

export const ETYKIETY_ZNALEZISKA: Record<string, { tekst: string; klasa: string }> = {
  NOWY: { tekst: 'nowe', klasa: 'border-las-200 bg-las-50 text-las-800' },
  ODRZUCONE: { tekst: 'odrzucone', klasa: 'border-kamien-300 bg-kamien-100 text-kamien-600' },
  WYKORZYSTANE: { tekst: 'wykorzystane', klasa: 'border-amber-200 bg-amber-50 text-amber-900' },
}

/**
 * Czas w formie, w jakiej mówi o nim człowiek.
 *
 * Ta sama zasada co przy tabliczkach: przy pytaniu „czy to jeszcze świeże"
 * liczy się odległość od teraz, a nie data z zegarkiem.
 */
export function ileTemu(kiedy: Date | null): string {
  if (!kiedy) return 'nigdy'

  const sekundy = Math.floor((Date.now() - kiedy.getTime()) / 1000)
  if (sekundy < 60) return 'przed chwilą'
  if (sekundy < 3600) return `${Math.floor(sekundy / 60)} min temu`
  if (sekundy < 86_400) return `${Math.floor(sekundy / 3600)} h temu`
  return `${Math.floor(sekundy / 86_400)} dni temu`
}
