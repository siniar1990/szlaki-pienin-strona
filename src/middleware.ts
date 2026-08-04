import { NextResponse, type NextRequest } from 'next/server'

import { NAZWA_SESJI, sesjaWazna } from '@/lib/panel/sesja'

/**
 * Osłona panelu administracyjnego.
 *
 * Warstwa pośrednicząca sprawdza sesję zanim żądanie dotrze do jakiejkolwiek
 * strony panelu czy trasy API. Osłanianie każdej strony osobno prędzej czy
 * później kończy się tym, że ktoś doda nową i zapomni — tutaj zapomnieć się
 * nie da, bo reguła jest jedna i obejmuje całe gałęzie adresów.
 *
 * Wyjątkiem jest strona logowania: musi być dostępna bez sesji, inaczej nie
 * dałoby się jej uzyskać.
 */
export async function middleware(zadanie: NextRequest) {
  const sekret = process.env.SEKRET_SESJI

  /*
    Brak sekretu w środowisku to błąd wdrożenia, nie sytuacja do obsłużenia
    domyślną wartością. Wpuszczenie kogokolwiek do panelu bez działającego
    podpisu byłoby gorsze niż niedziałający panel.
  */
  if (!sekret) {
    return new NextResponse('Panel nie jest skonfigurowany: brak zmiennej SEKRET_SESJI.', {
      status: 503,
    })
  }

  const ciasteczko = zadanie.cookies.get(NAZWA_SESJI)?.value
  if (await sesjaWazna(ciasteczko, sekret)) return NextResponse.next()

  // Trasy API odpowiadają kodem, nie przekierowaniem — po drugiej stronie
  // jest kod, a nie człowiek, i strona logowania nic mu nie da.
  if (zadanie.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ blad: 'Brak uprawnień' }, { status: 401 })
  }

  const doLogowania = new URL('/panel/logowanie', zadanie.url)
  // Zapamiętujemy, dokąd ktoś zmierzał, żeby po zalogowaniu tam wrócił.
  doLogowania.searchParams.set('wroc', zadanie.nextUrl.pathname)
  return NextResponse.redirect(doLogowania)
}

export const config = {
  matcher: ['/panel/((?!logowanie).*)', '/api/panel/:path*'],
}
