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
    { repo: "SagerNet/sing-box", code: "S", bin: "sing-box" },
    { repo: "XTLS/Xray-core", code: "X", bin: "xray" },
    { repo: "cloudflare/cloudflared", code: "C", bin: "cloudflared" },
    { repo: "komari-monitor/komari-agent", code: "K", bin: "komari-agent" },
    { repo: "nezhahq/agent", code: "N", bin: "nezha-agent" },
    { repo: "apernet/hysteria", code: "H", bin: "hysteria" },
    { repo: "Itsusinn/tuic", code: "T", bin: "tuic" }
];

const ARCHS = ['amd', 'arm'];

const api = axios.create({
    headers: TOKEN ? { Authorization: `token ${TOKEN}` } : {},
    timeout: 30000
});

async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try { return await api(url, options); } 
        catch (e) { if (i === retries - 1) throw e; await new Promise(r => setTimeout(r, 2000)); }
    }
}

function findAsset(assets, arch) {
    return assets.find(a => {
        const n = a.name.toLowerCase();
        if (n.includes('windows') || n.includes('darwin') || n.includes('bsd') || n.includes('mips') || 
            n.includes('deb') || n.includes('rpm') || n.includes('sha256') || n.includes('sig') || 
            n.includes('txt') || n.includes('apk')) return false;
        if (!n.includes('linux')) return false;

        if (arch === 'amd') {
            return (n.includes('amd64') || n.includes('x86_64') || n.includes('-64')) && !n.includes('arm');
        } else if (arch === 'arm') {
            return n.includes('arm64') || n.includes('aarch64');
        }
        return false;
    });
}

function findCoreBinary(dir, expectedBinName) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            const res = findCoreBinary(fullPath, expectedBinName);
            if (res) return res;
        } else {
            const ext = path.extname(file).toLowerCase();
            const badExts = ['.txt', '.md', '.json', '.yml', '.yaml', '.html', '.service', '.sh'];
            
            if (badExts.includes(ext)) continue;
            if (stat.size < 1024 * 1024) continue;
            
            if (file.toLowerCase().includes(expectedBinName.toLowerCase())) return fullPath;
            if (ext === '') return fullPath;
        }
    }
    return null;
}

async function processProject(project, versionData) {
    console.log(`\n🔍 Fetching latest STABLE info for [${project.code}] ...`);
    try {
        const { data: releases } = await fetchWithRetry(`https://api.github.com/repos/${project.repo}/releases`);
        const release = releases.find(r => !r.prerelease) || releases[0];
        const version = release.tag_name;
        
        versionData[project.code] = {
            version: version,
            updated: new Date().toISOString()
        };

        for (const arch of ARCHS) {
            const asset = findAsset(release.assets, arch);
            if (!asset) {
                console.log(`⚠️  [${project.code}] No matching asset found for ${arch}`);
                continue;
            }

            console.log(`📦 [${project.code}_${arch}] Downloading: ${asset.name}`);
            const dlPath = path.join(TMP_DIR, asset.name);
            const extDir = path.join(TMP_DIR, `ext_${project.code}_${arch}`);
            fs.ensureDirSync(extDir);

            const response = await fetchWithRetry(asset.browser_download_url, { responseType: 'stream' });
            const writer = fs.createWriteStream(dlPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            let binarySource = dlPath;
            if (asset.name.endsWith('.tar.gz')) {
                await tar.x({ file: dlPath, cwd: extDir });
                binarySource = findCoreBinary(extDir, project.bin);
            } else if (asset.name.endsWith('.zip')) {
                const zip = new AdmZip(dlPath);
                zip.extractAllTo(extDir, true);
                binarySource = findCoreBinary(extDir, project.bin);
            } else if (asset.name.endsWith('.gz') && !asset.name.endsWith('.tar.gz')) {
                execSync(`gunzip -c ${dlPath} > ${path.join(extDir, project.bin)}`);
                binarySource = path.join(extDir, project.bin);
            }

            if (!binarySource) {
                console.error(`❌ [${project.code}_${arch}] Could not locate core binary in archive.`);
                continue;
            }

            const finalPath = path.join(FILES_DIR, `${project.code}_${arch}`);
            fs.copySync(binarySource, finalPath);

            fs.chmodSync(finalPath, 0o755);
            try {
                execSync(`strip -s ${finalPath} || aarch64-linux-gnu-strip -s ${finalPath} || true`, { stdio: 'ignore' });
                console.log(`✅ [${project.code}_${arch}] Processed and saved.`);
            } catch (e) {
                console.log(`✅ [${project.code}_${arch}] Saved (Strip skipped).`);
            }
        }
    } catch (error) {
        console.error(`❌ Error processing [${project.code}]:`, error.message);
    }
}

async function main() {
    fs.emptyDirSync(FILES_DIR); 
    fs.emptyDirSync(TMP_DIR);   
    
    const versionData = {};

    for (const project of UPSTREAMS) {
        await processProject(project, versionData);
    }

    fs.writeJsonSync(DATA_FILE, versionData, { spaces: 2 });
    console.log(`\n💾 data.json generated.`);
    
    fs.removeSync(TMP_DIR); 
}

main();
