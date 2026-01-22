/**
 * Cross-platform script to rename .js files to .cjs in the CJS build directory
 * and update internal require paths to use .cjs extension.
 *
 * This is necessary because TypeScript doesn't support outputting .cjs files directly.
 */
import { readdirSync, renameSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recursively rename all .js files to .cjs in a directory
 * @param {string} dir - Directory to process
 */
function renameJsToCjs(dir) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      renameJsToCjs(fullPath);
    } else if (file.endsWith('.js')) {
      const newPath = fullPath.replace(/\.js$/, '.cjs');
      renameSync(fullPath, newPath);
      console.log(`Renamed: ${file} -> ${file.replace(/\.js$/, '.cjs')}`);
    } else if (file.endsWith('.js.map')) {
      const newPath = fullPath.replace(/\.js\.map$/, '.cjs.map');
      renameSync(fullPath, newPath);
      console.log(`Renamed: ${file} -> ${file.replace(/\.js\.map$/, '.cjs.map')}`);
    }
  }
}

/**
 * Update require paths in all .cjs files to use .cjs extension
 * @param {string} dir - Directory to process
 */
function updateRequirePaths(dir) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      updateRequirePaths(fullPath);
    } else if (file.endsWith('.cjs')) {
      let content = readFileSync(fullPath, 'utf-8');

      // Replace .js extensions in require() calls with .cjs
      // Match patterns like: require("./path/to/file.js") or require('./path/to/file.js')
      const updated = content.replace(
        /require\(["'](\.[^"']+)\.js["']\)/g,
        'require("$1.cjs")'
      );

      if (updated !== content) {
        writeFileSync(fullPath, updated);
        console.log(`Updated require paths in: ${file}`);
      }
    } else if (file.endsWith('.cjs.map')) {
      // Also update source map file references
      let content = readFileSync(fullPath, 'utf-8');
      const updated = content
        .replace(/"file":"([^"]+)\.js"/g, '"file":"$1.cjs"')
        .replace(/\.js\.map/g, '.cjs.map');

      if (updated !== content) {
        writeFileSync(fullPath, updated);
        console.log(`Updated source map: ${file}`);
      }
    }
  }
}

// Get the CJS dist directory
const cjsDir = join(__dirname, '..', 'dist', 'cjs');

console.log('Step 1: Renaming .js files to .cjs in:', cjsDir);
renameJsToCjs(cjsDir);

console.log('\nStep 2: Updating require paths to use .cjs extension');
updateRequirePaths(cjsDir);

console.log('\nDone!');
