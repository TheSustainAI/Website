/* =========================================
   SustainAI Local Hub — Demo Dashboard JS
   Rebuild: All features, no external libs.
   ========================================= */

(function () {
  'use strict';

  // ============ UTILITY ============
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.round(rand(min, max));
  }

  // ============ DOM REFS ============
  const sidebar = document.getElementById('sidebar');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const hamburgerBtn = document.getElementById('hamburgerBtn');

  const sidebarLinks = document.querySelectorAll('.nav-link[data-tab]');
  const drawerLinks = document.querySelectorAll('.drawer-link[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');

  const alertsValue = document.getElementById('alertsValue');
  const alertsSub = document.getElementById('alertsSub');
  const alertsKpi = document.getElementById('alertsKpi');
  const mlBadge = document.getElementById('mlBadge');
  const mlConfidence = document.getElementById('mlConfidence');
  const chatLog = document.getElementById('chatLog');
  const recommendedActions = document.getElementById('recommendedActions');
  const actionsRow = document.getElementById('actionsRow');
  const valveShutoffBtn = document.getElementById('valveShutoffBtn');
  const acknowledgeBtn = document.getElementById('acknowledgeBtn');
  const systemClock = document.getElementById('systemClock');
  const mobileClock = document.getElementById('mobileClock');
  const weatherTemp = document.getElementById('weatherTemp');
  const weatherWind = document.getElementById('weatherWind');
  const weatherHumidity = document.getElementById('weatherHumidity');
  const weatherDesc = document.getElementById('weatherDesc');
  const weatherFooter = document.getElementById('weatherFooter');
  const eventTimeline = document.getElementById('eventTimeline');
  const timelineSteps = document.getElementById('timelineSteps');
  const toastContainer = document.getElementById('toastContainer');

  const scenario1Btn = document.getElementById('scenario1Btn');
  const scenario2Btn = document.getElementById('scenario2Btn');
  const scenario3Btn = document.getElementById('scenario3Btn');
  const scenarioResetBtn = document.getElementById('scenarioResetBtn');

  const aiChatInput = document.getElementById('aiChatInput');
  const aiChatSend = document.getElementById('aiChatSend');

  const hwOnlineCount = document.getElementById('hwOnlineCount');
  const hwOnlinePct = document.getElementById('hwOnlinePct');
  const hw2ABadge = document.getElementById('hw2ABadge');
  const hw2ABat = document.getElementById('hw2ABat');
  const hw2APing = document.getElementById('hw2APing');
  const hw2ACard = document.getElementById('hw-2A');
  const hw4CCard = document.getElementById('hw-4C');

  const conductivityChart = document.getElementById('conductivityChart');
  const kgCanvas = document.getElementById('kgCanvas');
  const fieldMapSvg = document.getElementById('fieldMapSvg');
  const particleCanvas = document.getElementById('particleCanvas');

  // ============ STATE ============
  let scenarioActive = false;
  let sensorInterval = null;
  let simClockSeconds = 4 * 3600 + 30 * 60; // 04:30:00

  // Sensor state
  const sensorState = {
    conductivity: 840,
    moisture: 28,
    flow: 120,
    temp: 68,
    ph: 7.2
  };

  const sensorConfig = {
    conductivity: { base: 840, variance: 12, decimals: 0 },
    moisture: { base: 28, variance: 1.5, decimals: 0 },
    flow: { base: 120, variance: 4, decimals: 0 },
    temp: { base: 68, variance: 0.8, decimals: 0 },
    ph: { base: 7.2, variance: 0.08, decimals: 1 }
  };

  // Conductivity history for line chart (60 points)
  const conductivityHistory = [];
  for (let i = 0; i < 60; i++) {
    conductivityHistory.push(840 + (Math.random() - 0.5) * 24);
  }

  // ============ TAB NAVIGATION ============
  function switchTab(tabId) {
    sidebarLinks.forEach(l => l.classList.toggle('active', l.dataset.tab === tabId));
    drawerLinks.forEach(l => l.classList.toggle('active', l.dataset.tab === tabId));
    tabPanels.forEach(p => {
      const isTarget = p.id === 'tab-' + tabId;
      if (isTarget) {
        p.classList.add('active');
        p.style.animation = 'none';
        p.offsetHeight;
        p.style.animation = '';
      } else {
        p.classList.remove('active');
      }
    });

    // Start KG animation when logs tab is activated
    if (tabId === 'logs') {
      setTimeout(initKnowledgeGraph, 100);
    }
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });

  drawerLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchTab(link.dataset.tab);
      closeDrawer();
    });
  });

  // ============ MOBILE DRAWER ============
  function openDrawer() {
    hamburgerBtn.classList.add('open');
    mobileDrawer.classList.add('open');
  }

  function closeDrawer() {
    hamburgerBtn.classList.remove('open');
    mobileDrawer.classList.remove('open');
  }

  hamburgerBtn.addEventListener('click', () => {
    mobileDrawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });

  document.addEventListener('click', e => {
    if (mobileDrawer.classList.contains('open') &&
      !mobileDrawer.contains(e.target) &&
      !hamburgerBtn.contains(e.target)) {
      closeDrawer();
    }
  });

  // ============ SYSTEM CLOCK ============
  function updateClock() {
    simClockSeconds++;
    const h = Math.floor(simClockSeconds / 3600) % 24;
    const m = Math.floor((simClockSeconds % 3600) / 60);
    const s = simClockSeconds % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    const displayFull = `${String(h12).padStart(2,'0')}:${mm}:${ss} ${ampm}`;
    const displayShort = `${String(h12).padStart(2,'0')}:${mm}:${ss}`;
    if (systemClock) systemClock.textContent = displayFull;
    if (mobileClock) mobileClock.textContent = displayShort;
  }

  setInterval(updateClock, 1000);

  // ============ DATA THROUGHPUT ============
  const throughputUp = document.getElementById('throughputUp');
  const throughputDown = document.getElementById('throughputDown');

  function updateThroughput() {
    const up = (rand(1.8, 3.2)).toFixed(1);
    const down = (rand(0.5, 1.2)).toFixed(1);
    if (throughputUp) throughputUp.textContent = `↑ ${up} KB/s`;
    if (throughputDown) throughputDown.textContent = `↓ ${down} KB/s`;
  }

  setInterval(updateThroughput, 3000);

  // ============ WEATHER FLUCTUATION ============
  let baseTemp = 68;

  function updateWeather() {
    baseTemp += (Math.random() - 0.5) * 0.5;
    baseTemp = Math.max(66, Math.min(70, baseTemp));
    const t = Math.round(baseTemp);
    if (weatherTemp) weatherTemp.textContent = `${t}°F`;
    if (weatherWind) {
      const w = Math.round(rand(6, 10));
      weatherWind.textContent = `${w} mph NW`;
    }
    if (weatherHumidity) {
      const h = Math.round(rand(53, 58));
      weatherHumidity.textContent = `${h}% Humidity`;
    }
  }

  setInterval(updateWeather, 5000);

  // ============ NUMBER TRANSITION (animate count) ============
  function animateNumber(el, fromVal, toVal, decimals, duration) {
    const start = performance.now();
    const diff = toVal - fromVal;

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const current = fromVal + diff * eased;
      el.textContent = current.toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ============ SENSOR FLUCTUATION ============
  function fluctuateSensors() {
    if (scenarioActive) return;

    Object.keys(sensorConfig).forEach(key => {
      const cfg = sensorConfig[key];
      const el = document.getElementById('val-' + key);
      if (!el) return;

      const prev = sensorState[key];
      const newVal = cfg.base + (Math.random() - 0.5) * 2 * cfg.variance;
      sensorState[key] = newVal;

      animateNumber(el, prev, newVal, cfg.decimals, 600);

      // Update trend arrows
      const trendEl = document.getElementById('trend-' + key);
      if (trendEl) {
        const diff = newVal - prev;
        if (key === 'conductivity') {
          conductivityHistory.push(newVal);
          if (conductivityHistory.length > 60) conductivityHistory.shift();
        }
        if (Math.abs(diff) < cfg.variance * 0.3) {
          trendEl.textContent = '—';
          trendEl.className = 'sensor-trend neutral';
        } else if (diff > 0) {
          trendEl.textContent = '↑';
          trendEl.className = 'sensor-trend up';
        } else {
          trendEl.textContent = '↓';
          trendEl.className = 'sensor-trend down';
        }
      }
    });
  }

  sensorInterval = setInterval(fluctuateSensors, 2000);

  // ============ CANVAS LINE CHART ============
  let chartSpikeActive = false;

  function resizeChart() {
    if (!conductivityChart) return;
    const wrap = conductivityChart.parentElement;
    conductivityChart.width = wrap.clientWidth * window.devicePixelRatio;
    conductivityChart.height = wrap.clientHeight * window.devicePixelRatio;
    conductivityChart.style.width = wrap.clientWidth + 'px';
    conductivityChart.style.height = wrap.clientHeight + 'px';
  }

  function drawLineChart() {
    if (!conductivityChart) return;
    const ctx = conductivityChart.getContext('2d');
    const W = conductivityChart.width;
    const H = conductivityChart.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, W, H);

    // Chart margins (in CSS pixels, then scale)
    const ml = 48 * dpr, mr = 16 * dpr, mt = 14 * dpr, mb = 28 * dpr;
    const cw = W - ml - mr;
    const ch = H - mt - mb;

    const yMin = 600, yMax = 1200;

    function toX(i) { return ml + (i / (conductivityHistory.length - 1)) * cw; }
    function toY(v) { return mt + ch - ((v - yMin) / (yMax - yMin)) * ch; }

    // Background grid
    ctx.strokeStyle = `rgba(0,0,0,0.05)`;
    ctx.lineWidth = dpr;
    const gridSteps = [600, 700, 800, 900, 1000, 1100, 1200];
    gridSteps.forEach(v => {
      const y = toY(v);
      ctx.beginPath();
      ctx.moveTo(ml, y);
      ctx.lineTo(ml + cw, y);
      ctx.stroke();
    });

    // Y-axis labels
    ctx.fillStyle = '#779c80';
    ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    gridSteps.forEach(v => {
      const y = toY(v);
      ctx.fillText(v, ml - 5 * dpr, y + 3 * dpr);
    });

    // Threshold line at 900
    const threshY = toY(900);
    ctx.strokeStyle = 'rgba(200,50,50,0.5)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(ml, threshY);
    ctx.lineTo(ml + cw, threshY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Threshold label
    ctx.fillStyle = 'rgba(200,50,50,0.7)';
    ctx.font = `${9 * dpr}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('900 threshold', ml + 4 * dpr, threshY - 4 * dpr);

    // Red zone above threshold (only when spike)
    if (chartSpikeActive) {
      const maxV = Math.max(...conductivityHistory);
      const maxY = toY(maxV);
      ctx.fillStyle = 'rgba(200,50,50,0.08)';
      ctx.fillRect(ml, maxY, cw, threshY - maxY);
    }

    // Determine line color
    const latestVal = conductivityHistory[conductivityHistory.length - 1];
    const lineColor = chartSpikeActive || latestVal > 900 ? '#c83232' : '#4db866';

    // Line fill gradient
    const grad = ctx.createLinearGradient(0, mt, 0, mt + ch);
    grad.addColorStop(0, chartSpikeActive ? 'rgba(200,50,50,0.18)' : 'rgba(77,184,102,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    // Draw fill
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(conductivityHistory[0]));
    for (let i = 1; i < conductivityHistory.length; i++) {
      const x0 = toX(i - 1), y0 = toY(conductivityHistory[i - 1]);
      const x1 = toX(i), y1 = toY(conductivityHistory[i]);
      const cpx = (x0 + x1) / 2;
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
    }
    ctx.lineTo(toX(conductivityHistory.length - 1), mt + ch);
    ctx.lineTo(ml, mt + ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineJoin = 'round';
    ctx.moveTo(toX(0), toY(conductivityHistory[0]));
    for (let i = 1; i < conductivityHistory.length; i++) {
      const x0 = toX(i - 1), y0 = toY(conductivityHistory[i - 1]);
      const x1 = toX(i), y1 = toY(conductivityHistory[i]);
      const cpx = (x0 + x1) / 2;
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
    }
    ctx.stroke();

    // Endpoint dot
    const lastX = toX(conductivityHistory.length - 1);
    const lastY = toY(latestVal);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();

    // X-axis time labels (every ~12 points)
    ctx.fillStyle = '#779c80';
    ctx.font = `${8 * dpr}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    const labelInterval = 12;
    let minuteOffset = -conductivityHistory.length * 2;
    for (let i = 0; i < conductivityHistory.length; i += labelInterval) {
      const x = toX(i);
      const totalMins = simClockSeconds / 60 + minuteOffset + i * 2 / 60;
      const h12 = Math.floor(totalMins / 60) % 12 || 12;
      const mins = Math.floor(totalMins % 60);
      const label = `${String(h12).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
      ctx.fillText(label, x, mt + ch + 16 * dpr);
    }
  }

  resizeChart();
  window.addEventListener('resize', () => {
    resizeChart();
    drawLineChart();
  });

  // Chart animation loop
  let lastChartDraw = 0;
  function chartLoop(ts) {
    if (ts - lastChartDraw > 500) {
      drawLineChart();
      lastChartDraw = ts;
    }
    requestAnimationFrame(chartLoop);
  }
  requestAnimationFrame(chartLoop);

  // Push new chart data every 2s
  setInterval(() => {
    if (!scenarioActive) {
      const prev = conductivityHistory[conductivityHistory.length - 1];
      const newVal = Math.max(600, Math.min(1200, prev + (Math.random() - 0.5) * 20));
      conductivityHistory.push(newVal);
      if (conductivityHistory.length > 60) conductivityHistory.shift();
      sensorState.conductivity = newVal;
    }
  }, 2000);

  // ============ KNOWLEDGE GRAPH ============
  let kgAnimFrame = null;

  const kgNodes = [
    { id: 0, label: 'SustainAI Hub', sub: '', color: '#4db866', size: 22, x: 0.5, y: 0.5 },
    { id: 1, label: 'County Advisories', sub: '(23)', color: '#6b8cff', size: 16, x: 0.18, y: 0.22 },
    { id: 2, label: 'Soil Reports', sub: '(412)', color: '#f5a623', size: 16, x: 0.82, y: 0.22 },
    { id: 3, label: 'Weather Data', sub: '(1,847)', color: '#4a9cd6', size: 18, x: 0.15, y: 0.72 },
    { id: 4, label: 'Sensor History', sub: '(2,845)', color: '#e85454', size: 18, x: 0.85, y: 0.72 },
    { id: 5, label: 'USDA Database', sub: '(127)', color: '#8bc34a', size: 14, x: 0.38, y: 0.12 },
    { id: 6, label: 'Compliance\nTemplates', sub: '(43)', color: '#e91e8c', size: 14, x: 0.62, y: 0.12 }
  ];

  // Floating offsets for breathing animation
  const kgOffsets = kgNodes.map(() => ({
    t: Math.random() * Math.PI * 2,
    dx: 0, dy: 0
  }));

  // Traveling dots on edges
  const kgDots = kgNodes.slice(1).map((_, i) => ({
    edgeIdx: i,
    progress: Math.random(),
    speed: rand(0.003, 0.007),
    alpha: rand(0.5, 1)
  }));

  let kgTooltip = null;

  function initKnowledgeGraph() {
    if (!kgCanvas) return;
    const wrap = kgCanvas.parentElement;
    kgCanvas.width = wrap.clientWidth * window.devicePixelRatio;
    kgCanvas.height = wrap.clientHeight * window.devicePixelRatio;
    kgCanvas.style.width = wrap.clientWidth + 'px';
    kgCanvas.style.height = wrap.clientHeight + 'px';

    kgCanvas.addEventListener('mousemove', handleKGHover);
    kgCanvas.addEventListener('mouseleave', () => { kgTooltip = null; });

    if (kgAnimFrame) cancelAnimationFrame(kgAnimFrame);
    animateKG();
  }

  function getNodePos(node, W, H) {
    const dpr = window.devicePixelRatio || 1;
    const off = kgOffsets[node.id];
    return {
      x: node.x * W + off.dx,
      y: node.y * H + off.dy
    };
  }

  function handleKGHover(e) {
    const rect = kgCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;
    const W = kgCanvas.width, H = kgCanvas.height;

    kgTooltip = null;
    kgNodes.forEach(node => {
      const p = getNodePos(node, W, H);
      const r = node.size * dpr;
      if (Math.hypot(mx - p.x, my - p.y) < r + 4 * dpr) {
        kgTooltip = { node, x: p.x, y: p.y };
      }
    });
  }

  function animateKG() {
    if (!kgCanvas) return;
    const ctx = kgCanvas.getContext('2d');
    const W = kgCanvas.width, H = kgCanvas.height;
    const dpr = window.devicePixelRatio || 1;

    // Breathing
    kgOffsets.forEach((off, i) => {
      off.t += 0.012;
      off.dx = Math.sin(off.t) * 6 * dpr;
      off.dy = Math.cos(off.t * 0.7) * 4 * dpr;
    });

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0c1f12';
    ctx.fillRect(0, 0, W, H);

    // Subtle star-field
    ctx.fillStyle = 'rgba(77,184,102,0.12)';
    for (let i = 0; i < 60; i++) {
      const bx = ((i * 137 + 11) % 100) / 100 * W;
      const by = ((i * 97 + 23) % 100) / 100 * H;
      ctx.beginPath();
      ctx.arc(bx, by, 1 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    const hub = getNodePos(kgNodes[0], W, H);

    // Draw edges
    kgNodes.slice(1).forEach(node => {
      const p = getNodePos(node, W, H);
      const grad = ctx.createLinearGradient(hub.x, hub.y, p.x, p.y);
      grad.addColorStop(0, 'rgba(77,184,102,0.5)');
      grad.addColorStop(1, 'rgba(77,184,102,0.1)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });

    // Traveling dots
    kgDots.forEach(dot => {
      dot.progress += dot.speed;
      if (dot.progress > 1) dot.progress = 0;

      const targetNode = kgNodes[dot.edgeIdx + 1];
      const p = getNodePos(targetNode, W, H);
      const tx = hub.x + (p.x - hub.x) * dot.progress;
      const ty = hub.y + (p.y - hub.y) * dot.progress;

      ctx.beginPath();
      ctx.arc(tx, ty, 3 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77,184,102,${dot.alpha})`;
      ctx.fill();
    });

    // Draw nodes
    kgNodes.forEach(node => {
      const p = getNodePos(node, W, H);
      const r = node.size * dpr;

      // Glow
      const glow = ctx.createRadialGradient(p.x, p.y, r * 0.2, p.x, p.y, r * 2);
      glow.addColorStop(0, node.color + '33');
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = node.color + 'cc';
      ctx.fill();

      // Border
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Label
      ctx.font = `${600} ${10 * dpr}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';

      const lines = node.label.split('\n');
      const lineH = 12 * dpr;
      const totalH = lines.length * lineH;
      lines.forEach((line, li) => {
        ctx.fillText(line, p.x, p.y + r + lineH + li * lineH - totalH / 2 + 6 * dpr);
      });

      if (node.sub) {
        ctx.font = `${8 * dpr}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = node.color;
        ctx.fillText(node.sub, p.x, p.y + r + lineH * (lines.length + 1) - totalH / 2 + 6 * dpr);
      }
    });

    // Tooltip
    if (kgTooltip) {
      const { node, x, y } = kgTooltip;
      const label = node.label.replace('\n', ' ');
      const tw = ctx.measureText(label).width + 24 * dpr;
      const th = 32 * dpr;
      const tx = Math.min(x, W - tw - 8 * dpr);
      const ty = y - node.size * dpr - th - 8 * dpr;

      ctx.fillStyle = 'rgba(12,31,18,0.95)';
      roundRect(ctx, tx, ty, tw, th, 6 * dpr);
      ctx.fill();

      ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'left';
      ctx.fillStyle = node.color;
      ctx.fillText(label, tx + 10 * dpr, ty + 14 * dpr);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `${9 * dpr}px 'JetBrains Mono', monospace`;
      ctx.fillText(node.sub, tx + 10 * dpr, ty + 25 * dpr);
    }

    kgAnimFrame = requestAnimationFrame(animateKG);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ============ FIELD MAP TOOLTIPS ============
  const mapTooltip = document.getElementById('mapTooltip');
  const mapTooltipBg = document.getElementById('mapTooltipBg');
  const mapTooltipName = document.getElementById('mapTooltipName');
  const mapTooltipValue = document.getElementById('mapTooltipValue');

  if (fieldMapSvg) {
    const sensors = fieldMapSvg.querySelectorAll('.map-sensor');
    sensors.forEach(s => {
      s.style.cursor = 'pointer';

      s.addEventListener('mouseenter', e => {
        const name = s.getAttribute('data-name');
        const value = s.getAttribute('data-value');
        const transform = s.getAttribute('transform');
        const match = transform.match(/translate\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\)/);
        if (!match) return;

        let tx = parseFloat(match[1]) + 16;
        let ty = parseFloat(match[2]) - 50;
        if (tx + 190 > 700) tx = parseFloat(match[1]) - 190;
        if (ty < 10) ty = parseFloat(match[2]) + 18;

        mapTooltipBg.setAttribute('x', tx);
        mapTooltipBg.setAttribute('y', ty);
        mapTooltipBg.setAttribute('width', 190);
        mapTooltipName.setAttribute('x', tx + 10);
        mapTooltipName.setAttribute('y', ty + 16);
        mapTooltipName.textContent = name;
        mapTooltipValue.setAttribute('x', tx + 10);
        mapTooltipValue.setAttribute('y', ty + 32);
        mapTooltipValue.textContent = value;
        mapTooltip.style.display = 'block';
        mapTooltip.setAttribute('transform', '');
      });

      s.addEventListener('mouseleave', () => {
        mapTooltip.style.display = 'none';
      });
    });
  }

  // ============ AMBIENT PARTICLES ============
  const particles = [];
  const NUM_PARTICLES = 18;

  function initParticles() {
    if (!particleCanvas) return;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: rand(2, 5),
        vx: (Math.random() - 0.5) * 0.3,
        vy: -rand(0.1, 0.4),
        alpha: rand(0.05, 0.2),
        alphaDir: Math.random() > 0.5 ? 1 : -1
      });
    }
  }

  function animateParticles() {
    if (!particleCanvas) return;
    const ctx = particleCanvas.getContext('2d');
    const W = particleCanvas.width, H = particleCanvas.height;
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += p.alphaDir * 0.002;
      if (p.alpha > 0.2 || p.alpha < 0.03) p.alphaDir *= -1;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(77,184,102,${p.alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(animateParticles);
  }

  window.addEventListener('resize', () => {
    if (particleCanvas) {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }
  });

  initParticles();
  requestAnimationFrame(animateParticles);

  // ============ TOAST SYSTEM ============
  function showToast(type, title, message, duration = 5000) {
    const icons = {
      critical: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
      warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
      success: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
      info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>'
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-indicator toast-${type}">
        <span class="toast-icon" style="display:flex;align-items:center;justify-content:center;">${icons[type] || '•'}</span>
      </div>
      <div class="toast-body">
          <div class="toast-title">${title}</div>
          <div class="toast-msg">${message}</div>
        </div>
      </div>
      <div class="toast-progress"><div class="toast-progress-bar" style="animation-duration:${duration}ms"></div></div>
    `;

    toastContainer.appendChild(toast);

    const timer = setTimeout(() => dismissToast(toast), duration);

    toast.addEventListener('click', () => {
      clearTimeout(timer);
      dismissToast(toast);
    });
  }

  function dismissToast(toast) {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 350);
  }

  // ============ TYPEWRITER ============
  async function typeWriter(element, text, speed = 16) {
    element.innerHTML = '';
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    return new Promise(resolve => {
      function type() {
        if (i < text.length) {
          element.innerHTML = text.substring(0, i + 1).replace(/\n/g, '<br/>');
          element.appendChild(cursor);
          i++;
          const el = element.closest('.chat-log');
          if (el) el.scrollTop = el.scrollHeight;
          if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
          setTimeout(type, speed);
        } else {
          if (element.contains(cursor)) element.removeChild(cursor);
          resolve();
        }
      }
      type();
    });
  }

  // ============ CHAT HELPERS ============
  function addSystemMessage(text, time) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg system-msg';
    msg.innerHTML = `<span class="chat-time">${time}</span><p>${text}</p>`;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
    return msg;
  }

  function addAlertMessage(text, time) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg alert-msg';
    msg.innerHTML = `<span class="chat-time">${time}</span><p>${text}</p>`;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
    return msg;
  }

  function addAIMessage() {
    const msg = document.createElement('div');
    msg.className = 'chat-msg ai-msg';
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
    return msg;
  }

  function addConfirmMessage(text, time) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg confirm-msg';
    msg.innerHTML = `<span class="chat-time">${time}</span><p>${text}</p>`;
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
    return msg;
  }

  function getTimeStr() {
    const h = Math.floor(simClockSeconds / 3600) % 24;
    const m = Math.floor((simClockSeconds % 3600) / 60);
    const s = simClockSeconds % 60;
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} ${ampm}`;
  }

  // ============ TIMELINE WIDGET ============
  function buildTimeline(steps) {
    if (!eventTimeline || !timelineSteps) return;
    timelineSteps.innerHTML = '';
    steps.forEach(step => {
      const el = document.createElement('div');
      el.className = 'timeline-step';
      el.id = `tstep-${step.id}`;
      el.innerHTML = `
        <div class="timeline-step-dot">${step.icon}</div>
        <div class="timeline-step-name">${step.name}</div>
        <div class="timeline-step-time" id="tstep-time-${step.id}">—</div>
      `;
      timelineSteps.appendChild(el);
    });
    eventTimeline.style.display = 'block';
  }

  function markTimelineStep(id, status, timeStr) {
    const el = document.getElementById(`tstep-${id}`);
    const timeEl = document.getElementById(`tstep-time-${id}`);
    if (!el) return;
    el.classList.remove('step-done', 'step-active');
    el.classList.add(status === 'done' ? 'step-done' : 'step-active');
    if (timeEl && timeStr) timeEl.textContent = timeStr;
  }

  // ============ FLASH EFFECT ============
  function flashDashboard() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    main.classList.remove('dashboard-flash');
    void main.offsetWidth;
    main.classList.add('dashboard-flash');
    setTimeout(() => main.classList.remove('dashboard-flash'), 900);
  }

  // ============ DISABLE / ENABLE SCENARIOS ============
  function disableAllScenarios() {
    [scenario1Btn, scenario2Btn, scenario3Btn].forEach(b => { if (b) b.disabled = true; });
    if (scenarioResetBtn) scenarioResetBtn.style.display = 'flex';
  }

  function resetDemo() {
    scenarioActive = false;
    chartSpikeActive = false;

    // Restore sensors
    const condEl = document.getElementById('val-conductivity');
    const phEl = document.getElementById('val-ph');
    const moistEl = document.getElementById('val-moisture');
    const tempEl = document.getElementById('val-temp');

    if (condEl) { condEl.textContent = '840'; condEl.className = 'sensor-value'; }
    if (phEl) { phEl.textContent = '7.2'; phEl.className = 'sensor-value'; }
    if (moistEl) { moistEl.textContent = '28'; moistEl.className = 'sensor-value'; }
    if (tempEl) { tempEl.textContent = '68'; tempEl.className = 'sensor-value'; }

    ['conductivity','ph','moisture','temp','flow'].forEach(k => {
      const t = document.getElementById('trend-' + k);
      if (t) { t.textContent = '—'; t.className = 'sensor-trend neutral'; }
    });

    // Restore KPIs
    if (alertsValue) { alertsValue.textContent = '0'; alertsValue.className = 'kpi-value'; }
    if (alertsSub) { alertsSub.textContent = 'All clear'; alertsSub.className = 'kpi-sub'; }
    if (mlBadge) { mlBadge.textContent = 'Monitoring'; mlBadge.className = 'badge badge-success'; }
    if (mlConfidence) mlConfidence.innerHTML = '97% <span class="text-muted">(Normal)</span>';

    // Restore chat
    chatLog.innerHTML = `
      <div class="chat-msg system-msg">
        <span class="chat-time">04:22 AM</span>
        <p>System nominal. All sensor inputs within historical bounds. Knowledge graph sync complete — 127 entities mapped.</p>
      </div>
      <div class="chat-msg system-msg">
        <span class="chat-time">04:30 AM</span>
        <p>Scheduled retrieval check: county water advisory CA-2026-031 downloaded and indexed. No action items.</p>
      </div>
    `;

    // Restore recommended actions
    recommendedActions.classList.remove('actions-active');
    actionsRow.innerHTML = `
      <button class="btn btn-danger" id="valveShutoffBtn" disabled>Initiate Valve Shutoff</button>
      <button class="btn btn-outline" id="acknowledgeBtn" disabled>Acknowledge &amp; Dismiss</button>
    `;
    document.getElementById('valveShutoffBtn').addEventListener('click', valveShutoffHandler);
    document.getElementById('acknowledgeBtn').addEventListener('click', acknowledgeHandler);

    // Restore hardware nodes
    if (hw2ACard) { hw2ACard.className = 'hw-card'; }
    if (hw2ABadge) { hw2ABadge.textContent = 'Online'; hw2ABadge.className = 'badge badge-success'; }
    if (hw2ABat) hw2ABat.textContent = '92%';
    if (hw2APing) hw2APing.textContent = '45ms';
    if (hwOnlineCount) hwOnlineCount.textContent = '7';
    if (hwOnlinePct) hwOnlinePct.textContent = '87.5%';

    // Restore field map
    const mapNode1B = document.getElementById('mapNode1B');
    const mapNode2A = document.getElementById('mapNode2A');
    [mapNode1B, mapNode2A].forEach(n => {
      if (n) {
        n.classList.remove('sensor-alert', 'map-sensor-offline');
        const inner = n.querySelector('.sensor-inner');
        const outer = n.querySelector('.sensor-outer');
        if (inner) { inner.setAttribute('fill', '#4db866'); }
        if (outer) { outer.setAttribute('fill', '#1b3a23'); outer.setAttribute('stroke', '#4db866'); }
        n.setAttribute('data-status', 'online');
      }
    });

    // Restore weather
    if (weatherTemp) weatherTemp.textContent = '68°F';
    if (weatherDesc) weatherDesc.textContent = 'Partly Cloudy';
    baseTemp = 68;

    // Restore timeline
    if (eventTimeline) eventTimeline.style.display = 'none';
    if (timelineSteps) timelineSteps.innerHTML = '';

    // Restore sensor state
    sensorState.conductivity = 840;
    sensorState.moisture = 28;
    sensorState.temp = 68;

    // Reset conductivity chart history
    for (let i = 0; i < conductivityHistory.length; i++) {
      conductivityHistory[i] = 840 + (Math.random() - 0.5) * 24;
    }

    // Re-enable buttons
    [scenario1Btn, scenario2Btn, scenario3Btn].forEach(b => { if (b) b.disabled = false; });
    if (scenarioResetBtn) scenarioResetBtn.style.display = 'none';
  }

  // Action button handlers
  function valveShutoffHandler() {
    const btn = document.getElementById('valveShutoffBtn');
    const ackBtn = document.getElementById('acknowledgeBtn');
    if (btn) btn.disabled = true;
    if (ackBtn) ackBtn.disabled = true;

    addConfirmMessage(
      'CONFIRMED — Valve shutoff command broadcasted to Edge Node 4 via LoRa mesh. Confirmation received in 340ms. South feed line secured. Compliance report auto-generated.',
      getTimeStr() + ' — CONFIRMED'
    );

    markTimelineStep('action', 'done', getTimeStr());
    showToast('success', 'Confirmed', 'Valve closed in 340ms via Edge Node 4');

    if (alertsSub) {
      alertsSub.textContent = 'Action taken';
      alertsSub.classList.remove('kpi-sub-red');
      alertsSub.classList.add('kpi-sub-green');
    }
  }

  function acknowledgeHandler() {
    const btn = document.getElementById('valveShutoffBtn');
    const ackBtn = document.getElementById('acknowledgeBtn');
    if (btn) btn.disabled = true;
    if (ackBtn) ackBtn.disabled = true;

    addConfirmMessage(
      'ACKNOWLEDGED — Alert logged by operator. Manual control assumed. Event logged with full trace for compliance audit.',
      getTimeStr() + ' — ACKNOWLEDGED'
    );

    if (alertsSub) {
      alertsSub.textContent = 'Acknowledged';
      alertsSub.classList.remove('kpi-sub-red');
      alertsSub.classList.add('kpi-sub-green');
    }
  }

  document.getElementById('valveShutoffBtn').addEventListener('click', valveShutoffHandler);
  document.getElementById('acknowledgeBtn').addEventListener('click', acknowledgeHandler);

  // ============ SCENARIO 1: CONTAMINATION EVENT ============
  async function runScenario1() {
    scenarioActive = true;
    disableAllScenarios();

    buildTimeline([
      { id: 'detect', name: 'Detection', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' },
      { id: 'analyze', name: 'Analysis', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/></svg>' },
      { id: 'recommend', name: 'Recommend', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>' },
      { id: 'action', name: 'Action', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' }
    ]);
    markTimelineStep('detect', 'active');

    // Flash dashboard
    flashDashboard();

    // Immediate toast
    showToast('critical', 'Sensor Alert', 'Conductivity spike detected at South Well');

    // Spike conductivity
    const condEl = document.getElementById('val-conductivity');
    const phEl = document.getElementById('val-ph');
    if (condEl) {
      animateNumber(condEl, sensorState.conductivity, 1180, 0, 1200);
      condEl.classList.add('val-red');
    }
    if (phEl) {
      animateNumber(phEl, 7.2, 6.4, 1, 1200);
      phEl.classList.add('val-amber');
    }

    // Spike trend
    const condTrend = document.getElementById('trend-conductivity');
    if (condTrend) { condTrend.textContent = '↑ 40%'; condTrend.className = 'sensor-trend spike'; }

    // Spike chart
    chartSpikeActive = true;
    for (let i = 0; i < 8; i++) {
      const v = 900 + (i / 7) * 280 + (Math.random() - 0.5) * 30;
      conductivityHistory.push(v);
      if (conductivityHistory.length > 60) conductivityHistory.shift();
      await delay(120);
    }

    // Alerts KPI
    if (alertsValue) {
      animateNumber(alertsValue, 0, 1, 0, 600);
      alertsValue.classList.add('kpi-red');
    }
    if (alertsSub) {
      alertsSub.textContent = 'Requires attention';
      alertsSub.classList.add('kpi-sub-red');
    }

    // ML badge
    if (mlBadge) { mlBadge.textContent = 'Anomaly Detected'; mlBadge.className = 'badge badge-danger badge-blink'; }
    if (mlConfidence) { mlConfidence.innerHTML = '98% <span class="text-red">(Anomaly)</span>'; mlConfidence.classList.add('text-red'); }

    // Field map — South Well alert
    const mapNode1B = document.getElementById('mapNode1B');
    if (mapNode1B) {
      mapNode1B.classList.add('sensor-alert');
      const inner = mapNode1B.querySelector('.sensor-inner');
      const outer = mapNode1B.querySelector('.sensor-outer');
      if (inner) inner.setAttribute('fill', '#c83232');
      if (outer) { outer.setAttribute('fill', '#1a0a0a'); outer.setAttribute('stroke', '#c83232'); }
      mapNode1B.setAttribute('data-value', '1180 µS/cm — ALERT');
    }

    // Weather update
    if (weatherDesc) weatherDesc.textContent = 'Rain: Last 6h — 1.2 inches';
    if (weatherTemp) weatherTemp.textContent = '64°F';

    markTimelineStep('detect', 'done', getTimeStr());
    markTimelineStep('analyze', 'active');

    await delay(600);
    addAlertMessage(
      'WARNING: South Well Conductivity exceeded safety threshold (1180 > 900 µS/cm). Isolation Forest confidence: 98%. Correlating with pH drift (7.2 → 6.4) and recent precipitation data...',
      getTimeStr() + ' — ALERT'
    );

    showToast('info', 'AI Analysis', 'Root cause identified — fertilizer runoff');

    await delay(2000);
    markTimelineStep('analyze', 'done', getTimeStr());
    markTimelineStep('recommend', 'active');

    const aiMsg = addAIMessage();
    const aiText =
`Analyzing South Well logs against local weather models, Tract B soil moisture, and county advisory CA-2026-031.

[CORRELATION ANALYSIS]
• Precipitation: +1.2 inches (last 6 hours)
• Soil saturation index: 0.87 (critical)
• pH dropped from 7.2 → 6.4 (acidic shift)
• Conductivity: 1180 µS/cm (40% above threshold)

[ROOT CAUSE] High-confidence fertilizer runoff event. Heavy precipitation carrying nitrogen-rich surface runoff into South Well aquifer zone.

[RECOMMENDED ACTIONS]
1. Immediate automated valve shutoff — South feed line
2. Dispatch field check to Tract B drainage channel
3. File runoff event report (county requires notification within 24h)`;

    await typeWriter(aiMsg, aiText, 16);

    markTimelineStep('recommend', 'done', getTimeStr());
    markTimelineStep('action', 'active');

    showToast('warning', 'Action Available', 'Valve shutoff recommended — South feed line');

    recommendedActions.classList.add('actions-active');
    const vsBtn = document.getElementById('valveShutoffBtn');
    const ackBtn = document.getElementById('acknowledgeBtn');
    if (vsBtn) vsBtn.disabled = false;
    if (ackBtn) ackBtn.disabled = false;
  }

  // ============ SCENARIO 2: IRRIGATION DECISION ============
  async function runScenario2() {
    scenarioActive = true;
    disableAllScenarios();

    buildTimeline([
      { id: 's2-detect', name: 'Soil Alert', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>' },
      { id: 's2-analyze', name: 'Analysis', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/></svg>' },
      { id: 's2-weather', name: 'Forecast', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 8.765A6.002 6.002 0 0 0 4 11V14"/><path d="M11.993 13.522A4.996 4.996 0 0 1 20 17.5c0 1.38-.56 2.63-1.464 3.535"/><path d="M6 18h11"/></svg>' },
      { id: 's2-action', name: 'Decision', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>' }
    ]);
    markTimelineStep('s2-detect', 'active');

    // Soil moisture drops
    const moistEl = document.getElementById('val-moisture');
    const tempEl = document.getElementById('val-temp');
    if (moistEl) {
      animateNumber(moistEl, 28, 18, 0, 1500);
      setTimeout(() => moistEl.classList.add('val-red'), 1500);
    }
    if (tempEl) {
      animateNumber(tempEl, 68, 92, 0, 2000);
      setTimeout(() => tempEl.classList.add('val-amber'), 2000);
    }

    const moistTrend = document.getElementById('trend-moisture');
    if (moistTrend) { moistTrend.textContent = '↓↓'; moistTrend.className = 'sensor-trend spike'; }
    const tempTrend = document.getElementById('trend-temp');
    if (tempTrend) { tempTrend.textContent = '↑'; tempTrend.className = 'sensor-trend up'; }

    if (weatherTemp) weatherTemp.textContent = '92°F';
    if (weatherDesc) weatherDesc.textContent = 'Clear · High UV';

    if (alertsValue) { alertsValue.textContent = '1'; alertsValue.classList.add('kpi-red'); }
    if (alertsSub) { alertsSub.textContent = 'Moisture critical'; alertsSub.classList.add('kpi-sub-red'); }
    if (mlBadge) { mlBadge.textContent = 'Alert'; mlBadge.className = 'badge badge-warning badge-blink'; }

    showToast('warning', 'Irrigation Alert', 'Tract B soil moisture at 18% — critical threshold');

    await delay(500);
    addAlertMessage(
      'ALERT: Tract B soil moisture has dropped to 18% (critical threshold: 20%). Temperature 92°F with clear skies. No precipitation forecast for 72 hours. Crop stage: V6 corn (high water demand).',
      getTimeStr() + ' — ALERT'
    );

    markTimelineStep('s2-detect', 'done', getTimeStr());
    markTimelineStep('s2-analyze', 'active');

    showToast('info', 'AI Analysis', 'Cross-referencing weather models + crop stage calendar');

    await delay(2200);
    markTimelineStep('s2-analyze', 'done', getTimeStr());
    markTimelineStep('s2-weather', 'active');

    await delay(400);
    markTimelineStep('s2-weather', 'done', getTimeStr());
    markTimelineStep('s2-action', 'active');

    const aiMsg = addAIMessage();
    const aiText =
`Analyzing Tract B conditions: soil moisture, weather forecast, and V6 corn water demand.

[FIELD CONDITIONS]
• Soil moisture: 18% (critical — field capacity 28%)
• Temperature: 92°F, UV index: high
• ET rate: 0.28 in/day (elevated)
• Last irrigation: 4 days ago

[WEATHER FORECAST — 72 HOURS]
• Today: Sunny, high 92°F — No rain
• Tomorrow: Partly cloudy, high 88°F — No rain  
• Day 3: Clear, high 85°F — Trace possible

[RECOMMENDATION]
Schedule irrigation within 6 hours to prevent yield loss.
Suggested: 1.4 inches over 8 hours via center pivot.
Start time: Tonight 10:00 PM (avoid peak heat).
Estimated cost: $240 · Yield protection value: ~$1,800.`;

    await typeWriter(aiMsg, aiText, 16);

    markTimelineStep('s2-action', 'done', getTimeStr());
    showToast('success', 'Analysis Complete', 'Irrigation schedule ready');

    recommendedActions.classList.add('actions-active');
    actionsRow.innerHTML = `
      <button class="btn btn-primary" id="startIrrigationBtn">Start Irrigation Zone B</button>
      <button class="btn btn-outline" id="deferIrrigationBtn">Defer — Rain Expected</button>
    `;

    document.getElementById('startIrrigationBtn').addEventListener('click', () => {
      document.getElementById('startIrrigationBtn').disabled = true;
      document.getElementById('deferIrrigationBtn').disabled = true;
      addConfirmMessage(
        'SCHEDULED — Irrigation Zone B queued for 22:00 tonight. Center pivot programmed: 1.4 inches, 8-hour cycle. Estimated completion: 06:00 tomorrow. System will monitor soil moisture and adjust rate automatically.',
        getTimeStr() + ' — SCHEDULED'
      );
      showToast('success', 'Irrigation Scheduled', 'Zone B: 10:00 PM start · 1.4 inches');
    });

    document.getElementById('deferIrrigationBtn').addEventListener('click', () => {
      document.getElementById('startIrrigationBtn').disabled = true;
      document.getElementById('deferIrrigationBtn').disabled = true;
      addConfirmMessage(
        'DEFERRED — Irrigation delayed. SustainAI will monitor soil moisture every 30 minutes and alert if conditions worsen. Next check-in: 2 hours.',
        getTimeStr() + ' — DEFERRED'
      );
    });
  }

  // ============ SCENARIO 3: SENSOR FAILURE ============
  async function runScenario3() {
    scenarioActive = true;
    disableAllScenarios();

    buildTimeline([
      { id: 's3-detect', name: 'Signal Lost', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c.44-.11.89-.2 1.34-.28"/><path d="M22 8.82a15 15 0 0 0-4.17-2.65"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><path d="M14.76 10.24A10 10 0 0 1 19 13"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>' },
      { id: 's3-analyze', name: 'Diagnosis', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' },
      { id: 's3-mesh', name: 'Mesh Reroute', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>' },
      { id: 's3-action', name: 'Resolution', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11.5 5.5.9-.9c1.2-1.2 3.1-1.2 4.2 0l.9.9c1.2 1.2 1.2 3.1 0 4.2l-.9.9c.7.3 1.4.7 1.9 1.4 1 1.5 1 3.5 0 5L15 20.5c-1.5 1-3.5 1-5 0-1.2-.8-1.5-2.2-1-3.5M6.5 18H5L1.5 21.5l1 1L6 19v-1.5M10.8 14.8l2.4-2.4"/></svg>' }
    ]);
    markTimelineStep('s3-detect', 'active');

    // Node 2A goes offline
    showToast('warning', 'Hardware Alert', 'Node 2A — Tract B Soil Array going offline');

    if (hw2ACard) {
      hw2ACard.classList.add('hw-flickering');
      await delay(900);
      hw2ACard.classList.remove('hw-flickering');
      hw2ACard.classList.add('hw-offline');
    }
    if (hw2ABadge) { hw2ABadge.textContent = 'Offline'; hw2ABadge.className = 'badge badge-danger'; }
    if (hw2ABat) hw2ABat.textContent = '—';
    if (hw2APing) hw2APing.textContent = 'TIMEOUT';
    if (hwOnlineCount) hwOnlineCount.textContent = '6';
    if (hwOnlinePct) hwOnlinePct.textContent = '75%';

    // Update field map
    const mapNode2A = document.getElementById('mapNode2A');
    if (mapNode2A) {
      const inner = mapNode2A.querySelector('.sensor-inner');
      const outer = mapNode2A.querySelector('.sensor-outer');
      if (inner) inner.setAttribute('fill', '#888');
      if (outer) { outer.setAttribute('fill', '#3a3a3a'); outer.setAttribute('stroke', '#666'); }

      const excl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      excl.setAttribute('x', '0');
      excl.setAttribute('y', '-14');
      excl.setAttribute('font-size', '12');
      excl.setAttribute('fill', '#c83232');
      excl.setAttribute('text-anchor', 'middle');
      excl.setAttribute('font-weight', 'bold');
      excl.textContent = '!';
      mapNode2A.appendChild(excl);
      mapNode2A.setAttribute('data-value', 'OFFLINE');
    }

    if (alertsValue) { alertsValue.textContent = '1'; alertsValue.classList.add('kpi-red'); }
    if (alertsSub) { alertsSub.textContent = 'Node offline'; alertsSub.classList.add('kpi-sub-red'); }
    const activeSensors = document.getElementById('activeSensorsKpi');
    if (activeSensors) {
      const kv = activeSensors.querySelector('.kpi-value');
      if (kv) kv.textContent = '6/8';
    }

    markTimelineStep('s3-detect', 'done', getTimeStr());
    markTimelineStep('s3-analyze', 'active');

    await delay(500);
    addAlertMessage(
      'WARNING: Node 2A (Tract B Soil Array) connection lost. Last reading: 04:28 AM. 3 consecutive ping timeouts. Data gap detected in soil moisture pipeline for Tract B.',
      getTimeStr() + ' — HARDWARE ALERT'
    );

    showToast('info', 'AI Analysis', 'Detecting data gap · Cross-referencing adjacent sensors');
    if (mlBadge) { mlBadge.textContent = 'Data Gap'; mlBadge.className = 'badge badge-warning badge-blink'; }

    await delay(2000);
    markTimelineStep('s3-analyze', 'done', getTimeStr());
    markTimelineStep('s3-cross', 'active');
    await delay(500);
    markTimelineStep('s3-cross', 'done', getTimeStr());
    markTimelineStep('s3-action', 'active');

    const aiMsg = addAIMessage();
    const aiText =
`Node 2A (Tract B Soil Array) has gone offline. Analyzing data gap and cross-referencing adjacent sensors.

[DATA GAP ANALYSIS]
• Last valid reading: 04:28 AM (27% moisture)
• Time since last reading: ~3 minutes
• Data gap severity: MODERATE — short duration

[CROSS-REFERENCE — ADJACENT SENSORS]
• Node 2B (Tract B N/P/K): Online · Soil K at 165ppm → normal
• Node 4A (Ambient Temp): 68°F · No thermal anomaly
• Historical trend: Node 2A had 99.1% uptime over 31 days

[PROBABLE CAUSE]
Battery voltage may be marginal (last reading: 73% — below optimal 80%). LoRa signal path potentially obstructed.

[RECOMMENDED ACTIONS]
1. Dispatch technician to Node 2A at Tract B southeast corner
2. Enable backup manual moisture log for Tract B
3. Connectivity auto-retry in 15 minutes`;

    await typeWriter(aiMsg, aiText, 16);
    markTimelineStep('s3-action', 'done', getTimeStr());

    showToast('warning', 'Action Required', 'Dispatch technician to Node 2A — Tract B SE corner');

    recommendedActions.classList.add('actions-active');
    actionsRow.innerHTML = `
      <button class="btn btn-primary" id="dispatchBtn">Dispatch Technician</button>
      <button class="btn btn-secondary" id="backupSensorBtn">Enable Backup Sensor</button>
    `;

    document.getElementById('dispatchBtn').addEventListener('click', () => {
      document.getElementById('dispatchBtn').disabled = true;
      document.getElementById('backupSensorBtn').disabled = true;
      addConfirmMessage(
        'DISPATCHED — Field technician alert sent. ETA: 45 minutes. Node 2A location flagged in field map: Tract B SE corner, junction B-7. SustainAI will use backup interpolation for Tract B moisture until repair complete.',
        getTimeStr() + ' — DISPATCHED'
      );
      showToast('success', 'Technician Dispatched', 'ETA 45min · Node 2A · Tract B SE corner');
    });

    document.getElementById('backupSensorBtn').addEventListener('click', () => {
      document.getElementById('dispatchBtn').disabled = true;
      document.getElementById('backupSensorBtn').disabled = true;
      addConfirmMessage(
        'BACKUP ENABLED — Manual sensor logging enabled for Tract B. AI will interpolate moisture from adjacent Node 2B readings and historical patterns. Alert will fire when Node 2A reconnects.',
        getTimeStr() + ' — BACKUP ACTIVE'
      );
      showToast('success', 'Backup Active', 'Tract B moisture interpolated from adjacent nodes');
    });
  }

  // ============ SCENARIO BUTTONS ============
  if (scenario1Btn) scenario1Btn.addEventListener('click', () => runScenario1());
  if (scenario2Btn) scenario2Btn.addEventListener('click', () => runScenario2());
  if (scenario3Btn) scenario3Btn.addEventListener('click', () => runScenario3());
  if (scenarioResetBtn) scenarioResetBtn.addEventListener('click', resetDemo);

  // ============ AI CHAT ============
  const chatResponses = [
    {
      keywords: ['soil', 'moisture'],
      response: `Tract B soil moisture is at 27%, trending down from 32% over 48 hours.

Based on weather forecast (no rain expected next 72h) and crop stage (V6 corn), I recommend scheduling irrigation within 12 hours.

Source: Local sensor array + NOAA forecast + USDA crop calendar.`
    },
    {
      keywords: ['weather', 'forecast', 'rain'],
      response: `Current conditions: 68°F, 55% humidity, wind 8mph NW.
72-hour forecast: Clear skies, high 74°F tomorrow. No precipitation expected.

Evapotranspiration rate: 0.18 in/day.
This aligns with increased irrigation demand for current crop cycle.`
    },
    {
      keywords: ['nitrogen', 'fertilizer', 'nutrient', 'npk'],
      response: `Latest N-P-K readings from Tract B:
• Nitrogen: 42 ppm (adequate)
• Phosphorus: 28 ppm (optimal)
• Potassium: 165 ppm (high)

Based on soil test history and corn growth stage, no additional fertilizer application recommended for 2 weeks.

County advisory CA-2026-031 notes: reduce nitrogen application near waterways.`
    },
    {
      keywords: ['compliance', 'report', 'filing', 'deadline'],
      response: `Next deadline: Water Q2 filing due April 15, 2026.
Status: Auto-draft 80% complete.
Remaining: operator signature + final conductivity log attachment.

14 reports filed this year, all on time.
Compliance score: 100%.`
    },
    {
      keywords: ['valve', 'shutoff', 'pipe', 'feed line'],
      response: `South feed line valve: Currently OPEN.
Last shutoff: March 14 (routine maintenance).
Edge Node 4 response time: 340ms average.

Backup valve (manual): Located at junction B-7, last inspected Feb 2.`
    },
    {
      keywords: ['well', 'water quality', 'conductivity'],
      response: `South Well status:
• Conductivity: 840 µS/cm (normal range 600–900)
• pH: 7.2 (target 6.5–7.5)
• Historical trend: Stable over 30 days

Last anomaly: Feb 28 (resolved — runoff event).
Knowledge graph references: 23 related county advisories indexed.`
    },
    {
      keywords: ['cost', 'savings', 'roi', 'savings'],
      response: `Estimated operational savings this quarter: $12,400.

Breakdown:
• Reduced manual monitoring: -40 hrs/wk × $35/hr
• Prevented crop loss from 2 early anomaly detections
• Automated compliance filing: 8 hrs/report × 14 reports

Projected annual ROI: 340%.`
    }
  ];

  const chatDefaultResponse = `I'm analyzing your query against 5,127 indexed documents in the local knowledge graph.

Based on current sensor readings, weather models, and historical data for South Tract, here's what I found:

[Your question relates to operational parameters that are currently within normal bounds. No immediate action required. I'll continue monitoring and alert you if conditions change.]

You can ask me about: soil moisture, weather, nitrogen/fertilizer, compliance deadlines, valve status, water quality, or ROI.`;

  async function handleChatQuery(query) {
    if (!query.trim()) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user-msg';
    userMsg.textContent = query;
    chatLog.appendChild(userMsg);
    chatLog.scrollTop = chatLog.scrollHeight;

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chatLog.appendChild(typing);
    chatLog.scrollTop = chatLog.scrollHeight;

    await delay(1500);
    typing.remove();

    // Find matching response
    const lower = query.toLowerCase();
    let response = chatDefaultResponse;
    for (const r of chatResponses) {
      if (r.keywords.some(k => lower.includes(k))) {
        response = r.response;
        break;
      }
    }

    const aiResp = document.createElement('div');
    aiResp.className = 'chat-msg ai-response-msg';
    chatLog.appendChild(aiResp);
    chatLog.scrollTop = chatLog.scrollHeight;

    await typeWriter(aiResp, response, 14);
  }

  if (aiChatInput) {
    aiChatInput.addEventListener('keydown', async e => {
      if (e.key === 'Enter') {
        const query = aiChatInput.value;
        aiChatInput.value = '';
        await handleChatQuery(query);
      }
    });
  }

  if (aiChatSend) {
    aiChatSend.addEventListener('click', async () => {
      if (!aiChatInput) return;
      const query = aiChatInput.value;
      aiChatInput.value = '';
      await handleChatQuery(query);
    });
  }

  // ============ INITIAL BOOT TOASTS ============
  setTimeout(() => {
    showToast('success', 'System Online', 'SustainAI Hub connected · 7 nodes active');
  }, 1200);

  setTimeout(() => {
    showToast('info', 'Knowledge Graph', '5,127 documents indexed · CA-2026-031 loaded');
  }, 3000);

})();
