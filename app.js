/* ============================================
   Gear Calculator Logic
   ============================================ */

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
  const activeBtn = document.querySelector('.toggle-btn.active');
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

// Initialize preset dropdowns
setupPresetDropdown('chainring-preset-a', 'chainrings-a');
setupPresetDropdown('chainring-preset-b', 'chainrings-b');
setupPresetDropdown('cassette-preset-a', 'cassette-a');
setupPresetDropdown('cassette-preset-b', 'cassette-b');

// Listen for other input changes
document.querySelectorAll('#wheel-a, #wheel-b, #tire-a, #tire-b, #crank-a, #crank-b, #cadence').forEach(input => {
  input.addEventListener('change', update);
  input.addEventListener('input', update);
});

// Toggle unit buttons
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    update();
  });
});

// Copy Drivetrain A → B
document.getElementById('copy-a-to-b').addEventListener('click', () => {
  const presetA = document.getElementById('chainring-preset-a');
  const presetB = document.getElementById('chainring-preset-b');
  presetB.value = presetA.value;
  document.getElementById('chainrings-b').value = document.getElementById('chainrings-a').value;
  if (presetA.value === 'custom') {
    document.getElementById('chainrings-b').classList.add('visible');
  } else {
    document.getElementById('chainrings-b').classList.remove('visible');
  }

  const cassetteA = document.getElementById('cassette-preset-a');
  const cassetteB = document.getElementById('cassette-preset-b');
  cassetteB.value = cassetteA.value;
  document.getElementById('cassette-b').value = document.getElementById('cassette-a').value;
  if (cassetteA.value === 'custom') {
    document.getElementById('cassette-b').classList.add('visible');
  } else {
    document.getElementById('cassette-b').classList.remove('visible');
  }

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
