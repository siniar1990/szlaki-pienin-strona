import type { GrupaAtrakcji } from '@/lib/tresc/atrakcje-turystyczne'

/**
 * Ilustracja zastępująca brakujące zdjęcie atrakcji.
 *
 * Szary prostokąt z ikoną „brak obrazka" mówi wprost: portal jest
 * niedokończony. Rysunek odpowiadający kategorii mówi coś przeciwnego —
 * że tak miało być. Każda z ośmiu kategorii ma własną scenę w barwach marki,
 * budowaną z tych samych warstw co ilustracje na stronie głównej: niebo,
 * dalekie grzbiety, motyw przewodni na pierwszym planie.
 *
 * Rysunki są celowo proste. Mają wypełniać kadr i nadawać rytm liście,
 * a nie konkurować ze zdjęciami, które kiedyś je zastąpią.
 */

const WAPIEN = '#F5F0E3'
const ZIELEN_JASNA = '#3E8F70'
const ZIELEN = '#1F6B4C'
const ZIELEN_CIEMNA = '#0F3F2C'
const DUNAJEC = '#7CC0EA'
const DUNAJEC_CIEMNY = '#2F7DBB'
const KAMIEN = '#D9D2BE'

/** Wspólne tło: niebo z gradientem i dwa dalekie grzbiety. */
function Tlo({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`niebo-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE6F4" />
          <stop offset="1" stopColor="#EFF4EC" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#niebo-${id})`} />
      <path
        d="M0 150 L60 118 L110 142 L170 104 L230 138 L290 110 L350 140 L400 118 L400 300 L0 300 Z"
        fill={ZIELEN_JASNA}
        opacity="0.32"
      />
      <path
        d="M0 190 L70 158 L140 186 L210 150 L280 184 L350 156 L400 180 L400 300 L0 300 Z"
        fill={ZIELEN_JASNA}
        opacity="0.5"
      />
    </>
  )
}

const SCENY: Record<GrupaAtrakcji, (id: string) => React.ReactNode> = {
  // Przełom: dwie wapienne ściany, rzeka i tratwa.
  dunajec: (id) => (
    <>
      <Tlo id={id} />
      <path d="M0 300 L0 120 L46 138 L78 96 L112 176 L136 300 Z" fill={ZIELEN} />
      <path d="M400 300 L400 108 L352 130 L318 88 L286 178 L268 300 Z" fill={ZIELEN} />
      <path d="M0 120 L46 138 L78 96 L112 176 L84 182 L34 160 L0 148 Z" fill={KAMIEN} opacity="0.75" />
      <path d="M136 300 L150 196 L256 196 L268 300 Z" fill={DUNAJEC} />
      <path d="M136 300 L150 196 L256 196 L268 300 Z" fill={DUNAJEC_CIEMNY} opacity="0.35" />
      <path d="M162 244 q 40 -8 80 0" stroke={WAPIEN} strokeWidth="2.5" fill="none" opacity="0.5" />
      <g transform="translate(202 268)">
        <path d="M-42 0 q42 9 84 0 l-5 9 q-37 8 -74 0 Z" fill="#7A5230" />
        <circle cx="-24" cy="-8" r="4" fill={WAPIEN} />
        <circle cx="24" cy="-8" r="4" fill={WAPIEN} />
      </g>
    </>
  ),

  // Wąwóz: szczelina między ścianami, potok na dnie.
  przyroda: (id) => (
    <>
      <Tlo id={id} />
      <path d="M0 300 L0 84 L58 108 L96 62 L130 140 L156 300 Z" fill={ZIELEN_CIEMNA} />
      <path d="M400 300 L400 72 L338 100 L300 58 L268 146 L246 300 Z" fill={ZIELEN_CIEMNA} />
      <path d="M0 84 L58 108 L96 62 L130 140 L96 148 L44 122 L0 108 Z" fill={KAMIEN} />
      <path d="M400 72 L338 100 L300 58 L268 146 L302 152 L354 124 L400 100 Z" fill={KAMIEN} opacity="0.85" />
      <path d="M186 300 q 10 -60 6 -104 q -3 -30 8 -52" stroke={DUNAJEC} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M186 300 q 10 -60 6 -104" stroke={WAPIEN} strokeWidth="3" fill="none" opacity="0.6" />
    </>
  ),

  // Zamek: baszta i mury na skale.
  zamki: (id) => (
    <>
      <Tlo id={id} />
      <path d="M96 300 L128 200 L288 200 L316 300 Z" fill={ZIELEN} />
      <g fill={KAMIEN}>
        <rect x="150" y="126" width="46" height="80" />
        <rect x="196" y="150" width="72" height="56" />
        <rect x="146" y="116" width="10" height="14" />
        <rect x="164" y="116" width="10" height="14" />
        <rect x="182" y="116" width="10" height="14" />
        <rect x="196" y="140" width="10" height="12" />
        <rect x="216" y="140" width="10" height="12" />
        <rect x="236" y="140" width="10" height="12" />
        <rect x="256" y="140" width="12" height="12" />
      </g>
      <rect x="164" y="150" width="14" height="20" fill={ZIELEN_CIEMNA} opacity="0.6" />
      <rect x="216" y="170" width="14" height="36" fill={ZIELEN_CIEMNA} opacity="0.6" />
      <path d="M0 300 L0 240 L90 218 L120 300 Z" fill={ZIELEN_CIEMNA} />
      <path d="M400 300 L400 232 L318 214 L296 300 Z" fill={ZIELEN_CIEMNA} />
    </>
  ),

  // Jezioro: tafla, zapora i odbicie grzbietów.
  jeziora: (id) => (
    <>
      <Tlo id={id} />
      <rect x="0" y="196" width="400" height="104" fill={DUNAJEC} />
      <rect x="0" y="196" width="400" height="104" fill={DUNAJEC_CIEMNY} opacity="0.28" />
      <path d="M0 196 L0 178 L400 172 L400 196 Z" fill={KAMIEN} />
      <path d="M40 232 q 46 -8 92 0" stroke={WAPIEN} strokeWidth="2.5" fill="none" opacity="0.45" />
      <path d="M180 262 q 56 -8 112 0" stroke={WAPIEN} strokeWidth="2.5" fill="none" opacity="0.35" />
      <path d="M0 178 L54 148 L104 176 L152 178 Z" fill={ZIELEN} />
      <path d="M256 176 L308 144 L358 174 L400 172 Z" fill={ZIELEN} />
    </>
  ),

  // Zdrój: pijalnia, strumień wody i kubek.
  wody: (id) => (
    <>
      <Tlo id={id} />
      <rect x="0" y="220" width="400" height="80" fill={ZIELEN} opacity="0.28" />
      <g transform="translate(200 154)">
        <path d="M-72 66 L-58 -8 L58 -8 L72 66 Z" fill={KAMIEN} />
        <path d="M-64 -8 L0 -46 L64 -8 Z" fill={ZIELEN} />
        <rect x="-10" y="8" width="20" height="26" rx="4" fill={ZIELEN_CIEMNA} opacity="0.55" />
        <path d="M0 34 q 0 20 -2 30" stroke={DUNAJEC} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M-16 66 q 16 10 32 0 l-4 14 q-12 6 -24 0 Z" fill={WAPIEN} />
      </g>
      <circle cx="120" cy="252" r="5" fill={DUNAJEC} opacity="0.7" />
      <circle cx="286" cy="262" r="4" fill={DUNAJEC} opacity="0.6" />
    </>
  ),

  // Wyciąg: słup, lina i krzesełko nad stokiem.
  rodzinne: (id) => (
    <>
      <Tlo id={id} />
      <path d="M0 300 L0 232 L140 190 L280 218 L400 178 L400 300 Z" fill={ZIELEN} />
      <path d="M0 300 L0 268 L150 238 L300 262 L400 236 L400 300 Z" fill={ZIELEN_CIEMNA} />
      <path d="M40 96 L370 62" stroke={ZIELEN_CIEMNA} strokeWidth="3" />
      <rect x="70" y="96" width="7" height="146" fill={KAMIEN} />
      <rect x="316" y="70" width="7" height="152" fill={KAMIEN} />
      <g transform="translate(180 88)">
        <path d="M0 0 L0 26" stroke={ZIELEN_CIEMNA} strokeWidth="3" />
        <rect x="-16" y="26" width="32" height="22" rx="5" fill="#C0392B" />
      </g>
      <g transform="translate(268 78)">
        <path d="M0 0 L0 26" stroke={ZIELEN_CIEMNA} strokeWidth="3" />
        <rect x="-16" y="26" width="32" height="22" rx="5" fill="#D69A00" />
      </g>
    </>
  ),

  // Muzeum: drewniana willa z gankiem, jak przy Placu Dietla.
  muzea: (id) => (
    <>
      <Tlo id={id} />
      <rect x="0" y="232" width="400" height="68" fill={ZIELEN} opacity="0.34" />
      <g transform="translate(200 168)">
        <path d="M-96 20 L0 -50 L96 20 Z" fill={ZIELEN} />
        <rect x="-80" y="20" width="160" height="76" fill="#B08154" />
        <rect x="-80" y="20" width="160" height="76" fill={ZIELEN_CIEMNA} opacity="0.12" />
        <rect x="-56" y="42" width="26" height="32" fill={WAPIEN} />
        <rect x="-13" y="42" width="26" height="32" fill={WAPIEN} />
        <rect x="30" y="42" width="26" height="32" fill={WAPIEN} />
        <path d="M-88 20 L0 -42 L88 20" stroke={WAPIEN} strokeWidth="3" fill="none" opacity="0.5" />
        <rect x="-12" y="76" width="24" height="20" fill={ZIELEN_CIEMNA} opacity="0.7" />
      </g>
    </>
  ),

  // Cerkiew: bania na wieży i krzyż.
  swiatynie: (id) => (
    <>
      <Tlo id={id} />
      <rect x="0" y="238" width="400" height="62" fill={ZIELEN} opacity="0.34" />
      <g transform="translate(200 170)">
        <rect x="-72" y="30" width="144" height="66" fill={KAMIEN} />
        <path d="M-80 30 L0 -12 L80 30 Z" fill={ZIELEN} />
        <rect x="-22" y="-56" width="44" height="58" fill={KAMIEN} />
        <path d="M0 -104 q 30 24 22 44 q -6 14 -22 14 q -16 0 -22 -14 q -8 -20 22 -44 Z" fill={ZIELEN} />
        <path d="M0 -128 L0 -104 M-9 -119 L9 -119" stroke={ZIELEN_CIEMNA} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="-10" y="66" width="20" height="30" fill={ZIELEN_CIEMNA} opacity="0.65" />
        <rect x="-52" y="50" width="18" height="24" fill={WAPIEN} />
        <rect x="34" y="50" width="18" height="24" fill={WAPIEN} />
      </g>
    </>
  ),
}

export function IlustracjaKategorii({
  grupa,
  id,
  className,
}: {
  grupa: GrupaAtrakcji
  /** Unikatowy przyrostek identyfikatorów gradientu — inaczej rysunki kradną
      sobie nawzajem definicje, gdy jest ich kilka na jednej stronie. */
  id: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      {SCENY[grupa](id)}
    </svg>
  )
}
