let codeReader = null;
const body = document.body;
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const resultContainer = document.getElementById('result-container');
const lastScannedText = document.getElementById('last-scanned');
const statusIcon = document.getElementById('status-icon');
const resultOverlay = document.getElementById('result-overlay');
const resultPopup = document.getElementById('result-popup');
const popupName = document.getElementById('popup-name');
const popupCode = document.getElementById('popup-code');
const popupStatus = document.getElementById('popup-status');
const popupWelcome = document.getElementById('popup-welcome');
const dataTableContainer = document.getElementById('data-table-container');
const tabScanner = document.getElementById('tab-scanner');
const tabData = document.getElementById('tab-data');
const scannerTab = document.getElementById('scanner-tab');
const dataTab = document.getElementById('data-tab');
const refreshDataBtn = document.getElementById('refresh-data');
const downloadCsvBtn = document.getElementById('download-csv');
const manualOverlay = document.getElementById('manual-overlay');
const manualPopup = document.getElementById('manual-popup');
const manualCodeInput = document.getElementById('manual-code');
const manualNameInput = document.getElementById('manual-name');
const manualSubmitBtn = document.getElementById('manual-submit');
const manualCancelBtn = document.getElementById('manual-cancel');

let isScanning = false;
let audioCtx = null;
let dataTable = [];
let lastDetected = null;
let lastDetectedAt = 0;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Initialize ZXing reader from available UMD globals
function initReader() {
    if (codeReader) return true;
    // common UMD globals: ZXing, ZXingBrowser, BrowserMultiFormatReader
    try {
        if (window.ZXing && ZXing.BrowserMultiFormatReader) {
            codeReader = new ZXing.BrowserMultiFormatReader();
            return true;
        }
        if (window.ZXingBrowser && ZXingBrowser.BrowserMultiFormatReader) {
            codeReader = new ZXingBrowser.BrowserMultiFormatReader();
            return true;
        }
        if (window.BrowserMultiFormatReader) {
            codeReader = new window.BrowserMultiFormatReader();
            return true;
        }
    } catch (e) {
        console.warn('ZXing init error', e);
    }
    console.warn('ZXing library not found. Ensure <script src="https://unpkg.com/@zxing/library@latest"></script> is loaded before app scripts.');
    return false;
}

function playBeep(type) {
    initAudio();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    // richer sounds and vibration patterns per type
    const now = audioCtx.currentTime;
    if (type === 'success') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        oscillator.start(now); oscillator.stop(now + 0.45);
        try { if (navigator.vibrate) navigator.vibrate([40, 30, 40]); } catch (e) {}
    } else if (type === 'warn') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        oscillator.start(now); oscillator.stop(now + 0.6);
        try { if (navigator.vibrate) navigator.vibrate([60, 30, 60]); } catch (e) {}
    } else if (type === 'error') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        oscillator.start(now); oscillator.stop(now + 0.55);
        try { if (navigator.vibrate) navigator.vibrate([120, 40, 120]); } catch (e) {}
    } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        oscillator.start(now); oscillator.stop(now + 0.4);
        try { if (navigator.vibrate) navigator.vibrate([80, 30, 80]); } catch (e) {}
    }
}

// Light-mode and theme toggle removed — dark mode enforced globally.
body.classList.remove('light-mode');

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
    // Legacy behavior: prefer localStorage copy and only fetch network when there is no stored data.
    const stored = localStorage.getItem('dataTable');
    if (stored) {
        try {
            dataTable = JSON.parse(stored);
            return;
        } catch (e) {
            console.warn('Invalid stored data, will reload CSV from network', e);
        }
    }

    // No local copy or invalid — try loading initial CSV from network
    try {
        const resp = await fetch('../data/data-table.csv');
        if (resp && resp.ok) {
            const txt = await resp.text();
            dataTable = parseCSV(txt);
            persistData();
            return;
        }
    } catch (e) {
        console.error('Failed to load CSV from network', e);
    }

    dataTable = [];
}

// Refresh helper used by UI to explicitly fetch latest CSV from server and overwrite local copy
async function refreshDataFromNetwork() {
    const csvUrlBase = '../data/data-table.csv';
    const cacheBust = '_=' + Date.now();
    try {
        const resp = await fetch(csvUrlBase + '?' + cacheBust, { cache: 'no-store' });
        if (resp && resp.ok) {
            const txt = await resp.text();
            const parsed = parseCSV(txt);
            if (parsed && parsed.length) {
                dataTable = parsed;
                persistData();
                renderTable();
                console.log('CSV refreshed from network');
                return true;
            }
        }
        console.warn('Refresh request returned empty or non-OK');
    } catch (e) {
        console.warn('Network refresh failed', e);
    }
    return false;
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
        const checked = !!(row['Checkin'] && String(row['Checkin']).trim());
        return `<tr class="${checked ? 'checked' : ''}">${keys.map(k => `<td class="px-3 py-2 border-t">${row[k] || ''}</td>`).join('')}</tr>`;
    }).join('') + '</tbody>';
    html += '</table>';
    dataTableContainer.innerHTML = html;
}

// markCheckin: attempt to mark a checkin for `code`.
// If allowAdd === false, do NOT append unknown codes (used for scanning).
function markCheckin(code, providedName, allowAdd = true) {
    code = String(code).trim();
    const idx = dataTable.findIndex(r => String(r['Code']).trim() === code);
    const now = new Date().toLocaleString();
    if (idx === -1) {
        if (!allowAdd) {
            // caller doesn't want new rows created (scanner flow)
            return { status: 'not-found', name: providedName || '' };
        }
        // add new row with headers preserved if possible (manual flow)
        const keys = (dataTable && dataTable[0]) ? Object.keys(dataTable[0]) : ['Code', 'Ten', 'Checkin', 'New'];
        const newRow = {};
        keys.forEach(k => {
            if (k === 'Code') newRow[k] = code;
            else if (k === 'Checkin') newRow[k] = now;
            else if (k === 'New') newRow[k] = 'True';
            else if ((k === 'Ten' || k === 'Name') && providedName) newRow[k] = providedName;
            else newRow[k] = '';
        });
        dataTable.push(newRow);
        persistData();
        renderTable();
        return { status: 'ok', name: providedName || '' };
    }
    const name = dataTable[idx]['Ten'] || dataTable[idx]['Name'] || '';
    const already = !!(dataTable[idx]['Checkin'] && String(dataTable[idx]['Checkin']).trim());
    if (already) return { status: 'already', name };
    // if provided name and existing row has empty name, set it
    if (providedName && (!dataTable[idx]['Ten'] || !String(dataTable[idx]['Ten']).trim())) {
        if ('Ten' in dataTable[idx]) dataTable[idx]['Ten'] = providedName;
        else if ('Name' in dataTable[idx]) dataTable[idx]['Name'] = providedName;
    }
    dataTable[idx]['Checkin'] = now;
    persistData();
    renderTable();
    return { status: 'ok', name: providedName || name };
}

function showPopup({ status, name, code }) {
    if (!resultOverlay || !resultPopup) return;
    // populate
    popupName && (popupName.innerText = name || 'Unknown');
    popupCode && (popupCode.innerText = code || '---');
    // adjust welcome/title based on status
    if (popupWelcome) {
        if (status === 'not-found') popupWelcome.innerText = 'Not Registered';
        else popupWelcome.innerText = 'WELCOME';
    }
    if (status === 'ok') {
        popupStatus && (popupStatus.innerText = 'Chúc mừng — Check-in thành công');
        resultPopup.classList.remove('popup-warn', 'popup-error');
        resultPopup.classList.add('popup-success');
        // add success animation
        resultPopup.classList.remove('pop-animate','pulse-glow','pulse-scale','shake');
        void resultPopup.offsetWidth; // force reflow
        resultPopup.classList.add('pop-animate','pulse-glow');
        playBeep('success');
    } else if (status === 'already') {
        popupStatus && (popupStatus.innerText = 'Đã checkin trước đó');
        resultPopup.classList.remove('popup-success', 'popup-error');
        resultPopup.classList.add('popup-warn');
        resultPopup.classList.remove('pop-animate','pulse-glow','pulse-scale','shake');
        void resultPopup.offsetWidth;
        resultPopup.classList.add('pop-animate','pulse-scale');
        playBeep('warn');
    } else if (status === 'not-found') {
        popupName && (popupName.innerText = 'Chưa đăng ký');
        popupStatus && (popupStatus.innerText = 'Mã không khớp với danh sách');
        resultPopup.classList.remove('popup-success', 'popup-warn');
        resultPopup.classList.add('popup-error');
        resultPopup.classList.remove('pop-animate','pulse-glow','pulse-scale','shake');
        void resultPopup.offsetWidth;
        resultPopup.classList.add('pop-animate','shake');
        playBeep('error');
    }
    // show
    resultOverlay.classList.remove('hidden');
}

function hidePopup() {
    if (!resultOverlay) return;
    resultOverlay.classList.add('hidden');
}

// close when clicking outside popup
if (resultOverlay) {
    resultOverlay.addEventListener('click', (e) => {
        if (e.target === resultOverlay) hidePopup();
    });
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
        // ensure ZXing reader is ready
        if (!initReader()) {
            console.warn('Cannot start scanner: ZXing reader not available');
            // optional: show small UI feedback
            const apiStatus = document.getElementById('api-status');
            if (apiStatus) apiStatus.innerText = 'ZXing library missing';
            return;
        }
        isScanning = true;
        if (resultContainer) resultContainer.classList.remove('hidden');
        showScanningUI();
        startBtn.innerHTML = "<span class='text-2xl'>⏸</span><span>Tắt Camera</span>";
        startBtn.style.opacity = "1";

        codeReader && codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
                if (result) {
                const code = result.text.trim();
                const now = Date.now();
                if (code === lastDetected && (now - lastDetectedAt) < 3000) return; // ignore duplicate within 3s
                lastDetected = code;
                lastDetectedAt = now;
                console.log('Scanned code:', code);
                lastScannedText && (lastScannedText.innerText = code);
                // When scanning, do not auto-add unknown codes; allowAdd = false
                const ok = markCheckin(code, undefined, false);
                // ok is an object now
                if (ok && ok.status) {
                    if (ok.status === 'ok') {
                        showStatusIcon('success');
                        playBeep('success');
                    } else if (ok.status === 'already') {
                        showStatusIcon('warn');
                        playBeep('warn');
                        } else if (ok.status === 'not-found') {
                            showStatusIcon('error');
                            playBeep('warn');
                        } else {
                            showStatusIcon('error');
                            playBeep('warn');
                    }
                    // show popup with name/code/status
                    showPopup({ status: ok.status, name: ok.name, code });
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

// Open manual input popup on button click
resetBtn && resetBtn.addEventListener('click', () => {
    if (!manualOverlay || !manualPopup) return;
    manualOverlay.classList.remove('hidden');
    // clear inputs
    manualCodeInput && (manualCodeInput.value = '');
    manualNameInput && (manualNameInput.value = '');
    setTimeout(() => { manualCodeInput && manualCodeInput.focus(); }, 50);
});

// Cancel manual popup
manualCancelBtn && manualCancelBtn.addEventListener('click', () => {
    if (manualOverlay) manualOverlay.classList.add('hidden');
});

// close manual popup when clicking outside
manualOverlay && manualOverlay.addEventListener('click', (e) => {
    if (e.target === manualOverlay) manualOverlay.classList.add('hidden');
});

// Submit manual checkin
manualSubmitBtn && manualSubmitBtn.addEventListener('click', () => {
    const code = manualCodeInput ? String(manualCodeInput.value || '').trim() : '';
    const name = manualNameInput ? String(manualNameInput.value || '').trim() : '';
    if (!/^\d{10}$/.test(code)) {
        alert('Mã không hợp lệ. Vui lòng nhập đúng 10 chữ số.');
        manualCodeInput && manualCodeInput.focus();
        return;
    }
    const res = markCheckin(code, name);
    if (res && res.status) {
        if (res.status === 'ok') showStatusIcon('success');
        else if (res.status === 'already') showStatusIcon('warn');
        else showStatusIcon('error');
        showPopup({ status: res.status, name: res.name || name, code });
    }
    if (manualOverlay) manualOverlay.classList.add('hidden');
});

refreshDataBtn && refreshDataBtn.addEventListener('click', async () => {
    const ok = await refreshDataFromNetwork();
    if (!ok) {
        // fallback: ensure we at least load stored data
        await loadData();
        renderTable();
    }
});
downloadCsvBtn && downloadCsvBtn.addEventListener('click', downloadCSV);

// Initialize
loadData();