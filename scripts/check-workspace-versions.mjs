#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageFiles = [
  path.join(root, 'package.json'),
  ...fs.readdirSync(path.join(root, 'apps')).map((d) => path.join(root, 'apps', d, 'package.json')),
  ...fs.readdirSync(path.join(root, 'packages')).map((d) => path.join(root, 'packages', d, 'package.json')),
].filter((p) => fs.existsSync(p));

const tracked = ['vite', 'vitest', '@vitejs/plugin-react'];
const seen = new Map(tracked.map((k) => [k, new Map()]));

for (const file of packageFiles) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const section of ['dependencies', 'devDependencies']) {
    const deps = json[section] || {};
    for (const key of tracked) {
      if (deps[key]) {
        const bucket = seen.get(key);
        const list = bucket.get(deps[key]) || [];
        list.push(path.relative(root, file));
        bucket.set(deps[key], list);
      }
    }
  }
}

let hasDrift = false;
for (const key of tracked) {
  const versions = seen.get(key);
  if (versions.size > 1) {
    hasDrift = true;
    console.error(`❌ Version drift for ${key}:`);
    for (const [version, files] of versions.entries()) {
      console.error(`  - ${version}`);
      for (const file of files) console.error(`    • ${file}`);
    }
  } else if (versions.size === 1) {
    const only = [...versions.keys()][0];
    console.log(`✅ ${key} aligned at ${only}`);
  } else {
    console.log(`⚠️  ${key} not found in workspace package manifests`);
  }
}

if (hasDrift) process.exit(1);
