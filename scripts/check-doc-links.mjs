#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const mdFiles = walk(root);
const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
const missing = [];

for (const file of mdFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(linkRe)) {
    let link = m[1].trim();
    if (!link || link.startsWith('#') || /^(https?:|mailto:)/.test(link)) continue;
    link = link.split('#')[0];
    const target = path.resolve(path.dirname(file), link);
    if (!target.startsWith(root)) continue;
    if (!fs.existsSync(target)) {
      missing.push(`${path.relative(root, file)} -> ${link}`);
    }
  }
}

if (missing.length) {
  console.error(`❌ Found ${missing.length} broken local markdown link(s):`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}

console.log(`✅ Markdown local links validated across ${mdFiles.length} file(s).`);
