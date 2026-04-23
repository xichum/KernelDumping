const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data.json');
const HTML_FILE = path.join(__dirname, '../index.html');

const NAME_MAP = {
    "S": "Sing-box", "X": "Xray-core", "C": "Cloudflared",
    "K": "Komari-agent", "N": "Nezha-agent", "H": "Hysteria", "T": "Tuic"
};

function generateHTML() {
    if (!fs.existsSync(DATA_FILE)) return;
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let cardsHTML = '';

    for (const [code, info] of Object.entries(data)) {
        const dateStr = new Date(info.updated).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const fullName = NAME_MAP[code] || code;

        cardsHTML += `
            <div class="card">
                <div class="card-header">
                    <h2>${fullName}</h2>
                    <span class="badge">${code}</span>
                </div>
                <div class="info">
                    <p><i>🔖</i> VER: <code>${info.version}</code></p>
                    <p><i>🕒</i> UPD: <code>${dateStr}</code></p>
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
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>✨ Core Repository</title>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root { 
            --accent: #38bdf8; 
            --text: #f8fafc;
            --glass-bg: rgba(15, 23, 42, 0.65);
            --glass-border: rgba(255, 255, 255, 0.15);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
            background: url('https://api.vvhan.com/api/wallpaper/acg') center/cover fixed no-repeat;
            color: var(--text); 
            font-family: 'Noto Sans SC', 'Fira Code', ui-monospace, monospace;
            min-height: 100vh;
        }

        .overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.15); z-index: -1;
        }

        .container { max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem; position: relative; z-index: 1; }
        
        h1 { 
            text-align: center; margin-bottom: 3rem; color: #fff; 
            font-size: 2.2rem; letter-spacing: 3px; 
            text-shadow: 0 4px 15px rgba(0,0,0,0.8), 0 0 20px var(--accent);
        }

        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
            gap: 1.8rem; 
        }

        .card { 
            background: var(--glass-bg); 
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 16px; 
            padding: 1.5rem; 
            border: 1px solid var(--glass-border);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3); 
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
            overflow: hidden;
        }
        
        .card::before {
            content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
            background: var(--accent); transition: width 0.3s ease; opacity: 0.8;
        }

        .card:hover { 
            transform: translateY(-8px); 
            box-shadow: 0 12px 40px rgba(56, 189, 248, 0.4);
            border-color: rgba(56, 189, 248, 0.4);
        }
        
        .card:hover::before { width: 100%; opacity: 0.05; }

        .card-header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid var(--glass-border);
            padding-bottom: 0.8rem; margin-bottom: 1rem;
        }

        .card h2 { font-size: 1.3rem; font-weight: 700; color: #fff; }
        
        .badge {
            background: var(--accent); color: #0f172a; font-weight: 900;
            padding: 3px 12px; border-radius: 8px; font-size: 0.9rem;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
        }

        .info p { font-size: 0.9rem; color: #cbd5e1; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 8px; }
        .info i { font-style: normal; }
        .info code { 
            background: rgba(0,0,0,0.5); padding: 3px 8px; 
            border-radius: 6px; color: #34d399; font-family: 'Fira Code', monospace;
        }

        .links { display: flex; gap: 1rem; margin-top: 1.5rem; }
        
        .btn { 
            flex: 1; text-align: center; padding: 0.7rem; border-radius: 8px; 
            text-decoration: none; color: #fff; font-weight: 600;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2);
            transition: all 0.2s ease;
        }
        
        .btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
        .btn.amd { border-bottom: 3px solid #818cf8; }
        .btn.arm { border-bottom: 3px solid #f472b6; }
        
        @media (max-width: 600px) {
            .grid { grid-template-columns: 1fr; }
            h1 { font-size: 1.8rem; }
        }
    </style>
</head>
<body>
    <div class="overlay"></div>
    <div class="container">
        <h1>✨ CORE REPOSITORY</h1>
        <div class="grid">
            ${cardsHTML}
        </div>
    </div>
</body>
</html>
    `;

    fs.writeFileSync(HTML_FILE, htmlTemplate.trim());
    console.log('🌐 index.html generated with Anime UI!');
}

generateHTML();
