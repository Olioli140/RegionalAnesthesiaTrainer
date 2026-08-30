import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const registryPath = resolve(root, 'media/manifests/asset-registry.v1.json');
const schemaPath = resolve(root, 'shared/schemas/asset-registry.schema.json');

function fail(message) {
  throw new Error(`PLATFORM DATA VALIDATION FAILED: ${message}`);
}
function assert(condition, message) {
  if (!condition) fail(message);
}
function readJson(path, label) {
  assert(existsSync(path), `${label} missing: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

const schema = readJson(schemaPath, 'asset registry schema');
const registry = readJson(registryPath, 'asset registry');

assert(schema.$schema?.includes('json-schema.org'), 'schema does not declare JSON Schema');
assert(registry.schemaVersion === '1.0.0', `unsupported schemaVersion ${registry.schemaVersion}`);
assert(/^\d+\.\d+\.\d+$/.test(registry.registryVersion), 'registryVersion must be semantic x.y.z');
assert(Array.isArray(registry.assets) && registry.assets.length > 0, 'assets must be a non-empty array');

const allowedTypes = new Set(['ultrasound-image','ultrasound-sequence','anatomy-illustration','probe-sweep','needle-asset','animation','video','audio','icon','3d-asset']);
const allowedStatuses = new Set(['draft','review','production','deprecated','retired']);
const allowedQuality = new Set(['unreviewed','engineering-reviewed','approved']);
const allowedValidation = new Set(['unvalidated','engineering-calibrated','reference-only','clinically-validated']);
const allowedRoles = new Set(['presentation-reference-only','runtime-presentation','none']);
const ids = new Set();
const paths = new Set();

for (const asset of registry.assets) {
  assert(typeof asset.id === 'string' && /^[a-z0-9][a-z0-9_-]*$/.test(asset.id), `invalid asset id: ${asset.id}`);
  assert(!ids.has(asset.id), `duplicate asset id: ${asset.id}`);
  ids.add(asset.id);
  assert(allowedTypes.has(asset.type), `${asset.id}: invalid type`);
  assert(typeof asset.region === 'string' && asset.region.length > 0, `${asset.id}: region required`);
  assert(typeof asset.view === 'string' && asset.view.length > 0, `${asset.id}: view required`);
  assert(typeof asset.license === 'string' && asset.license.length > 0, `${asset.id}: license required; use UNKNOWN if unresolved`);
  assert(/^\d+\.\d+\.\d+$/.test(asset.version), `${asset.id}: version must be semantic x.y.z`);
  assert(allowedStatuses.has(asset.status), `${asset.id}: invalid status`);
  assert(allowedQuality.has(asset.qualityStatus), `${asset.id}: invalid qualityStatus`);
  assert(allowedValidation.has(asset.validationStatus), `${asset.id}: invalid validationStatus`);
  assert(allowedRoles.has(asset.simulationRole), `${asset.id}: invalid simulationRole`);
  assert(typeof asset.path === 'string' && asset.path.length > 0, `${asset.id}: path required`);
  assert(!asset.path.includes('..') && !asset.path.startsWith('/'), `${asset.id}: path must stay repository-relative`);
  assert(!paths.has(asset.path), `${asset.id}: duplicate production path ${asset.path}`);
  paths.add(asset.path);
  assert(Number.isInteger(asset.byteSize) && asset.byteSize > 0, `${asset.id}: byteSize must be positive integer`);
  assert(/^[a-f0-9]{64}$/.test(asset.sha256), `${asset.id}: invalid sha256`);

  const fullPath = resolve(root, asset.path);
  assert(existsSync(fullPath), `${asset.id}: registered file missing: ${asset.path}`);
  const bytes = readFileSync(fullPath);
  assert(bytes.length === asset.byteSize, `${asset.id}: byteSize mismatch (${bytes.length} != ${asset.byteSize})`);
  const digest = createHash('sha256').update(bytes).digest('hex');
  assert(digest === asset.sha256, `${asset.id}: sha256 mismatch`);

  if (asset.type === 'ultrasound-image') {
    assert(Number.isInteger(asset.width) && asset.width > 0, `${asset.id}: width required for ultrasound image`);
    assert(Number.isInteger(asset.height) && asset.height > 0, `${asset.id}: height required for ultrasound image`);
    assert(asset.simulationRole !== undefined, `${asset.id}: explicit simulationRole required`);
  }

  if (asset.status === 'deprecated') {
    assert(asset.deprecated === true, `${asset.id}: deprecated status requires deprecated=true`);
  }
}

for (const asset of registry.assets) {
  if (asset.replacementAssetId) {
    assert(ids.has(asset.replacementAssetId), `${asset.id}: replacementAssetId not found: ${asset.replacementAssetId}`);
    assert(asset.replacementAssetId !== asset.id, `${asset.id}: cannot replace itself`);
  }
}

console.log(`PLATFORM DATA VALIDATION PASS (${registry.assets.length} registered assets, registry ${registry.registryVersion})`);
