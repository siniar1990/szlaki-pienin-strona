-- CreateEnum
CREATE TYPE "KategoriaKodu" AS ENUM ('SZLAK', 'ATRAKCJA', 'PUNKT_WIDOKOWY', 'MIASTO', 'PARKING', 'ODPOCZYNEK', 'INNE');

-- CreateEnum
CREATE TYPE "StatusKodu" AS ENUM ('AKTYWNY', 'NIEAKTYWNY', 'ZAPAS');

-- CreateEnum
CREATE TYPE "TypUrzadzenia" AS ENUM ('IOS', 'ANDROID', 'DESKTOP', 'INNE');

-- CreateEnum
CREATE TYPE "Nosnik" AS ENUM ('QR', 'NFC', 'BEACON');

-- CreateTable
CREATE TABLE "KodQr" (
    "id" TEXT NOT NULL,
    "kod" TEXT NOT NULL,
    "nazwa" TEXT NOT NULL,
    "opis" TEXT,
    "szerokosc" DOUBLE PRECISION,
    "dlugosc" DOUBLE PRECISION,
    "kategoria" "KategoriaKodu" NOT NULL,
    "nazwaLokalizacji" TEXT,
    "powiazanaStrona" TEXT,
    "dataMontazu" TIMESTAMP(3),
    "status" "StatusKodu" NOT NULL DEFAULT 'ZAPAS',
    "nosnik" "Nosnik" NOT NULL DEFAULT 'QR',
    "wariant" TEXT,
    "kampania" TEXT,
    "liczbaSkanow" INTEGER NOT NULL DEFAULT 0,
    "ostatniSkan" TIMESTAMP(3),
    "utworzono" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zmieniono" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KodQr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkanQr" (
    "id" BIGSERIAL NOT NULL,
    "kodQrId" TEXT NOT NULL,
    "czas" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urzadzenie" "TypUrzadzenia" NOT NULL,
    "przegladarka" TEXT,
    "jezyk" TEXT,
    "kraj" TEXT,
    "miasto" TEXT,
    "zrodlo" TEXT,
    "przekierowanoDoSklepu" BOOLEAN NOT NULL DEFAULT false,
    "wariant" TEXT,

    CONSTRAINT "SkanQr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkanDzienny" (
    "kodQrId" TEXT NOT NULL,
    "dzien" DATE NOT NULL,
    "liczba" INTEGER NOT NULL DEFAULT 0,
    "ios" INTEGER NOT NULL DEFAULT 0,
    "android" INTEGER NOT NULL DEFAULT 0,
    "desktop" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SkanDzienny_pkey" PRIMARY KEY ("kodQrId","dzien")
);

-- CreateIndex
CREATE UNIQUE INDEX "KodQr_kod_key" ON "KodQr"("kod");

-- CreateIndex
CREATE INDEX "KodQr_status_kategoria_idx" ON "KodQr"("status", "kategoria");

-- CreateIndex
CREATE INDEX "KodQr_liczbaSkanow_idx" ON "KodQr"("liczbaSkanow");

-- CreateIndex
CREATE INDEX "SkanQr_kodQrId_czas_idx" ON "SkanQr"("kodQrId", "czas");

-- CreateIndex
CREATE INDEX "SkanQr_czas_idx" ON "SkanQr"("czas");

-- CreateIndex
CREATE INDEX "SkanDzienny_dzien_idx" ON "SkanDzienny"("dzien");

-- AddForeignKey
ALTER TABLE "SkanQr" ADD CONSTRAINT "SkanQr_kodQrId_fkey" FOREIGN KEY ("kodQrId") REFERENCES "KodQr"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkanDzienny" ADD CONSTRAINT "SkanDzienny_kodQrId_fkey" FOREIGN KEY ("kodQrId") REFERENCES "KodQr"("id") ON DELETE CASCADE ON UPDATE CASCADE;
