---
sidebar_position: 5
---

# ADR-005: Norwegian Domain Terms in Code

**Date:** 2026-11-27  
**Status:** Accepted

## Decision

Domain terms are written in **Norwegian** in code, exactly as they appear in the app and in [CONTEXT.md](https://github.com/rebeccaals/mealmate/blob/main/CONTEXT.md): `Oppskrift`, `Ukesmeny`, `Måltid`, `Måltidstype.Kvelds`. Technical words stay **English**: `GetOppskrifter()`, `OppskrifterController`, `MåltidDto`. `æ`, `ø`, `å` are allowed in identifiers, but URL routes use ASCII (`/api/maltider`).

The existing English code (`Recipe`, `WeeklyMenu`, `MenuEntry`, …) is renamed in one go before the shopping list is built.

## Reasoning

- One name per concept everywhere — no translating between what the app says and what the code says.
- Matches the convention the primary developer uses at work.
- Renaming is cheapest now: the app isn't deployed and has no real data, so migrations can be recreated instead of written as renames. The weekly menu model is being rebuilt anyway.

## Considered options

- **English in code, Norwegian in UI** (the original setup): rejected — requires a translation table and a constant mental mapping, for no practical gain in a two-person app.
- **Norwegian only in new code**: rejected — mixing `Recipe` and `Måltid` is worse than either convention.

## Consequences

- Git history before 2026-11-27 uses English domain names.
- ASCII-only routes avoid percent-encoded URLs (`/api/m%C3%A5ltider`) in logs and debugging.
