#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".cursor",
  ".cache",
  "coverage",
  "tmp",
  "logs"
]);

const IGNORE_FILES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock"
]);

const PATTERNS = [
  { name: "Stripe secret", regex: /sk_(?:live|test|proj|rk|pat)[0-9A-Za-z]{20,}/g },
  { name: "Google API key", regex: /AIza[0-9A-Za-z\-_]{35}/g },
  { name: "GitHub token", regex: /gh[pousr]_[0-9A-Za-z]{36,}/g },
  { name: "Render API key", regex: /rnd_[0-9A-Za-z]{32,}/g },
  { name: "Supabase service key", regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[0-9A-Za-z_-]+\.[0-9A-Za-z_-]+/g },
  { name: "Generic secret token", regex: /\b(?:secret|token|api[_-]?key)[^=\n]{0,20}["']?[=:]["']?[A-Za-z0-9-_]{24,}\b/gi }
];

const findings = [];

const WHITELIST = [
  "sk_test_your_stripe_secret_key",
  "whsec_your_webhook_secret",
  "re_your_resend_api_key",
  "rnd_your_render_service_id",
  "your_openai_api_key_here",
  "your-service-role-key-here"
];

function maskValue(value) {
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function isWhitelisted(value) {
  return WHITELIST.some((placeholder) => value.includes(placeholder));
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (!IGNORE_FILES.has(entry.name)) {
      await scanFile(fullPath);
    }
  }
}

async function scanFile(filePath) {
  const relPath = path.relative(ROOT, filePath);
  const maxSize = 512 * 1024; // 512 KB
  const info = await stat(filePath);
  if (info.size > maxSize) return;

  const content = await readFile(filePath, "utf8");
  for (const pattern of PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      const snippet = match[0].slice(0, 80);
      if (!isWhitelisted(snippet)) {
        findings.push({
          file: relPath,
          pattern: pattern.name,
          value: snippet
        });
      }
    }
  }
}

async function main() {
  await walk(ROOT);
  if (findings.length > 0) {
    console.error("❌ Potential secrets detected:");
    for (const finding of findings) {
      console.error(` - [${finding.pattern}] ${finding.file}: ${maskValue(finding.value)}`);
    }
    process.exit(1);
  } else {
    console.log("✅ No secrets found");
  }
}

main().catch((error) => {
  console.error("Secret scan failed:", error);
  process.exit(1);
});


