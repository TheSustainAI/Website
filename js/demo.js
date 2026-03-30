// SustainAI Demo Logic

// 1. Initial Bar Chart Population
const barChart = document.getElementById('barChart');
let barHeights = [40, 42, 38, 45, 41, 48, 55, 30, 35, 42, 44, 46, 38];
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

let baseCond = 840;
let anomalyTriggered = false;

setInterval(() => {
    if(anomalyTriggered || !condVal) return; // Stop random fluctuations during anomaly
    let cShift = Math.floor(Math.random() * 10) - 5;
    condVal.innerText = `${baseCond + cShift} µS/cm`;
    
    let sShift = Math.floor(Math.random() * 3) - 1;
    soilVal.innerText = `${28 + sShift}%`;
    
    let fShift = Math.floor(Math.random() * 6) - 3;
    flowVal.innerText = `${120 + fShift} GPM`;
}, 2500);

// 3. Time formatting
function getFormattedTime() {
    // just HH:MM format
    const str = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return str + ' (Local)';
}

// 4. Anomaly Simulation Workflow (ML Ops -> LLM)
const simBtn = document.getElementById('simAnomalyBtn');
const mlStatus = document.getElementById('mlStatusBadge');
const mlConf = document.getElementById('mlConf');
const condTrend = document.getElementById('cond-trend');
const llmLog = document.getElementById('llmLog');
const llmActions = document.getElementById('llmActions');

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
                // To keep new lines working nicely
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
        
        // --- Step 2: ML Ops detects anomaly (Information Flow)
        renderBars(true);
        mlStatus.className = "dbadge danger";
        mlStatus.innerText = "Anomaly Detected";
        mlConf.innerHTML = "<span style='color: #c83232'>98% (Anomaly)</span>";
        
        // --- Step 3: Trigger System Alert
        setTimeout(() => {
            appendMessage('alert', 'Warning: South Well Conductivity limit exceeded (1180 > 900 threshold). Isolation Forest indicates 98% confidence. Routing Context to Local LLM...');
        }, 500);

        // --- Step 4: LLM Reasons locally
        setTimeout(async () => {
            const aiBody = appendMessage('ai', '');
            const reasoningText = "Analyzing South Well logs against local weather models and Track B soil moisture. \n\nAnalysis: Precipitation increased by 1.2 inches over the last 6 hours, leading to saturated soil. The conductivity spike strongly correlates with excessive fertilizer runoff entering the South Well system. This is a high-risk compliance violation.\n\nRecommendation: I suggest an immediate automated valve shutoff for the South feed to prevent contamination spread.";
            
            await typeWriter(aiBody, reasoningText, 25); // Type out the response
            
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
        appendMessage('system', 'Valve shutoff command successfully broadcasted to Edge Node 4 via LoRa system. Operation secured.');
        actProtocol.disabled = true;
        actDismiss.disabled = true;
    });
}
if(actDismiss){
    actDismiss.addEventListener('click', () => {
        appendMessage('system', 'Alert acknowledged and logged locally. Operator assumed manual control.');
        actProtocol.disabled = true;
        actDismiss.disabled = true;
    });
}

// 6. Sidebar Navigation Logic
const sideNavLinks = document.querySelectorAll('#sideNav a');
const viewPanels = document.querySelectorAll('.view-panel');

sideNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        sideNavLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        viewPanels.forEach(panel => panel.classList.remove('active'));
        
        const targetId = link.getAttribute('data-target');
        const targetPanel = document.getElementById(targetId);
        if(targetPanel) {
            targetPanel.classList.add('active');
        }
    });
});
