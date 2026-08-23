-- Numery tabliczek wycofanych z użycia.
--
-- Numeracja bierze najwyższy istniejący kod, więc skasowanie ostatniej
-- tabliczki zwalniało jej numer i kolejna dostawała go ponownie. Ten wpis
-- zostaje po skasowanej, żeby numer pozostał zajęty na zawsze — wydrukowany
-- egzemplarz może przecież nadal gdzieś być.
CREATE TABLE "UsunietaTabliczka" (
    "kod" TEXT NOT NULL,
    "nazwa" TEXT NOT NULL,
    "usunieto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsunietaTabliczka_pkey" PRIMARY KEY ("kod")
);
