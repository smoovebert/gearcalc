# Decoupled front/rear Era selectors + 12-32 7-speed cassette

**Date:** 2026-05-28
**Status:** Approved (design)
**Scope:** `index.html`, `app.js`, `style.css`, `CLAUDE.md`

## Problem

1. A user installed a **12-32 7-speed** cassette and could not find it. Two causes:
   - 7-speed cassettes exist only under the **Vintage** Era set; the default **Modern** view has no 7-speed group, so the option appeared absent.
   - Even under Vintage, there was no `12-32` 7-speed preset.
2. The Era toggle is **per-drivetrain**: a single 3-way toggle (`#era-a`/`#era-b`) controls *both* the chainring and cassette selects at once. A user cannot mix, e.g., a Modern chainring with a Vintage cassette — which is exactly the real-world case above (modern crank, 7-speed rear).

## Goal

Make **Modern/Vintage/Single selectable independently for the front (chainring) and rear (cassette)** of each drivetrain, and add the missing 12-32 7-speed cassette preset.

## Key insight

The data model already supports this: `PRESETS.chainring[era]` and `PRESETS.cassette[era]` are independent lookups. The only coupling is the UI — one toggle whose handler calls `applyEra(suffix)`, which rebuilds *both* selects from one era. Decoupling is therefore a UI + wiring change, not a data-model change.

Decoupling also removes the need to duplicate 7-speed into a "Modern" group (an option that was considered and rejected): the user sets the **rear** era to Vintage independently while leaving the front on Modern.

## Changes

### 1. Data — `app.js` `PRESETS.cassette.vintage` 7-speed group

Add one option to the existing 7-speed group (currently `app.js:142-147`):

```js
['12-32 (7s)', '12, 14, 16, 18, 21, 26, 32'],
```

Cog teeth confirmed by the user (standard Shimano HG41-style 7-speed 12-32 spacing).

### 2. HTML — `index.html`

Replace the **single** drivetrain-level era toggle per side with **two per side**, one inside each preset's `.input-group`, placed between the `<label>` and the preset `<select>`:

- Remove `#era-a` (lines ~42-46) and `#era-b` (lines ~149-152) from the drivetrain headers. Headers keep only the title + color indicator.
- Add, for each drivetrain `{a,b}` and component `{chainring,cassette}`, a toggle:
  - ids: `#era-chainring-a`, `#era-cassette-a`, `#era-chainring-b`, `#era-cassette-b`
  - markup identical to today's 3-button segmented toggle (`data-era="modern|vintage|single"`, `modern` active by default), class `toggle era-toggle`.

### 3. JS — `app.js`

Generalize era from per-drivetrain to per-component:

- `getEra(suffix)` → **`getEra(suffix, component)`**, reading `#era-${component}-${suffix} .toggle-btn.active`; defaults to `'modern'`.
- `applyEra(suffix)` (rebuilds both selects) → **`applyEra(suffix, component)`**, which rebuilds **only** that one select (`PRESETS[component][era]`) and calls `update()`.
- Toggle wiring (currently lines ~538-545): iterate all **4** containers; each click sets its own active button (scoped to its container) and calls `applyEra(suffix, component)`. Preserves the existing "scope by container / `[data-era]`" pattern so the speed-unit toggle is unaffected.
- Initial population + `LOAD_DEFAULTS` (lines ~516-529): populate each of the 4 selects from its own era; all default to **Modern** (unchanged behavior).
- **`copy-A-to-B`** (lines ~565-571): mirror **both** eras (chainring + cassette) A→B, rebuild both B selects via `applyEra('b', component)`, then mirror the specific selections and `.visible` custom-field state — instead of mirroring one era.

### 4. CSS — `style.css`

Reuse the existing `.toggle.era-toggle` styles. Add a compact size modifier only if four toggles prove visually heavy in the live layout (decision made by eyeballing the rendered page).

### 5. Docs — `CLAUDE.md`

Update the "Presets data model & Era toggle" and "Toggle class is shared" sections: the Era toggle is now **per-component** (`#era-chainring-*`/`#era-cassette-*`), not per-drivetrain; `getEra`/`applyEra` take a `component` argument; there are 4 era containers to scope.

## Data flow / error handling / testing

- **Data flow:** unchanged — every toggle click still terminates in the single `update()` reactive re-render.
- **Error handling:** unchanged — `parseGears` keeps its `/^\d+$/` per-token integer guard.
- **Node-testability:** `PRESETS` remains free of `document` references.
- **Manual verification:** (a) each of the 4 toggles flips only its own select; (b) a Modern chainring + Vintage cassette combination is selectable and the new `12-32 (7s)` appears; (c) `copy-A-to-B` mirrors both eras and selections; (d) Custom… field round-trips for each select.

## Out of scope

- No change to wheel/tire option lists (remain hardcoded, not era-filtered).
- No new Modern 7-speed group (rejected in favor of independent rear era).
- No range-shorthand parsing.
