---
sidebar_position: 2
---

# Data Model

Domain terms are Norwegian — see `CONTEXT.md` at the repo root for definitions and [ADR-005](../decisions/adr-005-norwegian-domain-terms.md) for why.

## Entity overview (current)

```
AppUser
  id, email, displayName

Oppskrift
  id, tittel, beskrivelse, porsjoner
  forberedelsestidMinutter?, tilberedningstidMinutter?
  steg[]
  opprettet, opprettetAvId → AppUser
  ingredienser[] → Ingrediens
  kategorier[] ↔ Kategori (many-to-many, join table KategoriOppskrift)

Ingrediens
  id, navn, mengde, enhet
  oppskriftId → Oppskrift

Kategori
  id, navn
  oppskrifter[] ↔ Oppskrift

Ukesmeny
  id, ukestart (Monday's date)
  måltider[] → Måltid

Måltid
  id, dag (DayOfWeek), måltidstype (Frokost|Lunsj|Middag|Kvelds)
  porsjoner (default 2), notat? (max 200)
  ukesmenyId → Ukesmeny            unique (ukesmenyId, dag, måltidstype)
  oppskrifter[] ↔ Oppskrift (many-to-many, join table MåltidOppskrift)
```

## Planned changes

- **Step 9:** `Butikkvare` (navn, avdeling); `Ingrediens` points to a butikkvare and uses a fixed `Enhet`.
- **Step 10:** one shared `Handleliste` with `Vare` and `Kilde` — see [ADR-006](../decisions/adr-006-one-shared-handleliste.md).
