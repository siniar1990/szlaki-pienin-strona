-- Historia odczytów wodowskazu w Krościenku.
--
-- IMGW udostępnia tylko ostatni pomiar, więc wykres z ostatniej doby może
-- powstać wyłącznie z tego, co sami zapiszemy. Klucz główny na chwili pomiaru
-- pilnuje, żeby odpytywanie co kwadrans nie powielało tych samych odczytów.
CREATE TABLE "OdczytDunajca" (
    "pomiar" TIMESTAMP(3) NOT NULL,
    "poziom" INTEGER NOT NULL,
    "temperaturaWody" DOUBLE PRECISION,

    CONSTRAINT "OdczytDunajca_pkey" PRIMARY KEY ("pomiar")
);

CREATE INDEX "OdczytDunajca_pomiar_idx" ON "OdczytDunajca"("pomiar");
