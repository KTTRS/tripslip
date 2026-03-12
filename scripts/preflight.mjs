#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const checkEnv = args.has('--check-env');

const requiredNodeMajor = 18;
const requiredNpmMajor = 9;

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (Number.isNaN(nodeMajor) || nodeMajor < requiredNodeMajor) {
  fail(`Node.js ${requiredNodeMajor}+ required, found ${process.versions.node}`);
} else {
  ok(`Node.js version ${process.versions.node}`);
}

const npmUA = process.env.npm_config_user_agent || '';
const npmMatch = npmUA.match(/npm\/(\d+)\./);
if (!npmMatch) {
  warn('Unable to detect npm version from npm_config_user_agent');
} else {
  const npmMajor = Number(npmMatch[1]);
  if (npmMajor < requiredNpmMajor) {
    fail(`npm ${requiredNpmMajor}+ required, found major ${npmMajor}`);
  } else {
    ok(`npm major version ${npmMajor}`);
  }
}

const requiredBins = ['turbo', 'vite', 'vitest'];
for (const bin of requiredBins) {
  const binPath = path.join(root, 'node_modules', '.bin', bin);
  if (!fs.existsSync(binPath)) {
    fail(`Missing required CLI: ${bin}. Run npm ci.`);
  } else {
    ok(`CLI available: ${bin}`);
  }
}

if (checkEnv) {
  const envFile = path.join(root, '.env');
  if (!fs.existsSync(envFile)) {
    fail('Missing .env file at repository root (required for --check-env).');
  } else {
    const text = fs.readFileSync(envFile, 'utf8');
    const requiredEnv = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_LANDING_APP_URL',
      'VITE_VENUE_APP_URL',
      'VITE_TEACHER_APP_URL',
      'VITE_PARENT_APP_URL',
      'VITE_SCHOOL_APP_URL',
    ];

    const missing = requiredEnv.filter((key) => {
      const re = new RegExp(`^${key}=.+`, 'm');
      return !re.test(text);
    });

    if (missing.length > 0) {
      fail(`Missing required env keys in .env: ${missing.join(', ')}`);
    } else {
      ok('Required environment keys present in .env');
    }
  }
} else {
  warn('Skipping env key checks (run with --check-env to enforce).');
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
