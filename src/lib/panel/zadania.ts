import { NextResponse, type NextRequest } from 'next/server'

/**
 * Osłona tras uruchamianych przez harmonogram.
 *
 * Warstwa pośrednicząca strzeże `/panel` i `/api/panel`, ale zadań cyklicznych
 * strzec nie może — wywołuje je maszyna, która nie ma ciasteczka sesji.
 * Zamiast tego przedstawia się sekretem w nagłówku `Authorization`, i to
 * sprawdzamy tutaj.
 *
 * **Dlaczego dwie nazwy zmiennej.** Zadania woła dziś dwóch różnych zleceniodawców
 * i każdy bierze sekret skądinąd:
 *
 * - Harmonogram GitHuba wysyła to, co wpiszemy w pliku przepływu — u nas
 *   `SEKRET_ZADAN`, nazwany po polsku jak reszta projektu.
 * - Wbudowany harmonogram Vercela dokłada nagłówek sam, ale **wyłącznie**
 *   z wartości zmiennej o nazwie dokładnie `CRON_SECRET`. Nazwy nie da się
 *   zmienić — jest zaszyta po ich stronie. Gdy tej zmiennej nie ma, Vercel nie
 *   wysyła nagłówka w ogóle.
 *
 * To ostatnie jest pułapką, w którą łatwo wpaść i nie zauważyć: trasa zwraca
 * wtedy 401, zadanie „chodzi" co noc i za każdym razem nic nie robi, a nigdzie
 * nie zapala się czerwone światło. Przyjmujemy więc obie nazwy — projekt
 * zachowuje polskie nazewnictwo, a harmonogram dostawcy dostaje nazwę, której
 * wymaga.
 *
 * Zwraca odpowiedź odmowną albo `null`, gdy żądanie jest w porządku — dzięki
 * temu w trasie wystarczy jedna linia i nie da się zapomnieć sprawdzenia.
 */
export function sprawdzZadanieCykliczne(zadanie: NextRequest): NextResponse | null {
  const sekrety = [process.env.SEKRET_ZADAN, process.env.CRON_SECRET].filter(
    (sekret): sekret is string => Boolean(sekret),
  )

  if (sekrety.length === 0) {
    // Tak jak przy panelu: brak sekretu to błąd wdrożenia. Wykonanie zadania
    // „na wszelki wypadek" otworzyłoby trasę dla każdego.
    return NextResponse.json(
      { blad: 'Brak zmiennej SEKRET_ZADAN ani CRON_SECRET' },
      { status: 503 },
    )
  }

  const podane = zadanie.headers.get('authorization')
  if (!sekrety.some((sekret) => podane === `Bearer ${sekret}`)) {
    return NextResponse.json({ blad: 'Brak uprawnień' }, { status: 401 })
  }

  return null
}
