/**
 * Znacznik pamięci podręcznej dla tabliczek.
 *
 * Trasa skanowania trzyma odczyt tabliczki w pamięci podręcznej, bo darmowy
 * Neon usypia bazę i jej wybudzenie potrafi zająć trzydzieści sekund. Panel
 * musi mieć czym ten zapis unieważnić, gdy ktoś zmieni cel tabliczki albo ją
 * wyłączy — inaczej zmiana czekałaby na upływ minuty, a przy dezaktywacji
 * uszkodzonej tabliczki to za długo.
 *
 * Osobny plik, bo importują go i trasa skanowania, i akcje panelu; trzymanie
 * stałej w którymkolwiek z nich wiązałoby je ze sobą bez powodu.
 */
export const ZNACZNIK_TABLICZEK = 'tabliczki'
