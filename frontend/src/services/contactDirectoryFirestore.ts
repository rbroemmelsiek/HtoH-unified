import { firebaseFirestore } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ContactRecord } from './contactDirectory';

const CONTACTS_COLLECTION = process.env.NEXT_PUBLIC_CONTACTS_COLLECTION || 'contacts';

const SAMPLE_CONTACTS_BASE: Array<Omit<ContactRecord, 'id' | 'linkedOwnerId'>> = [
  {
    name: 'Maya Brooks',
    role: 'Buyer',
    phone: '(555) 410-1001',
    email: 'maya.brooks@example.com',
    category: 'party',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    notes: 'Sample buyer contact for plan-flow testing.',
  },
  {
    name: 'Derek Hale',
    role: 'Seller',
    phone: '(555) 410-1002',
    email: 'derek.hale@example.com',
    category: 'party',
    isFavorite: true,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    notes: 'Sample seller contact for multi-plan testing.',
  },
  {
    name: 'Tina Alvarez',
    role: 'Transaction Coordinator',
    company: 'Summit Realty',
    phone: '(555) 410-1003',
    email: 'tina.alvarez@summitrealty.com',
    category: 'provider',
    isFavorite: true,
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    notes: 'Sample provider linked to plan execution.',
  },
  {
    name: 'Nolan Reed',
    role: 'Loan Officer',
    company: 'Prime Funding',
    phone: '(555) 410-1004',
    email: 'nolan.reed@primefunding.com',
    category: 'provider',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Olivia Kent',
    role: 'Inspector Property',
    company: 'SureCheck Inspection',
    phone: '(555) 410-1005',
    email: 'olivia.kent@surecheck.com',
    category: 'vendor',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Evergreen Movers',
    role: 'Movers',
    company: 'Evergreen Movers',
    phone: '(555) 410-1006',
    email: 'dispatch@evergreenmovers.com',
    category: 'vendor',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80',
  },
];

function requireFirestore() {
  if (!firebaseFirestore) {
    throw new Error(
      'Firebase not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID to frontend/.env.local and restart the dev server.'
    );
  }
  return firebaseFirestore;
}

function normalizeDocId(rawId: string): string {
  const trimmed = rawId.trim();
  return trimmed.replace(/[\/\\?#\[\]]/g, '-');
}

function toContactRecord(id: string, data: Record<string, unknown>): ContactRecord {
  return {
    id,
    name: String(data.name || ''),
    role: String(data.role || ''),
    company: data.company ? String(data.company) : undefined,
    phone: String(data.phone || ''),
    email: String(data.email || ''),
    category: (data.category as ContactRecord['category']) || 'party',
    isFavorite: Boolean(data.isFavorite),
    imageUrl: String(data.imageUrl || ''),
    address: data.address ? String(data.address) : undefined,
    notes: data.notes ? String(data.notes) : undefined,
    linkedPlanId: (data.linkedPlanId as string | null | undefined) ?? null,
    linkedOwnerId: (data.linkedOwnerId as string | null | undefined) ?? null,
    ...data,
  };
}

function mergeUniqueContacts(contacts: ContactRecord[]): ContactRecord[] {
  const byId = new Map<string, ContactRecord>();
  const byKey = new Map<string, string>();

  contacts.forEach((contact, idx) => {
    const fallbackId = `contact_${idx + 1}`;
    const resolvedId = normalizeDocId(String(contact.id || fallbackId));
    const key = `${String(contact.name || '').toLowerCase()}::${String(contact.email || '').toLowerCase()}`;
    const existingId = byKey.get(key);
    if (existingId && byId.has(existingId)) return;
    byId.set(resolvedId, { ...contact, id: resolvedId });
    if (key !== '::') byKey.set(key, resolvedId);
  });

  return Array.from(byId.values());
}

function makeSampleContacts(planIds: string[]): ContactRecord[] {
  return SAMPLE_CONTACTS_BASE.map((base, idx) => ({
    ...base,
    id: `sample_${idx + 1}`,
    linkedPlanId: planIds.length ? planIds[idx % planIds.length] : null,
    linkedOwnerId: 'self',
  }));
}

export async function fetchContactsForOwner(ownerId: string): Promise<ContactRecord[]> {
  const db = requireFirestore();
  const q = query(collection(db, CONTACTS_COLLECTION), where('ownerId', '==', ownerId));
  const snap = await getDocs(q);

  return snap.docs.map((snapshot) => toContactRecord(snapshot.id, snapshot.data() as Record<string, unknown>));
}

export async function upsertContactsForOwner(ownerId: string, contacts: ContactRecord[]): Promise<void> {
  const db = requireFirestore();
  const batch = writeBatch(db);

  contacts.forEach((contact) => {
    const docId = normalizeDocId(String(contact.id || crypto.randomUUID()));
    const ref = doc(db, CONTACTS_COLLECTION, docId);
    batch.set(
      ref,
      {
        ...contact,
        id: docId,
        ownerId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();
}

export async function ensureSeededContactsForOwner(
  ownerId: string,
  localContacts: ContactRecord[],
  planIds: string[]
): Promise<ContactRecord[]> {
  const remoteContacts = await fetchContactsForOwner(ownerId);
  if (remoteContacts.length === 0) {
    const seeded = mergeUniqueContacts([
      ...localContacts.map((c) => ({
        ...c,
        linkedPlanId: c.linkedPlanId || (planIds[0] ?? null),
        linkedOwnerId: c.linkedOwnerId || 'self',
      })),
      ...makeSampleContacts(planIds),
    ]);
    await upsertContactsForOwner(ownerId, seeded);
    return seeded;
  }

  const remoteIdSet = new Set(remoteContacts.map((c) => c.id));
  const missingLocal = localContacts.filter((c) => c.id && !remoteIdSet.has(String(c.id)));
  if (missingLocal.length > 0) {
    await upsertContactsForOwner(ownerId, missingLocal);
    return mergeUniqueContacts([...remoteContacts, ...missingLocal]);
  }

  return remoteContacts;
}

