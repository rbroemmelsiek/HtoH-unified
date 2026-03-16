import { collection, getDocs } from 'firebase/firestore';
import { firebaseFirestore } from '../../lib/firebase';
import {
  AiGuidesCacheEnvelope,
  AiGuideRecord,
  normalizeAiGuideRecord,
  sortAiGuides,
} from './types';

const CACHE_VERSION = 'aiguides-v1';
const CACHE_PREFIX = 'htoh-ai-guides-cache';
const DEFAULT_STALE_MS = 5 * 60 * 1000;

const memoryCache = new Map<string, AiGuidesCacheEnvelope>();

function getCacheKey(collectionName: string): string {
  return `${CACHE_PREFIX}:${collectionName}`;
}

function getNow(): number {
  return Date.now();
}

function readLocalCache(cacheKey: string): AiGuidesCacheEnvelope | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AiGuidesCacheEnvelope;
    if (!parsed || parsed.version !== CACHE_VERSION || !Array.isArray(parsed.records)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalCache(cacheKey: string, envelope: AiGuidesCacheEnvelope): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(envelope));
  } catch {
    // Best-effort cache write.
  }
}

function setCache(collectionName: string, records: AiGuideRecord[]): AiGuideRecord[] {
  const sorted = sortAiGuides(records);
  const envelope: AiGuidesCacheEnvelope = {
    version: CACHE_VERSION,
    updatedAt: getNow(),
    records: sorted,
  };
  const key = getCacheKey(collectionName);
  memoryCache.set(key, envelope);
  writeLocalCache(key, envelope);
  return sorted;
}

function requireFirestore() {
  if (!firebaseFirestore) {
    throw new Error(
      'Firebase not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to frontend/.env.local and restart the dev server.'
    );
  }
  return firebaseFirestore;
}

export function getCachedAiGuides(collectionName: string): AiGuidesCacheEnvelope | null {
  const key = getCacheKey(collectionName);
  const fromMemory = memoryCache.get(key);
  if (fromMemory && fromMemory.version === CACHE_VERSION) {
    return fromMemory;
  }
  const fromLocal = readLocalCache(key);
  if (fromLocal) {
    memoryCache.set(key, fromLocal);
    return fromLocal;
  }
  return null;
}

export async function fetchAiGuidesRecords(collectionName: string): Promise<AiGuideRecord[]> {
  const db = requireFirestore();
  const snapshot = await getDocs(collection(db, collectionName));
  const normalized = snapshot.docs
    .map((docSnap) =>
      normalizeAiGuideRecord(docSnap.id, docSnap.data() as Record<string, unknown>)
    )
    .filter((item): item is AiGuideRecord => Boolean(item));
  return setCache(collectionName, normalized);
}

export async function loadAiGuidesWithCache(options: {
  collectionName: string;
  staleMs?: number;
  onBackgroundUpdate?: (records: AiGuideRecord[]) => void;
}): Promise<{ records: AiGuideRecord[]; source: 'cache' | 'network'; stale: boolean }> {
  const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
  const cached = getCachedAiGuides(options.collectionName);

  if (cached) {
    const stale = getNow() - cached.updatedAt > staleMs;
    if (stale) {
      void fetchAiGuidesRecords(options.collectionName)
        .then((nextRecords) => {
          options.onBackgroundUpdate?.(nextRecords);
        })
        .catch(() => {
          // Silent background refresh failure: keep cached view.
        });
    }
    return { records: cached.records, source: 'cache', stale };
  }

  const records = await fetchAiGuidesRecords(options.collectionName);
  return { records, source: 'network', stale: false };
}
