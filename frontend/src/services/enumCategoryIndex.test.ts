import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEnumCategoryIndex, normalizeCatalogItem } from './enumCategoryIndex';
import { resolveFieldSelectOptions } from './formLogic';

const SAMPLE_ITEMS = [
  normalizeCatalogItem('1', {
    Unique_ID: 'A-1',
    EnumCategory: 'TransactionType',
    EnumValue: 'purchase',
    DisplayName: 'Purchase',
    SortOrder: 2,
  }),
  normalizeCatalogItem('2', {
    Unique_ID: 'A-2',
    EnumCategory: 'TransactionType',
    EnumValue: 'listing',
    DisplayName: 'Listing',
    SortOrder: 1,
  }),
  normalizeCatalogItem('3', {
    Unique_ID: 'S-CA',
    EnumCategory: 'State',
    EnumValue: 'CA',
    DisplayName: 'California',
    SortOrder: 2,
  }),
  normalizeCatalogItem('4', {
    Unique_ID: 'S-AZ',
    EnumCategory: 'State',
    EnumValue: 'AZ',
    DisplayName: 'Arizona',
    SortOrder: 1,
  }),
].filter((item): item is NonNullable<typeof item> => Boolean(item));

test('EnumCategoryIndex returns complete sorted category records', () => {
  const index = buildEnumCategoryIndex(SAMPLE_ITEMS);
  const records = index.getCategoryRecords('TransactionType');
  assert.equal(records.length, 2);
  assert.equal(records[0].displayName, 'Listing');
  assert.equal(records[1].displayName, 'Purchase');
});

test('EnumCategoryIndex resolves category aliases case-insensitively', () => {
  const index = buildEnumCategoryIndex(SAMPLE_ITEMS);
  assert.equal(index.hasCategory('transaction_type'), true);
  assert.equal(index.hasCategory('TRANSACTION TYPE'), true);
  assert.equal(index.hasCategory('TransactionType'), true);
});

test('EnumCategoryIndex select options honor source mode', () => {
  const index = buildEnumCategoryIndex(SAMPLE_ITEMS);
  const display = index.getSelectOptionsForCategory('State', [], 'displayName');
  const enumValues = index.getSelectOptionsForCategory('State', [], 'enumValue');
  const uniqueIds = index.getSelectOptionsForCategory('State', [], 'uniqueId');

  assert.deepEqual(display.map((option) => option.value), ['Arizona', 'California']);
  assert.deepEqual(enumValues.map((option) => option.value), ['AZ', 'CA']);
  assert.deepEqual(uniqueIds.map((option) => option.value), ['S-AZ', 'S-CA']);
});

test('resolveFieldSelectOptions does not hallucinate enumCategory members', () => {
  const options = resolveFieldSelectOptions(
    {
      name: 'SecurityLevel',
      enumCategory: 'MissingCategory',
      enumValueSource: 'displayName',
      options: ['fallback-should-not-appear'],
    },
    {},
    () => [],
    1
  );

  assert.deepEqual(options, []);
});

