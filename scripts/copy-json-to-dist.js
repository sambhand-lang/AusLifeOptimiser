#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'netlify', 'functions');
const destDir = path.join(__dirname, '..', 'app', 'dist');

const files = ['suburbs.json', 'suburb_demographics.json', 'suburb_postcodes.json', 'schools.json', 'parks.json', 'commute_times.json', 'public_transport_stops.json'];

files.forEach(file => {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  } else {
    console.warn(`File not found: ${src}`);
  }
});

console.log('JSON files copied to dist');
