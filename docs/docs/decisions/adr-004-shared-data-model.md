---
sidebar_position: 4
---

# ADR-004: Shared Data Model

**Date:** 2026-06-06  
**Status:** Accepted

## Decision

All app data (recipes, categories, weekly menus, shopping lists) is **fully shared** between both users. Individual logins exist for identity and attribution, not data isolation.

Shopping items record which user checked them off, and manually added items are attributed to the user who added them.

## Reasoning

The primary use case is two people in the same household coordinating meals and grocery shopping together. Separate data silos would defeat the purpose of the app — the whole point is that both people see the same recipe book and the same shopping list at the store.

User identity is preserved for attribution ("Rebecca added milk") and accountability, but not for access control.

## Implications

- No per-user data filtering needed on API endpoints (beyond authentication)
- Shopping list check-off records `checked_by_id` (foreign key to user) and `checked_at`
- This simplifies the data model significantly compared to a multi-tenant design
