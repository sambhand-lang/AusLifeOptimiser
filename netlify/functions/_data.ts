// This file is auto-generated at build time and contains embedded JSON data
// Generated: 2026-02-21
// Source: netlify/functions/*.json

export const suburbsData = () => {
  // In production, try to load from published files first; fall back to inline if needed
  
  const fs = require('fs');
  const path = require('path');
  
  const candidates = [
    path.join(__dirname, 'suburbs.json'),
    path.join('/', 'opt', 'build', 'repo', 'netlify', 'functions', 'suburbs.json'),
    path.join('/', 'var', 'task', 'netlify', 'functions', 'suburbs.json'),
  ];
  
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) {
      // Continue to next candidate
    }
  }
  
  // Fallback to empty array if no file found
  return [];
};

export const demographicsData = () => {
  const fs = require('fs');
  const path = require('path');
  
  const candidates = [
    path.join(__dirname, 'suburb_demographics.json'),
    path.join('/', 'opt', 'build', 'repo', 'netlify', 'functions', 'suburb_demographics.json'),
    path.join('/', 'var', 'task', 'netlify', 'functions', 'suburb_demographics.json'),
  ];
  
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) {
      // Continue to next candidate
    }
  }
  
  return [];
};
