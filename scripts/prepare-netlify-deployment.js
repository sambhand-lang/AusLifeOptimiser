#!/usr/bin/env node

/**
 * Pre-build script for Netlify deployment
 * Copies database file to deployment root
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing database for Netlify deployment...\n');

try {
  const sourceDb = path.join(__dirname, '../backend/suburbs.db');
  const targetDb = path.join(__dirname, '../suburbs.db');

  if (!fs.existsSync(sourceDb)) {
    console.error(`❌ Database not found at: ${sourceDb}`);
    console.error('\nPlease ensure:');
    console.error('  1. backend/suburbs.db exists');
    console.error('  2. Database is not corrupted');
    process.exit(1);
  }

  // Get file size
  const stats = fs.statSync(sourceDb);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  // Copy database
  fs.copyFileSync(sourceDb, targetDb);

  console.log(`✅ Database copied successfully`);
  console.log(`   Source: ${sourceDb}`);
  console.log(`   Target: ${targetDb}`);
  console.log(`   Size: ${sizeMB} MB\n`);

  process.exit(0);
} catch (error) {
  console.error('❌ Error preparing database:', error.message);
  process.exit(1);
}
