// Leaflet Map Initialization
const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([12.9716, 77.5946], 13); // Default view (e.g., Bangalore)

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
}).addTo(map);

const mainNodeMarker = L.circleMarker([12.9716, 77.5946], {
    radius: 12,
    fillColor: "#0ea5e9",
    color: "#fff",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
}).addTo(map);

mainNodeMarker.bindPopup("<b class='text-slate-900'>Main Node: AquaNode-01</b>").openPopup();

// Request Current Location
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        map.setView([lat, lon], 15);
        mainNodeMarker.setLatLng([lat, lon]);
        addLog(`[SYSTEM] Map centered to current location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }, (error) => {
        console.warn("Geolocation failed or denied:", error);
        addLog("[INFO] Using default location (Geolocation denied).");
    });
} else {
    addLog("[INFO] Geolocation not supported by browser.");
}

// Firebase Listeners (Mocking Data for Demonstration)
const db = firebase.database();
const telemetryRef = db.ref('telemetry');

// Mock Data Generation (For UI Testing)
function startMockTelemetry() {
    if (window.mockInterval) return; // Already running
    window.mockInterval = setInterval(() => {
        // Occasionally generate critical values
        const isCritical = Math.random() > 0.8;
        const mockData = {
            ph: isCritical ? (Math.random() > 0.5 ? 4.5 : 8.0) : (6.0 + Math.random() * 1.5).toFixed(1),
            temp: (24 + Math.random() * 2).toFixed(1),
            turbidity: isCritical ? (11 + Math.random() * 5) : (Math.random() * 8).toFixed(1),
            flow: (Math.random() * 5).toFixed(1),
            valve: "OPEN" 
        };
        updateUI(mockData);
    }, 4000);
}

// Update UI with Real-time Data
function updateUI(data) {
    const ph = parseFloat(data.ph);
    const turb = parseFloat(data.turbidity);

    // Animate Numbers with Anime.js
    animateValue("#ph-value", ph);
    animateValue("#temp-value", data.temp);
    animateValue("#turb-value", turb);
    animateValue("#flow-value", data.flow);

    // Threshold Checks
    let phStatus = 'safe';
    if (ph < 5.0 || ph > 7.5) phStatus = 'critical';
    else if ((ph >= 5.0 && ph < 5.5) || (ph > 7.0 && ph <= 7.5)) phStatus = 'warning';

    let turbStatus = 'safe';
    if (turb > 10) turbStatus = 'critical';
    else if (turb >= 5 && turb <= 10) turbStatus = 'warning';

    // Update Progress Bars and Colors
    updateMetricStatus('ph', phStatus, (ph / 14) * 100);
    updateMetricStatus('temp', 'safe', (data.temp / 50) * 100);
    updateMetricStatus('turb', turbStatus, (turb / 20) * 100);
    updateMetricStatus('flow', 'safe', (data.flow / 10) * 100);

    // Valve Status
    const valveIndicator = document.getElementById('valve-indicator');
    const valveStatus = document.getElementById('valve-status');
    const globalStatus = document.getElementById('global-status');

    if (phStatus === 'critical' || turbStatus === 'critical') {
        valveIndicator.className = "w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_10px_#ef4444] pulse-red";
        valveStatus.innerText = "CLOSED";
        valveStatus.className = "text-xs px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full font-bold";
        globalStatus.innerText = "CRITICAL";
        globalStatus.className = "text-rose-400 font-bold";
        
        const reason = phStatus === 'critical' ? "CRITICAL pH LEVEL" : "CRITICAL TURBIDITY";
        triggerAlert(reason);
        triggerOverride(); // Automatically close valve via backend
        addLog(`[CRITICAL] Emergency lockdown initiated: ${reason}`);
    } else if (phStatus === 'warning' || turbStatus === 'warning') {
        valveIndicator.className = "w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]";
        valveStatus.innerText = "OPEN (CAUTION)";
        valveStatus.className = "text-xs px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full font-bold";
        globalStatus.innerText = "WARNING";
        globalStatus.className = "text-amber-400 font-bold";
        addLog(`[WARNING] Environmental thresholds near limit.`);
    } else {
        valveIndicator.className = "w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]";
        valveStatus.innerText = "OPEN";
        valveStatus.className = "text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-bold";
        globalStatus.innerText = "NORMAL";
        globalStatus.className = "text-emerald-400 font-bold";
    }
}

function updateMetricStatus(metric, status, percentage) {
    const progressEl = document.getElementById(`${metric}-progress`);
    const valueEl = document.getElementById(`${metric}-value`);
    
    // Reset colors
    progressEl.className = 'h-full transition-all duration-500';
    valueEl.parentElement.classList.remove('text-rose-500', 'text-amber-500', 'text-emerald-500');

    if (status === 'critical') {
        progressEl.classList.add('bg-rose-500');
        valueEl.parentElement.classList.add('text-rose-500');
    } else if (status === 'warning') {
        progressEl.classList.add('bg-amber-500');
        valueEl.parentElement.classList.add('text-amber-500');
    } else {
        progressEl.classList.add('bg-sky-500');
    }
    progressEl.style.width = `${percentage}%`;
}

function animateValue(id, value) {
    const el = document.querySelector(id);
    const startValue = parseFloat(el.innerText) || 0;
    
    anime({
        targets: el,
        innerText: [startValue, value],
        round: 10, // 1 decimal point for numbers
        easing: 'easeOutExpo',
        duration: 400,
        update: function(anim) {
            // Ensure correct formatting for float values
            if (id !== "#turb-value") {
                el.innerHTML = parseFloat(el.innerHTML).toFixed(1);
            }
        }
    });
}

function addLog(message) {
    const logs = document.getElementById('logs');
    const entry = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    entry.className = message.includes('WARNING') ? 'text-rose-400' : 'text-slate-400';
    entry.innerHTML = `[${timestamp}] ${message}`;
    logs.prepend(entry);
}

// Alert System
function triggerAlert(message) {
    const overlay = document.getElementById('alert-overlay');
    document.getElementById('alert-message').innerText = message;
    overlay.classList.remove('hidden');
    
    // Pulsing Marker on Map
    mainNodeMarker.setStyle({ fillColor: '#ef4444', color: '#ef4444' });
}

function dismissAlert() {
    document.getElementById('alert-overlay').classList.add('hidden');
    mainNodeMarker.setStyle({ fillColor: '#0ea5e9', color: '#fff' });
}

// Override API Call
async function triggerOverride() {
    addLog("[SYSTEM] Initiating emergency override...");
    try {
        const response = await fetch('/api/override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'close' })
        });
        const result = await response.json();
        addLog(`[SYSTEM] ${result.message}`);
    } catch (err) {
        addLog("[ERROR] Failed to contact override API.");
    }
}

// Initialize
window.onload = () => {
    addLog("[SYSTEM] Dashboard initializing...");
    
    // Start listening to Firebase Realtime Database
    telemetryRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateUI(data);
            addLog("[STATUS] Telemetry updated from Firebase.");
            // Stop mock data if it was running
            if (window.mockInterval) clearInterval(window.mockInterval);
        } else {
            addLog("[INFO] No data in Firebase. Starting mock telemetry for demonstration.");
            startMockTelemetry();
        }
    }, (error) => {
        addLog(`[ERROR] Firebase listener failed: ${error.message}`);
        startMockTelemetry(); // Fallback to mock
    });

    addLog("[SYSTEM] Operational.");
};
