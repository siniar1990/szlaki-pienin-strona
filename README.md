# Strona aplikacji Szlaki Pienin

Statyczna strona wizytówkowa: opis aplikacji, **polityka prywatności**
i **wsparcie** — dwa ostatnie są wymagane przez App Store.

## Dlaczego osobne repozytorium

Kod aplikacji leży w `Aplikacja-Szlaki`, które jest **prywatne**. GitHub Pages
w darmowym planie publikuje wyłącznie z repozytoriów publicznych, więc strona
musi mieszkać osobno. Przy okazji ma to sens sama w sobie: poprawka literówki
w polityce prywatności nie powinna uruchamiać niczego po stronie aplikacji.

## Jak to działa

Każde `git push` do gałęzi `main` publikuje stronę przez GitHub Actions
(`.github/workflows/publikuj.yml`). Nie ma etapu budowania — pliki idą na
serwer takie, jakie są.

Jednorazowo trzeba włączyć w GitHubie: **Settings → Pages → Source:
GitHub Actions**.

## Podgląd na komputerze

```
python3 -m http.server 8000
```

potem <http://localhost:8000>.

## Pliki

| plik | co to |
|---|---|
| `index.html` | strona główna |
| `prywatnosc.html` | polityka prywatności — adres podawany w App Store Connect |
| `wsparcie.html` | pomoc i kontakt — adres podawany w App Store Connect |
| `styl.css` | wygląd; barwy wzięte z aplikacji |
| `ikona.png` | ikona aplikacji, ta sama co na telefonie |

## Dane z aplikacji

Katalog `dane/` to kopia z repozytorium aplikacji, przynoszona skryptem:

```
./narzedzia/synchronizuj-dane.sh
```

Kopiowanie idzie w jedną stronę — aplikacja jest źródłem prawdy. Szczegóły
i wprowadzenie do samej aplikacji: [CLAUDE.md](CLAUDE.md).
