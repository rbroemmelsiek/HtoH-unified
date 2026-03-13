import { FieldDef, MesopType, TableDefinition } from '../types';
import { compileShowIfToJsonRule } from './expressionEngine';

const MESOP_TYPES: Set<MesopType> = new Set([
  'Address', 'App', 'ChangeCounter', 'ChangeLocation', 'ChangeTimestamp',
  'Color', 'Date', 'DateTime', 'Time', 'Decimal', 'Number', 'Percent',
  'Price', 'Progress', 'Duration', 'Email', 'File', 'Image', 'LatLong',
  'LongText', 'Name', 'Phone', 'Ref', 'Signature', 'Text', 'Thumbnail',
  'Url', 'Video', 'XY', 'Yes/No', 'Enum', 'EnumList', 'Drawing', 'PageBreak', 'SectionHeader',
]);

export interface TableValidationResult {
  ok: boolean;
  errors: string[];
}

type RawSectionField = {
  name?: string;
  label?: string;
  type?: string;
  showIf?: string | null;
  required?: boolean;
  isVirtual?: boolean;
  optionsSource?: {
    collection?: string;
    category?: string;
    displayField?: string;
    valueField?: string;
  };
};

type RawSection = {
  sectionTitle?: string;
  showIf?: string | null;
  fields?: RawSectionField[];
};

type RawSectionSchema = {
  collectionName?: string;
  sections?: RawSection[];
};

function isMesopType(value: unknown): value is MesopType {
  return typeof value === 'string' && MESOP_TYPES.has(value as MesopType);
}

function normalizeMesopType(type: string | undefined): MesopType {
  const input = String(type || '').trim();
  const map: Record<string, MesopType> = {
    'Long Text': 'LongText',
    URL: 'Url',
    'Date/Time': 'DateTime',
    'Page Header': 'PageBreak',
    'Video (Url)': 'Video',
    'Virtual Column': 'Text',
    List: 'EnumList',
    Checkbox: 'Yes/No',
  };
  const candidate = map[input] || input;
  return isMesopType(candidate) ? candidate : 'Text';
}

function combineShowIf(sectionShowIf?: string | null, fieldShowIf?: string | null): string | undefined {
  const s = sectionShowIf ? String(sectionShowIf).trim() : '';
  const f = fieldShowIf ? String(fieldShowIf).trim() : '';
  if (s && f) return `(${s}) && (${f})`;
  if (s) return s;
  if (f) return f;
  return undefined;
}

export function coerceTableDefinition(input: unknown, fallbackId = 'contacts', fallbackName = 'Contacts Directory'): TableDefinition {
  if (Array.isArray(input)) {
    return {
      id: fallbackId,
      name: fallbackName,
      schema: input as FieldDef[],
      keyField: 'id',
      labelField: 'name',
    };
  }

  if (!input || typeof input !== 'object') {
    return {
      id: fallbackId,
      name: fallbackName,
      schema: [],
      keyField: 'id',
      labelField: 'name',
    };
  }

  const raw = input as Partial<TableDefinition> & RawSectionSchema;
  if (Array.isArray(raw.schema)) {
    return {
      id: raw.id || fallbackId,
      name: raw.name || fallbackName,
      schema: raw.schema,
      keyField: raw.keyField || 'id',
      labelField: raw.labelField || 'name',
    };
  }

  if (Array.isArray(raw.sections)) {
    const schema: FieldDef[] = [];
    raw.sections.forEach((section, idx) => {
      if (idx > 0) {
        schema.push({
          name: `section_${idx}`,
          label: section.sectionTitle || `Section ${idx + 1}`,
          type: 'PageBreak',
        });
      }
      (section.fields || []).forEach((field, fieldIdx) => {
        const fieldName = String(field.name || `field_${idx}_${fieldIdx}`);
        const mesopType = normalizeMesopType(field.type);
        const combinedShowIf = combineShowIf(section.showIf, field.showIf);
        const showIfJson = combinedShowIf ? (compileShowIfToJsonRule(combinedShowIf) || undefined) : undefined;
        const nextField: FieldDef = {
          name: fieldName,
          label: String(field.label || fieldName),
          type: mesopType,
          showIf: combinedShowIf,
          showIfJson,
          readOnly: false,
          hidden: Boolean(field.isVirtual),
        };

        if (field.optionsSource?.category) {
          nextField.enumCategory = String(field.optionsSource.category);
          const valueField = String(field.optionsSource.valueField || '').toLowerCase();
          if (valueField === 'unique_id' || valueField === 'uniqueid') {
            nextField.enumValueSource = 'uniqueId';
          } else if (valueField === 'displayname') {
            nextField.enumValueSource = 'displayName';
          } else {
            nextField.enumValueSource = 'enumValue';
          }
        }
        schema.push(nextField);
      });
    });
    return {
      id: String(raw.collectionName || raw.id || fallbackId),
      name: String(raw.name || raw.collectionName || fallbackName),
      schema,
      keyField: raw.keyField || 'ContactID',
      labelField: raw.labelField || 'FirstName',
    };
  }

  return {
    id: String(raw.id || fallbackId),
    name: String(raw.name || fallbackName),
    schema: [],
    keyField: String(raw.keyField || 'id'),
    labelField: String(raw.labelField || 'name'),
  };
}

export function validateField(field: FieldDef, index: number): string[] {
  const errors: string[] = [];
  if (!field.name?.trim()) errors.push(`Field[${index}] is missing "name".`);
  if (!field.label?.trim()) errors.push(`Field[${index}] (${field.name || 'unnamed'}) is missing "label".`);
  if (!isMesopType(field.type)) errors.push(`Field[${index}] (${field.name || 'unnamed'}) has invalid type "${String(field.type)}".`);

  if (field.optionsSourceField && !field.optionsByValue) {
    errors.push(`Field "${field.name}" has optionsSourceField but no optionsByValue.`);
  }

  if (field.optionsByValue && !field.optionsSourceField) {
    errors.push(`Field "${field.name}" has optionsByValue but no optionsSourceField.`);
  }

  if ((field.type === 'Enum' || field.type === 'EnumList') &&
      !field.options &&
      !field.enumCategory &&
      !field.optionsSourceField) {
    errors.push(`Field "${field.name}" (${field.type}) has no options, enumCategory, or optionsSourceField.`);
  }

  return errors;
}

export function validateTableDefinition(def: TableDefinition): TableValidationResult {
  const errors: string[] = [];
  if (!def.id?.trim()) errors.push('Table definition missing "id".');
  if (!def.name?.trim()) errors.push('Table definition missing "name".');
  if (!Array.isArray(def.schema) || def.schema.length === 0) errors.push('Table definition requires a non-empty "schema" array.');
  if (!def.keyField?.trim()) errors.push('Table definition missing "keyField".');
  if (!def.labelField?.trim()) errors.push('Table definition missing "labelField".');

  if (Array.isArray(def.schema)) {
    const seenNames = new Set<string>();
    def.schema.forEach((field, index) => {
      validateField(field, index).forEach((error) => errors.push(error));
      if (field.name) {
        if (seenNames.has(field.name)) errors.push(`Duplicate field name "${field.name}".`);
        seenNames.add(field.name);
      }
    });
  }

  return { ok: errors.length === 0, errors };
}
