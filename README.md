# 🚀 Resource Distribution System

An automated resource distribution system powered by GitHub Actions and GitHub Pages.

## ✨ Features

* Automatically fetches the latest releases from multiple upstream projects
* Supports Linux AMD64 / ARM64 architectures
* Downloads, extracts, and keeps only core binaries
* Unified and obfuscated file naming (no original project names exposed)
* Auto-generates a clean HTML download page
* Outputs version metadata (`data.json`)
* Works with GitHub Pages + custom domain

---

## 📁 Structure

```text
/files/        Binary files (obfuscated names)
/index.html    Download page
/data.json     Version metadata
/sync.js       Sync & processing script
/generate.js   HTML generator
```

---

## ⚙️ Automation

Handled via GitHub Actions:

* Runs every 24 hours
* Syncs latest versions automatically
* Regenerates files and deploys

---

## 🌐 Access

```text
https://your-domain/
```

---

## ⚠️ Notes

* Only the latest versions are kept
* File names are standardized and anonymized
* Designed for lightweight distribution and automation
