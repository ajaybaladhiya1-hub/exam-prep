import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src');
const pubDir = path.resolve('public');
const outDir = path.resolve('build');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(pubDir, outDir);
copyDir(srcDir, path.join(outDir, 'src'));

console.log('Build complete ->', outDir);
