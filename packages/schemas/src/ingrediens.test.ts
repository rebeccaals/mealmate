import { describe, expect, it } from 'vitest'
import {
  delIngredienslinjer,
  finnButikkvare,
  foreslåButikkvarer,
  formatIngrediens,
  formatMengde,
  storForbokstav,
  tolkIngredienslinje,
} from './ingrediens'

describe('tolkIngredienslinje', () => {
  it.each([
    // [linje, mengde, enhet, navn, merknad]
    ['2 ss smør', 2, 'ss', 'smør', null],
    ['200 g kyllingfilet', 200, 'g', 'kyllingfilet', null],
    ['200g kyllingfilet', 200, 'g', 'kyllingfilet', null],
    ['1,5 dl fløte', 1.5, 'dl', 'fløte', null],
    ['1.5 dl fløte', 1.5, 'dl', 'fløte', null],
    ['1,5dl fløte', 1.5, 'dl', 'fløte', null],
    ['1/2 ts salt', 0.5, 'ts', 'salt', null],
    ['½ ts salt', 0.5, 'ts', 'salt', null],
    ['1½ dl melk', 1.5, 'dl', 'melk', null],
    ['1 1/2 dl melk', 1.5, 'dl', 'melk', null],
    ['1 ½ dl melk', 1.5, 'dl', 'melk', null],
    ['2-3 fedd hvitløk', 3, 'fedd', 'hvitløk', null],
    ['2–3 fedd hvitløk', 3, 'fedd', 'hvitløk', null],
    ['2 - 3 fedd hvitløk', 3, 'fedd', 'hvitløk', null],
  ] as const)('%s', (linje, mengde, enhet, navn, merknad) => {
    expect(tolkIngredienslinje(linje)).toEqual({ mengde, enhet, navn, merknad })
  })

  it('understands written-out and abbreviated enheter', () => {
    expect(tolkIngredienslinje('2 spiseskjeer smør').enhet).toBe('ss')
    expect(tolkIngredienslinje('2 s.s. smør').enhet).toBe('ss')
    expect(tolkIngredienslinje('1 teskje salt').enhet).toBe('ts')
    expect(tolkIngredienslinje('500 gram kjøttdeig').enhet).toBe('g')
    expect(tolkIngredienslinje('500 gr. kjøttdeig').enhet).toBe('g')
    expect(tolkIngredienslinje('1 liter melk').enhet).toBe('l')
    expect(tolkIngredienslinje('3 båter hvitløk').enhet).toBe('fedd')
    expect(tolkIngredienslinje('1 pk bacon').enhet).toBe('pakke')
    expect(tolkIngredienslinje('2 Bokser hakkede tomater').enhet).toBe('boks')
  })

  it('uses stk when there is an amount but no enhet', () => {
    expect(tolkIngredienslinje('2 egg')).toEqual({ mengde: 2, enhet: 'stk', navn: 'egg', merknad: null })
    expect(tolkIngredienslinje('1/2 rødløk')).toEqual({ mengde: 0.5, enhet: 'stk', navn: 'rødløk', merknad: null })
  })

  it('has no amount or enhet when the line has none', () => {
    expect(tolkIngredienslinje('salt og pepper')).toEqual({ mengde: null, enhet: null, navn: 'salt og pepper', merknad: null })
  })

  it('reads "en/ei/et" as 1', () => {
    expect(tolkIngredienslinje('en løk')).toEqual({ mengde: 1, enhet: 'stk', navn: 'løk', merknad: null })
    expect(tolkIngredienslinje('ei klype salt')).toEqual({ mengde: 1, enhet: 'klype', navn: 'salt', merknad: null })
  })

  it('uses 1 when there is an enhet but no amount', () => {
    expect(tolkIngredienslinje('klype salt')).toEqual({ mengde: 1, enhet: 'klype', navn: 'salt', merknad: null })
  })

  it('puts text after the first comma in merknad', () => {
    expect(tolkIngredienslinje('1 løk, finhakket')).toEqual({ mengde: 1, enhet: 'stk', navn: 'løk', merknad: 'finhakket' })
    expect(tolkIngredienslinje('2 fedd hvitløk, presset, eller mer')).toEqual({
      mengde: 2, enhet: 'fedd', navn: 'hvitløk', merknad: 'presset, eller mer',
    })
    expect(tolkIngredienslinje('smør,').merknad).toBeNull()
  })

  it('does not treat words that look like enheter as enheter when nothing follows', () => {
    expect(tolkIngredienslinje('l')).toEqual({ mengde: null, enhet: null, navn: 'l', merknad: null })
    expect(tolkIngredienslinje('pakke').navn).toBe('pakke')
  })

  it('keeps a word that merely starts like an enhet as part of the name', () => {
    expect(tolkIngredienslinje('1 liten løk')).toEqual({ mengde: 1, enhet: 'stk', navn: 'liten løk', merknad: null })
    expect(tolkIngredienslinje('2 gulrøtter')).toEqual({ mengde: 2, enhet: 'stk', navn: 'gulrøtter', merknad: null })
  })

  it('handles an amount and enhet with no name', () => {
    expect(tolkIngredienslinje('2 ss')).toEqual({ mengde: 2, enhet: 'ss', navn: '', merknad: null })
  })

  it('ignores list bullets and extra whitespace from pasted recipes', () => {
    expect(tolkIngredienslinje('  - 2 ss   smør  ')).toEqual({ mengde: 2, enhet: 'ss', navn: 'smør', merknad: null })
    expect(tolkIngredienslinje('• 1 l melk')).toEqual({ mengde: 1, enhet: 'l', navn: 'melk', merknad: null })
  })
})

describe('delIngredienslinjer', () => {
  it('splits pasted text into non-empty lines', () => {
    expect(delIngredienslinjer('2 ss smør\r\n\n  1 l melk  \n')).toEqual(['2 ss smør', '1 l melk'])
  })
})

describe('formatMengde / formatIngrediens', () => {
  it('formats amounts with a decimal comma and at most two decimals', () => {
    expect(formatMengde(2)).toBe('2')
    expect(formatMengde(0.5)).toBe('0,5')
    expect(formatMengde(1 / 3)).toBe('0,33')
  })

  it('builds a line that parses back to the same ingrediens', () => {
    const cases = [
      { mengde: 2, enhet: 'ss', navn: 'Smør', merknad: 'myk' },
      { mengde: 0.5, enhet: 'stk', navn: 'Rødløk', merknad: null },
      { mengde: null, enhet: null, navn: 'Salt og pepper', merknad: null },
      { mengde: 1.5, enhet: 'dl', navn: 'Fløte', merknad: null },
    ] as const
    for (const c of cases) {
      expect(tolkIngredienslinje(formatIngrediens(c))).toEqual(c)
    }
    expect(formatIngrediens(cases[0])).toBe('2 ss Smør, myk')
    expect(formatIngrediens(cases[1])).toBe('0,5 Rødløk')
  })
})

describe('finnButikkvare / foreslåButikkvarer', () => {
  const butikkvarer = [{ navn: 'Smør' }, { navn: 'Smørbrødpålegg' }, { navn: 'Kyllingfilet' }, { navn: 'Peanøttsmør' }, { navn: 'Melk' }]

  it('finds an exact match ignoring case and spaces', () => {
    expect(finnButikkvare('  smør ', butikkvarer)).toEqual({ navn: 'Smør' })
    expect(finnButikkvare('smørr', butikkvarer)).toBeUndefined()
  })

  it('suggests names that start with, are contained in, or contain the text', () => {
    expect(foreslåButikkvarer('smø', butikkvarer).map((b) => b.navn)).toEqual(['Smør', 'Smørbrødpålegg', 'Peanøttsmør'])
    expect(foreslåButikkvarer('kyllingfileter', butikkvarer).map((b) => b.navn)).toEqual(['Kyllingfilet'])
  })

  it('does not suggest the exact match itself or anything for very short text', () => {
    expect(foreslåButikkvarer('melk', butikkvarer)).toEqual([])
    expect(foreslåButikkvarer('m', butikkvarer)).toEqual([])
  })
})

describe('storForbokstav', () => {
  it('capitalises and tidies whitespace', () => {
    expect(storForbokstav('  smør  usaltet ')).toBe('Smør usaltet')
  })
})
