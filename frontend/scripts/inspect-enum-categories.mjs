import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

function parseEnvFile(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '');
  }
  return env;
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(__dirname, '..');
  const env = parseEnvFile(path.join(root, '.env.local'));
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
  const db = getFirestore(app);
  const collectionName = env.NEXT_PUBLIC_ENUMS_CATALOG_COLLECTION || 'EnumsCatalog';
  const snapshot = await getDocs(collection(db, collectionName));
  const counts = new Map();
  snapshot.forEach((docSnap) => {
    const category = String(docSnap.data().EnumCategory || '').trim();
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  const sorted = [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category));
  console.log(JSON.stringify({ totalRows: snapshot.size, categories: sorted }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
