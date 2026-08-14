-- Odsianie botów ze statystyk skanowania tabliczek.
--
-- Powód: po opublikowaniu odnośnika na Facebooku licznik kodu P009 skoczył
-- o 22 „skany" z centrów danych Meta i AWS. To crawlery budujące podgląd
-- odnośnika, a nie turyści pod tabliczką.
--
-- Migracja dokłada wyłącznie kolumny i indeksy. Klasyfikacji historycznych
-- wierszy NIE robi — od tego jest `narzedzia/przeklasyfikuj-skany.ts`, który
-- najpierw pokazuje raport, a dopiero potem zapisuje. Rozdzielenie jest
-- celowe: zmiana schematu ma być odwracalna wdrożeniem, zmiana danych ma być
-- policzalna przed wykonaniem.
--
-- UWAGA na wartość domyślną `liczone = false`. Po tej migracji, do czasu
-- uruchomienia skryptu i przeliczenia agregatów, statystyki pokażą zera —
-- i tak ma być. Lepiej zero niż liczba, o której nie wiadomo, ile w niej
-- crawlerów Meta.

CREATE TYPE "KlasyfikacjaSkanu" AS ENUM ('CZLOWIEK', 'BOT', 'NIEPEWNY');

ALTER TABLE "SkanQr"
  ADD COLUMN "userAgent"      TEXT,
  ADD COLUMN "asn"            INTEGER,
  ADD COLUMN "klasyfikacja"   "KlasyfikacjaSkanu" NOT NULL DEFAULT 'NIEPEWNY',
  ADD COLUMN "powodBota"      TEXT,
  ADD COLUMN "potwierdzonyJs" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "liczone"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tokenTrafienia" TEXT;

CREATE UNIQUE INDEX "SkanQr_tokenTrafienia_key" ON "SkanQr"("tokenTrafienia");
CREATE INDEX "SkanQr_liczone_czas_idx" ON "SkanQr"("liczone", "czas");
CREATE INDEX "SkanQr_kodQrId_liczone_czas_idx" ON "SkanQr"("kodQrId", "liczone", "czas");
CREATE INDEX "SkanQr_klasyfikacja_czas_idx" ON "SkanQr"("klasyfikacja", "czas");
