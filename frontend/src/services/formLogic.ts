import { compileShowIfToJsonRule, evaluateJsonRule } from './expressionEngine';
import type { EnumValueSource } from './enumCategoryIndex';

export interface FormUiState {
  activeField: string | null;
  touched: Record<string, boolean>;
  viewType?: string;
}

export interface FormFieldLike {
  name: string;
  options?: string[];
  optionsByCategory?: Record<string, string[]>;
  enumCategory?: string;
  enumCategoryAliases?: string[];
  enumValueSource?: 'displayName' | 'enumValue' | 'uniqueId';
  optionsCategorySourceField?: string;
  optionsSourceField?: string;
  optionsByValue?: Record<string, string[]>;
  validIf?: string;
  showIf?: string;
  hidden?: boolean;
}

export interface EnumSelectOptionLike {
  label: string;
  value: string;
}

export interface EnumFieldVerificationResult {
  status: 'pass' | 'skip' | 'fail';
  fieldName: string;
  checkedCategory?: string;
  expectedCount: number;
  resolvedCount: number;
  reason?: string;
  missingValues?: string[];
  extraValues?: string[];
}

export function evaluateShowIfExpression(
  showIf: string | undefined,
  showIfJson: Record<string, unknown> | undefined,
  formData: Record<string, unknown>,
  uiState: FormUiState,
  sourceTag: string
): boolean {
  if (showIfJson) {
    try {
      return evaluateJsonRule(showIfJson, { data: formData || {}, ui: { ...uiState, viewType: uiState.viewType || 'Form' } });
    } catch (error) {
      console.warn(`[${sourceTag}] showIfJson evaluation failed`, error);
      return true;
    }
  }
  if (!showIf) return true;
  try {
    const compiled = compileShowIfToJsonRule(showIf);
    if (!compiled) return true;
    return evaluateJsonRule(compiled, { data: formData || {}, ui: { ...uiState, viewType: uiState.viewType || 'Form' } });
  } catch (error) {
    console.warn(`[${sourceTag}] showIf evaluation failed:`, showIf, error);
    return true;
  }
}

function getCatalogCategoryFromValidIf(validIf?: string): string | null {
  if (!validIf || !validIf.includes('EnumsCatalog')) return null;
  const equalsPattern = /EnumCategory\s*(?:===|==|=)\s*["']([^"']+)["']/i;
  const bracketPattern = /\[\s*EnumCategory\s*]\s*=\s*["']([^"']+)["']/i;
  const equalsMatch = validIf.match(equalsPattern);
  if (equalsMatch?.[1]) return equalsMatch[1].trim();
  const bracketMatch = validIf.match(bracketPattern);
  if (bracketMatch?.[1]) return bracketMatch[1].trim();
  return null;
}

export function resolveFieldOptions(
  field: FormFieldLike,
  formData: Record<string, unknown>,
  getOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: EnumValueSource
  ) => string[]
): string[] {
  const source: EnumValueSource = field.enumValueSource || 'displayName';
  const fallbackSource: EnumValueSource = source === 'displayName' ? 'enumValue' : 'displayName';
  const validIfCategory = getCatalogCategoryFromValidIf(field.validIf);
  const resolvedCategory = validIfCategory || field.enumCategory || field.name;
  const isCatalogBound = Boolean(validIfCategory || field.enumCategory);

  if (field.optionsCategorySourceField) {
    const selectedCategoryRaw = formData?.[field.optionsCategorySourceField];
    if (!selectedCategoryRaw) return [];
    const selectedCategory = String(selectedCategoryRaw).trim();

    if (field.optionsByCategory) {
      const entries = Object.entries(field.optionsByCategory);
      const selectedLower = selectedCategory.toLowerCase();
      const exact = entries.find(([key]) => key.toLowerCase() === selectedLower);
      if (exact) return exact[1];
      const fuzzy = entries.find(([key]) => {
        const keyLower = key.toLowerCase();
        return keyLower.includes(selectedLower) || selectedLower.includes(keyLower);
      });
      if (fuzzy) return fuzzy[1];
    }

    const categoryOptions = getOptionsForCategory(selectedCategory, field.options || [], source);
    if (categoryOptions.length > 0) return categoryOptions;
    const fallbackCategoryOptions = getOptionsForCategory(selectedCategory, field.options || [], fallbackSource);
    if (fallbackCategoryOptions.length > 0) return fallbackCategoryOptions;
    return field.options || [];
  }

  const categoryKey = resolvedCategory;
  const catalogOptions = getOptionsForCategory(categoryKey, isCatalogBound ? [] : (field.options || []), source);
  const catalogOptionsFallback = getOptionsForCategory(categoryKey, isCatalogBound ? [] : (field.options || []), fallbackSource);

  if (field.optionsSourceField && field.optionsByValue) {
    const sourceValue = formData?.[field.optionsSourceField];
    if (!sourceValue) return [];
    const selectedText = String(sourceValue).trim().toLowerCase();
    const entries = Object.entries(field.optionsByValue);

    const exact = entries.find(([key]) => key.toLowerCase() === selectedText);
    if (exact) return exact[1];

    const fuzzy = entries.find(([key]) => {
      const normalizedKey = key.toLowerCase();
      return normalizedKey.includes(selectedText) || selectedText.includes(normalizedKey);
    });
    if (fuzzy) return fuzzy[1];
    return [];
  }

  if (catalogOptions.length > 0) return catalogOptions;
  if (catalogOptionsFallback.length > 0) return catalogOptionsFallback;
  if (field.enumCategoryAliases?.length) {
    for (const alias of field.enumCategoryAliases) {
      const aliasOptions = getOptionsForCategory(alias, [], source);
      if (aliasOptions.length > 0) return aliasOptions;
      const aliasOptionsFallback = getOptionsForCategory(alias, [], fallbackSource);
      if (aliasOptionsFallback.length > 0) return aliasOptionsFallback;
    }
  }
  if (isCatalogBound) {
    if (field.options?.length) {
      // #region agent log
      fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
        body: JSON.stringify({
          sessionId: '4938d5',
          runId: 'before-fix',
          hypothesisId: 'H9',
          location: 'formLogic.ts:153',
          message: 'Using schema fallback options for catalog-bound text options',
          data: {
            fieldName: field.name,
            enumCategory: categoryKey,
            fallbackCount: field.options.length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return field.options;
    }
    console.warn('[FormLogic] Missing EnumsCatalog category for field.', {
      fieldName: field.name,
      enumCategory: categoryKey,
      enumCategoryAliases: field.enumCategoryAliases || [],
    });
    return [];
  }
  return field.options || [];
}


const selectOptionsCache = new Map<string, EnumSelectOptionLike[]>();

export function resolveFieldSelectOptions(
  field: FormFieldLike,
  formData: Record<string, unknown>,
  getSelectOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: EnumValueSource
  ) => EnumSelectOptionLike[],
  catalogVersion = 0
): EnumSelectOptionLike[] {
  const source: EnumValueSource = field.enumValueSource || 'displayName';
  const fallbackSource: EnumValueSource = source === 'displayName' ? 'enumValue' : 'displayName';
  const validIfCategory = getCatalogCategoryFromValidIf(field.validIf);
  const resolvedCategory = validIfCategory || field.enumCategory;
  const isCatalogBound = Boolean(validIfCategory || field.enumCategory);

  // Optimization: cache results for common memory access speedup
  const sourceValue = field.optionsSourceField ? String(formData?.[field.optionsSourceField] || '') : '';
  const catSourceValue = field.optionsCategorySourceField ? String(formData?.[field.optionsCategorySourceField] || '') : '';
  const cacheKey = `${catalogVersion}|${field.name}|${resolvedCategory || ''}|${source}|${sourceValue}|${catSourceValue}`;
  
  const cached = selectOptionsCache.get(cacheKey);
  if (cached) {
    if (field.enumCategory === 'TransactionTemplateID' || field.name === 'TransactionTemplateID') {
      // #region agent log
      fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
        body: JSON.stringify({
          sessionId: '4938d5',
          runId: 'before-fix',
          hypothesisId: 'H3',
          location: 'formLogic.ts:172',
          message: 'Select options cache hit for TransactionTemplateID',
          data: {
            fieldName: field.name,
            enumCategory: field.enumCategory,
            source,
            cachedCount: cached.length,
            cacheKey,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
    return cached;
  }

  let resolved: EnumSelectOptionLike[] = [];
  const debugCategoryFields = new Set(['Property_Includes', 'Property_Excludes', 'Related TransactionParties', 'Related TransactionContacts']);

  if (field.optionsCategorySourceField) {
    const selectedCategory = formData?.[field.optionsCategorySourceField];
    if (!selectedCategory) {
      resolved = [];
    } else {
      const selectedCategoryText = String(selectedCategory).trim();
      if (field.optionsByCategory) {
        const entries = Object.entries(field.optionsByCategory);
        const selectedLower = selectedCategoryText.toLowerCase();
        const exact = entries.find(([key]) => key.toLowerCase() === selectedLower);
        const fuzzy = entries.find(([key]) => {
          const keyLower = key.toLowerCase();
          return keyLower.includes(selectedLower) || selectedLower.includes(keyLower);
        });
        const mapped = exact ? exact[1] : (fuzzy ? fuzzy[1] : []);
        if (mapped.length > 0) {
          resolved = mapped.map((item) => ({ label: item, value: item }));
        }
      }

      if (resolved.length === 0) {
        resolved = getSelectOptionsForCategory(selectedCategoryText, field.options || [], source);
      }
      if (resolved.length === 0) {
        resolved = getSelectOptionsForCategory(selectedCategoryText, field.options || [], fallbackSource);
      }
      if (resolved.length === 0 && field.options?.length) {
        resolved = field.options.map((item) => ({ label: item, value: item }));
      }
    }
  } else if (field.optionsSourceField && field.optionsByValue) {
    const sourceValueRaw = formData?.[field.optionsSourceField];
    if (sourceValueRaw) {
      const selectedText = String(sourceValueRaw).trim().toLowerCase();
      const entries = Object.entries(field.optionsByValue);
      const exact = entries.find(([key]) => key.toLowerCase() === selectedText);
      const fuzzy = entries.find(([key]) => {
        const normalizedKey = key.toLowerCase();
        return normalizedKey.includes(selectedText) || selectedText.includes(normalizedKey);
      });
      const values = exact ? exact[1] : (fuzzy ? fuzzy[1] : []);
      resolved = values.map((item) => ({ label: item, value: item }));
    }
  } else if (resolvedCategory) {
    resolved = getSelectOptionsForCategory(resolvedCategory, isCatalogBound ? [] : (field.options || []), source);
    if (resolved.length === 0) {
      resolved = getSelectOptionsForCategory(resolvedCategory, isCatalogBound ? [] : (field.options || []), fallbackSource);
    }
    if (resolved.length === 0 && field.enumCategoryAliases?.length) {
      for (const alias of field.enumCategoryAliases) {
        const aliasOptions = getSelectOptionsForCategory(alias, [], source);
        if (aliasOptions.length > 0) {
          resolved = aliasOptions;
          break;
        }
        const aliasOptionsFallback = getSelectOptionsForCategory(alias, [], fallbackSource);
        if (aliasOptionsFallback.length > 0) {
          resolved = aliasOptionsFallback;
          break;
        }
      }
    }
    if (resolved.length === 0 && isCatalogBound) {
      if (field.options?.length) {
        resolved = field.options.map((item) => ({ label: item, value: item }));
        // #region agent log
        fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
          body: JSON.stringify({
            sessionId: '4938d5',
            runId: 'before-fix',
            hypothesisId: 'H9',
            location: 'formLogic.ts:284',
            message: 'Using schema fallback options for catalog-bound select options',
            data: {
              fieldName: field.name,
              enumCategory: resolvedCategory,
              fallbackCount: field.options.length,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      } else {
      console.warn('[FormLogic] Missing EnumsCatalog select-options category for field.', {
        fieldName: field.name,
        enumCategory: resolvedCategory,
        enumCategoryAliases: field.enumCategoryAliases || [],
      });
      // #region agent log
      fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
        body: JSON.stringify({
          sessionId: '4938d5',
          runId: 'before-fix',
          hypothesisId: 'H4',
          location: 'formLogic.ts:268',
          message: 'Missing EnumsCatalog options for enum field',
          data: {
            fieldName: field.name,
            enumCategory: field.enumCategory,
            enumCategoryAliases: field.enumCategoryAliases || [],
            source,
            fallbackSource,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      }
    }
  } else {
    resolved = (field.options || []).map((item) => ({ label: item, value: item }));
  }

  if (debugCategoryFields.has(field.name)) {
    // #region agent log
    fetch('http://127.0.0.1:7550/ingest/ffd5b308-2692-4410-9cb2-c3f9560fe983', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '4938d5' },
      body: JSON.stringify({
        sessionId: '4938d5',
        runId: 'before-fix',
        hypothesisId: 'H12',
        location: 'formLogic.ts:resolveFieldSelectOptions',
        message: 'Transaction enumlist resolution result',
        data: {
          fieldName: field.name,
          resolvedCount: resolved.length,
          hasEnumCategory: Boolean(field.enumCategory),
          hasValidIfCategory: Boolean(getCatalogCategoryFromValidIf(field.validIf)),
          hasStaticOptions: Boolean(field.options?.length),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

  selectOptionsCache.set(cacheKey, resolved);
  return resolved;
}

export function verifyFieldEnumOptionsComplete(
  field: FormFieldLike & { type?: string },
  formData: Record<string, unknown>,
  getSelectOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: EnumValueSource
  ) => EnumSelectOptionLike[],
  catalogVersion = 0
): EnumFieldVerificationResult {
  const isEnumField = field.type === 'Enum' || field.type === 'EnumList';
  if (!isEnumField) {
    return {
      status: 'skip',
      fieldName: field.name,
      expectedCount: 0,
      resolvedCount: 0,
      reason: 'not-enum-field',
    };
  }

  if (!field.enumCategory) {
    const validIfCategory = getCatalogCategoryFromValidIf(field.validIf);
    if (!validIfCategory) {
      return {
        status: 'skip',
        fieldName: field.name,
        expectedCount: 0,
        resolvedCount: 0,
        reason: 'not-catalog-bound',
      };
    }
  }

  const validIfCategory = getCatalogCategoryFromValidIf(field.validIf);
  const resolvedCategory = validIfCategory || field.enumCategory;
  if (!resolvedCategory) {
    return {
      status: 'skip',
      fieldName: field.name,
      expectedCount: 0,
      resolvedCount: 0,
      reason: 'not-catalog-bound',
    };
  }

  if (field.optionsSourceField && !formData?.[field.optionsSourceField]) {
    return {
      status: 'skip',
      fieldName: field.name,
      checkedCategory: field.enumCategory,
      expectedCount: 0,
      resolvedCount: 0,
      reason: 'awaiting-options-source-value',
    };
  }

  if (field.optionsCategorySourceField && !formData?.[field.optionsCategorySourceField]) {
    return {
      status: 'skip',
      fieldName: field.name,
      checkedCategory: field.enumCategory,
      expectedCount: 0,
      resolvedCount: 0,
      reason: 'awaiting-category-source-value',
    };
  }

  const source: EnumValueSource = field.enumValueSource || 'displayName';
  const resolved = resolveFieldSelectOptions(field, formData, getSelectOptionsForCategory, catalogVersion);
  let expected = getSelectOptionsForCategory(resolvedCategory, [], source);
  let checkedCategory = resolvedCategory;

  if (expected.length === 0 && field.enumCategoryAliases?.length) {
    for (const alias of field.enumCategoryAliases) {
      const aliasOptions = getSelectOptionsForCategory(alias, [], source);
      if (aliasOptions.length > 0) {
        expected = aliasOptions;
        checkedCategory = alias;
        break;
      }
    }
  }

  if (expected.length === 0) {
    return {
      status: 'fail',
      fieldName: field.name,
      checkedCategory,
      expectedCount: 0,
      resolvedCount: resolved.length,
      reason: 'missing-catalog-category',
    };
  }

  const expectedValues = new Set(expected.map((option) => String(option.value)));
  const resolvedValues = new Set(resolved.map((option) => String(option.value)));
  const missingValues = Array.from(expectedValues).filter((value) => !resolvedValues.has(value));
  const extraValues = Array.from(resolvedValues).filter((value) => !expectedValues.has(value));

  if (missingValues.length > 0 || extraValues.length > 0 || resolved.length !== expected.length) {
    return {
      status: 'fail',
      fieldName: field.name,
      checkedCategory,
      expectedCount: expected.length,
      resolvedCount: resolved.length,
      reason: 'truncated-or-mismatched-options',
      missingValues,
      extraValues,
    };
  }

  return {
    status: 'pass',
    fieldName: field.name,
    checkedCategory,
    expectedCount: expected.length,
    resolvedCount: resolved.length,
  };
}

export function clearFormLogicCache() {
  selectOptionsCache.clear();
}
