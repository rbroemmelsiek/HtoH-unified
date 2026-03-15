import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';

function parseEnvFile(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '');
    env[key] = value;
  }
  return env;
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (quoted && next === '"') {
        cur += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (ch === ',' && !quoted) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendRoot = path.resolve(__dirname, '..');
  const envFromFile = parseEnvFile(path.join(frontendRoot, '.env.local'));

  const env = { ...envFromFile, ...process.env };
  const csvPath = process.argv[2] || 'C:/Users/rmbsa/Downloads/FINAL AppSheet HtoH 2-a - EnumsCatalog.csv';
  const collectionName = process.argv[3] || env.NEXT_PUBLIC_ENUMS_CATALOG_COLLECTION || 'EnumsCatalog';

  const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID in frontend/.env.local');
  }

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const rows = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (rows.length < 2) {
    throw new Error('CSV has no data rows.');
  }

  const header = parseCsvLine(rows[0]);
  const idx = {
    uniqueId: header.indexOf('Unique_ID'),
    enumCategory: header.indexOf('EnumCategory'),
    enumValue: header.indexOf('EnumValue'),
    displayName: header.indexOf('DisplayName'),
    sortOrder: header.indexOf('SortOrder'),
  };

  if (Object.values(idx).some((v) => v < 0)) {
    throw new Error(`CSV header mismatch. Found: ${header.join(', ')}`);
  }

  let batch = writeBatch(db);
  let inBatch = 0;
  let total = 0;
  let skipped = 0;
  const BATCH_SIZE = 400;

  for (let i = 1; i < rows.length; i += 1) {
    const cols = parseCsvLine(rows[i]);
    const uniqueId = cols[idx.uniqueId] || '';
    const enumCategory = cols[idx.enumCategory] || '';
    const enumValue = cols[idx.enumValue] || '';
    const displayName = cols[idx.displayName] || enumValue;
    const sortOrderRaw = cols[idx.sortOrder] || '';
    const sortOrderNum = Number(sortOrderRaw);
    const sortOrder = Number.isFinite(sortOrderNum) ? sortOrderNum : null;

    if (!uniqueId || !enumCategory || !displayName) {
      skipped += 1;
      continue;
    }

    const ref = doc(db, collectionName, uniqueId);
    batch.set(ref, {
      Unique_ID: uniqueId,
      EnumCategory: enumCategory,
      EnumValue: enumValue,
      DisplayName: displayName,
      SortOrder: sortOrder,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    inBatch += 1;
    total += 1;

    if (inBatch >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      inBatch = 0;
    }
  }

  if (inBatch > 0) {
    await batch.commit();
  }

  console.log(JSON.stringify({
    collection: collectionName,
    imported: total,
    skipped,
    csvPath,
    projectId: firebaseConfig.projectId,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
