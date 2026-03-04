#!/usr/bin/env node

/**
 * Coverage Threshold Checker
 * 
 * Parses coverage-summary.json and checks if coverage meets the 70% threshold.
 * Exits with error code 1 if coverage is below threshold.
 * 
 * Usage: node scripts/check-coverage.js
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const COVERAGE_THRESHOLD = 70;
const COVERAGE_FILE = 'coverage/coverage-summary.json';

function checkCoverage() {
  // Check if coverage file exists
  if (!existsSync(COVERAGE_FILE)) {
    console.error('❌ Coverage file not found: ' + COVERAGE_FILE);
    console.error('   Run "npm run test:coverage" first to generate coverage report.');
    process.exit(1);
  }

  try {
    // Read and parse coverage summary
    const coverageData = JSON.parse(readFileSync(COVERAGE_FILE, 'utf8'));
    
    if (!coverageData.total) {
      console.error('❌ Invalid coverage file format: missing "total" property');
      process.exit(1);
    }

    // Extract coverage metrics
    const { lines, statements, functions, branches } = coverageData.total;
    
    // Display coverage summary
    console.log('\n📊 Coverage Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Lines:      ${lines.pct.toFixed(2)}%`);
    console.log(`  Statements: ${statements.pct.toFixed(2)}%`);
    console.log(`  Functions:  ${functions.pct.toFixed(2)}%`);
    console.log(`  Branches:   ${branches.pct.toFixed(2)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check if all metrics meet threshold
    const metrics = [
      { name: 'Lines', value: lines.pct },
      { name: 'Statements', value: statements.pct },
      { name: 'Functions', value: functions.pct },
      { name: 'Branches', value: branches.pct }
    ];

    const failedMetrics = metrics.filter(m => m.value < COVERAGE_THRESHOLD);

    if (failedMetrics.length > 0) {
      console.error(`❌ Coverage check FAILED - Below ${COVERAGE_THRESHOLD}% threshold:\n`);
      failedMetrics.forEach(m => {
        console.error(`   ${m.name}: ${m.value.toFixed(2)}% (need ${COVERAGE_THRESHOLD}%)`);
      });
      console.error('\n💡 Tip: Run "npm run test:coverage" to see detailed coverage report.');
      console.error('   Focus on adding tests for uncovered critical paths.\n');
      process.exit(1);
    }

    // Success!
    console.log(`✅ Coverage check PASSED - All metrics meet ${COVERAGE_THRESHOLD}% threshold!\n`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error reading coverage file:', error.message);
    process.exit(1);
  }
}

// Run the check
checkCoverage();
