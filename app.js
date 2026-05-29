/* ============================================
   Gear Calculator Logic
   ============================================ */

/* ----------------------------------------------------------------
   Preset catalog. Pure data — NO document references (node-testable).
   Shape: PRESETS[component][set] = [ { group, options:[[label,value]] } ]
   value is a comma-separated teeth string consumed by parseGears().
   "Custom..." is appended by buildPresetOptions(), never stored here.
   ---------------------------------------------------------------- */
const ones = (label, ...teeth) => ({
  group: label,
  options: teeth.map(t => [`${t}t`, String(t)]),
});

// Inclusive descending integer range, e.g. range(60, 23) -> [60,59,...,23].
// Used for the Single set, where ring/cog are independent free choices
// (not products) so a dense contiguous list beats a curated one.
const range = (hi, lo) => Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);

const PRESETS = {
  chainring: {
    modern: [
      { group: 'Road 2x', options: [
        ['53/39', '53, 39'], ['52/36', '52, 36'], ['50/34', '50, 34'],
        ['48/32', '48, 32'], ['46/33', '46, 33'], ['52/39', '52, 39'] ] },
      { group: 'Gravel 2x', options: [
        ['48/31', '48, 31'], ['46/30', '46, 30'], ['43/30', '43, 30'] ] },
      { group: 'MTB 2x', options: [
        ['38/28', '38, 28'], ['36/26', '36, 26'], ['36/22', '36, 22'] ] },
      ones('Road/Gravel 1x', 54, 52, 50, 48, 46, 44, 42, 40, 38),
      ones('MTB 1x', 36, 34, 32, 30, 28),
    ],
    vintage: [
      { group: 'Road 2x', options: [
        ['53/42', '53, 42'], ['52/42', '52, 42'], ['52/39', '52, 39'],
        ['50/40', '50, 40'] ] },
      { group: 'Road Triple', options: [
        ['52/42/30', '52, 42, 30'], ['50/40/30', '50, 40, 30'],
        ['52/40/30', '52, 40, 30'], ['50/39/30', '50, 39, 30'] ] },
      { group: 'Touring Triple', options: [
        ['48/36/26', '48, 36, 26'], ['46/36/26', '46, 36, 26'],
        ['48/38/28', '48, 38, 28'] ] },
      { group: 'MTB Triple', options: [
        ['44/32/22', '44, 32, 22'], ['42/32/22', '42, 32, 22'],
        ['40/30/22', '40, 30, 22'] ] },
    ],
    single: [
      ones('Track / Single / BMX / FGFS', ...range(60, 23)),
    ],
  },
  cassette: {
    modern: [
      { group: 'Road 11-speed', options: [
        ['11-23', '11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23'],
        ['11-25', '11, 12, 13, 14, 15, 16, 17, 19, 21, 23, 25'],
        ['12-25', '12, 13, 14, 15, 16, 17, 18, 19, 21, 23, 25'],
        ['11-28', '11, 12, 13, 14, 15, 17, 19, 21, 23, 25, 28'],
        ['12-30', '12, 13, 14, 15, 16, 17, 19, 21, 24, 27, 30'],
        ['11-30', '11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30'],
        ['11-32', '11, 12, 13, 14, 16, 18, 20, 22, 25, 28, 32'],
        ['11-34', '11, 12, 13, 14, 16, 18, 20, 22, 25, 28, 34'],
        ['11-36', '11, 12, 13, 14, 16, 18, 20, 22, 25, 30, 36'] ] },
      { group: 'Road 12-speed Shimano', options: [
        ['11-28', '11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 24, 28'],
        ['11-30', '11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 27, 30'],
        ['11-32', '11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 28, 32'],
        ['11-34', '11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34'],
        ['11-36', '11, 12, 13, 14, 15, 17, 19, 21, 24, 28, 32, 36'] ] },
      { group: 'Road 12-speed SRAM', options: [
        ['10-26', '10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 26'],
        ['10-28', '10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 28'],
        ['10-30', '10, 11, 12, 13, 14, 15, 16, 17, 19, 22, 25, 30'],
        ['10-33', '10, 11, 12, 13, 14, 15, 17, 19, 21, 24, 28, 33'],
        ['10-36', '10, 11, 12, 13, 14, 16, 18, 21, 24, 28, 32, 36'] ] },
      { group: 'Road 13-speed Campagnolo', options: [
        ['9-29', '9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 22, 25, 29'],
        ['10-34', '10, 11, 12, 13, 14, 15, 16, 17, 19, 22, 25, 29, 34'],
        ['10-39', '10, 11, 12, 13, 14, 15, 17, 19, 22, 25, 29, 34, 39'] ] },
      { group: 'Wide-range 11-speed', options: [
        ['11-40', '11, 13, 15, 17, 19, 21, 24, 27, 31, 35, 40'],
        ['11-42 Shimano', '11, 13, 15, 17, 19, 21, 24, 28, 32, 37, 42'],
        ['10-42 SRAM', '10, 12, 14, 16, 18, 21, 24, 28, 32, 37, 42'],
        ['11-45', '11, 13, 15, 17, 19, 21, 24, 28, 33, 39, 45'],
        ['11-46 Shimano', '11, 13, 15, 17, 19, 22, 25, 28, 32, 37, 46'],
        ['10-46', '10, 12, 14, 16, 18, 21, 24, 28, 33, 39, 46'],
        ['11-50 SunRace', '11, 13, 15, 18, 21, 24, 28, 32, 36, 42, 50'],
        ['11-51 SunRace', '11, 13, 15, 18, 21, 24, 28, 32, 36, 42, 51'] ] },
      { group: 'Gravel 12-speed', options: [
        ['10-42', '10, 11, 13, 15, 17, 19, 21, 24, 28, 32, 36, 42'],
        ['10-44', '10, 11, 13, 15, 17, 19, 22, 25, 28, 32, 36, 44'],
        ['10-46 SRAM XPLR', '10, 11, 13, 15, 17, 20, 23, 26, 30, 34, 40, 46'] ] },
      { group: 'MTB 10-speed', options: [
        ['11-36', '11, 13, 15, 17, 19, 21, 24, 28, 32, 36'],
        ['11-42', '11, 13, 15, 18, 21, 24, 28, 32, 36, 42'],
        ['11-46', '11, 13, 15, 18, 21, 24, 28, 34, 40, 46'] ] },
      { group: 'MTB 11-speed', options: [
        ['11-42 Shimano', '11, 13, 15, 17, 19, 21, 24, 28, 32, 37, 42'],
        ['11-46 Shimano', '11, 13, 15, 17, 19, 21, 24, 28, 32, 37, 46'],
        ['10-42 SRAM NX', '10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42'],
        ['11-40', '11, 13, 15, 17, 19, 21, 24, 28, 32, 36, 40'] ] },
      { group: 'MTB 12-speed SRAM', options: [
        ['10-50 GX/X01/XX1', '10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 50'],
        ['10-52 GX/X01/XX1', '10, 12, 14, 16, 18, 21, 24, 28, 33, 39, 45, 52'] ] },
      { group: 'MTB 12-speed Shimano', options: [
        ['10-51 XT/XTR', '10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 51'],
        ['10-51 Deore', '10, 12, 14, 16, 18, 21, 24, 28, 33, 39, 45, 51'],
        ['10-51 SLX', '10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 45, 51'] ] },
      { group: 'Campagnolo 12-speed', options: [
        ['11-29', '11, 12, 13, 14, 15, 16, 17, 19, 21, 23, 26, 29'],
        ['11-32', '11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 28, 32'],
        ['11-34', '11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34'],
        ['10-27', '10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 27'],
        ['10-29', '10, 11, 12, 13, 14, 15, 16, 17, 19, 22, 25, 29'] ] },
      { group: 'Shimano CUES / LinkGlide', options: [
        ['11-50 (11s)', '11, 13, 15, 17, 19, 22, 25, 28, 33, 39, 50'],
        ['11-45 (11s)', '11, 13, 15, 17, 19, 21, 24, 28, 32, 37, 45'],
        ['11-48 (10s)', '11, 13, 15, 18, 21, 24, 28, 34, 41, 48'],
        ['11-43 (10s)', '11, 13, 15, 18, 21, 24, 28, 32, 37, 43'],
        ['11-46 (9s)', '11, 13, 15, 18, 22, 27, 33, 39, 46'],
        ['11-41 (9s)', '11, 13, 15, 18, 21, 24, 30, 35, 41'] ] },
      { group: 'microSHIFT Advent / Advent X', options: [
        ['Advent 11-46 (9s)', '11, 13, 15, 18, 21, 24, 28, 34, 46'],
        ['Advent 11-48 (9s)', '11, 13, 15, 18, 21, 25, 30, 38, 48'],
        ['Advent X 11-48 (10s)', '11, 13, 15, 18, 21, 25, 29, 35, 41, 48'] ] },
      { group: 'Rotor 1×13', options: [
        ['10-36', '10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 30, 36'],
        ['10-39', '10, 11, 12, 13, 14, 15, 16, 17, 19, 22, 26, 32, 39'],
        ['10-46', '10, 11, 12, 13, 14, 15, 17, 19, 22, 26, 31, 38, 46'],
        ['10-52', '10, 11, 12, 13, 15, 17, 19, 22, 26, 31, 37, 44, 52'] ] },
      { group: 'SRAM Apex 10-speed', options: [
        ['11-28', '11, 12, 13, 14, 15, 17, 19, 22, 25, 28'],
        ['11-32', '11, 12, 13, 15, 17, 19, 22, 25, 28, 32'],
        ['11-36', '11, 12, 14, 16, 18, 21, 24, 28, 32, 36'] ] },
    ],
    vintage: [
      { group: '5-speed', options: [
        ['14-28', '14, 17, 20, 24, 28'], ['14-34', '14, 18, 22, 28, 34'] ] },
      { group: '6-speed', options: [
        ['13-28', '13, 15, 17, 19, 23, 28'], ['14-28', '14, 16, 18, 21, 24, 28'],
        ['14-32', '14, 17, 20, 24, 28, 32'], ['13-30', '13, 15, 18, 21, 25, 30'] ] },
      { group: '7-speed', options: [
        ['13-28', '13, 15, 17, 19, 21, 24, 28'],
        ['14-32', '14, 16, 18, 21, 24, 28, 32'],
        ['13-30', '13, 15, 17, 20, 23, 26, 30'],
        ['11-28', '11, 13, 15, 17, 20, 24, 28'],
        ['11-32', '11, 13, 15, 18, 21, 24, 32'],
        ['12-32', '12, 14, 16, 18, 21, 26, 32'] ] },
      { group: 'Road 8-speed', options: [
        ['12-23', '12, 13, 14, 15, 17, 19, 21, 23'],
        ['11-24', '11, 12, 13, 14, 16, 18, 21, 24'],
        ['11-26', '11, 13, 15, 17, 19, 21, 23, 26'],
        ['12-26', '12, 13, 14, 15, 17, 19, 21, 26'],
        ['11-32', '11, 13, 15, 18, 21, 24, 28, 32'] ] },
      { group: 'Road 9-speed', options: [
        ['11-23', '11, 12, 13, 14, 15, 17, 19, 21, 23'],
        ['12-23', '12, 13, 14, 15, 16, 17, 19, 21, 23'],
        ['11-25', '11, 12, 13, 14, 15, 17, 19, 21, 25'],
        ['12-26', '12, 13, 14, 15, 17, 19, 21, 23, 26'],
        ['11-30', '11, 12, 14, 16, 18, 20, 23, 26, 30'],
        ['12-34', '12, 14, 16, 18, 20, 23, 26, 30, 34'] ] },
      { group: 'Road 10-speed', options: [
        ['11-23', '11, 12, 13, 14, 15, 16, 17, 19, 21, 23'],
        ['11-25', '11, 12, 13, 14, 15, 16, 17, 19, 21, 25'],
        ['12-25', '12, 13, 14, 15, 16, 17, 18, 19, 21, 25'],
        ['11-26', '11, 12, 13, 14, 15, 16, 17, 19, 21, 26'],
        ['11-28', '11, 12, 13, 14, 15, 17, 19, 21, 24, 28'],
        ['12-28', '12, 13, 14, 15, 16, 17, 19, 21, 24, 28'],
        ['12-30', '12, 13, 14, 15, 17, 19, 21, 24, 27, 30'],
        ['11-32', '11, 12, 14, 16, 18, 20, 22, 25, 28, 32'] ] },
      { group: 'MTB 9-speed', options: [
        ['11-34', '11, 13, 15, 17, 20, 23, 26, 30, 34'],
        ['12-36', '12, 14, 16, 18, 21, 24, 28, 32, 36'] ] },
    ],
    single: [
      ones('Single cog', ...range(24, 8)),
    ],
  },
};

// Render a select's options from a PRESETS group list, then append Custom.
function buildPresetOptions(selectEl, groups) {
  selectEl.replaceChildren();
  for (const { group, options } of groups) {
    const og = document.createElement('optgroup');
    og.label = group;
    for (const [label, value] of options) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      og.appendChild(opt);
    }
    selectEl.appendChild(og);
  }
  const other = document.createElement('optgroup');
  other.label = 'Other';
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = 'Custom...';
  other.appendChild(customOpt);
  selectEl.appendChild(other);
}

// Active era ('modern'|'vintage'|'single') for one of a drivetrain's selects.
// suffix is 'a'|'b'; component is 'chainring'|'cassette'. Front (chainring) and
// rear (cassette) eras are independent, so each has its own toggle.
function getEra(suffix, component) {
  const active = document.querySelector(`#era-${component}-${suffix} .toggle-btn.active`);
  return active ? active.dataset.era : 'modern';
}

// Repopulate one select (a drivetrain's chainring OR cassette) for its own
// era, reset to the first option, hide/sync its custom input, recompute.
function applyEra(suffix, component) {
  const era = getEra(suffix, component);
  const sel = document.getElementById(`${component}-preset-${suffix}`);
  buildPresetOptions(sel, PRESETS[component][era]);
  sel.selectedIndex = 0;
  // Custom-input ids are irregular: chainring -> "chainrings-*", cassette -> "cassette-*".
  const customId = component === 'chainring' ? `chainrings-${suffix}` : `cassette-${suffix}`;
  const custom = document.getElementById(customId);
  custom.classList.remove('visible');
  custom.value = sel.value;
  update();
}

// Parse a comma-separated list of cog/chainring teeth counts.
// Only bare positive integers are accepted; any non-integer token
// (including "11-32" range shorthand) is dropped rather than silently
// coerced — parseInt("11-32") would otherwise yield 11.
function parseGears(input) {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(s => /^\d+$/.test(s))
    .map(s => parseInt(s, 10))
    .filter(n => n > 0);
}

// Calculate wheel circumference from BSD (bead seat diameter) and tire width
function calcWheelCircumference(bsdMm, tireWidthMm) {
  const diameterMm = bsdMm + (2 * tireWidthMm);
  return Math.PI * diameterMm;
}

// Calculate gear inches (textbook, crank-independent):
// (chainring / cog) * wheel_diameter_inches
function calcGearInches(chainring, cog, wheelCircumMm) {
  const wheelDiameterInches = (wheelCircumMm / Math.PI) / 25.4;
  return (chainring / cog) * wheelDiameterInches;
}

// Calculate gain ratio (Sheldon Brown): dimensionless, accounts for crank
// length. (wheel_radius / crank_length) * (chainring / cog), same length units.
function calcGainRatio(chainring, cog, wheelCircumMm, crankMm) {
  const wheelRadiusMm = (wheelCircumMm / Math.PI) / 2;
  return (wheelRadiusMm / crankMm) * (chainring / cog);
}

// Calculate speed in mph given gear inches and cadence
function calcSpeedMph(gearInches, cadence) {
  return (gearInches * Math.PI * cadence * 60) / 63360;
}

// Calculate speed in km/h
function calcSpeedKmh(gearInches, cadence) {
  return calcSpeedMph(gearInches, cadence) * 1.60934;
}

// Get all gear combinations for a drivetrain
function getAllGears(chainrings, cassette, wheelCircumMm, crankMm, cadence) {
  const gears = [];
  for (const ring of chainrings) {
    for (const cog of cassette) {
      const gearInches = calcGearInches(ring, cog, wheelCircumMm);
      gears.push({
        chainring: ring,
        cog: cog,
        gearInches: gearInches,
        gainRatio: calcGainRatio(ring, cog, wheelCircumMm, crankMm),
        ratio: ring / cog,
        speedMph: calcSpeedMph(gearInches, cadence),
        speedKmh: calcSpeedKmh(gearInches, cadence)
      });
    }
  }
  return gears.sort((a, b) => a.gearInches - b.gearInches);
}

// Calculate gear range as percentage
function calcRange(gears) {
  if (gears.length < 2) return 0;
  const low = gears[0].gearInches;
  const high = gears[gears.length - 1].gearInches;
  return ((high - low) / low) * 100;
}

// Group gears by chainring, sorted big→small
function groupByChainring(gears) {
  const map = new Map();
  gears.forEach(g => {
    if (!map.has(g.chainring)) map.set(g.chainring, []);
    map.get(g.chainring).push(g);
  });
  // Sort chainrings descending (big ring first)
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([chainring, gears]) => ({ chainring, gears }));
}

// Render the comparison chart — per-chainring rows
function renderChart(gearsA, gearsB) {
  const chart = document.getElementById('chart');
  const axis = document.getElementById('chart-axis');
  chart.innerHTML = '';
  axis.innerHTML = '';

  const allGearInches = [...gearsA, ...gearsB].map(g => g.gearInches);
  const minGear = Math.min(...allGearInches);
  const maxGear = Math.max(...allGearInches);
  const range = maxGear - minGear || 1;

  // Update axis labels
  const steps = window.innerWidth < 600 ? 5 : 10;
  for (let i = 0; i <= steps; i++) {
    const value = minGear + (range * i / steps);
    const span = document.createElement('span');
    span.textContent = Math.round(value);
    axis.appendChild(span);
  }

  const cadence = parseInt(document.getElementById('cadence').value, 10) || 90;
  const groupsA = groupByChainring(gearsA);
  const groupsB = groupByChainring(gearsB);
  function renderRow(group, setClass) {
    const row = document.createElement('div');
    row.className = 'chart-row';

    const label = document.createElement('span');
    label.className = 'chart-row-label';
    label.textContent = group.chainring + 't';
    row.appendChild(label);

    const bars = document.createElement('div');
    bars.className = 'chart-row-bars';

    group.gears.forEach(gear => {
      const bar = document.createElement('div');
      bar.className = 'chart-bar ' + setClass;
      const pos = ((gear.gearInches - minGear) / range) * 100;
      bar.style.left = `${pos}%`;
      bar.title = `${gear.chainring}/${gear.cog} = ${gear.gearInches.toFixed(1)}" @ ${formatSpeed(gear.gearInches, cadence)}`;
      bars.appendChild(bar);
    });

    row.appendChild(bars);
    return row;
  }

  // Drivetrain A rows
  groupsA.forEach(group => {
    chart.appendChild(renderRow(group, 'set-a'));
  });

  // Gap between A and B if both have rows
  if (groupsA.length > 0 && groupsB.length > 0) {
    const gap = document.createElement('div');
    gap.className = 'chart-gap';
    chart.appendChild(gap);
  }

  // Drivetrain B rows
  groupsB.forEach(group => {
    chart.appendChild(renderRow(group, 'set-b'));
  });
}

// Get current speed unit
function getSpeedUnit() {
  const activeBtn = document.querySelector('.toggle-btn[data-unit].active');
  return activeBtn ? activeBtn.dataset.unit : 'kmh';
}

// Format speed with unit
function formatSpeed(gearInches, cadence) {
  const unit = getSpeedUnit();
  if (unit === 'mph') {
    return calcSpeedMph(gearInches, cadence).toFixed(1) + ' mph';
  }
  return calcSpeedKmh(gearInches, cadence).toFixed(1) + ' km/h';
}

// Render gear table with speed
function renderTable(tableId, chainrings, cassette, wheelCircumMm, crankMm, cadence) {
  const table = document.getElementById(tableId);
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  thead.innerHTML = '<tr><th>Cog</th>' +
    chainrings.map(r => `<th>${r}t</th>`).join('') +
    '</tr>';

  tbody.innerHTML = cassette.map(cog => {
    const cells = chainrings.map(ring => {
      const gi = calcGearInches(ring, cog, wheelCircumMm);
      const gr = calcGainRatio(ring, cog, wheelCircumMm, crankMm);
      return `<td>${gi.toFixed(1)}<span class="speed">${formatSpeed(gi, cadence)}</span><span class="gain">gain ${gr.toFixed(2)}</span></td>`;
    });
    return `<tr><td>${cog}t</td>${cells.join('')}</tr>`;
  }).join('');
}

// Handle preset dropdowns
function setupPresetDropdown(presetId, customInputId) {
  const preset = document.getElementById(presetId);
  const customInput = document.getElementById(customInputId);

  function updateVisibility() {
    if (preset.value === 'custom') {
      customInput.classList.add('visible');
      customInput.focus();
    } else {
      customInput.classList.remove('visible');
      customInput.value = preset.value;
    }
    update();
  }

  preset.addEventListener('change', updateVisibility);
  customInput.addEventListener('input', update);

  // Initialize
  updateVisibility();
}

// Update all calculations and displays
function update() {
  // Get chainring values
  const chainringPresetA = document.getElementById('chainring-preset-a');
  const chainringsA = parseGears(
    chainringPresetA.value === 'custom'
      ? document.getElementById('chainrings-a').value
      : chainringPresetA.value
  );

  const chainringPresetB = document.getElementById('chainring-preset-b');
  const chainringsB = parseGears(
    chainringPresetB.value === 'custom'
      ? document.getElementById('chainrings-b').value
      : chainringPresetB.value
  );

  // Get cassette values
  const cassettePresetA = document.getElementById('cassette-preset-a');
  const cassetteA = parseGears(
    cassettePresetA.value === 'custom'
      ? document.getElementById('cassette-a').value
      : cassettePresetA.value
  );

  const cassettePresetB = document.getElementById('cassette-preset-b');
  const cassetteB = parseGears(
    cassettePresetB.value === 'custom'
      ? document.getElementById('cassette-b').value
      : cassettePresetB.value
  );

  // Get wheel/tire
  const wheelA = parseInt(document.getElementById('wheel-a').value, 10);
  const tireA = parseInt(document.getElementById('tire-a').value, 10);
  const wheelCircumA = calcWheelCircumference(wheelA, tireA);

  const wheelB = parseInt(document.getElementById('wheel-b').value, 10);
  const tireB = parseInt(document.getElementById('tire-b').value, 10);
  const wheelCircumB = calcWheelCircumference(wheelB, tireB);

  // Get crank lengths
  const crankA = parseFloat(document.getElementById('crank-a').value) || 170;
  const crankB = parseFloat(document.getElementById('crank-b').value) || 170;

  // Get cadence
  const cadence = parseInt(document.getElementById('cadence').value, 10) || 90;

  // Validate
  if (chainringsA.length === 0 || cassetteA.length === 0 ||
      chainringsB.length === 0 || cassetteB.length === 0) {
    return;
  }

  // Calculate all gears
  const gearsA = getAllGears(chainringsA, cassetteA, wheelCircumA, crankA, cadence);
  const gearsB = getAllGears(chainringsB, cassetteB, wheelCircumB, crankB, cadence);

  // Update stats
  document.getElementById('range-a').textContent = calcRange(gearsA).toFixed(0) + '%';
  document.getElementById('range-b').textContent = calcRange(gearsB).toFixed(0) + '%';
  document.getElementById('low-a').textContent = gearsA[0].gearInches.toFixed(1);
  document.getElementById('low-b').textContent = gearsB[0].gearInches.toFixed(1);
  document.getElementById('high-a').textContent = gearsA[gearsA.length - 1].gearInches.toFixed(1);
  document.getElementById('high-b').textContent = gearsB[gearsB.length - 1].gearInches.toFixed(1);
  document.getElementById('low-gain-a').textContent = gearsA[0].gainRatio.toFixed(2);
  document.getElementById('low-gain-b').textContent = gearsB[0].gainRatio.toFixed(2);
  document.getElementById('high-gain-a').textContent = gearsA[gearsA.length - 1].gainRatio.toFixed(2);
  document.getElementById('high-gain-b').textContent = gearsB[gearsB.length - 1].gainRatio.toFixed(2);

  // Render chart
  renderChart(gearsA, gearsB);

  // Render tables
  renderTable('table-a', chainringsA, cassetteA, wheelCircumA, crankA, cadence);
  renderTable('table-b', chainringsB, cassetteB, wheelCircumB, crankB, cadence);
}

// Populate all four preset selects for their default era (Modern), then
// apply the load defaults so the page opens with the same setup as before.
const LOAD_DEFAULTS = {
  'chainring-preset-a': '50, 34',
  'cassette-preset-a': '11, 12, 13, 14, 16, 18, 20, 22, 25, 28, 32',
  'chainring-preset-b': '40',
  'cassette-preset-b': '10, 12, 14, 16, 18, 21, 24, 28, 33, 39, 45, 52',
};
for (const suffix of ['a', 'b']) {
  buildPresetOptions(document.getElementById(`chainring-preset-${suffix}`), PRESETS.chainring.modern);
  buildPresetOptions(document.getElementById(`cassette-preset-${suffix}`), PRESETS.cassette.modern);
}
for (const [id, value] of Object.entries(LOAD_DEFAULTS)) {
  document.getElementById(id).value = value;
}

// Initialize preset dropdowns (selects are now populated)
setupPresetDropdown('chainring-preset-a', 'chainrings-a');
setupPresetDropdown('chainring-preset-b', 'chainrings-b');
setupPresetDropdown('cassette-preset-a', 'cassette-a');
setupPresetDropdown('cassette-preset-b', 'cassette-b');

// Per-component Era toggle (Modern / Vintage / Single): one for each
// drivetrain's chainring and cassette (4 total). Each is scoped to its own
// container so toggles can't disturb each other or the speed-unit toggle
// (all share the .toggle-btn class).
for (const suffix of ['a', 'b']) {
  for (const component of ['chainring', 'cassette']) {
    const container = document.getElementById(`era-${component}-${suffix}`);
    container.querySelectorAll('.toggle-btn[data-era]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyEra(suffix, component);
      });
    });
  }
}

// Listen for other input changes
document.querySelectorAll('#wheel-a, #wheel-b, #tire-a, #tire-b, #crank-a, #crank-b, #cadence').forEach(input => {
  input.addEventListener('change', update);
  input.addEventListener('input', update);
});

// Speed-unit toggle — scoped to [data-unit] so era toggles are unaffected
document.querySelectorAll('.toggle-btn[data-unit]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn[data-unit]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    update();
  });
});

// Copy Drivetrain A → B
document.getElementById('copy-a-to-b').addEventListener('click', () => {
  // Mirror A's eras first (chainring + cassette independently) so B's option
  // lists match A's sets, then rebuild B's selects.
  for (const component of ['chainring', 'cassette']) {
    const eraA = getEra('a', component);
    document.querySelectorAll(`#era-${component}-b .toggle-btn`).forEach(b => {
      b.classList.toggle('active', b.dataset.era === eraA);
    });
    applyEra('b', component);
  }

  // Mirror the specific selections + custom values (B now has matching options)
  const presetA = document.getElementById('chainring-preset-a');
  document.getElementById('chainring-preset-b').value = presetA.value;
  document.getElementById('chainrings-b').value = document.getElementById('chainrings-a').value;
  document.getElementById('chainrings-b').classList.toggle('visible', presetA.value === 'custom');

  const cassetteA = document.getElementById('cassette-preset-a');
  document.getElementById('cassette-preset-b').value = cassetteA.value;
  document.getElementById('cassette-b').value = document.getElementById('cassette-a').value;
  document.getElementById('cassette-b').classList.toggle('visible', cassetteA.value === 'custom');

  document.getElementById('wheel-b').value = document.getElementById('wheel-a').value;
  document.getElementById('tire-b').value = document.getElementById('tire-a').value;
  document.getElementById('crank-b').value = document.getElementById('crank-a').value;

  update();
});

// Handle window resize for chart axis
window.addEventListener('resize', update);

// Initial render
update();

// Dark mode toggle
const darkToggle = document.getElementById('dark-toggle');
const html = document.documentElement;

// Check for saved preference or system preference
function getPreferredTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Initialize theme
setTheme(getPreferredTheme());

// Toggle on click
darkToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});
