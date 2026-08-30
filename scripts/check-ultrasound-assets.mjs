import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const app = join(root, 'apps', 'regional-anesthesia-trainer');
const relativeAsset = join('assets', 'ultrasound', 'adductor-canal', 'v0.1', 'mid.webp');
const sourceAsset = join(app, 'public', relativeAsset);
const distAsset = join(app, 'dist', relativeAsset);
const expectedSha256 = '0ce58f4b8b2aa505c0cb6703736b2ce3460564a77013c146231b5bcb50e62371';
const expectedBytes = 6476;
const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.html']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyWebP(path, label) {
  assert(existsSync(path), `${label} missing: ${relative(root, path)}`);
  const bytes = readFileSync(path);
  assert(bytes.length === expectedBytes, `${label} byte size changed: expected ${expectedBytes}, got ${bytes.length}`);
  assert(bytes.subarray(0, 4).toString('ascii') === 'RIFF', `${label} is not a RIFF container`);
  assert(bytes.subarray(8, 12).toString('ascii') === 'WEBP', `${label} is not a WebP binary`);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert(sha256 === expectedSha256, `${label} SHA-256 mismatch: ${sha256}`);
  assert(bytes.length < 350_000, `${label} exceeds the P0 asset budget`);
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, visit);
    else visit(path);
  }
}

function verifyNoEmbeddedImageData() {
  walk(root, (path) => {
    if (!textExtensions.has(extname(path))) return;
    const text = readFileSync(path, 'utf8');
    const rel = relative(root, path);
    assert(!/data:image\//i.test(text), `embedded image data URI found in ${rel}`);
    assert(!/[A-Za-z0-9+/]{4096,}={0,2}/.test(text), `probable embedded Base64 payload found in ${rel}`);
    assert(!/(?:^|[/\\])chunk\d*\.ts$/i.test(path), `binary text chunk file found: ${rel}`);
  });

  const abandonedChunkDir = join(app, 'src', 'assets', 'adductorRealistic');
  assert(!existsSync(abandonedChunkDir), `abandoned chunk directory exists: ${relative(root, abandonedChunkDir)}`);
}

verifyWebP(sourceAsset, 'source ultrasound asset');
verifyNoEmbeddedImageData();

if (process.argv.includes('--dist')) verifyWebP(distAsset, 'built ultrasound asset');

console.log(`ULTRASOUND ASSET P0 PASS (${expectedBytes} bytes, ${expectedSha256.slice(0, 12)}…)`);
