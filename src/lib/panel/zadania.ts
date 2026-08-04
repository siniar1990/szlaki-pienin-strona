import { NextResponse, type NextRequest } from 'next/server'

/**
 * Osłona tras uruchamianych przez harmonogram.
 *
 * Warstwa pośrednicząca strzeże `/panel` i `/api/panel`, ale zadań cyklicznych
 * strzec nie może — wywołuje je maszyna dostawcy hostingu, która nie ma
 * ciasteczka sesji. Zamiast tego przedstawia się sekretem w nagłówku
 * `Authorization`, i to sprawdzamy tutaj.
 *
 * Zwraca odpowiedź odmowną albo `null`, gdy żądanie jest w porządku — dzięki
 * temu w trasie wystarczy jedna linia i nie da się zapomnieć sprawdzenia.
 */
export function sprawdzZadanieCykliczne(zadanie: NextRequest): NextResponse | null {
  const sekret = process.env.SEKRET_ZADAN

  if (!sekret) {
    // Tak jak przy panelu: brak sekretu to błąd wdrożenia. Wykonanie zadania
    // „na wszelki wypadek" otworzyłoby trasę dla każdego.
    return NextResponse.json({ blad: 'Brak zmiennej SEKRET_ZADAN' }, { status: 503 })
  }

  if (zadanie.headers.get('authorization') !== `Bearer ${sekret}`) {
    return NextResponse.json({ blad: 'Brak uprawnień' }, { status: 401 })
  }

  return null
}
