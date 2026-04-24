const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data.json');
const HTML_FILE = path.join(__dirname, '../index.html');

const FAKE_NAMES = {
    "S": "S-QV",
    "X": "X-NR",
    "C": "C-LM",
    "K": "K-DS",
    "N": "N-OV",
    "H": "H-RT",
    "T": "T-QL"
};

const ICONS = {
    cpu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`,

    tag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,

    clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,

    download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,

    copy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
};

function generateHTML() {
    if (!fs.existsSync(DATA_FILE)) return;

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let cardsHTML = '';

    for (const [code, info] of Object.entries(data)) {

        const dateStr = new Date(info.updated).toLocaleString('en-US', {
            timeZone: 'Asia/Shanghai',
            hour12: false
        });

        const fakeName = FAKE_NAMES[code] || `sys-proc-${code}`;

        const isTuic = code === "T";

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

                    ${
                        isTuic
                        ? `
                        <!-- TUIC unified -->
                        <div class="action-row">
                            <span class="arch-label amd">ALL</span>
                            <a href="./files/${code}_amd" class="btn dl-btn" download>
                                ${ICONS.download} Download
                            </a>
                            <button class="btn copy-btn" onclick="copyLink(this, '${code}_amd')" title="Copy Link">
                                ${ICONS.copy}
                            </button>
                        </div>
                        `
                        : `
                        <!-- AMD -->
                        <div class="action-row">
                            <span class="arch-label amd">AMD64</span>
                            <a href="./files/${code}_amd" class="btn dl-btn" download>
                                ${ICONS.download} Download
                            </a>
                            <button class="btn copy-btn" onclick="copyLink(this, '${code}_amd')" title="Copy Link">
                                ${ICONS.copy}
                            </button>
                        </div>

                        <!-- ARM -->
                        <div class="action-row">
                            <span class="arch-label arm">ARM64</span>
                            <a href="./files/${code}_arm" class="btn dl-btn" download>
                                ${ICONS.download} Download
                            </a>
                            <button class="btn copy-btn" onclick="copyLink(this, '${code}_arm')" title="Copy Link">
                                ${ICONS.copy}
                            </button>
                        </div>
                        `
                    }

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

    <link rel="icon" href="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f5a5.png">

    <style>
        :root {
            --glass-bg: rgba(25, 25, 30, 0.45);
            --glass-border: rgba(255, 255, 255, 0.12);
            --text-main: rgba(255, 255, 255, 0.95);
            --text-sub: rgba(235, 235, 245, 0.6);
            --amd-color: #5e5ce6;
            --arm-color: #ff375f;
            --bg-api: url('https://t.alcy.cc/ycy');
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: #0f0f13 var(--bg-api) center/cover fixed no-repeat;
            color: var(--text-main);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            min-height: 100vh;
            padding: 2rem 1.5rem;
        }

        .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.25);
            z-index: -1;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        h1 {
            text-align: center;
            margin-bottom: 2.5rem;
            font-size: 2rem;
        }

        .grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.5rem;
        }

        .card {
            flex: 1 1 300px;
            max-width: 320px;
            background: var(--glass-bg);
            backdrop-filter: blur(25px);
            border-radius: 20px;
            padding: 1.25rem;
            border: 1px solid var(--glass-border);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
        }

        .action-row {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .arch-label {
            width: 65px;
            text-align: center;
            font-size: 0.75rem;
        }

        .dl-btn {
            flex: 1;
        }
    </style>
</head>

<body>
<div class="overlay"></div>

<div class="container">
    <h1>System Monitor</h1>
    <div class="grid">
        ${cardsHTML}
    </div>
</div>

<script>
function copyLink(btn, file) {
    const base = window.location.href.replace(/\\/[^\\/]*$/, '');
    const url = base + '/files/' + file;

    navigator.clipboard.writeText(url);

    btn.innerHTML = '✓';
    setTimeout(() => btn.innerHTML = '⧉', 1500);
}
</script>

</body>
</html>
`;

    fs.writeFileSync(HTML_FILE, htmlTemplate.trim());
    console.log('🌐 index.html generated (TUIC unified + new favicon)');
}

generateHTML();
