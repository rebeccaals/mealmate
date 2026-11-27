---
sidebar_position: 6
---

# ADR-006: One Shared Handleliste with Kilder and Automatic Sync

**Date:** 2026-11-27  
**Status:** Accepted

## Decision

There is **one** shared, ongoing handleliste, not one per ukesmeny. Varer are added to it from the ukesmeny, selected days, a single måltid, an oppskrift, or manually.

Each vare records its **kilder** (which måltid, oppskrift or manual entry contributed how much). The vare's amount is the sum of its kilder.

When a måltid changes after being added (porsjoner, oppskrifter added or removed), the handleliste **updates automatically**: its kilder are changed, amounts recalculated, and varer reaching 0 removed. **Avkryssede varer are never changed** automatically; a mismatch is shown instead.

Other clients see changes by polling every 5 seconds while the handleliste is open.

## Reasoning

- The household shops several times a week and adds things from recipes and by hand; separate lists per week would mean choosing a list every time and checking several in the store.
- Kilder make it possible to show per måltid whether it's on the list, avoid doubling when a week is added twice, subtract when something is removed, and explain why a vare is on the list.
- Automatic sync avoids a "remember to update the list" button that would leave the list wrong. Locking avkryssede varer means the list never changes what has already been bought.

## Considered options

- **One handleliste per ukesmeny** (original plan): rejected — doesn't fit adding from days or single oppskrifter.
- **Snapshot per måltid + "add what's missing" button, no subtraction**: rejected — subtraction is impossible once amounts are merged, and a manual button is easy to forget.
- **Real-time sync (SignalR)**: deferred — polling is one line with RTK Query and sufficient for two users.

## Consequences

- The list can change while someone is in the store (only for varer not yet avkrysset). This is surprising unless you know it's deliberate.
- Summing and subtracting needs unit conversion within a kind (g/kg, ml/dl/l); different kinds stay side by side.
