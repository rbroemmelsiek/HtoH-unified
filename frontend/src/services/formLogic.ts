import { compileShowIfToJsonRule, evaluateJsonRule } from './expressionEngine';

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
  showIf?: string;
  hidden?: boolean;
}

export interface EnumSelectOptionLike {
  label: string;
  value: string;
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

export function resolveFieldOptions(
  field: FormFieldLike,
  formData: Record<string, unknown>,
  getOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: 'displayName' | 'enumValue'
  ) => string[]
): string[] {
  const source: 'displayName' | 'enumValue' = 'displayName';
  const fallbackSource: 'displayName' | 'enumValue' = 'enumValue';

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

  const categoryKey = field.enumCategory || field.name;
  const catalogOptions = getOptionsForCategory(categoryKey, [], source);
  const catalogOptionsFallback = getOptionsForCategory(categoryKey, [], fallbackSource);

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
  return field.options || [];
}


const selectOptionsCache = new Map<string, EnumSelectOptionLike[]>();

export function resolveFieldSelectOptions(
  field: FormFieldLike,
  formData: Record<string, unknown>,
  getSelectOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: 'displayName' | 'enumValue' | 'uniqueId'
  ) => EnumSelectOptionLike[]
): EnumSelectOptionLike[] {
  const source: 'displayName' | 'enumValue' | 'uniqueId' = 'displayName';
  const fallbackSource: 'displayName' | 'enumValue' | 'uniqueId' = 'enumValue';

  // Optimization: cache results for common memory access speedup
  const sourceValue = field.optionsSourceField ? String(formData?.[field.optionsSourceField] || '') : '';
  const catSourceValue = field.optionsCategorySourceField ? String(formData?.[field.optionsCategorySourceField] || '') : '';
  const cacheKey = `${field.name}|${field.enumCategory}|${source}|${sourceValue}|${catSourceValue}`;
  
  const cached = selectOptionsCache.get(cacheKey);
  if (cached) return cached;

  let resolved: EnumSelectOptionLike[] = [];

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
  } else if (field.enumCategory) {
    resolved = getSelectOptionsForCategory(field.enumCategory, field.options || [], source);
    if (resolved.length === 0) {
      resolved = getSelectOptionsForCategory(field.enumCategory, field.options || [], fallbackSource);
    }
    if (resolved.length === 0 && field.enumCategoryAliases?.length) {
      for (const alias of field.enumCategoryAliases) {
        const aliasOptions = getSelectOptionsForCategory(alias, field.options || [], source);
        if (aliasOptions.length > 0) {
          resolved = aliasOptions;
          break;
        }
        const aliasOptionsFallback = getSelectOptionsForCategory(alias, field.options || [], fallbackSource);
        if (aliasOptionsFallback.length > 0) {
          resolved = aliasOptionsFallback;
          break;
        }
      }
    }
  } else {
    resolved = (field.options || []).map((item) => ({ label: item, value: item }));
  }

  selectOptionsCache.set(cacheKey, resolved);
  return resolved;
}

export function clearFormLogicCache() {
  selectOptionsCache.clear();
}
