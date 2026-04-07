const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data.json');
const HTML_FILE = path.join(__dirname, '../index.html');

function generateHTML() {
    if (!fs.existsSync(DATA_FILE)) return;
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let cardsHTML = '';

    for (const [code, info] of Object.entries(data)) {
        const dateStr = new Date(info.updated).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        cardsHTML += `
            <div class="card">
                <h2>Project <span>${code}</span></h2>
                <div class="info">
                    <p>VER: <code>${info.version}</code></p>
                    <p>UPD: <code>${dateStr}</code></p>
                </div>
                <div class="links">
                    <a href="./files/${code}_amd" class="btn amd">AMD64</a>
                    <a href="./files/${code}_arm" class="btn arm">ARM64</a>
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
    <title>Core Dist</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #e2e8f0; --accent: #38bdf8; --btn: #334155; --btn-hover: #475569; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: var(--bg); color: var(--text); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; padding: 2rem; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 2rem; color: var(--accent); font-size: 1.5rem; letter-spacing: 2px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .card { background: var(--card); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); border: 1px solid #334155; }
        .card h2 { font-size: 1.2rem; border-bottom: 1px solid var(--btn); padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .card h2 span { color: var(--accent); font-weight: bold; }
        .info p { font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.5rem; }
        .info code { background: #000; padding: 2px 6px; border-radius: 4px; color: #34d399; }
        .links { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .btn { flex: 1; text-align: center; padding: 0.6rem; border-radius: 6px; text-decoration: none; color: #fff; background: var(--btn); font-size: 0.9rem; transition: background 0.2s; }
        .btn:hover { background: var(--btn-hover); }
        .btn.amd { border-bottom: 2px solid #818cf8; }
        .btn.arm { border-bottom: 2px solid #f472b6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>CORE REPOSITORY</h1>
        <div class="grid">
            ${cardsHTML}
        </div>
    </div>
</body>
</html>
    `;

    fs.writeFileSync(HTML_FILE, htmlTemplate.trim());
    console.log('🌐 index.html generated.');
}

generateHTML();
