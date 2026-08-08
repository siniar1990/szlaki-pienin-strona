-- Kategoria i powiązana strona znikają z modelu tabliczki.
--
-- Obie były w danych i obie usuwamy świadomie, na życzenie właściciela:
-- kategoria nie była do niczego używana poza filtrem w panelu, a każda
-- tabliczka prowadzi teraz do jednej strony z pobraniem aplikacji, więc
-- wskazywanie strony docelowej per tabliczka straciło sens.
--
-- Wraz z kolumną `kategoria` znika indeks, który ją obejmował, i typ
-- wyliczeniowy, z którego korzystała.
DROP INDEX IF EXISTS "KodQr_status_kategoria_idx";

ALTER TABLE "KodQr" DROP COLUMN "kategoria";
ALTER TABLE "KodQr" DROP COLUMN "powiazanaStrona";

DROP TYPE IF EXISTS "KategoriaKodu";

CREATE INDEX "KodQr_status_idx" ON "KodQr"("status");

-- Wysokość nad poziomem morza — z odczytu GPS przy montażu. Bywa niedostępna,
-- więc kolumna dopuszcza brak wartości.
ALTER TABLE "KodQr" ADD COLUMN "wysokosc" DOUBLE PRECISION;

-- Zdjęcie zamontowanej tabliczki jako `data:` URL. Tekst, nie bajty:
-- przeglądarka zmniejsza zdjęcie przed wysłaniem i przekazuje je już
-- zakodowane, więc kolumna tekstowa jest tym, co faktycznie przychodzi.
ALTER TABLE "KodQr" ADD COLUMN "zdjecie" TEXT;
