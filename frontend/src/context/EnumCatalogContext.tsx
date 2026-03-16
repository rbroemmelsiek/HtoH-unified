import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '../lib/firebase';
import {
  buildEnumCategoryIndex,
  normalizeCatalogItem,
  type EnumCatalogItem,
  type EnumValueSource,
} from '../services/enumCategoryIndex';

const ENUMS_CATALOG_COLLECTION =
  process.env.NEXT_PUBLIC_ENUMS_CATALOG_COLLECTION || 'EnumsCatalog';

type GroupedEnumCatalog = Record<string, EnumCatalogItem[]>;

interface EnumCatalogContextValue {
  groupedCatalog: GroupedEnumCatalog;
  loading: boolean;
  error: string | null;
  catalogVersion: number;
  getOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: EnumValueSource
  ) => string[];
  getSelectOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: EnumValueSource
  ) => Array<{ label: string; value: string }>;
  hasCategory: (category?: string) => boolean;
  getKnownCategories: () => string[];
}

const EnumCatalogContext = createContext<EnumCatalogContextValue | null>(null);
const FALLBACK_ENUM_CONTEXT: EnumCatalogContextValue = {
  groupedCatalog: {},
  loading: false,
  error: null,
  catalogVersion: 0,
  getOptionsForCategory: (_category?: string, fallback: string[] = []) => fallback,
  getSelectOptionsForCategory: (_category?: string, fallback: string[] = []) =>
    fallback.map((item) => ({ label: item, value: item })),
  hasCategory: () => false,
  getKnownCategories: () => [],
};

function groupCatalog(items: EnumCatalogItem[]): GroupedEnumCatalog {
  return items.reduce<GroupedEnumCatalog>((acc, item) => {
    if (!acc[item.enumCategory]) acc[item.enumCategory] = [];
    acc[item.enumCategory].push(item);
    return acc;
  }, {});
}

export function EnumCatalogProvider({ children }: { children: React.ReactNode }) {
  const [groupedCatalog, setGroupedCatalog] = useState<GroupedEnumCatalog>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [authReady, setAuthReady] = useState<boolean>(!firebaseAuth);
  const [authUid, setAuthUid] = useState<string | null>(firebaseAuth?.currentUser?.uid || null);

  useEffect(() => {
    if (!firebaseAuth) return;
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setAuthUid(user?.uid || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      if (!authReady) return;
      if (!firebaseFirestore) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const candidates = Array.from(
          new Set([
            ENUMS_CATALOG_COLLECTION,
            'EnumsCatalog',
            'EnumCatalog',
            'enumsCatalog',
            'Enums_Catalog',
          ].filter(Boolean))
        );
        let normalized: EnumCatalogItem[] = [];

        for (const candidate of candidates) {
          try {
            const snapshot = await getDocs(collection(firebaseFirestore, candidate));
            const normalizedCandidate = snapshot.docs
              .map((docSnap) => normalizeCatalogItem(docSnap.id, docSnap.data() as Record<string, unknown>))
              .filter((item): item is EnumCatalogItem => Boolean(item));

            if (normalizedCandidate.length > normalized.length) {
              normalized = normalizedCandidate;
            }
          } catch {
            // Ignore individual candidate probe failures.
          }
        }
        const grouped = groupCatalog(normalized);
        if (!cancelled) {
          setGroupedCatalog(grouped);
          setCatalogVersion((prev) => prev + 1);
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
  }, [authReady, authUid]);

  const value = useMemo<EnumCatalogContextValue>(() => {
    const index = buildEnumCategoryIndex(Object.values(groupedCatalog).flat());
    return {
      groupedCatalog,
      loading,
      error,
      catalogVersion,
      getOptionsForCategory: (
        category?: string,
        fallback: string[] = [],
        source: EnumValueSource = 'displayName'
      ) => index.getOptionsForCategory(category, fallback, source),
      getSelectOptionsForCategory: (
        category?: string,
        fallback: string[] = [],
        source: EnumValueSource = 'displayName'
      ) => index.getSelectOptionsForCategory(category, fallback, source),
      hasCategory: (category?: string) => index.hasCategory(category),
      getKnownCategories: () => index.getKnownCategories(),
    };
  }, [groupedCatalog, loading, error, catalogVersion]);

  return <EnumCatalogContext.Provider value={value}>{children}</EnumCatalogContext.Provider>;
}

export function useEnumCatalog(): EnumCatalogContextValue {
  const context = useContext(EnumCatalogContext);
  if (!context) {
    return FALLBACK_ENUM_CONTEXT;
  }
  return context;
}
