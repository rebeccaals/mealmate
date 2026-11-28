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
  id, rekkefølge
  butikkvareId → Butikkvare
  mengde?, enhet? (g|kg|ml|dl|l|ts|ss|stk|fedd|pakke|boks|klype — both set or both null)
  merknad? (max 200)
  oppskriftId → Oppskrift

Butikkvare
  id, navn (unique ignoring case), avdeling (FruktOgGrønt|Brød|KjøttOgFisk|Meieri|Tørrvarer|Frys|Drikke|Husholdning|Annet)

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

- **Step 10:** one shared `Handleliste` with `Vare` and `Kilde` — see [ADR-006](../decisions/adr-006-one-shared-handleliste.md).
