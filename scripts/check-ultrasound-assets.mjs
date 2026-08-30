import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const app = join(root, 'apps', 'regional-anesthesia-trainer');
const assetDir = join('assets', 'ultrasound', 'adductor-canal', 'v0.1');
const expectedAssets = [
  { file: 'proximal.webp', bytes: 91066, sha256: 'af039bfe159e604c96037411a43f6cb74bc97ee17024d140ec462ef8d3df08d1' },
  { file: 'proximal-mid.webp', bytes: 91536, sha256: 'ae333848e9b5ac1f6e54e42a4c7c92b13315d988681bea2ec680e1fc289149e7' },
  { file: 'mid.webp', bytes: 92124, sha256: 'd875a18d2f624f66c1d3ef91e75977589987328d883bb9213435108a49932955' },
  { file: 'mid-distal.webp', bytes: 89730, sha256: '20b9a3671f9f11bafcbc1199f1d92b3165ab86b2f8dbe30342d411c35477618b' },
  { file: 'distal.webp', bytes: 91500, sha256: '01ed9dbf2acc3fc4435f5170a89edbfee8128fd00d466e3fe272be243f841558' },
];
const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.html']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function inspectWebP(path, expected, label) {
  assert(existsSync(path), `${label} missing: ${relative(root, path)}`);
  const bytes = readFileSync(path);
  assert(bytes.length === expected.bytes, `${label} byte size changed: expected ${expected.bytes}, got ${bytes.length}`);
  assert(bytes.length < 150_000, `${label} exceeds the P1 per-frame asset budget`);
  assert(bytes.subarray(0, 4).toString('ascii') === 'RIFF', `${label} is not a RIFF container`);
  assert(bytes.subarray(8, 12).toString('ascii') === 'WEBP', `${label} is not a WebP binary`);
  assert(bytes.readUInt32LE(4) + 8 === bytes.length, `${label} RIFF length does not match the binary file length`);

  const chunkType = bytes.subarray(12, 16).toString('ascii');
  assert(chunkType === 'VP8 ', `${label} expected a VP8 WebP frame, got ${chunkType}`);
  assert(bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a, `${label} has an invalid VP8 key-frame signature`);
  const width = bytes.readUInt16LE(26) & 0x3fff;
  const height = bytes.readUInt16LE(28) & 0x3fff;
  assert(width === 640 && height === 720, `${label} dimensions changed: expected 640x720, got ${width}x${height}`);

  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert(sha256 === expected.sha256, `${label} SHA-256 mismatch: ${sha256}`);
  return bytes.length;
}

function verifyStack(baseDir, label) {
  const expectedFiles = expectedAssets.map((asset) => asset.file).sort();
  const actualFiles = readdirSync(baseDir).filter((file) => extname(file) === '.webp').sort();
  assert(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), `${label} stack mismatch: expected ${expectedFiles.join(', ')}, got ${actualFiles.join(', ')}`);

  let totalBytes = 0;
  for (const expected of expectedAssets) {
    totalBytes += inspectWebP(join(baseDir, expected.file), expected, `${label} ${expected.file}`);
  }
  assert(totalBytes === 455956, `${label} total stack bytes changed: expected 455956, got ${totalBytes}`);
  assert(totalBytes < 600_000, `${label} stack exceeds the P1 total asset budget`);
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
console.log('ULTRASOUND ASSET P1 PASS (5 frames, 640x720, 455956 bytes total)');
