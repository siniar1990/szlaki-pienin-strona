-- Ustawienia redakcji: jeden wiersz na cały portal.
CREATE TABLE "UstawieniaRedakcji" (
    "klucz" TEXT NOT NULL DEFAULT 'jedyne',
    "notekDziennie" INTEGER NOT NULL DEFAULT 1,
    "publikowanieAutomatyczne" BOOLEAN NOT NULL DEFAULT false,
    "zmieniono" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UstawieniaRedakcji_pkey" PRIMARY KEY ("klucz")
);

INSERT INTO "UstawieniaRedakcji" ("klucz", "zmieniono") VALUES ('jedyne', CURRENT_TIMESTAMP);
