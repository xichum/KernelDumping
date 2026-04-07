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

// 映射表：真实仓库 -> 隐蔽代号
const UPSTREAMS = [
    { repo: "SagerNet/sing-box", code: "S", bin: "sing-box" },
    { repo: "XTLS/Xray-core", code: "X", bin: "xray" },
    { repo: "cloudflare/cloudflared", code: "C", bin: "cloudflared" },
    { repo: "komari-monitor/komari-agent", code: "K", bin: "komari-agent" },
    { repo: "naiba/nezha-agent", code: "N", bin: "nezha-agent" }
];

const ARCHS = ['amd', 'arm'];

// axios 配置，包含重试和 Token
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

// 智能匹配资源包
function findAsset(assets, arch) {
    return assets.find(a => {
        const n = a.name.toLowerCase();
        // 排除无关平台和格式
        if (n.includes('windows') || n.includes('darwin') || n.includes('bsd') || n.includes('mips') || 
            n.includes('deb') || n.includes('rpm') || n.includes('sha256') || n.includes('sig')) return false;
        if (!n.includes('linux')) return false;

        if (arch === 'amd') {
            return (n.includes('amd64') || n.includes('x86_64') || n.includes('-64')) && !n.includes('arm');
        } else if (arch === 'arm') {
            return n.includes('arm64') || n.includes('aarch64');
        }
        return false;
    });
}

// 递归查找核心可执行文件
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
            if (stat.size < 1024 * 1024) continue; // 小于1MB忽略
            
            // 首选：名字精准匹配
            if (file.toLowerCase().includes(expectedBinName.toLowerCase())) return fullPath;
            // 备选：无扩展名的大文件
            if (ext === '') return fullPath;
        }
    }
    return null;
}

async function processProject(project, versionData) {
    console.log(`\n🔍 Fetching latest info for [${project.code}] ...`);
    try {
        const { data: release } = await fetchWithRetry(`https://api.github.com/repos/${project.repo}/releases/latest`);
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

            // 下载文件
            const response = await fetchWithRetry(asset.browser_download_url, { responseType: 'stream' });
            const writer = fs.createWriteStream(dlPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // 解压逻辑
            let binarySource = dlPath;
            if (asset.name.endsWith('.tar.gz')) {
                await tar.x({ file: dlPath, cwd: extDir });
                binarySource = findCoreBinary(extDir, project.bin);
            } else if (asset.name.endsWith('.zip')) {
                const zip = new AdmZip(dlPath);
                zip.extractAllTo(extDir, true);
                binarySource = findCoreBinary(extDir, project.bin);
            }

            if (!binarySource) {
                console.error(`❌ [${project.code}_${arch}] Could not locate core binary in archive.`);
                continue;
            }

            // 移动并重命名（隐蔽化）
            const finalPath = path.join(FILES_DIR, `${project.code}_${arch}`);
            fs.copySync(binarySource, finalPath);

            // 授权并脱壳 (减小体积)
            fs.chmodSync(finalPath, 0o755);
            try {
                // 使用跨平台支持的 strip 
                execSync(`strip -s ${finalPath} || aarch64-linux-gnu-strip -s ${finalPath} || true`, { stdio: 'ignore' });
                console.log(`✅ [${project.code}_${arch}] Stripped and saved.`);
            } catch (e) {
                console.log(`✅ [${project.code}_${arch}] Saved (Strip skipped).`);
            }
        }
    } catch (error) {
        console.error(`❌ Error processing [${project.code}]:`, error.message);
    }
}

async function main() {
    fs.emptyDirSync(FILES_DIR); // 清空旧文件
    fs.emptyDirSync(TMP_DIR);   // 准备临时目录
    
    const versionData = {};

    for (const project of UPSTREAMS) {
        await processProject(project, versionData);
    }

    // 保存 JSON
    fs.writeJsonSync(DATA_FILE, versionData, { spaces: 2 });
    console.log(`\n💾 data.json generated.`);
    
    fs.removeSync(TMP_DIR); // 清理临时文件
}

main();
