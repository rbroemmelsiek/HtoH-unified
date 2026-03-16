import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseFirestore } from '../../lib/firebase';
import { AiGuideRecord, normalizeAiGuideRecord, sortAiGuides } from './types';

const DEFAULT_DRAFT_COLLECTION = process.env.NEXT_PUBLIC_AI_GUIDES_DRAFT_COLLECTION || 'AiGuides_draft';
const DEFAULT_LIVE_COLLECTION = process.env.NEXT_PUBLIC_AI_GUIDES_COLLECTION || 'AiGuides';

function requireFirestore() {
  if (!firebaseFirestore) {
    throw new Error(
      'Firebase not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to frontend/.env.local and restart the dev server.'
    );
  }
  return firebaseFirestore;
}

export function getAiGuidesCollectionConfig() {
  return {
    liveCollection: DEFAULT_LIVE_COLLECTION,
    draftCollection: DEFAULT_DRAFT_COLLECTION,
    publishMetaCollection:
      process.env.NEXT_PUBLIC_AI_GUIDES_PUBLISH_META_COLLECTION || 'AiGuides_publish_meta',
  };
}

async function fetchNormalizedRecords(collectionName: string): Promise<AiGuideRecord[]> {
  const db = requireFirestore();
  const snap = await getDocs(collection(db, collectionName));
  const normalized = snap.docs
    .map((docSnap) =>
      normalizeAiGuideRecord(docSnap.id, docSnap.data() as Record<string, unknown>)
    )
    .filter((item): item is AiGuideRecord => Boolean(item));
  return sortAiGuides(normalized);
}

export async function fetchDraftRecords(draftCollection = DEFAULT_DRAFT_COLLECTION): Promise<AiGuideRecord[]> {
  return fetchNormalizedRecords(draftCollection);
}

export async function fetchLiveRecords(liveCollection = DEFAULT_LIVE_COLLECTION): Promise<AiGuideRecord[]> {
  return fetchNormalizedRecords(liveCollection);
}

export async function seedDraftFromLive(options?: {
  liveCollection?: string;
  draftCollection?: string;
  actorUid?: string;
  actorEmail?: string | null;
}): Promise<{ seeded: number }> {
  const liveCollection = options?.liveCollection || DEFAULT_LIVE_COLLECTION;
  const draftCollection = options?.draftCollection || DEFAULT_DRAFT_COLLECTION;
  const live = await fetchLiveRecords(liveCollection);
  if (live.length === 0) return { seeded: 0 };

  const db = requireFirestore();
  const BATCH_SIZE = 400;
  for (let i = 0; i < live.length; i += BATCH_SIZE) {
    const chunk = live.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((record) => {
      const ref = doc(db, draftCollection, record.Unique_ID);
      batch.set(
        ref,
        {
          ...record,
          status: 'draft',
          sourceCollection: liveCollection,
          draftUpdatedByUid: options?.actorUid || null,
          draftUpdatedByEmail: options?.actorEmail || null,
          draftUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
    await batch.commit();
  }
  return { seeded: live.length };
}

export async function saveDraftRecord(
  record: AiGuideRecord,
  options?: { draftCollection?: string; actorUid?: string; actorEmail?: string | null }
): Promise<void> {
  const draftCollection = options?.draftCollection || DEFAULT_DRAFT_COLLECTION;
  const db = requireFirestore();
  const ref = doc(db, draftCollection, record.Unique_ID);
  await setDoc(
    ref,
    {
      ...record,
      status: 'draft',
      draftUpdatedByUid: options?.actorUid || null,
      draftUpdatedByEmail: options?.actorEmail || null,
      draftUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
