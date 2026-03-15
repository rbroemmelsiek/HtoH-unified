export type EnumValueSource = 'displayName' | 'enumValue' | 'uniqueId';

export interface EnumCatalogItem {
  id: string;
  uniqueId: string;
  enumCategory: string;
  enumValue: string;
  displayName: string;
  sortOrder: number | null;
  raw: Record<string, unknown>;
}

interface EnumCategoryBucket {
  categoryName: string;
  records: EnumCatalogItem[];
}

export interface EnumCategoryIndex {
  getCategoryRecords: (category?: string) => EnumCatalogItem[];
  getOptionsForCategory: (category?: string, fallback?: string[], source?: EnumValueSource) => string[];
  getSelectOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: EnumValueSource
  ) => Array<{ label: string; value: string }>;
  hasCategory: (category?: string) => boolean;
  getKnownCategories: () => string[];
}

function normalizeCategoryKey(value: string): string {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function buildCategoryLookup(items: EnumCatalogItem[]): Map<string, EnumCategoryBucket> {
  const byExact = new Map<string, EnumCategoryBucket>();
  const byNormalized = new Map<string, EnumCategoryBucket>();

  items.forEach((item) => {
    const category = item.enumCategory;
    if (!category) return;

    let bucket = byExact.get(category);
    if (!bucket) {
      bucket = { categoryName: category, records: [] };
      byExact.set(category, bucket);
    }
    bucket.records.push(item);
  });

  byExact.forEach((bucket) => {
    bucket.records.sort((a, b) => {
      if (a.sortOrder !== null && b.sortOrder !== null) return a.sortOrder - b.sortOrder;
      if (a.sortOrder !== null) return -1;
      if (b.sortOrder !== null) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    const normalized = normalizeCategoryKey(bucket.categoryName);
    if (!byNormalized.has(normalized)) {
      byNormalized.set(normalized, bucket);
    }
  });

  const lookup = new Map<string, EnumCategoryBucket>();
  byExact.forEach((value, key) => {
    lookup.set(key, value);
    lookup.set(key.toLowerCase(), value);
  });
  byNormalized.forEach((value, key) => {
    lookup.set(key, value);
  });
  return lookup;
}

function resolveRecordValue(item: EnumCatalogItem, source: EnumValueSource): string {
  if (source === 'displayName') return item.displayName;
  if (source === 'uniqueId') return item.uniqueId || item.id;
  return item.enumValue || item.displayName;
}

function dedupeStringValues(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];
  values.forEach((value) => {
    const normalized = String(value).trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    deduped.push(value);
  });
  return deduped;
}

function shouldDedupeCategory(category?: string): boolean {
  const normalized = normalizeCategoryKey(category || '');
  return (
    normalized === normalizeCategoryKey('TransactionTemplateID') ||
    normalized === normalizeCategoryKey('Sell_Buy_Remodel_Refi')
  );
}

export function normalizeCatalogItem(id: string, raw: Record<string, unknown>): EnumCatalogItem | null {
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

export function buildEnumCategoryIndex(items: EnumCatalogItem[]): EnumCategoryIndex {
  const lookup = buildCategoryLookup(items);
  const knownCategories = Array.from(
    new Set(
      items
        .map((item) => item.enumCategory)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const getCategoryRecords = (category?: string): EnumCatalogItem[] => {
    if (!category) return [];
    const key = String(category).trim();
    if (!key) return [];
    const normalized = normalizeCategoryKey(key);
    const bucket = lookup.get(key) || lookup.get(key.toLowerCase()) || lookup.get(normalized);
    return bucket ? bucket.records : [];
  };

  const getOptionsForCategory = (
    category?: string,
    fallback: string[] = [],
    source: EnumValueSource = 'displayName'
  ): string[] => {
    const records = getCategoryRecords(category);
    if (records.length === 0) return fallback;
    const values = records.map((item) => resolveRecordValue(item, source)).filter(Boolean);
    return shouldDedupeCategory(category) ? dedupeStringValues(values) : values;
  };

  const getSelectOptionsForCategory = (
    category?: string,
    fallback: string[] = [],
    source: EnumValueSource = 'displayName'
  ): Array<{ label: string; value: string }> => {
    const records = getCategoryRecords(category);
    if (records.length === 0) return fallback.map((item) => ({ label: item, value: item }));
    const options = records
      .map((item) => {
        const value = resolveRecordValue(item, source);
        if (!value) return null;
        return { label: item.displayName, value };
      })
      .filter((item): item is { label: string; value: string } => Boolean(item));
    if (!shouldDedupeCategory(category)) return options;
    const seen = new Set<string>();
    return options.filter((option) => {
      const normalizedLabel = option.label.trim().toLowerCase();
      if (!normalizedLabel || seen.has(normalizedLabel)) return false;
      seen.add(normalizedLabel);
      return true;
    });
  };

  const hasCategory = (category?: string): boolean => getCategoryRecords(category).length > 0;

  const getKnownCategories = (): string[] => knownCategories;

  return {
    getCategoryRecords,
    getOptionsForCategory,
    getSelectOptionsForCategory,
    hasCategory,
    getKnownCategories,
  };
}
