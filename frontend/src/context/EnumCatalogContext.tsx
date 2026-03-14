import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firebaseFirestore } from '../lib/firebase';

const ENUMS_CATALOG_COLLECTION =
  process.env.NEXT_PUBLIC_ENUMS_CATALOG_COLLECTION || 'EnumsCatalog';

export interface EnumCatalogItem {
  id: string;
  uniqueId: string;
  enumCategory: string;
  enumValue: string;
  displayName: string;
  sortOrder: number | null;
  raw: Record<string, unknown>;
}

type GroupedEnumCatalog = Record<string, EnumCatalogItem[]>;

interface EnumCatalogContextValue {
  groupedCatalog: GroupedEnumCatalog;
  loading: boolean;
  error: string | null;
  getOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: 'displayName' | 'enumValue'
  ) => string[];
  getSelectOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: 'displayName' | 'enumValue' | 'uniqueId'
  ) => Array<{ label: string; value: string }>;
}

const EnumCatalogContext = createContext<EnumCatalogContextValue | null>(null);
const FALLBACK_ENUM_CONTEXT: EnumCatalogContextValue = {
  groupedCatalog: {},
  loading: false,
  error: null,
  getOptionsForCategory: (_category?: string, fallback: string[] = []) => fallback,
  getSelectOptionsForCategory: (_category?: string, fallback: string[] = []) =>
    fallback.map((item) => ({ label: item, value: item })),
};

function normalizeCatalogItem(id: string, raw: Record<string, unknown>): EnumCatalogItem | null {
  const enumCategory = String(raw.EnumCategory || raw.enumCategory || '').trim();
  const enumValue = String(raw.EnumValue || raw.enumValue || '').trim();
  const displayName = String(raw.DisplayName || raw.displayName || raw.Name || raw.name || enumValue).trim();
  const uniqueId = String(raw.Unique_ID || raw.unique_id || raw.uniqueId || id).trim();
  const parsedSortOrder = Number(raw.SortOrder);
  const sortOrder = Number.isFinite(parsedSortOrder) ? parsedSortOrder : null;
  if (!enumCategory || !displayName) return null;

  return {
    id,
    uniqueId,
    enumCategory,
    enumValue,
    displayName,
    sortOrder,
    raw,
  };
}

function groupCatalog(items: EnumCatalogItem[]): GroupedEnumCatalog {
  return items.reduce<GroupedEnumCatalog>((acc, item) => {
    if (!acc[item.enumCategory]) acc[item.enumCategory] = [];
    acc[item.enumCategory].push(item);
    return acc;
  }, {});
}

function normalizeCategoryKey(value: string): string {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function resolveCategoryItems(groupedCatalog: GroupedEnumCatalog, category?: string): EnumCatalogItem[] | null {
  if (!category) return null;
  if (groupedCatalog[category]) return groupedCatalog[category];

  const directInsensitive = Object.entries(groupedCatalog).find(
    ([key]) => key.toLowerCase() === String(category).toLowerCase()
  );
  if (directInsensitive) return directInsensitive[1];

  const normalizedRequested = normalizeCategoryKey(category);
  const normalizedMatch = Object.entries(groupedCatalog).find(
    ([key]) => normalizeCategoryKey(key) === normalizedRequested
  );
  return normalizedMatch ? normalizedMatch[1] : null;
}

export function EnumCatalogProvider({ children }: { children: React.ReactNode }) {
  const [groupedCatalog, setGroupedCatalog] = useState<GroupedEnumCatalog>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      if (!firebaseFirestore) return;
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getDocs(collection(firebaseFirestore, ENUMS_CATALOG_COLLECTION));
        const normalized = snapshot.docs
          .map((docSnap) => normalizeCatalogItem(docSnap.id, docSnap.data() as Record<string, unknown>))
          .filter((item): item is EnumCatalogItem => Boolean(item));
        if (!cancelled) {
          setGroupedCatalog(groupCatalog(normalized));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load enum catalog.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<EnumCatalogContextValue>(() => {
    return {
      groupedCatalog,
      loading,
      error,
      getOptionsForCategory: (
        category?: string,
        fallback: string[] = [],
        source: 'displayName' | 'enumValue' = 'displayName'
      ) => {
        if (!category) return fallback;
        const matches = resolveCategoryItems(groupedCatalog, category);
        if (!matches || matches.length === 0) return fallback;
        const sorted = [...matches].sort((a, b) => {
          if (a.sortOrder !== null && b.sortOrder !== null) return a.sortOrder - b.sortOrder;
          if (a.sortOrder !== null) return -1;
          if (b.sortOrder !== null) return 1;
          return a.displayName.localeCompare(b.displayName);
        });
        const values = sorted
          .map((item) => (source === 'enumValue' && item.enumValue ? item.enumValue : item.displayName))
          .filter(Boolean);
        return Array.from(new Set(values));
      },
      getSelectOptionsForCategory: (
        category?: string,
        fallback: string[] = [],
        source: 'displayName' | 'enumValue' | 'uniqueId' = 'enumValue'
      ) => {
        if (!category) {
          return fallback.map((item) => ({ label: item, value: item }));
        }
        const matches = resolveCategoryItems(groupedCatalog, category);
        if (!matches || matches.length === 0) {
          return fallback.map((item) => ({ label: item, value: item }));
        }
        const sorted = [...matches].sort((a, b) => {
          if (a.sortOrder !== null && b.sortOrder !== null) return a.sortOrder - b.sortOrder;
          if (a.sortOrder !== null) return -1;
          if (b.sortOrder !== null) return 1;
          return a.displayName.localeCompare(b.displayName);
        });
        const seen = new Set<string>();
        const options: Array<{ label: string; value: string }> = [];
        sorted.forEach((item) => {
          const value =
            source === 'displayName' ? item.displayName :
            source === 'uniqueId' ? item.uniqueId :
            (item.enumValue || item.displayName);
          if (!value || seen.has(value)) return;
          seen.add(value);
          options.push({ label: item.displayName, value });
        });
        return options;
      },
    };
  }, [groupedCatalog, loading, error]);

  return <EnumCatalogContext.Provider value={value}>{children}</EnumCatalogContext.Provider>;
}

export function useEnumCatalog(): EnumCatalogContextValue {
  const context = useContext(EnumCatalogContext);
  if (!context) {
    return FALLBACK_ENUM_CONTEXT;
  }
  return context;
}
