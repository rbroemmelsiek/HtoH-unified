import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseFirestore } from '../../lib/firebase';
import { AiGuideRecord, normalizeAiGuideRecord } from './types';

function requireFirestore() {
  if (!firebaseFirestore) {
    throw new Error(
      'Firebase not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to frontend/.env.local and restart the dev server.'
    );
  }
  return firebaseFirestore;
}

export interface PublishPreview {
  draftCount: number;
  liveCount: number;
  createCount: number;
  updateCount: number;
  unchangedCount: number;
}

function stableStringify(record: Record<string, unknown>): string {
  const sortedKeys = Object.keys(record).sort();
  const normalized: Record<string, unknown> = {};
  sortedKeys.forEach((key) => {
    normalized[key] = record[key];
  });
  return JSON.stringify(normalized);
}

function toComparable(record: AiGuideRecord): Record<string, unknown> {
  const { updatedAt, status, ...rest } = record;
  return rest;
}

export async function getPublishPreview(options?: {
  liveCollection?: string;
  draftCollection?: string;
}): Promise<PublishPreview> {
  const liveCollection = options?.liveCollection || process.env.NEXT_PUBLIC_AI_GUIDES_COLLECTION || 'AiGuides';
  const draftCollection =
    options?.draftCollection || process.env.NEXT_PUBLIC_AI_GUIDES_DRAFT_COLLECTION || 'AiGuides_draft';
  const db = requireFirestore();

  const [liveSnap, draftSnap] = await Promise.all([
    getDocs(collection(db, liveCollection)),
    getDocs(collection(db, draftCollection)),
  ]);

  const liveMap = new Map<string, string>();
  liveSnap.docs.forEach((docSnap) => {
    const normalized = normalizeAiGuideRecord(docSnap.id, docSnap.data() as Record<string, unknown>);
    if (!normalized) return;
    liveMap.set(normalized.Unique_ID, stableStringify(toComparable(normalized)));
  });

  let createCount = 0;
  let updateCount = 0;
  let unchangedCount = 0;

  draftSnap.docs.forEach((docSnap) => {
    const normalized = normalizeAiGuideRecord(docSnap.id, docSnap.data() as Record<string, unknown>);
    if (!normalized) return;
    const draftComparable = stableStringify(toComparable(normalized));
    const liveComparable = liveMap.get(normalized.Unique_ID);
    if (!liveComparable) {
      createCount += 1;
      return;
    }
    if (liveComparable !== draftComparable) {
      updateCount += 1;
      return;
    }
    unchangedCount += 1;
  });

  return {
    draftCount: draftSnap.size,
    liveCount: liveSnap.size,
    createCount,
    updateCount,
    unchangedCount,
  };
}

export async function publishDraftToLive(options: {
  actorUid: string;
  actorEmail?: string | null;
  liveCollection?: string;
  draftCollection?: string;
  publishMetaCollection?: string;
}): Promise<PublishPreview> {
  const liveCollection = options.liveCollection || process.env.NEXT_PUBLIC_AI_GUIDES_COLLECTION || 'AiGuides';
  const draftCollection =
    options.draftCollection || process.env.NEXT_PUBLIC_AI_GUIDES_DRAFT_COLLECTION || 'AiGuides_draft';
  const publishMetaCollection =
    options.publishMetaCollection ||
    process.env.NEXT_PUBLIC_AI_GUIDES_PUBLISH_META_COLLECTION ||
    'AiGuides_publish_meta';
  const db = requireFirestore();
  const preview = await getPublishPreview({ liveCollection, draftCollection });

  const draftSnap = await getDocs(collection(db, draftCollection));
  const BATCH_SIZE = 400;
  const docs = draftSnap.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((docSnap) => {
      const normalized = normalizeAiGuideRecord(docSnap.id, docSnap.data() as Record<string, unknown>);
      if (!normalized) return;
      const ref = doc(db, liveCollection, normalized.Unique_ID);
      batch.set(
        ref,
        {
          ...normalized,
          status: 'published',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();
  }

  const publishRef = doc(collection(db, publishMetaCollection));
  await setDoc(
    publishRef,
    {
      actorUid: options.actorUid,
      actorEmail: options.actorEmail || null,
      publishedAt: serverTimestamp(),
      ...preview,
    },
    { merge: false }
  );

  return preview;
}
