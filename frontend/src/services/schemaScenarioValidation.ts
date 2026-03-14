import { CONTACTS_DIRECTORY_TABLE_DEF } from './contactDirectorySchema';
import { evaluateShowIfExpression, FormUiState } from './formLogic';

type Scenario = {
  name: string;
  data: Record<string, unknown>;
  ui?: Partial<FormUiState>;
  mustShow: string[];
  mustHide: string[];
  expectedFirstStepTitle?: string;
  expectedLastStepTitle?: string;
};

type ScenarioResult = {
  name: string;
  passed: boolean;
  visibleFields: string[];
  visibleStepTitles: string[];
  failedMustShow: string[];
  failedMustHide: string[];
  failedExpectedFirstStepTitle?: string;
  failedExpectedLastStepTitle?: string;
};

function resolveVisibleFields(
  data: Record<string, unknown>,
  ui: Partial<FormUiState> = {}
): string[] {
  const fullUi: FormUiState = {
    activeField: ui.activeField ?? null,
    touched: ui.touched ?? {},
    viewType: ui.viewType ?? 'Form',
  };

  return CONTACTS_DIRECTORY_TABLE_DEF.schema
    .filter((field) => !field.hidden)
    .filter((field) =>
      evaluateShowIfExpression(
        field.showIf,
        field.showIfJson as Record<string, unknown> | undefined,
        data,
        fullUi,
        'schemaScenarioValidation'
      )
    )
    .map((field) => field.name);
}

function runScenario(scenario: Scenario): ScenarioResult {
  const visibleFields = resolveVisibleFields(scenario.data, scenario.ui);
  const visibleStepTitles = resolveVisibleStepTitles(scenario.data, scenario.ui);
  const visible = new Set(visibleFields);
  const failedMustShow = scenario.mustShow.filter((field) => !visible.has(field));
  const failedMustHide = scenario.mustHide.filter((field) => visible.has(field));
  const failedExpectedFirstStepTitle =
    scenario.expectedFirstStepTitle && visibleStepTitles[0] !== scenario.expectedFirstStepTitle
      ? visibleStepTitles[0] || '(none)'
      : undefined;
  const failedExpectedLastStepTitle =
    scenario.expectedLastStepTitle && visibleStepTitles[visibleStepTitles.length - 1] !== scenario.expectedLastStepTitle
      ? visibleStepTitles[visibleStepTitles.length - 1] || '(none)'
      : undefined;
  return {
    name: scenario.name,
    passed:
      failedMustShow.length === 0 &&
      failedMustHide.length === 0 &&
      !failedExpectedFirstStepTitle &&
      !failedExpectedLastStepTitle,
    visibleFields,
    visibleStepTitles,
    failedMustShow,
    failedMustHide,
    failedExpectedFirstStepTitle,
    failedExpectedLastStepTitle,
  };
}

function resolveVisibleStepTitles(
  data: Record<string, unknown>,
  ui: Partial<FormUiState> = {}
): string[] {
  const fullUi: FormUiState = {
    activeField: ui.activeField ?? null,
    touched: ui.touched ?? {},
    viewType: ui.viewType ?? 'Form',
  };

  const steps: Array<{ title: string; fields: string[] }> = [];
  let currentTitle = 'About';
  let currentFields: string[] = [];

  CONTACTS_DIRECTORY_TABLE_DEF.schema.forEach((field, idx) => {
    if (field.type === 'PageBreak') {
      if (idx > 0) {
        steps.push({ title: currentTitle, fields: currentFields });
      }
      currentTitle = field.label || `Page ${steps.length + 1}`;
      currentFields = [];
      return;
    }
    const isVisible =
      !field.hidden &&
      evaluateShowIfExpression(
        field.showIf,
        field.showIfJson as Record<string, unknown> | undefined,
        data,
        fullUi,
        'schemaScenarioValidation'
      );
    if (isVisible) {
      currentFields.push(field.name);
    }
  });

  if (currentFields.length > 0) {
    steps.push({ title: currentTitle, fields: currentFields });
  }

  return steps.filter((step) => step.fields.length > 0).map((step) => step.title);
}

export function runContactsDirectoryValidationScenarios(): ScenarioResult[] {
  const scenarios: Scenario[] = [
    {
      name: 'Generic Add Contact',
      data: {},
      mustShow: [
        'FirstName',
        'LastName',
        'EntityKind',
        'ServicesAndProviders',
        'Mobile',
        'Email',
        'CompanyName',
        'BusinessPhone',
        'BusinessZipCode',
      ],
      mustHide: [
        'Client_ID',
        'ProRoleType',
        'VendorRole',
        'BranchCategory',
        'Job',
        'HomePhone',
        'HomeAddress',
        'City',
        'County',
        'State',
        'ZipCode',
        'ShareWith',
        'OwnerEmail',
      ],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'Clients Path',
      data: { ServicesAndProviders: 'Clients' },
      mustShow: ['HomePhone', 'HomeAddress', 'City', 'County', 'State', 'ZipCode', 'Mobile', 'Email'],
      mustHide: ['CompanyName', 'BusinessPhone', 'BranchCategory', 'Job'],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'Law Enforcement Branch Category',
      data: { ServicesAndProviders: 'Law_Enforcement_Agency' },
      mustShow: ['BranchCategory'],
      mustHide: ['HomePhone', 'HomeAddress', 'ProRoleType', 'WebsiteURL', 'ProfileURL'],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'Law Enforcement Job',
      data: {
        ServicesAndProviders: 'Law_Enforcement_Agency',
        BranchCategory: 'Military',
      },
      mustShow: ['BranchCategory', 'Job'],
      mustHide: ['HomePhone', 'HomeAddress'],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'Broker/Lender/Closing Services Path',
      data: { ServicesAndProviders: 'Broker_Lender_Closing_Services' },
      mustShow: ['ProRoleType', 'CompanyName', 'BusinessPhone', 'OfficeEmail'],
      mustHide: ['HomePhone', 'HomeAddress', 'VendorRole', 'BranchCategory', 'Job'],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'Vendor Services Path',
      data: { ServicesAndProviders: 'Vendor_Services' },
      mustShow: ['VendorRole', 'CompanyName', 'BusinessPhone', 'OfficeEmail'],
      mustHide: ['HomePhone', 'HomeAddress', 'ProRoleType', 'BranchCategory', 'Job'],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'Internal Members Path',
      data: { ServicesAndProviders: 'Internal_Members' },
      mustShow: [
        'ProRoleType',
        'VendorRole',
        'SecurityLevel',
        'AddedBy',
        'AppUserRef',
        'DateAdded',
        'TenantID',
      ],
      mustHide: ['HomePhone', 'HomeAddress', 'BranchCategory', 'Job'],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Account and Security',
    },
    {
      name: 'Rental Building Path',
      data: { ServicesAndProviders: 'Rental_Building' },
      mustShow: ['CompanyName', 'BusinessPhone', 'OfficeEmail'],
      mustHide: ['HomePhone', 'HomeAddress', 'ProRoleType', 'VendorRole', 'BranchCategory', 'Job'],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'YouTube Interaction Reveal',
      data: { ServicesAndProviders: 'Clients' },
      ui: { touched: { YouTube: true } },
      mustShow: ['YouTubeThumbnail'],
      mustHide: ['YouTubePlayer'],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'YouTube Value Reveal',
      data: { ServicesAndProviders: 'Clients', YouTube: 'https://youtube.com/watch?v=abc' },
      mustShow: ['YouTubeThumbnail', 'YouTubePlayer'],
      mustHide: [],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
    {
      name: 'Entity Team Path',
      data: { EntityKind: 'Team' },
      mustShow: ['TeamName'],
      mustHide: [],
      expectedFirstStepTitle: 'About',
      expectedLastStepTitle: 'Notes',
    },
  ];

  return scenarios.map(runScenario);
}

export function formatScenarioResults(results: ScenarioResult[]): string {
  const lines: string[] = [];
  results.forEach((result) => {
    lines.push(`${result.passed ? 'PASS' : 'FAIL'}: ${result.name}`);
    if (!result.passed) {
      if (result.failedMustShow.length) {
        lines.push(`  Missing expected fields: ${result.failedMustShow.join(', ')}`);
      }
      if (result.failedMustHide.length) {
        lines.push(`  Unexpected visible fields: ${result.failedMustHide.join(', ')}`);
      }
      if (result.failedExpectedFirstStepTitle) {
        lines.push(`  First visible step mismatch (actual): ${result.failedExpectedFirstStepTitle}`);
      }
      if (result.failedExpectedLastStepTitle) {
        lines.push(`  Last visible step mismatch (actual): ${result.failedExpectedLastStepTitle}`);
      }
    }
  });
  return lines.join('\n');
}

// Optional CLI execution after local compile.
if (typeof process !== 'undefined' && process.argv[1]?.includes('schemaScenarioValidation')) {
  const results = runContactsDirectoryValidationScenarios();
  // eslint-disable-next-line no-console
  console.log(formatScenarioResults(results));
}
