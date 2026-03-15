import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, limit, query, where } from 'firebase/firestore';

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

  const app = getApps().length ? getApp() : initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  const db = getFirestore(app);

  const collectionName = process.argv[2] || env.NEXT_PUBLIC_ENUMS_CATALOG_COLLECTION || 'EnumsCatalog';
  const idToCheck = process.argv[3] || 'SP_001';

  const idSnap = await getDoc(doc(db, collectionName, idToCheck));
  const categorySnap = await getDocs(
    query(collection(db, collectionName), where('EnumCategory', '==', 'Sell_Buy_Remodel_Refi'))
  );
  const buyHomeSnap = await getDocs(
    query(
      collection(db, collectionName),
      where('EnumCategory', '==', 'Sell_Buy_Remodel_Refi'),
      where('DisplayName', '==', 'Buy a Home'),
      limit(1)
    )
  );

  console.log(
    JSON.stringify(
      {
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        collection: collectionName,
        checkedId: idToCheck,
        idExists: idSnap.exists(),
        sellBuyRemodelRefiCount: categorySnap.size,
        buyAHomeExists: buyHomeSnap.size > 0,
        sampleTop5: categorySnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => Number(a.SortOrder || 0) - Number(b.SortOrder || 0))
          .slice(0, 5),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
