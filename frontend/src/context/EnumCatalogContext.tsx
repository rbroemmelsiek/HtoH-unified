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
      // #region agent log
      fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
        body: JSON.stringify({
          sessionId: '4938d5',
          runId: 'before-fix',
          hypothesisId: 'H7',
          location: 'EnumCatalogContext.tsx:69',
          message: 'Auth state changed for enum catalog load',
          data: {
            hasUser: Boolean(user?.uid),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      if (!authReady) return;
      if (!firebaseFirestore) {
        // #region agent log
        fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
          body: JSON.stringify({
            sessionId: '4938d5',
            runId: 'before-fix',
            hypothesisId: 'H6',
            location: 'EnumCatalogContext.tsx:68',
            message: 'Skipped EnumsCatalog load because firebaseFirestore is null',
            data: {
              collection: ENUMS_CATALOG_COLLECTION,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
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
        let selectedCollection = ENUMS_CATALOG_COLLECTION;
        let normalized: EnumCatalogItem[] = [];

        for (const candidate of candidates) {
          try {
            const snapshot = await getDocs(collection(firebaseFirestore, candidate));
            const normalizedCandidate = snapshot.docs
              .map((docSnap) => normalizeCatalogItem(docSnap.id, docSnap.data() as Record<string, unknown>))
              .filter((item): item is EnumCatalogItem => Boolean(item));

            // #region agent log
            fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
              body: JSON.stringify({
                sessionId: '4938d5',
                runId: 'before-fix',
                hypothesisId: 'H10',
                location: 'EnumCatalogContext.tsx:111',
                message: 'Enum collection probe result',
                data: {
                  candidate,
                  rowCount: normalizedCandidate.length,
                },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion

            if (normalizedCandidate.length > normalized.length) {
              normalized = normalizedCandidate;
              selectedCollection = candidate;
            }
          } catch {
            // Ignore individual candidate probe failures.
          }
        }
        const grouped = groupCatalog(normalized);
        if (!cancelled) {
          setGroupedCatalog(grouped);
          setCatalogVersion((prev) => prev + 1);
          // #region agent log
          fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
            body: JSON.stringify({
              sessionId: '4938d5',
              runId: 'before-fix',
              hypothesisId: 'H1',
              location: 'EnumCatalogContext.tsx:78',
              message: 'EnumsCatalog loaded and grouped',
              data: {
                collection: selectedCollection,
                totalRows: normalized.length,
                categoryCount: Object.keys(grouped).length,
                transactionTemplateCount: grouped.TransactionTemplateID?.length || 0,
                sampleCategories: Object.keys(grouped).slice(0, 12),
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
        }
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
          body: JSON.stringify({
            sessionId: '4938d5',
            runId: 'before-fix',
            hypothesisId: 'H6',
            location: 'EnumCatalogContext.tsx:117',
            message: 'EnumsCatalog load failed',
            data: {
              collection: ENUMS_CATALOG_COLLECTION,
              error: err instanceof Error ? err.message : String(err),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
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
      ) => {
        const result = index.getSelectOptionsForCategory(category, fallback, source);
        const watchedCategories = new Set([
          'TransactionTemplateID',
          'TransactionType',
          'TypeOfSale',
          'PropertyType',
          'State',
        ]);
        if (category && (watchedCategories.has(category) || result.length === 0)) {
          // #region agent log
          fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
            body: JSON.stringify({
              sessionId: '4938d5',
              runId: 'before-fix',
              hypothesisId: 'H2',
              location: 'EnumCatalogContext.tsx:124',
              message: 'Select options lookup',
              data: {
                category,
                source,
                resolvedCount: result.length,
                fallbackCount: fallback.length,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
        }
        return result;
      },
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
