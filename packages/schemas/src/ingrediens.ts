import { z } from 'zod'

// ── Enheter ──────────────────────────────────────────────────────────────────

export const ENHETER = ['g', 'kg', 'ml', 'dl', 'l', 'ts', 'ss', 'stk', 'fedd', 'pakke', 'boks', 'klype'] as const
export const EnhetSchema = z.enum(ENHETER)
export type Enhet = z.infer<typeof EnhetSchema>

// Every way of writing an enhet we recognise, lowercased and without dots ("s.s." → "ss").
const ENHET_SYNONYMER: Record<string, Enhet> = {
  g: 'g', gr: 'g', gram: 'g',
  kg: 'kg', kilo: 'kg', kilogram: 'kg',
  ml: 'ml', milliliter: 'ml',
  dl: 'dl', desiliter: 'dl',
  l: 'l', liter: 'l',
  ts: 'ts', tsk: 'ts', teskje: 'ts', teskjeer: 'ts',
  ss: 'ss', spiseskje: 'ss', spiseskjeer: 'ss',
  stk: 'stk', stykk: 'stk', stykker: 'stk',
  fedd: 'fedd', båt: 'fedd', båter: 'fedd',
  pk: 'pakke', pakke: 'pakke', pakker: 'pakke', pakning: 'pakke',
  boks: 'boks', bokser: 'boks',
  klype: 'klype', klyper: 'klype',
}

export function tolkEnhet(tekst: string): Enhet | null {
  return ENHET_SYNONYMER[tekst.toLowerCase().replaceAll('.', '')] ?? null
}

// ── Avdelinger ───────────────────────────────────────────────────────────────

export const AVDELINGER = [
  'FruktOgGrønt',
  'Brød',
  'KjøttOgFisk',
  'Meieri',
  'Tørrvarer',
  'Frys',
  'Drikke',
  'Husholdning',
  'Annet',
] as const
export const AvdelingSchema = z.enum(AVDELINGER)
export type Avdeling = z.infer<typeof AvdelingSchema>

export const AVDELINGSNAVN: Record<Avdeling, string> = {
  FruktOgGrønt: 'Frukt og grønt',
  Brød: 'Brød',
  KjøttOgFisk: 'Kjøtt og fisk',
  Meieri: 'Meieri',
  Tørrvarer: 'Tørrvarer',
  Frys: 'Frys',
  Drikke: 'Drikke',
  Husholdning: 'Husholdning',
  Annet: 'Annet',
}

// ── Tolking av "2 ss smør, myk" ──────────────────────────────────────────────

export interface TolketIngrediens {
  mengde: number | null
  enhet: Enhet | null
  /** The butikkvare part, e.g. "smør". Empty if the line had nothing but an amount/enhet. */
  navn: string
  /** Text after the first comma, e.g. "finhakket". */
  merknad: string | null
}

const BRØKER: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }
const TALLORD: Record<string, number> = { en: 1, ei: 1, et: 1 }

/** "2", "0,5", "1.5", "1/2", "½", "1½" → number. Anything else → null. */
function tolkTall(tekst: string): number | null {
  const t = tekst.trim()
  const medBrøk = /^(\d*)([¼½¾⅓⅔])$/.exec(t)
  if (medBrøk) return (medBrøk[1] ? Number(medBrøk[1]) : 0) + BRØKER[medBrøk[2]]
  const brøk = /^(\d+)\/(\d+)$/.exec(t)
  if (brøk) return Number(brøk[2]) === 0 ? null : Number(brøk[1]) / Number(brøk[2])
  if (/^\d+([.,]\d+)?$/.test(t)) return Number(t.replace(',', '.'))
  return null
}

/** Reads the amount from the start of the token list. Returns the amount and how many tokens it used. */
function lesMengde(tokens: string[]): { mengde: number; brukt: number } | null {
  const [a, b, c] = tokens
  if (a === undefined) return null

  // Range "2-3" / "2–3" (one token) or "2 - 3" (three tokens): use the upper value — better to buy too much
  const områdeEttToken = /^(.+?)[-–](.+)$/.exec(a)
  if (områdeEttToken) {
    const til = tolkTall(områdeEttToken[2])
    if (tolkTall(områdeEttToken[1]) !== null && til !== null) return { mengde: til, brukt: 1 }
  }
  if ((b === '-' || b === '–') && c !== undefined && tolkTall(a) !== null && tolkTall(c) !== null) {
    return { mengde: tolkTall(c)!, brukt: 3 }
  }

  const første = tolkTall(a) ?? TALLORD[a.toLowerCase()] ?? null
  if (første === null) return null

  // "1 1/2" or "1 ½"
  if (b !== undefined && Number.isInteger(første) && /^(\d+\/\d+|[¼½¾⅓⅔])$/.test(b)) {
    const brøk = tolkTall(b)
    if (brøk !== null) return { mengde: første + brøk, brukt: 2 }
  }
  return { mengde: første, brukt: 1 }
}

/**
 * Interprets one ingredient line as typed or pasted, e.g.
 *   "2 ss smør"            → 2 · ss · smør
 *   "200g kyllingfilet"    → 200 · g · kyllingfilet
 *   "1/2 rødløk, i ringer" → 0.5 · stk · rødløk · merknad "i ringer"
 *   "salt og pepper"       → no amount · salt og pepper
 */
export function tolkIngredienslinje(linje: string): TolketIngrediens {
  // Separate numbers glued to a unit ("200g" → "200 g"), and strip list bullets ("- ", "• ")
  const renset = linje
    .trim()
    .replace(/^[-•*]\s+/, '')
    .replace(/(\d)([a-zA-ZæøåÆØÅ])/g, '$1 $2')

  // The first comma that isn't a decimal comma ("1,5 dl" — digits on both sides) starts the merknad
  const kommaIndeks = renset.search(/(?<!\d),|,(?!\d)/)
  const hoveddel = kommaIndeks === -1 ? renset : renset.slice(0, kommaIndeks)
  const merknad = kommaIndeks === -1 ? null : renset.slice(kommaIndeks + 1).trim() || null

  let tokens = hoveddel.split(/\s+/).filter(Boolean)

  let mengde: number | null = null
  const lest = lesMengde(tokens)
  if (lest) {
    mengde = lest.mengde
    tokens = tokens.slice(lest.brukt)
  }

  let enhet: Enhet | null = null
  // Only treat the next word as an enhet if something follows it ("1 l melk"), so a lone "l" isn't swallowed
  if (tokens.length > 1 || (tokens.length === 1 && mengde !== null && tolkEnhet(tokens[0]) !== null)) {
    const tolket = tolkEnhet(tokens[0])
    if (tolket) {
      enhet = tolket
      tokens = tokens.slice(1)
    }
  }

  if (mengde !== null && enhet === null) enhet = 'stk' // "2 egg" → 2 stk
  if (mengde === null && enhet !== null) mengde = 1 // "klype salt" → 1 klype

  return { mengde, enhet, navn: tokens.join(' '), merknad }
}

/** Splits pasted text into ingredient lines, skipping empty lines. */
export function delIngredienslinjer(tekst: string): string[] {
  return tekst.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
}

// ── Visning ──────────────────────────────────────────────────────────────────

/** 0.5 → "0,5", 2 → "2", 0.3333 → "0,33" */
export function formatMengde(mengde: number): string {
  return String(Math.round(mengde * 100) / 100).replace('.', ',')
}

/** Back to one line, e.g. for editing: "2 ss Smør, myk". "stk" is left out ("2 Egg"). */
export function formatIngrediens(i: { mengde: number | null; enhet: Enhet | null; navn: string; merknad?: string | null }): string {
  const deler: string[] = []
  if (i.mengde !== null) deler.push(formatMengde(i.mengde))
  if (i.enhet !== null && i.enhet !== 'stk') deler.push(i.enhet)
  deler.push(i.navn)
  const linje = deler.join(' ')
  return i.merknad ? `${linje}, ${i.merknad}` : linje
}

// ── Matching mot butikkvarer ─────────────────────────────────────────────────

export function normaliserNavn(navn: string): string {
  return navn.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** The butikkvare with exactly this name (ignoring case and extra spaces), if any. */
export function finnButikkvare<T extends { navn: string }>(navn: string, butikkvarer: T[]): T | undefined {
  const n = normaliserNavn(navn)
  return butikkvarer.find((b) => normaliserNavn(b.navn) === n)
}

/** Up to `antall` likely matches when there's no exact one: names starting with the text first, then containing it. */
export function foreslåButikkvarer<T extends { navn: string }>(navn: string, butikkvarer: T[], antall = 3): T[] {
  const n = normaliserNavn(navn)
  if (n.length < 2) return []
  const starter = butikkvarer.filter((b) => normaliserNavn(b.navn).startsWith(n))
  const inneholder = butikkvarer.filter((b) => !starter.includes(b) && normaliserNavn(b.navn).includes(n))
  // Also the other way round: "kyllingfileter" should suggest "Kyllingfilet"
  const delAv = butikkvarer.filter((b) => !starter.includes(b) && !inneholder.includes(b) && n.startsWith(normaliserNavn(b.navn)))
  return [...starter, ...delAv, ...inneholder].filter((b) => normaliserNavn(b.navn) !== n).slice(0, antall)
}

/** "smør" → "Smør" — how new butikkvarer are named. */
export function storForbokstav(navn: string): string {
  const t = navn.trim().replace(/\s+/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}
