# Mealmate

A shared recipe book, weekly meal planner and shopping list for a household of two. Domain terms are Norwegian and used identically in the app and in code (e.g. `Oppskrift`, `GetOppskrifter()`); only technical words are English.

## Language

### Oppskrifter

**Oppskrift**:
A saved description of a dish: ingredienser, steps, and the number of portions it makes.
_Avoid_: Rett, matrett

**Kategori**:
A label for grouping oppskrifter, e.g. "Vegetar" or "Hverdagsmiddag". An oppskrift can have several.
_Avoid_: Tag, avdeling

**Ingrediens**:
A butikkvare with an amount and an enhet, as part of an oppskrift, e.g. "2 ss smør". Written as one line of free text and interpreted by the app.
_Avoid_: Råvare

**Enhet**:
One of a fixed set of units (g, kg, ml, dl, l, ts, ss, stk, fedd, pakke, boks, klype). Enheter of the same kind (weight, volume) are converted when summed; different kinds are kept side by side.
_Avoid_: Måleenhet

### Planlegging

**Ukesmeny**:
The plan for one week, Monday to Sunday, made up of måltider.
_Avoid_: Ukesplan, meny, kalender

**Måltidstype**:
One of four fixed kinds of meal: frokost, lunsj, middag, kvelds.
_Avoid_: Måltid (when meaning the type)

**Måltid**:
One day + one måltidstype in an ukesmeny, e.g. "tirsdag middag". Has a number of porsjoner (default 2), zero or more oppskrifter, and an optional notat. All its oppskrifter are scaled to the måltid's porsjoner.
_Avoid_: Rute, slot, entry, menyoppskrift

**Notat**:
Free text on a måltid that needs no oppskrift and adds nothing to the handleliste, e.g. "Rester" or "Spiser ute".
_Avoid_: Kommentar

### Handel

**Butikkvare**:
Something the household buys, without an amount, e.g. "Smør" or "Dopapir". All butikkvarer are shared and used for autocomplete in both oppskrifter and the handleliste.
_Avoid_: Produkt, element, råvare, vareregister

**Avdeling**:
The part of the store a butikkvare is found in, e.g. "Meieri" or "Frukt og grønt". Each butikkvare has exactly one; the handleliste is grouped by avdeling in a household-chosen order.
_Avoid_: Kategori, seksjon, hylle

**Handleliste**:
The single shared list of varer the household needs to buy. There is only one; everything is added to it.
_Avoid_: Innkjøpsliste, ukens handleliste

**Vare**:
A butikkvare on the handleliste with a total amount, e.g. "Smør 250 g + 2 ss". Its amount is the sum of its kilder.
_Avoid_: Listevare, item, ingrediens (on the list)

**Kilde**:
The reason a vare is on the handleliste, with its share of the amount: a måltid, an oppskrift added directly, or a manual entry.
_Avoid_: Opphav, bidrag

**Avkrysset**:
A vare marked as bought. Avkryssede varer are never changed automatically when a måltid changes; a mismatch is shown instead.
_Avoid_: Kjøpt, ferdig
