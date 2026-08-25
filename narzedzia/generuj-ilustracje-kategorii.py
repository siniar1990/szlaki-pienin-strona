#!/usr/bin/env python3
"""
Generuje autorskie ilustracje kategorii tras.

Dlaczego rysujemy, a nie fotografujemy: zdjęć wszystkich kategorii po prostu
nie mamy, a zdjęcia z cudzych folderów są cudze. Rysunek wektorowy ma tu zresztą
przewagę — dziewięć kafelków z jednego generatora trzyma wspólny charakter,
czego nie da się osiągnąć zbieranymi z różnych źródeł fotografiami.

Każda kategoria dostaje własną scenę i własną porę dnia, żeby dało się je
rozróżnić kątem oka, bez czytania podpisu. Wspólne zostają: paleta marki,
kompozycja warstwowa (niebo → dalekie grzbiety → bliskie grzbiety → pierwszy
plan) i pas góralskiego ornamentu u dołu.

    python3 narzedzia/generuj-ilustracje-kategorii.py

Pliki lądują w `public/marka/kategorie/`. Skrypt jest deterministyczny —
uruchomiony ponownie daje bajt w bajt to samo.
"""

from pathlib import Path

SZEROKOSC, WYSOKOSC = 1200, 900
# Ścieżka względem katalogu projektu — skrypt uruchamiamy z jego korzenia.
CEL = Path("public") / "marka" / "kategorie"

# Paleta marki — te same wartości, co w księdze znaku i w globals.css.
WAPIEN = "#F5F0E3"
ZIELEN_JASNA = "#1F8060"
ZIELEN_GLEBOKA = "#0B3A26"
ZIELEN_ZNAKU = "#14532D"
DUNAJEC_JASNY = "#7CC0EA"
DUNAJEC_CIEMNY = "#2F7DBB"


def grzbiet(punkty, wypelnienie, krycie=1.0, do_dolu=WYSOKOSC):
    """
    Zamienia listę wierzchołków w wypełniony kształt grzbietu.

    Linia łamana zamiast krzywych: pienińskie granie są wapienne i kanciaste,
    a wygładzone „chmurki" wyglądałyby jak Bieszczady.
    """
    d = f"M {punkty[0][0]} {punkty[0][1]}"
    for x, y in punkty[1:]:
        d += f" L {x} {y}"
    d += f" L {SZEROKOSC} {do_dolu} L 0 {do_dolu} Z"
    return f'<path d="{d}" fill="{wypelnienie}" opacity="{krycie}"/>'


def swierk(x, podstawa, wysokosc, kolor, krycie=1.0):
    """Sylwetka świerka — trzy zachodzące na siebie trójkąty."""
    czesci = []
    for i, (gora_frac, szer_frac) in enumerate(((0.0, 0.55), (0.3, 0.8), (0.6, 1.0))):
        gora = podstawa - wysokosc * (1 - gora_frac)
        szer = wysokosc * 0.42 * szer_frac
        dol = podstawa - wysokosc * (0.45 - i * 0.22)
        czesci.append(
            f'<path d="M {x} {gora:.1f} L {x + szer:.1f} {dol:.1f} '
            f'L {x - szer:.1f} {dol:.1f} Z" fill="{kolor}" opacity="{krycie}"/>'
        )
    czesci.append(
        f'<rect x="{x - wysokosc * 0.035:.1f}" y="{podstawa - wysokosc * 0.16:.1f}" '
        f'width="{wysokosc * 0.07:.1f}" height="{wysokosc * 0.16:.1f}" '
        f'fill="{kolor}" opacity="{krycie}"/>'
    )
    return "".join(czesci)


def ornament(y, kolor, krycie=0.5):
    """
    Pas góralskiego haftu — motyw z okładki folderu gminy.

    Powtarzalny ząbek z listkiem: uproszczony do tego, co czytelne przy
    wysokości kilkunastu pikseli. Bez tego dziewięć ilustracji byłoby ładne,
    ale niczym nie zdradzałoby, że są z Pienin.
    """
    krok = 50
    zabki = []
    for i in range(0, SZEROKOSC + krok, krok):
        zabki.append(
            f'<path d="M {i} {y} l {krok / 2} -18 l {krok / 2} 18 '
            f'M {i + krok / 2} {y - 18} l 0 -10 '
            f'M {i + krok / 2 - 8} {y - 24} l 8 -6 l 8 6" '
            f'stroke="{kolor}" stroke-width="2.5" fill="none" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity="{krycie}"/>'
        )
    return "".join(zabki)


def slonce(cx, cy, r, kolor, poswiata_id):
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r * 3.4}" fill="url(#{poswiata_id})"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{kolor}"/>'
    )


def dokument(tresc, gradienty=""):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SZEROKOSC} {WYSOKOSC}" '
        f'width="{SZEROKOSC}" height="{WYSOKOSC}">'
        f"<defs>{gradienty}</defs>{tresc}</svg>"
    )


def niebo(id_gradientu, gora, dol):
    return (
        f'<linearGradient id="{id_gradientu}" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{gora}"/>'
        f'<stop offset="1" stop-color="{dol}"/></linearGradient>'
    )


def poswiata(id_gradientu, kolor):
    return (
        f'<radialGradient id="{id_gradientu}">'
        f'<stop offset="0" stop-color="{kolor}" stop-opacity="0.55"/>'
        f'<stop offset="1" stop-color="{kolor}" stop-opacity="0"/></radialGradient>'
    )


# ── Sceny ────────────────────────────────────────────────────────────────────
# Każda funkcja zwraca (gradienty, treść). Kolejność rysowania: od najdalszego
# planu do najbliższego — tak jak patrzy oko.


def scena_krotkie():
    """Poranek nad doliną: miękkie światło, ścieżka wchodząca w kadr."""
    g = niebo("n", "#FBE9D2", "#F5F0E3") + poswiata("p", "#F0A868")
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(880, 250, 58, "#F6C177", "p"),
        grzbiet([(0, 470), (180, 400), (340, 445), (520, 360), (700, 430), (900, 375), (1200, 440)],
                ZIELEN_JASNA, 0.28),
        grzbiet([(0, 560), (220, 495), (430, 545), (640, 470), (860, 530), (1050, 480), (1200, 520)],
                ZIELEN_JASNA, 0.5),
        grzbiet([(0, 660), (260, 600), (500, 645), (760, 585), (1000, 640), (1200, 610)],
                ZIELEN_ZNAKU, 0.85),
        # Ścieżka — jasna wstęga wchodząca w głąb kadru.
        f'<path d="M 380 900 C 520 800 470 730 620 690 C 740 658 780 640 820 628" '
        f'stroke="{WAPIEN}" stroke-width="26" fill="none" stroke-linecap="round" opacity="0.75"/>',
        f'<path d="M 380 900 C 520 800 470 730 620 690 C 740 658 780 640 820 628" '
        f'stroke="#E4D9BE" stroke-width="26" fill="none" stroke-linecap="round" '
        f'stroke-dasharray="2 26" opacity="0.5"/>',
        grzbiet([(0, 745), (300, 720), (620, 755), (900, 715), (1200, 750)], ZIELEN_GLEBOKA, 1),
        swierk(120, 800, 150, ZIELEN_GLEBOKA),
        swierk(210, 830, 110, ZIELEN_GLEBOKA),
        swierk(1080, 815, 165, ZIELEN_GLEBOKA),
        swierk(1000, 845, 105, ZIELEN_GLEBOKA),
        ornament(880, WAPIEN, 0.30),
    ]
    return g, "".join(t)


def scena_srednie():
    """Południe na grani: pełne światło, kilka pasm jedno za drugim."""
    g = niebo("n", "#CDE7F7", "#F0F6FA") + poswiata("p", "#FFFFFF")
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(300, 180, 46, "#FFFFFF", "p"),
        grzbiet([(0, 430), (150, 360), (330, 410), (480, 330), (650, 395), (830, 340), (1000, 400), (1200, 355)],
                DUNAJEC_CIEMNY, 0.20),
        grzbiet([(0, 520), (200, 450), (400, 505), (600, 425), (820, 490), (1030, 440), (1200, 480)],
                ZIELEN_JASNA, 0.38),
        grzbiet([(0, 615), (240, 545), (470, 600), (700, 520), (930, 585), (1200, 545)],
                ZIELEN_JASNA, 0.62),
        grzbiet([(0, 700), (280, 645), (560, 700), (840, 630), (1200, 685)], ZIELEN_ZNAKU, 0.92),
        grzbiet([(0, 790), (320, 755), (660, 795), (980, 750), (1200, 785)], ZIELEN_GLEBOKA, 1),
        swierk(150, 850, 130, ZIELEN_GLEBOKA),
        swierk(1050, 858, 120, ZIELEN_GLEBOKA),
        ornament(880, WAPIEN, 0.34),
    ]
    return g, "".join(t)


def scena_dlugie():
    """Późne popołudnie: pasma aż po horyzont, długie cienie, słońce nisko."""
    g = niebo("n", "#F4D9B8", "#EFE3D2") + poswiata("p", "#E8894A")
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(960, 330, 64, "#EE9A56", "p"),
        grzbiet([(0, 390), (200, 330), (420, 380), (640, 305), (880, 370), (1200, 330)],
                "#C98C63", 0.22),
        grzbiet([(0, 470), (230, 415), (450, 465), (700, 390), (950, 455), (1200, 420)],
                "#9C7A66", 0.3),
        grzbiet([(0, 555), (260, 495), (520, 550), (780, 470), (1030, 535), (1200, 505)],
                ZIELEN_JASNA, 0.45),
        grzbiet([(0, 645), (290, 585), (580, 640), (870, 560), (1200, 620)], ZIELEN_ZNAKU, 0.72),
        grzbiet([(0, 740), (330, 685), (680, 745), (1000, 675), (1200, 720)], ZIELEN_GLEBOKA, 0.94),
        grzbiet([(0, 828), (360, 800), (740, 838), (1200, 795)], "#08281A", 1),
        swierk(240, 880, 175, "#08281A"),
        swierk(330, 895, 120, "#08281A"),
        swierk(940, 890, 150, "#08281A"),
        ornament(880, WAPIEN, 0.26),
    ]
    return g, "".join(t)


def scena_trzy_korony():
    """Trzy skalne baszty — znak rozpoznawczy Pienin."""
    g = niebo("n", "#BFE0F4", "#EAF3F8") + poswiata("p", "#FFFFFF")
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(230, 190, 42, "#FFFFFF", "p"),
        grzbiet([(0, 560), (250, 500), (520, 555), (800, 490), (1200, 545)], ZIELEN_JASNA, 0.26),
        # Trzy wapienne baszty, każda z jaśniejszą ścianą od strony słońca.
        '<path d="M 350 700 L 452 336 L 500 452 L 548 700 Z" fill="#E9E2D0"/>',
        '<path d="M 452 336 L 500 452 L 548 700 L 512 700 Z" fill="#C9BFA6"/>',
        '<path d="M 540 700 L 640 268 L 700 420 L 760 700 Z" fill="#F1EBDB"/>',
        '<path d="M 640 268 L 700 420 L 760 700 L 712 700 Z" fill="#CFC5AC"/>',
        '<path d="M 752 700 L 838 388 L 880 486 L 922 700 Z" fill="#E5DECB"/>',
        '<path d="M 838 388 L 880 486 L 922 700 L 890 700 Z" fill="#C4BAA2"/>',
        grzbiet([(0, 690), (300, 660), (620, 700), (940, 655), (1200, 690)], ZIELEN_ZNAKU, 0.9),
        grzbiet([(0, 780), (340, 748), (700, 788), (1040, 742), (1200, 775)], ZIELEN_GLEBOKA, 1),
        swierk(160, 845, 145, ZIELEN_GLEBOKA),
        swierk(1060, 838, 155, ZIELEN_GLEBOKA),
        ornament(880, WAPIEN, 0.34),
    ]
    return g, "".join(t)


def scena_dzieci():
    """Łagodna polana: niskie wzgórza, kwiaty, dużo światła."""
    g = niebo("n", "#D8EEDF", "#F6F2E4") + poswiata("p", "#FFE9A8")
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(950, 210, 52, "#FBD979", "p"),
        grzbiet([(0, 520), (260, 470), (540, 515), (820, 460), (1200, 505)], ZIELEN_JASNA, 0.26),
        grzbiet([(0, 620), (300, 578), (620, 622), (940, 572), (1200, 610)], ZIELEN_JASNA, 0.45),
        # Łagodne, zaokrąglone pagórki zamiast kanciastych grani.
        f'<path d="M 0 760 C 200 680 340 690 520 745 C 700 800 840 700 1040 720 '
        f'C 1130 728 1170 740 1200 748 L 1200 900 L 0 900 Z" fill="{ZIELEN_ZNAKU}" opacity="0.85"/>',
        f'<path d="M 0 830 C 240 780 420 800 640 830 C 860 860 1000 810 1200 826 '
        f'L 1200 900 L 0 900 Z" fill="{ZIELEN_GLEBOKA}"/>',
    ]
    # Kwiaty na pierwszym planie — nieregularne, ale ustalone na sztywno,
    # żeby kolejne uruchomienie skryptu dało ten sam obrazek.
    for x, y, kolor in (
        (110, 812, "#F2C94C"), (190, 838, "#F5F0E3"), (275, 806, "#E8A0B4"),
        (395, 842, "#F2C94C"), (505, 818, "#F5F0E3"), (640, 848, "#E8A0B4"),
        (760, 820, "#F2C94C"), (880, 850, "#F5F0E3"), (995, 822, "#E8A0B4"),
        (1105, 846, "#F2C94C"),
    ):
        t.append(f'<circle cx="{x}" cy="{y}" r="7" fill="{kolor}" opacity="0.9"/>')
        t.append(
            f'<path d="M {x} {y + 7} l 0 18" stroke="{ZIELEN_GLEBOKA}" '
            f'stroke-width="2.5" opacity="0.5"/>'
        )
    t.append(swierk(80, 790, 105, ZIELEN_ZNAKU, 0.9))
    t.append(swierk(1140, 786, 115, ZIELEN_ZNAKU, 0.9))
    t.append(ornament(880, ZIELEN_GLEBOKA, 0.22))
    return g, "".join(t)


def scena_rowerowe():
    """Dolina Dunajca: rzeka jako główny bohater, wzdłuż niej wstęga trasy."""
    g = (
        niebo("n", "#CDE6F6", "#EDF4F8")
        + poswiata("p", "#FFFFFF")
        + f'<linearGradient id="rzeka" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{DUNAJEC_CIEMNY}"/>'
        f'<stop offset="1" stop-color="{DUNAJEC_JASNY}"/></linearGradient>'
    )
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(260, 175, 44, "#FFFFFF", "p"),
        grzbiet([(0, 445), (220, 385), (450, 440), (690, 365), (930, 430), (1200, 385)],
                ZIELEN_JASNA, 0.25),
        grzbiet([(0, 545), (260, 480), (520, 540), (780, 465), (1040, 530), (1200, 495)],
                ZIELEN_JASNA, 0.45),
        grzbiet([(0, 640), (300, 585), (620, 645), (940, 580), (1200, 625)], ZIELEN_ZNAKU, 0.8),
        # Rzeka: szeroka wstęga wijąca się od horyzontu ku dolnej krawędzi.
        '<path d="M 640 626 C 700 700 520 740 560 800 C 590 848 470 866 430 900 '
        'L 900 900 C 860 850 900 806 860 762 C 812 710 760 680 700 626 Z" fill="url(#rzeka)"/>',
        '<path d="M 660 660 C 700 716 560 752 596 800" stroke="#FFFFFF" stroke-width="3" '
        'fill="none" opacity="0.35"/>',
        grzbiet([(0, 720), (200, 700), (380, 730), (520, 742), (560, 900)],
                ZIELEN_GLEBOKA, 1, do_dolu=900),
        f'<path d="M 900 900 C 940 830 1010 790 1080 762 C 1140 738 1180 730 1200 726 '
        f'L 1200 900 Z" fill="{ZIELEN_GLEBOKA}"/>',
        # Wstęga trasy rowerowej biegnąca brzegiem.
        f'<path d="M 980 900 C 1000 820 1060 782 1120 756" stroke="{WAPIEN}" '
        f'stroke-width="16" fill="none" stroke-linecap="round" opacity="0.8"/>',
        swierk(120, 800, 140, ZIELEN_GLEBOKA),
        swierk(300, 828, 100, ZIELEN_GLEBOKA),
        ornament(880, WAPIEN, 0.30),
    ]
    return g, "".join(t)


def scena_korony_pienin():
    """Kolekcja szczytów: wiele wierzchołków, jeden wyróżniony gwiazdą."""
    g = niebo("n", "#0F4C3A", "#1F8060") + poswiata("p", "#7CC0EA")
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(600, 250, 40, "#F5F0E3", "p"),
        grzbiet([(0, 470), (120, 405), (250, 455), (380, 385), (520, 448), (660, 375),
                 (800, 445), (940, 392), (1080, 452), (1200, 400)], "#F5F0E3", 0.12),
        grzbiet([(0, 570), (160, 500), (320, 558), (480, 480), (640, 548), (800, 478),
                 (960, 548), (1120, 490), (1200, 528)], "#F5F0E3", 0.20),
        grzbiet([(0, 675), (200, 600), (400, 665), (600, 575), (800, 655), (1000, 590),
                 (1200, 650)], "#0B3A26", 0.65),
        grzbiet([(0, 775), (240, 710), (500, 775), (760, 700), (1020, 768), (1200, 730)],
                "#08281A", 1),
        # Gwiazda nad najwyższym szczytem — znak kolekcji do zdobycia.
        '<path d="M 600 470 l 13 40 l 42 0 l -34 25 l 13 40 l -34 -25 l -34 25 l 13 -40 '
        'l -34 -25 l 42 0 Z" fill="#F5F0E3" opacity="0.92"/>',
        swierk(140, 860, 150, "#08281A"),
        swierk(1080, 855, 140, "#08281A"),
        ornament(880, WAPIEN, 0.40),
    ]
    return g, "".join(t)


def scena_wyzwania():
    """Odznaki: diament i rubin nad ciemną granią."""
    g = niebo("n", "#12314A", "#2F7DBB") + poswiata("p", "#F5F0E3")
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(600, 300, 30, "#F5F0E3", "p"),
        grzbiet([(0, 560), (220, 495), (460, 555), (700, 480), (940, 548), (1200, 500)],
                "#0B3A26", 0.55),
        grzbiet([(0, 680), (260, 615), (540, 682), (820, 605), (1200, 668)], "#08281A", 0.9),
        grzbiet([(0, 790), (320, 750), (680, 800), (1020, 745), (1200, 782)], "#061C12", 1),
        # Diament — fasetowany ośmiobok z widocznymi szlifami.
        '<g transform="translate(470 350)">'
        '<path d="M 0 -78 L 66 -26 L 40 62 L -40 62 L -66 -26 Z" fill="#DCEEFB" opacity="0.95"/>'
        '<path d="M 0 -78 L 66 -26 L 0 -4 Z" fill="#FFFFFF" opacity="0.85"/>'
        '<path d="M 0 -78 L -66 -26 L 0 -4 Z" fill="#A9D3EE" opacity="0.9"/>'
        '<path d="M -66 -26 L 0 -4 L -40 62 Z" fill="#7CC0EA" opacity="0.85"/>'
        '<path d="M 66 -26 L 0 -4 L 40 62 Z" fill="#8FC9EE" opacity="0.8"/>'
        '<path d="M -40 62 L 0 -4 L 40 62 Z" fill="#BEE0F6" opacity="0.9"/></g>',
        # Rubin — ten sam kształt, mniejszy i w czerwieni.
        '<g transform="translate(742 402) scale(0.78)">'
        '<path d="M 0 -78 L 66 -26 L 40 62 L -40 62 L -66 -26 Z" fill="#E4A0A8" opacity="0.95"/>'
        '<path d="M 0 -78 L 66 -26 L 0 -4 Z" fill="#F3CBCF" opacity="0.85"/>'
        '<path d="M 0 -78 L -66 -26 L 0 -4 Z" fill="#C4666F" opacity="0.9"/>'
        '<path d="M -66 -26 L 0 -4 L -40 62 Z" fill="#A93F49" opacity="0.9"/>'
        '<path d="M 66 -26 L 0 -4 L 40 62 Z" fill="#B85560" opacity="0.85"/>'
        '<path d="M -40 62 L 0 -4 L 40 62 Z" fill="#D4838C" opacity="0.9"/></g>',
        swierk(180, 860, 145, "#061C12"),
        swierk(1020, 855, 135, "#061C12"),
        ornament(880, WAPIEN, 0.35),
    ]
    return g, "".join(t)


def scena_atrakcje():
    """Przełom Dunajca z tratwą — obraz, który każdy kojarzy z Pieninami."""
    g = (
        niebo("n", "#CBE8F7", "#EEF6FA")
        + poswiata("p", "#FFFFFF")
        + '<linearGradient id="woda" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{DUNAJEC_JASNY}"/>'
        f'<stop offset="1" stop-color="{DUNAJEC_CIEMNY}"/></linearGradient>'
    )
    t = [
        f'<rect width="{SZEROKOSC}" height="{WYSOKOSC}" fill="url(#n)"/>',
        slonce(600, 200, 40, "#FFFFFF", "p"),
        grzbiet([(0, 470), (300, 400), (600, 455), (900, 390), (1200, 445)], ZIELEN_JASNA, 0.22),
        # Dwie wapienne ściany zamykające przełom — kadr jak z folderu.
        f'<path d="M 0 900 L 0 300 L 120 340 L 210 250 L 300 420 L 360 520 L 390 900 Z" '
        f'fill="{ZIELEN_ZNAKU}"/>',
        '<path d="M 0 300 L 120 340 L 210 250 L 300 420 L 250 440 L 130 400 L 0 380 Z" '
        'fill="#E9E2D0" opacity="0.55"/>',
        f'<path d="M 1200 900 L 1200 280 L 1070 330 L 980 230 L 890 410 L 830 530 L 810 900 Z" '
        f'fill="{ZIELEN_ZNAKU}"/>',
        '<path d="M 1200 280 L 1070 330 L 980 230 L 890 410 L 950 430 L 1075 390 L 1200 362 Z" '
        'fill="#E9E2D0" opacity="0.5"/>',
        # Woda między ścianami.
        '<path d="M 390 900 L 400 560 L 812 560 L 810 900 Z" fill="url(#woda)"/>',
        '<path d="M 430 690 q 90 -14 180 0 t 180 0" stroke="#FFFFFF" stroke-width="3" '
        'fill="none" opacity="0.35"/>',
        '<path d="M 450 760 q 90 -14 180 0 t 160 0" stroke="#FFFFFF" stroke-width="3" '
        'fill="none" opacity="0.28"/>',
        # Tratwa flisacka — pięć połączonych łodzi, sylwetki flisaków.
        '<g transform="translate(600 800)">'
        '<path d="M -132 0 q 132 26 264 0 l -14 26 q -118 22 -236 0 Z" fill="#7A5230"/>'
        '<path d="M -132 0 q 132 26 264 0" stroke="#5C3D22" stroke-width="4" fill="none"/>'
        '<rect x="-118" y="-6" width="236" height="7" fill="#8B6239" opacity="0.75"/>'
        '<circle cx="-86" cy="-24" r="9" fill="#F5F0E3"/>'
        '<rect x="-92" y="-15" width="12" height="20" rx="4" fill="#2F4F63"/>'
        '<circle cx="86" cy="-24" r="9" fill="#F5F0E3"/>'
        '<rect x="80" y="-15" width="12" height="20" rx="4" fill="#2F4F63"/>'
        '<path d="M -104 -30 l -22 -34" stroke="#5C3D22" stroke-width="4" stroke-linecap="round"/>'
        '<path d="M 104 -30 l 22 -34" stroke="#5C3D22" stroke-width="4" stroke-linecap="round"/>'
        "</g>",
        swierk(300, 620, 120, ZIELEN_GLEBOKA),
        swierk(900, 610, 130, ZIELEN_GLEBOKA),
        ornament(880, WAPIEN, 0.32),
    ]
    return g, "".join(t)


SCENY = {
    "krotkie": scena_krotkie,
    "srednie": scena_srednie,
    "dlugie": scena_dlugie,
    "trzy-korony": scena_trzy_korony,
    "z-dziecmi": scena_dzieci,
    "rowerowe": scena_rowerowe,
    "korony-pienin": scena_korony_pienin,
    "wyzwania": scena_wyzwania,
    "atrakcje": scena_atrakcje,
}


def main():
    CEL.mkdir(parents=True, exist_ok=True)
    for nazwa, buduj in SCENY.items():
        gradienty, tresc = buduj()
        plik = CEL / f"{nazwa}.svg"
        plik.write_text(dokument(tresc, gradienty), encoding="utf-8")
        print(f"  {plik.name:22} {plik.stat().st_size / 1024:5.1f} kB")
    print(f"\nGotowe: {len(SCENY)} ilustracji w {CEL}")


if __name__ == "__main__":
    main()
