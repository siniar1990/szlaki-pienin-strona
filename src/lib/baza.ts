import { PrismaClient } from '@prisma/client'

/**
 * Klient bazy danych.
 *
 * Trzymany na `globalThis`, a nie tworzony przy każdym imporcie. Powód jest
 * konkretny: na środowisku bezserwerowym moduł ładuje się przy każdym zimnym
 * starcie funkcji, a w trybie deweloperskim przy każdym przeładowaniu kodu.
 * Nowy klient to nowa pula połączeń — po kilkudziesięciu przeładowaniach baza
 * odmawia przyjęcia kolejnego i praca staje. Jedna instancja na proces
 * rozwiązuje oba przypadki.
 */

const globalnie = globalThis as unknown as { prisma?: PrismaClient }

export const baza =
  globalnie.prisma ??
  new PrismaClient({
    // W czasie pracy nad kodem chcemy widzieć zapytania, na produkcji tylko
    // ostrzeżenia i błędy — logowanie każdego zapytania kosztuje czas funkcji.
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalnie.prisma = baza
