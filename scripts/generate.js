```javascript
const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, '../data.json');
const HTML_FILE = path.join(__dirname, '../index.html');
const FAKE_NAMES = {
    "S": "S-QV",       // sing-box
    "X": "X-NR",     // xray
    "C": "C-LM",      // cloudflared
    "K": "K-DS",      // komari
    "N": "N-OV",      // nezha
    "H": "H-RT",     // hy2
    "T": "T-QL"        // tuic
};
const ICONS = {
    cpu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`,
    tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
    clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
};
const NEW_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'%3E%3C/path%3E%3Cpolyline points='22,4 12,14.01 9,11.01'%3E%3C/polyline%3E%3C/svg%3E"; // 新图标：一个简化的监控/系统图标
function generateHTML() {
    if (!fs.existsSync(DATA_FILE)) return;
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let cardsHTML = '';
    for (const [code, info] of Object.entries(data)) {
        // Changed to English locale but kept Shanghai timezone
        const dateStr = new Date(info.updated).toLocaleString('en-US', { timeZone: 'Asia/Shanghai', hour12: false });
        const fakeName = FAKE_NAMES[code] || `sys-proc-${code}`;
        let actionsHTML = `
            <div class="action-row">
                <span class="arch-label amd">AMD64</span>
                <a href="./files/${code}_amd" class="btn dl-btn" download>${ICONS.download} Download</a>
                <button class="btn copy-btn" onclick="copyLink(this, '${code}_amd')" title="Copy Link">${ICONS.copy}</button>
            </div>
            <div class="action-row">
                <span class="arch-label arm">ARM64</span>
                <a href="./files/${code}_arm" class="btn dl-btn" download>${ICONS.download} Download</a>
                <button class="btn copy-btn" onclick="copyLink(this, '${code}_arm')" title="Copy Link">${ICONS.copy}</button>
            </div>
        `;
        if (code === 'T') {
            actionsHTML = `
                <div class="action-row">
                    <span class="arch-label amd">x86_64</span>
                    <a href="./files/T_amd64" class="btn dl-btn" download>${ICONS.download} Download</a>
                    <button class="btn copy-btn" onclick="copyLink(this, 'T_amd64')" title="Copy Link">${ICONS.copy}</button>
                </div>
            `;
        }
        cardsHTML += `
            <div class="card">
                <div class="card-header">
                    <div class="title-group">
                        <span class="icon-box">${ICONS.cpu}</span>
                        <h2>${fakeName}</h2>
                    </div>
                    <span class="status-dot"></span>
                </div>
                <div class="info">
                    <p class="tag">${ICONS.tag} <code>${info.version}</code></p>
                    <p class="time">${ICONS.clock} <code>${dateStr}</code></p>
                </div>
                <div class="actions">
                    ${actionsHTML}
                </div>
            </div>
        `;
    }
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Monitor</title>
    <link rel="icon" href="${NEW_FAVICON}">
    <style>
        :root {
            --glass-bg: rgba(25, 25, 30, 0.45);
            --glass-border: rgba(255, 255, 255, 0.12);
            --glass-highlight: rgba(255, 255, 255, 0.05);
            --text-main: rgba(255, 255, 255, 0.95);
            --text-sub: rgba(235, 235, 245, 0.6);
            --amd-color: #5e5ce6;
            --arm-color: #ff375f;
            --bg-api: url('https://t.alcy.cc/ycy');
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: #0f0f13 var(--bg-api) center/cover fixed no-repeat;
            color: var(--text-main);
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center; /* Ensures content centers perfectly on one screen */
            padding: 2rem 1.5rem;
            -webkit-font-smoothing: antialiased;
        }
        .overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.25);
            z-index: -1;
        }
        .container {
            max-width: 1400px; /* Increased width to fit 4 cards beautifully */
            width: 100%;
            margin: 0 auto;
        }
        h1 {
            text-align: center; margin-bottom: 2.5rem;
            font-size: 2rem; font-weight: 600; letter-spacing: 1px;
            color: var(--text-main);
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        .grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center; /* Creates the 4+3 staggered look */
            gap: 1.5rem;
        }
        .card {
            flex: 1 1 300px; /* Base width */
            max-width: 320px; /* Caps width so 4 fit in 1400px */
            background: var(--glass-bg);
            backdrop-filter: blur(25px) saturate(180%);
            -webkit-backdrop-filter: blur(25px) saturate(180%);
            border-radius: 20px;
            padding: 1.25rem; /* Slightly compact padding */
            border: 1px solid var(--glass-border);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }
        .card:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
            background: rgba(35, 35, 45, 0.55);
        }
        .card-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 1rem;
        }
        .title-group { display: flex; align-items: center; gap: 10px; }
        .icon-box {
            display: flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; border-radius: 8px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.05);
        }
        .icon-box svg { width: 18px; height: 18px; color: #fff; }
        .card h2 { font-size: 1.1rem; font-weight: 600; letter-spacing: 0.5px; }
        .status-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: #32d74b;
            box-shadow: 0 0 8px #32d74b;
        }
        .info {
            background: var(--glass-highlight);
            border-radius: 12px; padding: 0.8rem; margin-bottom: 1.2rem;
        }
        .info p {
            display: flex; align-items: center; gap: 8px;
            font-size: 0.85rem; color: var(--text-sub); margin-bottom: 0.5rem;
        }
        .info p:last-child { margin-bottom: 0; }
        .info svg { width: 14px; height: 14px; opacity: 0.8; }
        .info code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
            color: #fff; opacity: 0.9;
        }
        .actions { display: flex; flex-direction: column; gap: 0.8rem; }
        .action-row {
            display: flex; align-items: center; gap: 8px;
            background: rgba(0,0,0,0.2); padding: 6px; border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .arch-label {
            font-size: 0.75rem; font-weight: 700; padding: 4px 8px; border-radius: 8px;
            letter-spacing: 0.5px; width: 65px; text-align: center;
        }
        .arch-label.amd { background: rgba(94, 92, 230, 0.2); color: #8280ff; }
        .arch-label.arm { background: rgba(255, 55, 95, 0.2); color: #ff6b8b; }
        .btn {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            border: none; border-radius: 8px; cursor: pointer;
            text-decoration: none; color: #fff; font-size: 0.85rem; font-weight: 500;
            background: rgba(255,255,255,0.1);
            transition: all 0.2s; height: 30px;
        }
        .btn:hover { background: rgba(255,255,255,0.2); }
        .btn:active { transform: scale(0.95); }
        .btn svg { width: 15px; height: 15px; }
        .dl-btn { flex: 1; }
        .copy-btn { width: 38px; }
        .copy-btn.success { background: #32d74b; color: #000; }
        #toast {
            position: fixed; top: 30px; left: 50%; transform: translateX(-50%) translateY(-20px);
            background: rgba(30, 30, 30, 0.75); backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.15);
            color: #fff; padding: 10px 24px; border-radius: 30px;
            font-size: 0.9rem; font-weight: 500; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            opacity: 0; visibility: hidden; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 9999; display: flex; align-items: center; gap: 8px;
        }
        #toast.show { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
        @media (max-width: 1024px) {
            /* Falls back to smaller layout gracefully on smaller screens */
            .card { flex: 1 1 250px; }
        }
        @media (max-width: 768px) {
            .card { max-width: 100%; flex: 1 1 100%; }
            body { padding: 2rem 1rem; height: auto; display: block; }
        }
    </style>
</head>
<body>
    <div class="overlay"></div>
    <div id="toast"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#32d74b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Link copied to clipboard!</span></div>
    <div class="container">
        <h1>System Monitor</h1>
        <div class="grid">
            ${cardsHTML}
        </div>
    </div>
    <script>
        function showToast() {
            const toast = document.getElementById('toast');
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }
        function copyLink(btnElement, fileName) {
            const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
            const fullUrl = baseUrl + '/files/' + fileName;
            navigator.clipboard.writeText(fullUrl).then(() => {
                const originalHTML = btnElement.innerHTML;
                btnElement.classList.add('success');
                btnElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                showToast();
                setTimeout(() => {
                    btnElement.classList.remove('success');
                    btnElement.innerHTML = originalHTML;
                }, 2000);
            }).catch(err => {
                alert('Failed to copy. Please manually right-click the Download button to copy the link.');
            });
        }
    </script>
</body>
</html>
    `;
    fs.writeFileSync(HTML_FILE, htmlTemplate.trim());
    console.log('🌐 index.html generated with gorgeous macOS Style!');
}
generateHTML();
```
