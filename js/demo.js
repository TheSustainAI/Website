// SustainAI Demo Logic — Enhanced

// 1. Initial Bar Chart Population
const barChart = document.getElementById('barChart');
let barHeights = [40, 42, 38, 45, 41, 48, 55, 30, 35, 42, 44, 46, 38, 41, 39, 43];
function renderBars(activeSpike = false) {
    if(!barChart) return;
    barChart.innerHTML = '';
    barHeights.forEach((h, i) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        if (i === barHeights.length - 1) {
            bar.classList.add('recent');
            if (activeSpike) {
                bar.classList.add('spike');
                bar.style.height = '95%';
            } else {
                bar.style.height = `${h}%`;
            }
        } else {
            bar.style.height = `${h}%`;
        }
        barChart.appendChild(bar);
    });
}
renderBars();

// 2. Sensor Fluctuation Simulation (Sense Layer)
const condVal = document.getElementById('cond-val');
const soilVal = document.getElementById('soil-val');
const flowVal = document.getElementById('flow-val');
const tempVal = document.getElementById('temp-val');
const phVal   = document.getElementById('ph-val');

let baseCond = 840;
let baseTemp = 68;
let basePH   = 7.2;
let anomalyTriggered = false;

setInterval(() => {
    if(anomalyTriggered) return;
    if(condVal) condVal.innerText = `${baseCond + Math.floor(Math.random() * 10) - 5} µS/cm`;
    if(soilVal) soilVal.innerText = `${28 + Math.floor(Math.random() * 3) - 1}%`;
    if(flowVal) flowVal.innerText = `${120 + Math.floor(Math.random() * 6) - 3} GPM`;
    if(tempVal) tempVal.innerText = `${baseTemp + Math.floor(Math.random() * 4) - 2}°F`;
    if(phVal)   phVal.innerText   = `${(basePH + (Math.random() * 0.2 - 0.1)).toFixed(1)}`;
}, 2500);

// 3. Time formatting
function getFormattedTime() {
    const str = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return str + ' (Local)';
}

// 4. Anomaly Simulation Workflow
const simBtn = document.getElementById('simAnomalyBtn');
const mlStatus = document.getElementById('mlStatusBadge');
const mlConf = document.getElementById('mlConf');
const condTrend = document.getElementById('cond-trend');
const llmLog = document.getElementById('llmLog');
const llmActions = document.getElementById('llmActions');
const kpiAlerts = document.getElementById('kpi-alerts');

function appendMessage(type, body) {
    const ts = getFormattedTime();
    const msg = document.createElement('div');
    msg.className = `llm-msg ${type}`;
    msg.innerHTML = `
        <div class="msg-ts">${ts}</div>
        <div class="msg-body">${body}</div>
    `;
    llmLog.appendChild(msg);
    llmLog.scrollTop = llmLog.scrollHeight;
    return msg.querySelector('.msg-body');
}

async function typeWriter(element, text, speed = 15) {
    element.innerHTML = '';
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    return new Promise(resolve => {
        function type() {
            if (i < text.length) {
                element.innerHTML = text.substring(0, i+1).replace(/\n/g, '<br/>');
                element.appendChild(cursor);
                i++;
                llmLog.scrollTop = llmLog.scrollHeight;
                setTimeout(type, speed);
            } else {
                if(element.contains(cursor)) element.removeChild(cursor);
                resolve();
            }
        }
        type();
    });
}

if(simBtn) {
    simBtn.addEventListener('click', async () => {
        if(anomalyTriggered) return;
        anomalyTriggered = true;
        simBtn.disabled = true;
        simBtn.innerText = "Spike Simulated";
        
        // --- Step 1: Hardware senses the spike
        condVal.innerText = "1180 µS/cm";
        condVal.style.color = "#c83232";
        condTrend.className = "s-trend up";
        condTrend.innerText = "↑ 40%";

        // Also shift pH down (correlated)
        if(phVal) { phVal.innerText = "6.4"; phVal.style.color = "#b8860b"; }

        // Update KPI
        if(kpiAlerts) {
            kpiAlerts.innerText = "1";
            kpiAlerts.style.color = "#c83232";
            const kpiSub = kpiAlerts.closest('.kpi-card')?.querySelector('.kpi-sub');
            if(kpiSub) { kpiSub.innerText = "Requires attention"; kpiSub.style.color = "#c83232"; }
        }
        
        // --- Step 2: ML Ops detects anomaly
        renderBars(true);
        mlStatus.className = "dbadge danger";
        mlStatus.innerText = "Anomaly Detected";
        mlConf.innerHTML = "<span style='color: #c83232'>98% (Anomaly)</span>";
        
        // --- Step 3: System Alert
        setTimeout(() => {
            appendMessage('alert', 'WARNING: South Well Conductivity exceeded safety threshold (1180 > 900 µS/cm). Isolation Forest confidence: 98%. Correlating with pH drift (7.2 → 6.4) and recent precipitation data...');
        }, 500);

        // --- Step 4: LLM Reasons locally
        setTimeout(async () => {
            const aiBody = appendMessage('ai', '');
            const reasoningText = "Analyzing South Well logs against local weather models, Tract B soil moisture, and county advisory CA-2026-031.\n\n[CORRELATION ANALYSIS]\n• Precipitation: +1.2 inches (last 6 hours)\n• Soil saturation index: 0.87 (critical)\n• pH dropped from 7.2 → 6.4 (acidic shift)\n• Conductivity: 1180 µS/cm (40% above threshold)\n\n[ROOT CAUSE] High-confidence fertilizer runoff event. Heavy precipitation is carrying nitrogen-rich surface runoff into the South Well aquifer zone.\n\n[RECOMMENDED ACTIONS]\n1. Immediate automated valve shutoff — South feed line\n2. Dispatch field check to Tract B drainage channel\n3. File runoff event report (county requires notification within 24h)";
            
            await typeWriter(aiBody, reasoningText, 18);
            
            // --- Step 5: Enable user actions
            llmActions.style.transition = "opacity 0.5s";
            llmActions.style.opacity = "1";
            llmActions.style.pointerEvents = "auto";
        }, 2200);
    });
}

// 5. Actions Cleanup
const actProtocol = document.getElementById('actProtocol');
const actDismiss = document.getElementById('actDismiss');
if(actProtocol){
    actProtocol.addEventListener('click', () => {
        appendMessage('system', 'CONFIRMED — Valve shutoff command broadcasted to Edge Node 4 via LoRa mesh. Confirmation received in 340ms. South feed line secured. Compliance report auto-generated and queued for operator review.');
        actProtocol.disabled = true;
        actDismiss.disabled = true;
        if(kpiAlerts) {
            const kpiSub = kpiAlerts.closest('.kpi-card')?.querySelector('.kpi-sub');
            if(kpiSub) { kpiSub.innerText = "Action taken"; kpiSub.style.color = "#2e7d3a"; }
        }
    });
}
if(actDismiss){
    actDismiss.addEventListener('click', () => {
        appendMessage('system', 'ACKNOWLEDGED — Alert logged by operator. Manual control assumed. Event logged locally with full trace for compliance audit.');
        actProtocol.disabled = true;
        actDismiss.disabled = true;
    });
}

// 6. Tab Navigation — keeps desktop sidebar + mobile drawer in sync
const allNavLinks   = document.querySelectorAll('#desktopNav a, #mobileNav a');
const viewPanels    = document.querySelectorAll('.view-panel');

function switchView(targetId) {
    allNavLinks.forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`[data-target="${targetId}"]`).forEach(l => l.classList.add('active'));
    viewPanels.forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(targetId);
    if (panel) panel.classList.add('active');
}

allNavLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        switchView(link.getAttribute('data-target'));
        closeMobileDrawer();
    });
});

// 7. Mobile Hamburger
const demoMenuBtn    = document.getElementById('demoMenuBtn');
const demoNavDrawer  = document.getElementById('demoNavDrawer');

function closeMobileDrawer() {
    if (!demoNavDrawer) return;
    demoNavDrawer.classList.remove('open');
    if (demoMenuBtn) demoMenuBtn.classList.remove('open');
}

if (demoMenuBtn && demoNavDrawer) {
    demoMenuBtn.addEventListener('click', () => {
        const isOpen = demoNavDrawer.classList.toggle('open');
        demoMenuBtn.classList.toggle('open', isOpen);
    });
}

// Close drawer when resizing to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMobileDrawer();
});
