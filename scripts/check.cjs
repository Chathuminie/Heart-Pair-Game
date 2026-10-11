const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
let count = 0;
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (/\.(js|cjs)$/.test(file)) {
      const browser = file.startsWith('frontend');
      const result = spawnSync(process.execPath, browser ? ['--input-type=module', '--check'] : ['--check', file], { input: browser ? fs.readFileSync(file) : undefined, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(`${file}: ${result.stderr}`);
      count++;
    }
    if (file.endsWith('.html')) {
      const html = fs.readFileSync(file, 'utf8');
      for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        if (!match[1] || /^(https?:|data:|#)/.test(match[1])) continue;
        if (!fs.existsSync(path.resolve(path.dirname(file), match[1]))) throw new Error(`Missing asset in ${file}: ${match[1]}`);
      }
    }
  }
}
for (const directory of ['backend', 'frontend', 'scripts', 'tests']) walk(directory);
console.log(`Checked ${count} JavaScript files and all local HTML asset links.`);
