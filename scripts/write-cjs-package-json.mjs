import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const packageDir = process.argv[2];

if (packageDir === undefined) {
  throw new Error('Usage: node scripts/write-cjs-package-json.mjs <package-dir>');
}

const cjsDir = resolve(packageDir, 'dist/cjs');

await mkdir(cjsDir, { recursive: true });
await writeFile(join(cjsDir, 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);
