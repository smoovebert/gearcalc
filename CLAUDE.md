# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A bicycle gear calculator and drivetrain comparison tool. Compares two drivetrains (A and B) side-by-side showing gear inches, gear range %, speeds, a visual range chart, and full gear tables. Static HTML/CSS/JS — no build tools, no dependencies, no tests.

## Running & Developing

Open `index.html` directly in a browser, or serve the directory (`python3 -m http.server`) if you need a real origin (e.g. for `localStorage` consistency across reloads). There is no build, lint, or test step — edit a file and refresh.

## File Structure

All files are at the repository root (there is no `webapp/` subdirectory):

- `index.html` — page structure; contains the large hardcoded preset `<optgroup>` lists for chainrings, cassettes, wheels, tires, and crank lengths
- `style.css` — design system + dark mode (`[data-theme="dark"]`)
- `app.js` — all calculation and rendering logic

## Architecture

The entire app is a single reactive loop with **no state object — the DOM is the state**:

- Every input listener (preset dropdowns, custom text inputs, wheel/tire/crank/cadence, unit toggle, copy button, window resize) calls the global `update()` function.
- `update()` re-reads all DOM values, recomputes both drivetrains via `getAllGears()`, and re-renders the stats, chart, and both tables from scratch.
- There is no incremental update or memoization; `update()` is also called once at the end of `app.js` for the initial render.

**Preset + custom input pattern:** Each of the 4 chainring/cassette selectors is a `<select>` paired with a hidden `.input-custom` text field, wired by `setupPresetDropdown()`. Choosing "Custom..." reveals the text field; choosing a preset hides it and copies the preset's value (a comma-separated string) into it. `update()` reads from the select unless its value is `custom`.

**Drivetrain duplication:** All A/B inputs are duplicated in HTML with `-a`/`-b` id suffixes. The "← copy A" button (`copy-a-to-b`) manually mirrors every A input into B, including re-applying the `.visible` class on custom fields.

**Dark mode:** Toggled via `data-theme` on `<html>`, persisted in `localStorage` under `theme`, defaulting to the OS `prefers-color-scheme`.

## Key Calculations (app.js)

- `calcWheelCircumference(bsd, tireWidth)` = `π × (bsd + 2 × tireWidth)` — inputs are BSD (bead seat diameter) and tire width in mm; circumference is derived, not an input
- `calcGearInches(chainring, cog, wheelCircumMm)` = `(chainring / cog) × wheelDiameterInches` where `wheelDiameterInches = (circumference / π) / 25.4`. Textbook gear inches — crank-independent
- `calcGainRatio(chainring, cog, wheelCircumMm, crankMm)` = `(wheelRadiusMm / crankMm) × (chainring / cog)` where `wheelRadiusMm = (circumference / π) / 2`. Sheldon Brown gain ratio — dimensionless; this is where crank length legitimately matters (shorter crank → higher gain ratio for the same gear inches). `getAllGears()` keeps its `crankMm` param solely to feed this
- `calcSpeedMph` = `gearInches × π × cadence × 60 / 63360`; km/h = mph × 1.60934
- `calcRange(gears)` = `((highest − lowest) / lowest) × 100`, on gear-inches-sorted list

## Input Parsing (`parseGears`)

- Comma-separated integers only: `11, 13, 15, 17` → those exact values
- There is **no range shorthand**. Each comma-split token must match `/^\d+$/`; non-integer tokens (including `11-32`) are dropped — not coerced. This `/^\d+$/` guard is deliberate: `parseInt("11-32", 10)` returns `11`, so a looser parse would silently produce a single 11t cog

## Rendering Details

- `renderChart()` positions bars by absolute gear-inches across the combined A+B min/max; rows are grouped per chainring (`groupByChainring`, big ring first) with set classes `set-a` / `set-b`
- Axis uses 5 steps below 600px viewport width, 10 otherwise — `window.resize` triggers a full `update()`
- `renderTable()` builds a cog (rows) × chainring (columns) grid; each cell shows gear inches, then a `.speed` sub-line (active unit), then a `.gain` sub-line (gain ratio)
- Stats grid: desktop places interleaved A/B card markup into explicit columns (A×5, gap, B×5); mobile drops the placement and relies on DOM order in a 2-col grid — so card markup must stay A/B-interleaved

## Design System

- CSS custom properties in `:root` for colors, spacing, typography; 8px base spacing unit
- `--color-a` (black) for Drivetrain A, `--color-b` (red) for Drivetrain B
- Font: Inter
