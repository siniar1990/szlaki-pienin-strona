-- Odsłony podstron i kliknięcia w pobranie aplikacji.
-- Bez adresu IP, bez ciasteczek, bez identyfikatora odwiedzającego.

CREATE TYPE "RodzajZdarzenia" AS ENUM ('ATRAKCJA', 'SZLAK', 'AKTUALNOSC', 'POBRANIE');

CREATE TABLE "Zdarzenie" (
    "id" BIGSERIAL NOT NULL,
    "rodzaj" "RodzajZdarzenia" NOT NULL,
    "klucz" TEXT NOT NULL,
    "czas" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zdarzenie_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Zdarzenie_rodzaj_czas_idx" ON "Zdarzenie"("rodzaj", "czas");
CREATE INDEX "Zdarzenie_czas_idx" ON "Zdarzenie"("czas");

CREATE TABLE "ZdarzenieDzienne" (
    "rodzaj" "RodzajZdarzenia" NOT NULL,
    "klucz" TEXT NOT NULL,
    "dzien" DATE NOT NULL,
    "liczba" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ZdarzenieDzienne_pkey" PRIMARY KEY ("rodzaj", "klucz", "dzien")
);

CREATE INDEX "ZdarzenieDzienne_dzien_idx" ON "ZdarzenieDzienne"("dzien");
CREATE INDEX "ZdarzenieDzienne_rodzaj_dzien_idx" ON "ZdarzenieDzienne"("rodzaj", "dzien");
