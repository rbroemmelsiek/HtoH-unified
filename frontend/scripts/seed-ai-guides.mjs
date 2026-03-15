import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';

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

function parseCsvContent(csvText) {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    const next = csvText[i + 1];

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
      row.push(cur.trim());
      cur = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cur.trim());
      const hasAnyValue = row.some((value) => String(value || '').trim().length > 0);
      if (hasAnyValue) rows.push(row);
      row = [];
      cur = '';
      continue;
    }

    cur += ch;
  }

  if (cur.length > 0 || row.length > 0) {
    row.push(cur.trim());
    const hasAnyValue = row.some((value) => String(value || '').trim().length > 0);
    if (hasAnyValue) rows.push(row);
  }

  return rows;
}

function normalizeNumber(value) {
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendRoot = path.resolve(__dirname, '..');
  const envFromFile = parseEnvFile(path.join(frontendRoot, '.env.local'));
  const env = { ...envFromFile, ...process.env };

  const csvPath = process.argv[2] || 'C:/Users/rmbsa/Downloads/HtoH 3.0 JSON Converter - AiGuides-data.csv';
  const collectionName = process.argv[3] || env.NEXT_PUBLIC_AI_GUIDES_COLLECTION || 'AiGuides';

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

  const rows = parseCsvContent(fs.readFileSync(csvPath, 'utf8'));
  if (rows.length < 2) {
    throw new Error('CSV has no data rows.');
  }

  const header = rows[0];
  const idx = {
    uniqueId: header.indexOf('Unique_ID'),
    guide: header.indexOf('Guide'),
    panel: header.indexOf('Panel'),
    panelOrder: header.indexOf('Panel_order'),
    title: header.indexOf('Title'),
    paragraph: header.indexOf('Paragraph'),
    ytThumb: header.indexOf('YT_Thumb'),
    photo: header.indexOf('Photo'),
    url: header.indexOf('URL'),
    ytVideo: header.indexOf('YT_Video'),
    ytShort: header.indexOf('YT_Short'),
    videoScript: header.indexOf('video_script'),
    pdfFile: header.indexOf('PDFfile'),
    ytEmbedWide: header.indexOf('YT_Embed_Wide'),
    ytEmbedShort: header.indexOf('YT_Embed_Short'),
  };

  if (Object.values(idx).some((v) => v < 0)) {
    throw new Error(`CSV header mismatch. Found: ${header.join(', ')}`);
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let batch = writeBatch(db);
  let inBatch = 0;
  let imported = 0;
  let skipped = 0;
  const BATCH_SIZE = 400;

  for (let i = 1; i < rows.length; i += 1) {
    const cols = rows[i];

    const uniqueId = cols[idx.uniqueId] || '';
    const guide = cols[idx.guide] || '';
    const panel = cols[idx.panel] || '';
    const title = cols[idx.title] || '';

    // Skip non-data/meta rows (e.g., schema/type/header repeats) and rows without doc IDs.
    const isDuplicateHeader = uniqueId === 'Unique_ID' && guide === 'Guide';
    if (isDuplicateHeader) continue;
    if (!uniqueId) {
      skipped += 1;
      continue;
    }

    const payload = {
      Unique_ID: uniqueId,
      Guide: guide,
      Panel: panel,
      Panel_order: normalizeNumber(cols[idx.panelOrder] || ''),
      Title: title,
      Paragraph: cols[idx.paragraph] || '',
      YT_Thumb: cols[idx.ytThumb] || '',
      Photo: cols[idx.photo] || '',
      URL: cols[idx.url] || '',
      YT_Video: cols[idx.ytVideo] || '',
      YT_Short: cols[idx.ytShort] || '',
      video_script: cols[idx.videoScript] || '',
      PDFfile: cols[idx.pdfFile] || '',
      YT_Embed_Wide: cols[idx.ytEmbedWide] || '',
      YT_Embed_Short: cols[idx.ytEmbedShort] || '',
      updatedAt: new Date().toISOString(),
    };

    const ref = doc(db, collectionName, uniqueId);
    batch.set(ref, payload, { merge: true });

    imported += 1;
    inBatch += 1;
    if (inBatch >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      inBatch = 0;
    }
  }

  if (inBatch > 0) {
    await batch.commit();
  }

  console.log(
    JSON.stringify({
      collection: collectionName,
      csvPath,
      imported,
      skipped,
      projectId: firebaseConfig.projectId,
    })
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
