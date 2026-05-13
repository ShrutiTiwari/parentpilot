#!/usr/bin/env node

/**
 * Build script to update version.json with current version and build information
 * Run this before building the application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const versionJsonPath = path.join(rootDir, 'public', 'version.json');

// Read package.json to get version
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version || '0.0.0';

// Get git commit hash (if available)
let gitCommit = 'unknown';
try {
  gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch (error) {
  console.warn('⚠️ Unable to get git commit hash:', error.message);
}

// Get current timestamp
const buildTime = new Date().toISOString();

// Create version info object
const versionInfo = {
  version,
  buildTime,
  gitCommit,
  environment: process.env.NODE_ENV || 'development',
  buildNumber: process.env.BUILD_NUMBER || 'local'
};

// Write to version.json
try {
  fs.writeFileSync(versionJsonPath, JSON.stringify(versionInfo, null, 2));
  console.log('✅ Version information updated successfully:');
  console.log(`   Version: ${version}`);
  console.log(`   Build Time: ${buildTime}`);
  console.log(`   Git Commit: ${gitCommit}`);
  console.log(`   Environment: ${versionInfo.environment}`);
  console.log(`   Build Number: ${versionInfo.buildNumber}`);
  console.log(`   Output: ${versionJsonPath}`);
} catch (error) {
  console.error('❌ Error writing version.json:', error);
  process.exit(1);
}