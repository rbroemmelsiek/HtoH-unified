export interface ContactRecord {
  id: string;
  name: string;
  role: string;
  company?: string;
  phone: string;
  email: string;
  category: 'party' | 'provider' | 'vendor';
  isFavorite: boolean;
  imageUrl: string;
  address?: string;
  notes?: string;
  linkedPlanId?: string | null;
  linkedOwnerId?: string | null;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: unknown;
}

const CONTACTS_STORAGE_KEY = 'hth-contacts-directory-v1';

/**
 * Maps AppSheet-style field names to standard ContactRecord fields.
 * Ensures parity between form data, Firestore, and local state.
 */
export function normalizeContact(data: any): ContactRecord {
  const existingId = String(data.id || data.Client_ID || data.ContactID || '').trim();
  const generatedId = existingId || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `contact_${Date.now()}`);

  const first = String(data.FirstName || '').trim();
  const last = String(data.LastName || '').trim();
  const combinedName = `${first} ${last}`.trim();
  const name = combinedName || String(data.name || '').trim() || 'New Contact';

  const phone = String(data.Mobile || data.phone || '').trim();
  const email = String(data.Email || data.email || '').trim();
  const company = String(data.CompanyName || data.company || '').trim();
  const imageUrl = String(data.Photo || data.imageUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=600&q=80').trim();
  const address = String(data.HomeAddress || data.address || '').trim();
  const notes = String(data.AdditionalInfo || data.notes || '').trim();

  // Determine category
  const services = String(data.ServicesAndProviders || '').toLowerCase();
  let category: ContactRecord['category'] = (data.category as any) || 'party';
  if (services.includes('vendor')) category = 'vendor';
  else if (services.includes('broker') || services.includes('lender') || services.includes('internal') || services.includes('agency')) category = 'provider';

  return {
    ...data,
    id: generatedId,
    Client_ID: generatedId,
    ContactID: generatedId,
    name,
    phone,
    email,
    company: company || undefined,
    imageUrl,
    address: address || undefined,
    notes: notes || undefined,
    category,
    isFavorite: Boolean(data.isFavorite),
    linkedPlanId: (data.linkedPlanId as string | null | undefined) ?? null,
    linkedOwnerId: (data.linkedOwnerId as string | null | undefined) ?? 'self',
  };
}

export const DEFAULT_CONTACTS: ContactRecord[] = [
  {
    id: '1',
    name: 'Alice Freeman',
    role: 'Buyer',
    phone: '(555) 123-4567',
    email: 'alice@example.com',
    category: 'party',
    isFavorite: true,
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    address: '123 Maple Dr, Springfield',
    notes: 'Pre-approved for $600k.',
    linkedPlanId: null,
    linkedOwnerId: 'self',
  },
  {
    id: '2',
    name: 'Bob Smith',
    role: 'Seller',
    phone: '(555) 987-6543',
    email: 'bob@example.com',
    category: 'party',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=600&q=80',
    address: '456 Oak Ln, Springfield',
    notes: 'Motivated seller, moving out of state.',
  },
  {
    id: '9',
    name: 'Alice Wilson',
    role: 'Buyer',
    phone: '(555) 321-8800',
    email: 'alice.wilson@example.com',
    category: 'party',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    address: '891 Cypress Ave, Springfield',
    notes: 'Prefers text updates after 5 PM.',
  },
  {
    id: '10',
    name: 'John Miller',
    role: 'Buyer',
    phone: '(555) 771-0101',
    email: 'john.miller@example.com',
    category: 'party',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '11',
    name: 'John Milton',
    role: 'Seller',
    phone: '(555) 771-0102',
    email: 'john.milton@example.com',
    category: 'party',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '12',
    name: 'Priya Shah',
    role: 'Transaction Coordinator',
    company: 'Prime Realty',
    phone: '(555) 883-2121',
    email: 'priya@primerealty.com',
    category: 'provider',
    isFavorite: true,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '13',
    name: 'Liam Carter',
    role: 'Photographer',
    company: 'Carter Media',
    phone: '(555) 884-7788',
    email: 'liam@cartermedia.com',
    category: 'vendor',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    name: 'Sarah Jenkins',
    role: 'Listing Agent',
    company: 'Prime Realty',
    phone: '(555) 222-3333',
    email: 'sarah@primerealty.com',
    category: 'provider',
    isFavorite: true,
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    notes: 'Co-listing agent.',
  },
  {
    id: '4',
    name: 'Mike Ross',
    role: 'Loan Officer',
    company: 'Quick Loans',
    phone: '(555) 444-5555',
    email: 'mike@quickloans.com',
    category: 'provider',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
    notes: 'Fast closer.',
  },
  {
    id: '5',
    name: 'Elena Rodriguez',
    role: 'Escrow Officer',
    company: 'Secure Title',
    phone: '(555) 666-7777',
    email: 'elena@securetitle.com',
    category: 'provider',
    isFavorite: true,
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '6',
    name: 'Tom Wilson',
    role: 'Home Inspector',
    company: 'CheckIt Inspections',
    phone: '(555) 888-9999',
    email: 'tom@checkit.com',
    category: 'vendor',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488058?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '7',
    name: 'Fix-It Felix',
    role: 'General Contractor',
    company: 'Felix Construction',
    phone: '(555) 000-1111',
    email: 'felix@build.com',
    category: 'vendor',
    isFavorite: true,
    imageUrl: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '8',
    name: 'Green Thumb Landscaping',
    role: 'Landscaper',
    company: 'Green Thumb',
    phone: '(555) 222-1212',
    email: 'info@greenthumb.com',
    category: 'vendor',
    isFavorite: false,
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getContactDirectory(): ContactRecord[] {
  if (typeof window === 'undefined') return DEFAULT_CONTACTS;
  try {
    const raw = window.localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTACTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CONTACTS;
    return parsed as ContactRecord[];
  } catch {
    return DEFAULT_CONTACTS;
  }
}

export function saveContactDirectory(contacts: ContactRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('[contactDirectory] Failed to save contacts', error);
  }
}

export function findContactsByName(input: string, contacts?: ContactRecord[]): ContactRecord[] {
  const source = contacts ?? getContactDirectory();
  const query = normalize(input);
  if (!query) return [];

  const exact = source.filter((c) => normalize(c.name) === query);
  if (exact.length > 0) return exact;

  return source.filter((c) => normalize(c.name).includes(query));
}

export function findContactsByNameSmart(input: string, contacts?: ContactRecord[]): ContactRecord[] {
  const source = contacts ?? getContactDirectory();
  const query = normalize(input);
  if (!query) return [];

  const exact = source.filter((c) => normalize(c.name) === query);
  if (exact.length > 0) return exact;

  const directIncludes = source.filter((c) => normalize(c.name).includes(query));
  if (directIncludes.length > 0) return directIncludes;

  const queryTokens = query.split(' ').filter(Boolean);
  if (queryTokens.length === 0) return [];

  return source.filter((c) => {
    const name = normalize(c.name);
    return queryTokens.every((token) => name.includes(token));
  });
}

