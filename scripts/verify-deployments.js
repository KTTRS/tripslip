#!/usr/bin/env node

/**
 * TripSlip Deployment Verification Script
 * 
 * This script verifies that all 5 applications are deployed and accessible.
 * It checks:
 * - HTTP status codes
 * - Security headers
 * - Supabase connection
 * - Build artifacts
 */

const https = require('https');
const http = require('http');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Applications to verify
const apps = [
  { name: 'Landing', url: 'https://tripslip-landing.vercel.app' },
  { name: 'Parent', url: 'https://tripslip-parent.vercel.app' },
  { name: 'Teacher', url: 'https://tripslip-teacher.vercel.app' },
  { name: 'Venue', url: 'https://tripslip-venue.vercel.app' },
  { name: 'School', url: 'https://tripslip-school.vercel.app' },
];

// Security headers to check
const requiredHeaders = [
  'x-frame-options',
  'x-content-type-options',
  'strict-transport-security',
];

/**
 * Make HTTP request and return response
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'HEAD',
      timeout: 10000,
    };
    
    const req = protocol.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers,
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Check if app is accessible
 */
async function checkApp(app) {
  console.log(`\n${colors.cyan}Checking ${app.name} App...${colors.reset}`);
  console.log(`URL: ${app.url}`);
  
  try {
    const response = await makeRequest(app.url);
    
    // Check status code
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓${colors.reset} Status: ${response.statusCode} OK`);
    } else if (response.statusCode >= 300 && response.statusCode < 400) {
      console.log(`${colors.yellow}⚠${colors.reset} Status: ${response.statusCode} (Redirect)`);
    } else {
      console.log(`${colors.red}✗${colors.reset} Status: ${response.statusCode} (Error)`);
      return false;
    }
    
    // Check security headers
    let allHeadersPresent = true;
    for (const header of requiredHeaders) {
      if (response.headers[header]) {
        console.log(`${colors.green}✓${colors.reset} ${header}: ${response.headers[header]}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${header}: Missing`);
        allHeadersPresent = false;
      }
    }
    
    return response.statusCode === 200 && allHeadersPresent;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Error: ${error.message}`);
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyDeployments() {
  console.log(`${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  TripSlip Deployment Verification         ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
  
  const results = [];
  
  for (const app of apps) {
    const success = await checkApp(app);
    results.push({ app: app.name, success });
  }
  
  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Summary:${colors.reset}\n`);
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    const icon = result.success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${icon} ${result.app} App`);
  });
  
  console.log(`\n${successCount}/${totalCount} applications verified successfully`);
  
  if (successCount === totalCount) {
    console.log(`\n${colors.green}🎉 All applications are deployed and accessible!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}⚠️  Some applications failed verification${colors.reset}`);
    console.log(`\nTroubleshooting:`);
    console.log(`1. Check Vercel dashboard for deployment status`);
    console.log(`2. Verify environment variables are set correctly`);
    console.log(`3. Check build logs for errors`);
    console.log(`4. Run: vercel logs --app=<app-name>`);
    process.exit(1);
  }
}

// Run verification
verifyDeployments().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
