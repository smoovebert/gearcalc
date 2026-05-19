# Design: Era-segmented, data-driven drivetrain presets

Date: 2026-05-19
Status: Approved (pending spec review)

## Problem

Two coupled issues:

1. **Maintainability.** Chainring/cassette `<option>` lists are hardcoded
   inline in `index.html` and duplicated across Drivetrain A and B (~280
   lines). Any preset change must be made in four places.
2. **Coverage + organization.** The preset catalog is missing whole
   drivetrain families (MTB 1x small rings, MTB 2x, mountain/touring triples,
   track/single/BMX/FGFS, single-cog rears, vintage 5/6-speed, MTB/gravel
   11-speed) and has no separation between modern, retro/vintage, and
   single-speed gear. Tire-width coverage also has gaps (narrow track/road
   sizes, cyclocross, BMX/FGFS).

Internal gear hubs are explicitly **out of scope** (deferred to a separate
spec — they need a different calc path, not just data).

## Approach

**Data-driven presets (Approach A, approved).** Move all chainring/cassette
presets into a JS data structure, render `<select>` options dynamically, and
add a per-drivetrain **3-way Era toggle (Modern / Vintage / Single)** that
repopulates that drivetrain's two selects from the chosen set's data. This
removes the existing 4× duplication and makes era filtering a 3-line
operation.

Single-speed is modelled as its own toggle position, not an era, because
track/fixed/BMX/FGFS spans all eras and does not belong under "Modern".

Rejected: tagging optgroups + show/hide (unreliable cross-browser hiding of
`<optgroup>`/`<option>`, worsens duplication); two selects per slot (doubles
elements, still duplicated markup).

Tire-size widths are a **separate, simpler change**: the wheel/tire selects
are not era-filtered, so their `<option>`s stay in HTML — we just add the
missing sizes to `#tire-a` and `#tire-b`.

## Data model (`app.js`, top-of-file, no `document` references)

```
const PRESETS = {
  chainring: { modern: [GROUP, ...], vintage: [GROUP, ...], single: [GROUP, ...] },
  cassette:  { modern: [GROUP, ...], vintage: [GROUP, ...], single: [GROUP, ...] },
};
// GROUP = { group: '<optgroup label>', options: [ ['<label>', '<value>'], ... ] }
// <value> is a comma-separated teeth string consumed by parseGears().
```

`Other → Custom...` is appended by the renderer for every list — it is **not**
stored in `PRESETS`, so it cannot be forgotten in any set.

### Taxonomy

Existing per-group teeth lists are **migrated verbatim** from the current
`index.html`, recategorized per the tables below. New groups are enumerated
explicitly.

**chainring.modern**
| Group | Options |
|---|---|
| Road 2x | 53/39, 52/36, 50/34, 48/32, **46/33**, **52/39** |
| Gravel 2x | 48/31, 46/30, 43/30 |
| MTB 2x *(new)* | 38/28, 36/26, 36/22 |
| Road/Gravel 1x | 54, 52, 50, 48, 46, 44, 42, 40, 38 |
| MTB 1x *(new)* | 36, 34, 32, 30, 28 |

**chainring.vintage**
| Group | Options |
|---|---|
| Road 2x | 53/42, 52/42, 52/39, 50/40 |
| Road Triple *(new)* | 52/42/30, 50/40/30, 52/40/30, 50/39/30 |
| Touring Triple *(new)* | 48/36/26, 46/36/26, 48/38/28 |
| MTB Triple *(new)* | 44/32/22, 42/32/22, 40/30/22 |

**chainring.single** — dense contiguous range, not a curated list, because
single-speed/track/BMX fronts are free independent choices, not products.
| Group | Options |
|---|---|
| Track / Single / BMX / FGFS *(new)* | every integer 60→23t (`range(60,23)`) |

**cassette.modern**: Road 11-speed, Road 12-speed Shimano, Road 12-speed
SRAM, Road 13-speed Campagnolo, Wide-range 11-speed, Gravel 12-speed, MTB
10-speed, **MTB 11-speed *(new)*** (11-42, 11-46, 10-42 NX, 11-40), MTB
12-speed SRAM, MTB 12-speed Shimano.

**cassette.vintage**: **5-speed *(new)*** (14-28, 14-34), **6-speed *(new)***
(13-28, 14-28, 14-32, 13-30), 7-speed, Road 8-speed, Road 9-speed, Road
10-speed, MTB 9-speed.

**cassette.single** — dense contiguous range (same rationale).
| Group | Options |
|---|---|
| Single cog *(new)* | every integer 24→8t (`range(24,8)`), each a single value |

### Tire sizes (`index.html`, `#tire-a` and `#tire-b`, both updated)

- **Road** optgroup: add **18, 19, 21, 22, 24mm**.
- **Gravel / Touring** optgroup: add **33mm** (cyclocross).
- New **BMX / FGFS** optgroup: 20×1.75 → **40mm**, 1.95 → **50mm**,
  2.1 → **53mm**, 2.25 → **57mm**, 2.4 → **60mm**. (Numeric overlap with MTB
  values is intentional — this is a discoverability/labelling group.)

### Judgment calls (flagged for spec review)

- **Road 10-speed → Vintage** (production era ~2008–2015).
- **All 3x → Vintage** (modern bikes are 1x/2x).
- **Single set** holds Track/Single/BMX/FGFS fronts (one combined 23–57t
  group) and one combined Single-cog rear group (8–22t).

## Behavior

- **Era toggle:** per drivetrain (`#era-a`, `#era-b`), three buttons
  (`data-era="modern|vintage|single"`) reusing the existing `.toggle` /
  `.toggle-btn` component, placed in each `.drivetrain-header`. Default
  **Modern** for both. **Verify `.toggle` CSS handles 3 segments** (it is a
  flexbox of buttons; confirm no 2-button assumptions / fixed widths).
- **`buildPresetOptions(selectEl, groups)`**: clears the select, appends one
  `<optgroup>` per group with its `<option value>label`, then appends a final
  `Other` optgroup containing `Custom...`.
- **`applyEra(suffix)`** (`suffix` = `'a'`/`'b'`): read the active era for
  that drivetrain (`'modern'|'vintage'|'single'`), repopulate its chainring
  and cassette selects from `PRESETS.chainring[era]` /
  `PRESETS.cassette[era]`, set each select to its first concrete option,
  hide + sync the custom text input, call `update()`.
- **Init order (replaces current inline-`selected` approach):**
  1. populate all four selects via `buildPresetOptions` at default era Modern;
  2. set load defaults — A: chainring `50/34`, cassette Road-11 `11-32`;
     B: chainring `40t` (1x), cassette MTB-12-SRAM `10-52` (parity with
     today's displayed defaults);
  3. wire `setupPresetDropdown` for each select↔custom pair;
  4. wire era-toggle listeners;
  5. initial `update()`.
- **Copy A→B** also copies era: set B's era to A's, `applyEra('b')` to
  rebuild B's lists, then mirror preset selections and custom values exactly
  as today.
- **Custom input behavior unchanged**: choosing `Custom...` reveals the text
  field; switching era hides it and resets to that set's default.

## Out of scope / unaffected

- Internal gear hubs (separate future spec).
- Gear-inches, gain-ratio, speed, chart, table rendering math — untouched.
- The crank and **wheel** selects — untouched (only `#tire-*` changes).

## Verification (comprehensive — no automated suite exists)

**Automated data-integrity check (node):** `PRESETS` is a standalone literal
with no `document` use, extracted/evaluated in isolation. Assert:

1. All six set arrays
   (`chainring.{modern,vintage,single}`, `cassette.{modern,vintage,single}`)
   are non-empty.
2. For every option, `parseGears(value)` returns a non-empty integer array.
3. Chainring option values parse to 1–3 integers; cassette `modern`/`vintage`
   values parse to ≥2 integers; cassette `single` values parse to exactly 1.
4. No duplicate `label` within any single group.
5. No `Custom`/`custom` strings present in `PRESETS` (renderer-only).

**Manual browser checks:**

1. Load: A shows 50/34 + 11-32, B shows 40t + 10-52 (parity with pre-change).
2. Toggle A → Vintage: chainring → triples, cassette → 5/6/7/8/9/10-speed +
   MTB-9; stats/chart/tables recompute; B unaffected.
3. Toggle A → Single: chainring → Track/Single/BMX/FGFS, cassette → Single
   cog; recompute.
4. Toggle A back → Modern: lists restore; A recomputes.
5. Copy A→B with A on Single: B's toggle flips to Single, B's lists rebuild,
   values mirror A.
6. `Custom...` works under all three sets for both chainring and cassette.
7. Single 23t front + 9t cog on a 20″ (BSD 406) wheel → sane gear inches
   (~ (23/9)×~24" ≈ 61"), confirming small-gear drivetrains compute.
8. `#tire-a`/`#tire-b` show the new 18–24mm, 33mm, and BMX/FGFS options;
   selecting one recomputes wheel circumference.

## Docs

`CLAUDE.md`: add a "Presets data model & Era toggle" subsection under
Architecture — the `PRESETS` shape (3 sets × 2 component types),
`buildPresetOptions`/`applyEra`, per-drivetrain era state, removal of the
inline-option duplication, and the note that `<select>` allows only one
`<optgroup>` level so the 3-way Era toggle substitutes for the missing
nesting. Update the preset/Input-Parsing notes accordingly. Note tire-size
options remain hardcoded in HTML (not era-filtered).

## Notes

Repo initialized 2026-05-19; this work lands on branch
`feature/era-segmented-presets`.
