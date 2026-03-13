import { compileShowIfToJsonRule, evaluateJsonRule } from './expressionEngine';

export interface FormUiState {
  activeField: string | null;
  touched: Record<string, boolean>;
  viewType?: string;
}

export interface FormFieldLike {
  name: string;
  options?: string[];
  enumCategory?: string;
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
  const source: 'displayName' | 'enumValue' =
    field.enumValueSource === 'displayName' ? 'displayName' : 'enumValue';

  const categoryKey = field.enumCategory || field.name;
  const catalogOptions = getOptionsForCategory(categoryKey, [], source);

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
  return field.options || [];
}

export function resolveFieldSelectOptions(
  field: FormFieldLike,
  formData: Record<string, unknown>,
  getSelectOptionsForCategory: (
    category?: string,
    fallback?: string[],
    source?: 'displayName' | 'enumValue' | 'uniqueId'
  ) => EnumSelectOptionLike[]
): EnumSelectOptionLike[] {
  const source = field.enumValueSource || 'enumValue';

  if (field.optionsCategorySourceField) {
    const selectedCategory = formData?.[field.optionsCategorySourceField];
    if (!selectedCategory) return [];
    return getSelectOptionsForCategory(String(selectedCategory), [], source);
  }

  if (field.optionsSourceField && field.optionsByValue) {
    const sourceValue = formData?.[field.optionsSourceField];
    if (!sourceValue) return [];
    const selectedText = String(sourceValue).trim().toLowerCase();
    const entries = Object.entries(field.optionsByValue);
    const exact = entries.find(([key]) => key.toLowerCase() === selectedText);
    const fuzzy = entries.find(([key]) => {
      const normalizedKey = key.toLowerCase();
      return normalizedKey.includes(selectedText) || selectedText.includes(normalizedKey);
    });
    const values = exact ? exact[1] : (fuzzy ? fuzzy[1] : []);
    return values.map((item) => ({ label: item, value: item }));
  }

  if (field.enumCategory) {
    return getSelectOptionsForCategory(field.enumCategory, field.options || [], source);
  }

  return (field.options || []).map((item) => ({ label: item, value: item }));
}
