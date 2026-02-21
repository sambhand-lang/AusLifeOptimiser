const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'suburbs.db');
const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
const dest = path.join(backupsDir, `suburbs_${ts}.db`);

try {
  fs.copyFileSync(src, dest);
  const stats = fs.statSync(dest);
  console.log(JSON.stringify({ path: dest, size: stats.size }));
} catch (err) {
  console.error('backup_failed', err.message);
  process.exit(2);
}
