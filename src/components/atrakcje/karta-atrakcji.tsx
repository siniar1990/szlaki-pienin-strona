import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

import { IlustracjaKategorii } from '@/components/atrakcje/ilustracja-kategorii'
import { podpisZdjecia } from '@/lib/dane/podpisy-zdjec'
import { zdjecieAtrakcji } from '@/lib/dane/zdjecia-atrakcji'
import {
  nazwaKategorii,
  nazwaLokalizacji,
  type KategoriaAtrakcji,
} from '@/lib/tresc/kategorie-atrakcji'
import type { AtrakcjaTurystyczna } from '@/lib/tresc/atrakcje-turystyczne'

/**
 * Zwarta karta atrakcji.
 *
 * Poprzednia wersja była szeroka na całą kolumnę i mieściła dwa zdania opisu.
 * Miało to sens przy dwudziestu czterech pozycjach, z których większość nie
 * miała zdjęcia — opis był wtedy jedyną rzeczą, po której dało się wybrać.
 * Przy pięćdziesięciu siedmiu pozycjach ten sam układ daje stronę na kilka
 * ekranów przewijania i nikt nie dochodzi do końca.
 *
 * Teraz karta jest mała i przede wszystkim wizualna: zdjęcie w stałych
 * proporcjach, nazwa, miejscowość i najwyżej dwie linijki opisu. Reszta czeka
 * na stronie atrakcji — karta ma pomóc wybrać, a nie zastąpić lekturę.
 *
 * **Stałe proporcje zdjęcia są tu warunkiem, nie ozdobą.** Przy czterech
 * kartach w rzędzie różne wysokości obrazków rozbijają siatkę na schodki
 * i oko przestaje skanować rząd jako rząd.
 */
export function KartaAtrakcji({
  atrakcja,
  kategoriaSekcji,
}: {
  atrakcja: AtrakcjaTurystyczna
  /**
   * Kategoria sekcji, w której karta stoi.
   *
   * Plakietka pokazuje właśnie ją, a nie pierwszą kategorię atrakcji. Różnica
   * jest widoczna przy pozycjach należących do kilku kategorii: zapora
   * w Niedzicy jest przede wszystkim zabytkiem techniki, ale stoi też w „Wodzie
   * i Dunajcu" — i podpisana tam „Kultura i historia" wyglądała jak pomyłka
   * w katalogu, a nie jak informacja.
   */
  kategoriaSekcji?: KategoriaAtrakcji
}) {
  const zdjecie = zdjecieAtrakcji(atrakcja.slug)
  const podpis = zdjecie ? podpisZdjecia(atrakcja.slug) : null
  const kategoria = kategoriaSekcji ?? atrakcja.kategorie[0]

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-kamien-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony focus-within:-translate-y-1 focus-within:shadow-uniesiony">
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-las-800">
        {zdjecie ? (
          <Image
            src={zdjecie}
            alt=""
            fill
            /* Karta ma najwyżej ćwierć szerokości strony na dużym ekranie
               i połowę na telefonie — nie ma powodu pobierać większych. */
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 23vw"
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <IlustracjaKategorii
            grupa={kategoria}
            id={atrakcja.slug}
            className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-[1.06]"
          />
        )}

        {kategoria && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-kamien-950/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {nazwaKategorii(kategoria)}
          </span>
        )}

        {/* Autor i licencja — warunek użycia zdjęć z Wikimedia Commons.
            Bez odnośnika, bo cała karta jest jednym celem kliknięcia i drugi
            odnośnik w środku psułby nawigację klawiaturą; pełne dane licencji
            są przy zdjęciu na stronie atrakcji. */}
        {podpis && (
          <span className="absolute bottom-0 right-0 z-10 max-w-full truncate rounded-tl-md bg-kamien-950/50 px-1.5 py-0.5 text-[9px] leading-tight text-white/80">
            fot. {podpis.autor}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-heading text-[0.95rem] font-semibold leading-snug text-kamien-900 transition-colors group-hover:text-las-700">
          <Link
            href={`/atrakcje/${atrakcja.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {atrakcja.nazwa}
          </Link>
        </h3>

        <p className="mt-1 flex items-center gap-1 text-xs text-kamien-500">
          <MapPin className="size-3 shrink-0" aria-hidden />
          {atrakcja.miejscowosc ?? nazwaLokalizacji(atrakcja.lokalizacja)}
        </p>

        {/*
          Opis obcięty do dwóch linijek przez `line-clamp`, a nie skracany
          w danych. Skrócenie w danych psułoby stronę atrakcji, która ma
          pokazać całe zdanie.
        */}
        {atrakcja.skrot && (
          <p className="mt-2 line-clamp-2 text-[0.8rem] leading-snug text-kamien-600">
            {atrakcja.skrot}
          </p>
        )}
      </div>
    </article>
  )
}
