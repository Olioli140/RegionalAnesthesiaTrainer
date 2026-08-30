import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const app = join(root, 'apps', 'regional-anesthesia-trainer');
const assetDir = join('assets', 'ultrasound', 'adductor-canal', 'v0.1');
const expectedFiles = ['proximal.webp', 'proximal-mid.webp', 'mid.webp', 'mid-distal.webp', 'distal.webp'];
const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.html']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function inspectWebP(path, label) {
  assert(existsSync(path), `${label} missing: ${relative(root, path)}`);
  const bytes = readFileSync(path);
  assert(bytes.length < 100_000, `${label} exceeds the P1 per-frame asset budget`);
  assert(bytes.subarray(0, 4).toString('ascii') === 'RIFF', `${label} is not a RIFF container`);
  assert(bytes.subarray(8, 12).toString('ascii') === 'WEBP', `${label} is not a WebP binary`);
  const declaredBytes = bytes.readUInt32LE(4) + 8;
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  return { bytes: bytes.length, declaredBytes, sha256 };
}

function verifyStack(baseDir, label) {
  const actualFiles = readdirSync(baseDir).filter((file) => extname(file) === '.webp').sort();
  const wanted = [...expectedFiles].sort();
  assert(JSON.stringify(actualFiles) === JSON.stringify(wanted), `${label} stack mismatch: expected ${wanted.join(', ')}, got ${actualFiles.join(', ')}`);

  let totalBytes = 0;
  for (const file of expectedFiles) {
    const result = inspectWebP(join(baseDir, file), `${label} ${file}`);
    totalBytes += result.bytes;
    console.log(`ASSET DIGEST ${label} ${file} bytes=${result.bytes} declared=${result.declaredBytes} sha256=${result.sha256}`);
  }
  assert(totalBytes < 150_000, `${label} stack exceeds the P1 total asset budget`);
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

verifyStack(join(app, 'public', assetDir), 'source ultrasound');
verifyNoEmbeddedImageData();
if (process.argv.includes('--dist')) verifyStack(join(app, 'dist', assetDir), 'built ultrasound');
console.log(`ULTRASOUND ASSET P1 DIGEST PASS (${expectedFiles.length} WebP frames)`);
