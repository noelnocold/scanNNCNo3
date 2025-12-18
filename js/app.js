if ('serviceWorker' in navigator) {
    // Chỉ lắng nghe thông điệp từ Service Worker, không đăng ký lại
    navigator.serviceWorker.addEventListener('message', event => {
        const log = document.getElementById('sw-log');
        const message = event.data;

        if (message.type === 'CACHE_HIT') {
            const li = document.createElement('li');
            li.textContent = `Cache hit: ${message.url}`;
            log.appendChild(li);
        } else if (message.type === 'NETWORK_FETCH') {
            const li = document.createElement('li');
            li.textContent = `Network fetch: ${message.url}`;
            log.appendChild(li);
        }
    });
}


// Inject CSS at runtime so the page has no static <style> block
(function () {
    const css = `
                #action-btn-SYS {
                    position: fixed;
                    top: 24px;
                    left: 24px;
                    z-index: 1000;
                    width: 48px;
                    height: 48px;
                    background: var(--md-sys-color-primary); /* Màu chính */
                    color: var(--md-sys-color-on-primary); /* Màu nội dung trên nền chính */
                    border: 0;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
                    -webkit-tap-highlight-color: transparent;
                    font: inherit;
                }
                #action-btn-SYS:hover {
                    background: var(--md-sys-color-primary-container); /* Màu nền khi hover */
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
                    transform: translateY(-3px);
                }
                #action-btn-SYS:active {
                    transform: translateY(-1px);
                }
                #action-tab-SYS {
                    position: fixed;
                    top: 80px;
                    left: 32px;
                    z-index: 1001;
                    background: var(--md-sys-color-surface); /* Màu nền bề mặt */
                    color: var(--md-sys-color-on-surface); /* Màu nội dung trên bề mặt */
                    border-radius: 12px;
                    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.18);
                    padding: 20px 18px;
                    display: none;
                    flex-direction: column;
                    gap: 18px;
                    max-width: 360px;
                    width: 360px;
                    min-width: 220px;
                    transition: opacity 180ms ease, transform 180ms ease;
                    opacity: 0;
                    transform: translateY(-6px) scale(.995);
                    font: inherit;
                }
                #action-tab-SYS.open {
                    display: flex;
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                .action-tab-header-SYS {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .action-tab-title-SYS {
                    font-weight: bold;
                    font-size: 1.05rem;
                    color: var(--md-sys-color-on-surface); /* Màu nội dung */
                }
                .action-tab-close-SYS {
                    background: none;
                    border: 0;
                    font-size: 1.3rem;
                    cursor: pointer;
                    padding: 6px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--md-sys-color-on-surface); /* Màu nội dung */
                }
                #action-tab-SYS button,
                #action-tab-SYS input,
                #action-tab-SYS select,
                #action-tab-SYS textarea {
                    font: inherit;
                }
                #action-tab-SYS button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 100px; /* Pill shape */
                    cursor: pointer;
                    font-size: 0.9em;
                    font-weight: 700; /* Bolder for Noto Sans Mono */
                    transition: box-shadow 0.2s, transform 0.2s, background-color 0.3s ease, color 0.3s ease;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 1px rgba(0, 0, 0, 0.08);
                    margin: 5px;
                    letter-spacing: 0.5px; /* Slightly more spacing for mono */
                    text-transform: uppercase;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                #action-tab-SYS button:hover {
                    background-color: var(--md-sys-color-primary-container); /* Hover background */
                    color: var(--md-sys-color-on-primary-container); /* Hover text color */
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                    transform: translateY(-2px);
                }

                #action-tab-SYS button:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
                }

                #action-tab-SYS.compact {
                    width: 50vw;
                    max-width: none;
                    left: 50%;
                    transform: translateX(-50%) translateY(0);
                }
                @media (max-width: 600px) {
                    #action-tab-SYS {
                        left: 50%;
                        transform: translateX(-50%);
                        width: 50vw;
                        max-width: none;
                    }
                }
                .hidden {
                    display: none !important;
                }
            `;
    const s = document.createElement('style');
    s.setAttribute('data-injected', 'true');
    s.textContent = css;
    document.head.appendChild(s);
})();

// Tạo nút mở tab chức năng (no inline styles; CSS above controls appearance)
const actionBtn = document.createElement('button');
actionBtn.id = 'action-btn-SYS';
actionBtn.title = 'Chức năng';
actionBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:32px;">settings</span>`;

document.body.appendChild(actionBtn);

// Tạo tab chức năng (no inline styles)
const tab = document.createElement('div');
tab.id = 'action-tab-SYS';
tab.setAttribute('aria-hidden', 'true');
tab.innerHTML = `
            <div class="action-tab-header-SYS">
                <span class="action-tab-title-SYS">Chức năng</span>
                <button id="close-tab-SYS" class="action-tab-close-SYS" aria-label="Đóng">&times;</button>
            </div>
            <div id="tab-auth">
            </div>
            <div id="tab-update">
                <button id="update-sw" type="button">Check for Updates</button>
            </div>
        `;
document.body.appendChild(tab);

// Responsive: toggle compact class instead of inline styles
function adjustTabSize() {
    if (window.innerWidth <= 600) {
        tab.classList.add('compact');
    } else {
        tab.classList.remove('compact');
    }
}
window.addEventListener('resize', adjustTabSize);
adjustTabSize();

// Open / close using class .open
function openTab() {
    tab.classList.add('open');
    tab.setAttribute('aria-hidden', 'false');
    const firstFocusable = tab.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
}
function closeTab() {
    tab.classList.remove('open');
    tab.setAttribute('aria-hidden', 'true');
    actionBtn.focus();
}

// Sự kiện nút Check for Updates
tab.querySelector('#update-sw').addEventListener('click', () => {
    window.location.href = '/app/Views/update-progress.html';
});
actionBtn.addEventListener('click', () => openTab());
tab.querySelector('#close-tab-SYS').addEventListener('click', () => closeTab());

// Click-outside-to-close: close the tab when clicking anywhere outside the tab while it's open
document.addEventListener('click', (e) => {
    if (!tab.classList.contains('open')) return; // only when open
    const path = e.composedPath ? e.composedPath() : (e.path || []);
    // If event target is inside the tab or is the action button, do nothing
    if (path.includes(tab) || path.includes(actionBtn)) return;
    closeTab();
}, true);

// Preserve update button behavior (in test this will navigate if the path exists)
const updateBtn = tab.querySelector('#update-sw');
updateBtn.addEventListener('click', () => {
    window.location.href = '/app/Views/update-progress.html';
});
