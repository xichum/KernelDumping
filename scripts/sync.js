const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const tar = require('tar');
const AdmZip = require('adm-zip');
const { execSync } = require('child_process');

const TOKEN = process.env.GITHUB_TOKEN;
const FILES_DIR = path.join(__dirname, '../files');
const TMP_DIR = path.join(__dirname, '../tmp');
const DATA_FILE = path.join(__dirname, '../data.json');

const UPSTREAMS = [
    {
        repo: "SagerNet/sing-box", code: "S", bin: "sing-box",
        matchers: {
            amd: (n) => n.includes('linux-amd64-glibc.tar.gz'),
            amdm: (n) => n.includes('linux-amd64-musl.tar.gz'),
            arm: (n) => n.includes('linux-arm64-glibc.tar.gz'),
            armm: (n) => n.includes('linux-arm64-musl.tar.gz')
        }
    },
    {
        repo: "XTLS/Xray-core", code: "X", bin: "xray",
        matchers: {
            amd: (n) => n === 'Xray-linux-64.zip',
            arm: (n) => n === 'Xray-linux-arm64-v8a.zip'
        }
    },
    {
        repo: "cloudflare/cloudflared", code: "C", bin: "cloudflared",
        matchers: {
            amd: (n) => n === 'cloudflared-linux-amd64',
            arm: (n) => n === 'cloudflared-linux-arm64'
        }
    },
    {
        repo: "apernet/hysteria", code: "H", bin: "hysteria",
        matchers: {
            amd: (n) => n === 'hysteria-linux-amd64',
            arm: (n) => n === 'hysteria-linux-arm64'
        }
    },
    {
        repo: "Itsusinn/tuic", code: "T", bin: "tuic-server",
        matchers: {
            amd: (n) => n.includes('tuic-server-x86_64-linux') && !n.includes('musl'),
            amdm: (n) => n.includes('tuic-server-x86_64-linux-musl'),
            arm: (n) => n.includes('tuic-server-aarch64-linux') && !n.includes('musl'),
            armm: (n) => n.includes('tuic-server-aarch64-linux-musl')
        }
    },
    {
        repo: "nezhahq/agent", code: "N", bin: "nezha-agent",
        matchers: {
            amd: (n) => n.includes('linux_amd64.zip'),
            arm: (n) => n.includes('linux_arm64.zip')
        }
    },
    {
        repo: "komari-monitor/komari-agent", code: "K", bin: "komari-agent",
        matchers: {
            amd: (n) => n.includes('linux_amd64.tar.gz') && !n.includes('bsd'),
            arm: (n) => n.includes('linux_arm64.tar.gz') && !n.includes('bsd')
        }
    }
];

const api = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 Node Sync',
        ...(TOKEN ? { Authorization: `token ${TOKEN}` } : {})
    },
    timeout: 30000
});

async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try { return await api(url, options); } 
        catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

function findCoreBinary(dir, expectedBinName) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const res = findCoreBinary(fullPath, expectedBinName);
            if (res) return res;
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.txt', '.md', '.json', '.yml', '.yaml', '.service'].includes(ext)) continue;
            if (file.toLowerCase().includes(expectedBinName.toLowerCase()) || ext === '') return fullPath;
        }
    }
    return null;
}

async function processProject(project, versionData) {
    try {
        const { data: releases } = await fetchWithRetry(`https://api.github.com/repos/${project.repo}/releases`);
        const release = releases.find(r => !r.prerelease) || releases[0];
        let version = release.tag_name;
        if (version.includes('/')) version = version.split('/').pop();

        const downloadedArchs = [];

        for (const [archKey, matcher] of Object.entries(project.matchers)) {
            const asset = release.assets.find(a => matcher(a.name));
            if (!asset) continue;

            const dlPath = path.join(TMP_DIR, asset.name);
            const extDir = path.join(TMP_DIR, `ext_${project.code}_${archKey}`);
            fs.ensureDirSync(extDir);

            const response = await fetchWithRetry(asset.browser_download_url, { responseType: 'stream' });
            const writer = fs.createWriteStream(dlPath);
            response.data.pipe(writer);
            await new Promise((res, rej) => { writer.on('finish', res); writer.on('error', rej); });

            let binarySource = dlPath;
            const assetNameLower = asset.name.toLowerCase();

            if (assetNameLower.endsWith('.tar.gz') || assetNameLower.endsWith('.tgz')) {
                await tar.x({ file: dlPath, cwd: extDir });
                binarySource = findCoreBinary(extDir, project.bin);
            } else if (assetNameLower.endsWith('.zip')) {
                const zip = new AdmZip(dlPath);
                zip.extractAllTo(extDir, true);
                binarySource = findCoreBinary(extDir, project.bin);
            } else if (assetNameLower.endsWith('.gz') && !assetNameLower.endsWith('.tar.gz')) {
                execSync(`gunzip -c "${dlPath}" > "${path.join(extDir, project.bin)}"`);
                binarySource = path.join(extDir, project.bin);
            }

            if (!binarySource) continue;

            const finalPath = path.join(FILES_DIR, `${project.code}_${archKey}`);
            fs.copySync(binarySource, finalPath);
            fs.chmodSync(finalPath, 0o755);

            try { execSync(`strip -s "${finalPath}" || true`, { stdio: 'ignore' }); } catch {}
            downloadedArchs.push(archKey);
        }

        if (downloadedArchs.length > 0) {
            versionData[project.code] = {
                version,
                updated: new Date().toISOString(),
                archs: downloadedArchs
            };
        }
    } catch (e) {}
}

async function main() {
    fs.emptyDirSync(FILES_DIR);
    fs.emptyDirSync(TMP_DIR);
    const versionData = {};
    for (const p of UPSTREAMS) await processProject(p, versionData);
    fs.writeJsonSync(DATA_FILE, versionData, { spaces: 2 });
    fs.removeSync(TMP_DIR);
}

main();
