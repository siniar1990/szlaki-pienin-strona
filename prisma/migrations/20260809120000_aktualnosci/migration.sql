-- Aktualności: źródła, znaleziska i notki.

CREATE TYPE "StanZnaleziska" AS ENUM ('NOWY', 'ODRZUCONE', 'WYKORZYSTANE');
CREATE TYPE "StanWiadomosci" AS ENUM ('SZKIC', 'OPUBLIKOWANA', 'ODRZUCONA');

CREATE TABLE "ZrodloWiadomosci" (
    "id" TEXT NOT NULL,
    "nazwa" TEXT NOT NULL,
    "adres" TEXT NOT NULL,
    "adresKanalu" TEXT,
    "aktywne" BOOLEAN NOT NULL DEFAULT true,
    "ostatniObchod" TIMESTAMP(3),
    "ostatniBlad" TEXT,
    "utworzono" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zmieniono" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZrodloWiadomosci_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ZrodloWiadomosci_adres_key" ON "ZrodloWiadomosci"("adres");
CREATE INDEX "ZrodloWiadomosci_aktywne_idx" ON "ZrodloWiadomosci"("aktywne");

CREATE TABLE "ZnalezionyArtykul" (
    "id" TEXT NOT NULL,
    "zrodloId" TEXT NOT NULL,
    "adres" TEXT NOT NULL,
    "tytul" TEXT NOT NULL,
    "opis" TEXT,
    "opublikowano" TIMESTAMP(3),
    "znaleziono" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ocena" INTEGER,
    "uzasadnienie" TEXT,
    "stan" "StanZnaleziska" NOT NULL DEFAULT 'NOWY',

    CONSTRAINT "ZnalezionyArtykul_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ZnalezionyArtykul_adres_key" ON "ZnalezionyArtykul"("adres");
CREATE INDEX "ZnalezionyArtykul_stan_znaleziono_idx" ON "ZnalezionyArtykul"("stan", "znaleziono");
CREATE INDEX "ZnalezionyArtykul_zrodloId_idx" ON "ZnalezionyArtykul"("zrodloId");

CREATE TABLE "Wiadomosc" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tytul" TEXT NOT NULL,
    "lid" TEXT NOT NULL,
    "tresc" TEXT NOT NULL,
    "zdjecie" TEXT,
    "zdjecieOpis" TEXT,
    "zrodloNazwa" TEXT,
    "zrodloAdres" TEXT,
    "odRedakcjiMaszynowej" BOOLEAN NOT NULL DEFAULT false,
    "stan" "StanWiadomosci" NOT NULL DEFAULT 'SZKIC',
    "opublikowano" TIMESTAMP(3),
    "utworzono" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zmieniono" TIMESTAMP(3) NOT NULL,
    "znaleziskoId" TEXT,

    CONSTRAINT "Wiadomosc_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Wiadomosc_slug_key" ON "Wiadomosc"("slug");
CREATE UNIQUE INDEX "Wiadomosc_znaleziskoId_key" ON "Wiadomosc"("znaleziskoId");
CREATE INDEX "Wiadomosc_stan_opublikowano_idx" ON "Wiadomosc"("stan", "opublikowano");

ALTER TABLE "ZnalezionyArtykul"
    ADD CONSTRAINT "ZnalezionyArtykul_zrodloId_fkey"
    FOREIGN KEY ("zrodloId") REFERENCES "ZrodloWiadomosci"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wiadomosc"
    ADD CONSTRAINT "Wiadomosc_znaleziskoId_fkey"
    FOREIGN KEY ("znaleziskoId") REFERENCES "ZnalezionyArtykul"("id") ON DELETE SET NULL ON UPDATE CASCADE;
