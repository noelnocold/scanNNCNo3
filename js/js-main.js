const codeReader = new ZXing.BrowserMultiFormatReader();
const body = document.body;
const themeBtn = document.getElementById('theme-btn');
const themeIcon = document.getElementById('theme-icon');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const resultContainer = document.getElementById('result-container');
const lastScannedText = document.getElementById('last-scanned');
const statusIcon = document.getElementById('status-icon');
const dataTableContainer = document.getElementById('data-table-container');
const tabScanner = document.getElementById('tab-scanner');
const tabData = document.getElementById('tab-data');
const scannerTab = document.getElementById('scanner-tab');
const dataTab = document.getElementById('data-tab');
const refreshDataBtn = document.getElementById('refresh-data');
const downloadCsvBtn = document.getElementById('download-csv');

let isScanning = false;
let audioCtx = null;
let dataTable = [];
let lastDetected = null;
let lastDetectedAt = 0;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playBeep(type) {
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.3);
        if (navigator.vibrate) navigator.vibrate(100);
    } else if (type === 'warn') {
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.5);
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.5);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
}

themeBtn && themeBtn.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    if (themeIcon) themeIcon.innerText = body.classList.contains('light-mode') ? '☀️' : '🌙';
});

// Tabs
tabScanner && tabScanner.addEventListener('click', () => {
    tabScanner.classList.add('active');
    tabData && tabData.classList.remove('active');
    scannerTab && scannerTab.classList.remove('hidden');
    dataTab && dataTab.classList.add('hidden');
});
tabData && tabData.addEventListener('click', () => {
    tabData.classList.add('active');
    tabScanner && tabScanner.classList.remove('active');
    dataTab && dataTab.classList.remove('hidden');
    scannerTab && scannerTab.classList.add('hidden');
    renderTable();
});

// CSV utilities
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length);
    if (!lines.length) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const cols = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h] = (cols[i] || '').trim());
        return obj;
    });
}

async function loadData() {
    const stored = localStorage.getItem('dataTable');
    if (stored) {
        try {
            dataTable = JSON.parse(stored);
            return;
        } catch (e) {
            console.warn('Invalid stored data, reloading CSV');
        }
    }
    try {
        const resp = await fetch('../data/data-table.csv');
        const txt = await resp.text();
        dataTable = parseCSV(txt);
        persistData();
    } catch (e) {
        console.error('Failed to load CSV', e);
        dataTable = [];
    }
}

function persistData() {
    try { localStorage.setItem('dataTable', JSON.stringify(dataTable)); } catch (e) { console.warn('Persist failed', e); }
}

function renderTable() {
    if (!dataTableContainer) return;
    if (!dataTable || !dataTable.length) {
        dataTableContainer.innerHTML = '<p class="opacity-70">No data</p>';
        return;
    }
    const keys = Object.keys(dataTable[0]);
    let html = '<table class="data-table w-full text-sm border-collapse">';
    html += '<thead class="bg-[var(--app-glass-bg)]"><tr>' + keys.map(k => `<th class="px-3 py-2 text-left">${k}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + dataTable.map(row => {
        const checked = (row['Checkin'] || '').toLowerCase() === 'true';
        return `<tr class="${checked ? 'checked' : ''}">${keys.map(k => `<td class="px-3 py-2 border-t">${row[k] || ''}</td>`).join('')}</tr>`;
    }).join('') + '</tbody>';
    html += '</table>';
    dataTableContainer.innerHTML = html;
}

function markCheckin(code) {
    code = String(code).trim();
    const idx = dataTable.findIndex(r => String(r['Code']).trim() === code);
    if (idx === -1) return false;
    dataTable[idx]['Checkin'] = 'True';
    persistData();
    renderTable();
    return true;
}

function downloadCSV() {
    if (!dataTable || !dataTable.length) return;
    const keys = Object.keys(dataTable[0]);
    const lines = [keys.join(',')];
    dataTable.forEach(r => lines.push(keys.map(k => (r[k] || '').toString().replace(/\n/g, ' ')).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-table-updated.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function showStatusIcon(type) {
    if (!statusIcon) return;
    let config = {
        color: 'from-green-400 to-green-600',
        svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>'
    };
    if (type === 'warn') {
        config = { color: 'from-yellow-400 to-yellow-600', svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>' };
    } else if (type === 'error') {
        config = { color: 'from-red-400 to-red-600', svg: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path>' };
    }
    statusIcon.innerHTML = `\n                <div class="absolute inset-0 bg-gradient-to-br ${config.color} opacity-90"></div>\n                <svg class="w-14 h-14 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">${config.svg}</svg>\n            `;
    statusIcon.className = "mx-auto w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce relative overflow-hidden";
}

function showScanningUI() {
    if (!statusIcon) return;
    statusIcon.innerHTML = `\n                <div class="absolute inset-0 bg-white/10 border border-white/10"></div>\n                <svg class="w-12 h-12 text-red-400 animate-spin relative z-10" fill="none" viewBox="0 0 24 24"><circle class="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>\n            `;
    statusIcon.className = "mx-auto w-24 h-24 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden";
}

startBtn && startBtn.addEventListener('click', () => {
    initAudio();
    // Toggle continuous camera scanning
    if (!isScanning) {
        isScanning = true;
        if (resultContainer) resultContainer.classList.remove('hidden');
        showScanningUI();
        startBtn.innerHTML = "<span class='text-2xl'>⏸</span><span>Tắt Camera</span>";
        startBtn.style.opacity = "1";

        codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
            if (result) {
                const code = result.text.trim();
                const now = Date.now();
                if (code === lastDetected && (now - lastDetectedAt) < 3000) return; // ignore duplicate within 3s
                lastDetected = code;
                lastDetectedAt = now;
                console.log('Scanned code:', code);
                lastScannedText && (lastScannedText.innerText = code);
                const ok = markCheckin(code);
                if (ok) {
                    showStatusIcon('success');
                    playBeep('success');
                } else {
                    showStatusIcon('error');
                    playBeep('warn');
                }
            } else if (err && typeof ZXing !== 'undefined' && !(err instanceof ZXing.NotFoundException)) {
                console.debug('Decode error:', err);
            }
        });
    } else {
        // stop scanning
        codeReader.reset();
        isScanning = false;
        startBtn.innerHTML = "<span class='text-2xl'>▶</span><span>Bật Camera</span>";
        startBtn.style.opacity = "1";
        resultContainer && resultContainer.classList.add('hidden');
    }
});

resetBtn && resetBtn.addEventListener('click', () => {
    codeReader.reset();
    isScanning = false;
    startBtn && (startBtn.innerHTML = "<span class='text-2xl'>⚡</span><span>Bắt đầu quét</span>");
    startBtn && (startBtn.style.opacity = "1");
    resultContainer && resultContainer.classList.add('hidden');
    lastScannedText && (lastScannedText.innerText = "---");
});

refreshDataBtn && refreshDataBtn.addEventListener('click', async () => { await loadData(); renderTable(); });
downloadCsvBtn && downloadCsvBtn.addEventListener('click', downloadCSV);

// Initialize
loadData();