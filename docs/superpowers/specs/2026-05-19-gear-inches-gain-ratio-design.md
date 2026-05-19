# Design: Correct gear inches, add gain ratio, remove range shorthand

Date: 2026-05-19
Status: Approved (pending spec review)

## Problem

`app.js` has two flagged correctness issues:

1. **Non-standard gear inches.** `calcGearInches` multiplies the textbook
   formula by an arbitrary `crankMm / 170` factor. True gear inches are
   crank-independent, so every number the app displays is off by a
   crank-derived scale factor and cannot be compared to any external
   gear-inches reference.
2. **Misleading range shorthand.** `parseGears` expands `11-32` into every
   integer 11,12,…,32 — a cassette that does not exist on any bike. This
   pollutes the all-gears table and is never what a user wants.

Separately, crank length is a topic users genuinely care about (short cranks
are popular). The fix should keep crank length meaningful — but via the
physically correct **gain ratio** metric, not by corrupting gear inches.

## Design

### 1. Textbook gear inches

`calcGearInches(chainring, cog, wheelCircumMm)` — remove the `crankMm`
parameter and the `× (crankMm / 170)` term:

```
wheelDiameterInches = (wheelCircumMm / π) / 25.4
gearInches          = (chainring / cog) × wheelDiameterInches
```

Cascade: remove `crankMm` from `getAllGears()` and `renderTable()` signatures
and from their call sites in `update()`.

### 2. New `calcGainRatio(chainring, cog, wheelCircumMm, crankMm)`

```
wheelRadiusMm = (wheelCircumMm / π) / 2
gainRatio     = (wheelRadiusMm / crankMm) × (chainring / cog)
```

Dimensionless (length ÷ length). Shorter cranks → higher gain ratio for the
same gear inches, which is the effect users want to explore. `getAllGears()`
adds a `gainRatio` field to each gear object alongside `gearInches`.

### 3. UI — stats + table cells

- Add four stat cards: **Lowest Gain A**, **Lowest Gain B**, **Highest Gain
  A**, **Highest Gain B**, shown to 2 decimals. Gain ratio is monotonic with
  gear inches within a drivetrain, so the gear-inches-sorted list's first and
  last entries give lowest/highest gain.
- `renderTable()` cells gain a third sub-line: gear inches, then the existing
  `speed` span, then a new `gain` span (e.g. `5.82`), mirroring how speed is
  rendered today.
- The chart remains gear-inches-based. The crank `<select>` stays in both
  Drivetrain A and B and now drives gain ratio.

### 4. Remove range shorthand

`parseGears()` drops the `^(\d+)\s*-\s*(\d+)$` branch entirely. Because
`parseInt("11-32", 10)` returns `11` (not `NaN`), naive removal would silently
turn `11-32` into a single 11t cog. To genuinely reject malformed input, the
comma-split path validates each trimmed token with `/^\d+$/` before parsing:

```
input.split(',')
     .map(s => s.trim())
     .filter(s => /^\d+$/.test(s))
     .map(s => parseInt(s, 10))
     .filter(n => n > 0)
```

Update both cassette `<input>` `placeholder` attributes in `index.html` to
drop the `11-32` example (e.g. `e.g. 11, 13, 15, 17...`).

### 5. Docs

Update `CLAUDE.md`:
- **Key Calculations**: corrected crank-free gear-inches formula; add the
  gain-ratio formula.
- **Input Parsing**: remove the range-shorthand description; state that only
  comma-separated integer lists are accepted and non-integer tokens are
  dropped.

## Out of scope

- Speeds and gear-range % are unaffected in formula but their displayed values
  shift because gear inches changes — this is expected and correct.
- Footer formula text in `index.html` is already crank-free; no change.
- Chart rendering logic (still plots gear inches).

## Verification

No automated test suite exists; verification is manual:

1. Open `index.html`.
2. Confirm 50/11 on 700c × 25mm ≈ **120.3"** gear inches (computed:
   `(50/11) × (π×672/π)/25.4`).
3. Change Crank Length on one drivetrain from 170 → 165; confirm its gain
   ratio values rise by a factor of ~`170/165` (~3%) while gear inches are
   unchanged.
4. Type `11-32` into a custom cassette field; confirm it is rejected (no
   gears rendered for that drivetrain) rather than producing an 11t cog.

## Notes

This directory is not a git repository, so the design doc is written but not
committed.
