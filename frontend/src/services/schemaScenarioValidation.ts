import { CONTACTS_DIRECTORY_TABLE_DEF } from './contactDirectorySchema';
import { evaluateShowIfExpression, FormUiState } from './formLogic';

type Scenario = {
  name: string;
  data: Record<string, unknown>;
  ui?: Partial<FormUiState>;
  mustShow: string[];
  mustHide: string[];
};

type ScenarioResult = {
  name: string;
  passed: boolean;
  visibleFields: string[];
  failedMustShow: string[];
  failedMustHide: string[];
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
  const visible = new Set(visibleFields);
  const failedMustShow = scenario.mustShow.filter((field) => !visible.has(field));
  const failedMustHide = scenario.mustHide.filter((field) => visible.has(field));
  return {
    name: scenario.name,
    passed: failedMustShow.length === 0 && failedMustHide.length === 0,
    visibleFields,
    failedMustShow,
    failedMustHide,
  };
}

export function runContactsDirectoryValidationScenarios(): ScenarioResult[] {
  const scenarios: Scenario[] = [
    {
      name: 'Generic Add Contact',
      data: {},
      mustShow: [
        'ContactID',
        'FirstName',
        'LastName',
        'EntityKind',
        'ServicesAndProviders',
        'Mobile',
        'Email',
        'CompanyName',
        'BusinessPhone',
      ],
      mustHide: [
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
      ],
    },
    {
      name: 'Clients Path',
      data: { ServicesAndProviders: 'Clients' },
      mustShow: ['HomePhone', 'HomeAddress', 'City', 'County', 'State', 'ZipCode', 'Mobile', 'Email'],
      mustHide: ['CompanyName', 'BusinessPhone', 'BranchCategory', 'Job'],
    },
    {
      name: 'Law Enforcement Branch Category',
      data: { ServicesAndProviders: 'Law_Enforcement_Agency' },
      mustShow: ['BranchCategory'],
      mustHide: ['HomePhone', 'HomeAddress', 'ProRoleType'],
    },
    {
      name: 'Law Enforcement Job',
      data: {
        ServicesAndProviders: 'Law_Enforcement_Agency',
        BranchCategory: 'Military',
      },
      mustShow: ['BranchCategory', 'Job'],
      mustHide: ['HomePhone', 'HomeAddress'],
    },
    {
      name: 'Broker/Lender/Closing Services Path',
      data: { ServicesAndProviders: 'Broker_Lender_Closing_Services' },
      mustShow: ['ProRoleType', 'CompanyName', 'BusinessPhone', 'OfficeEmail'],
      mustHide: ['HomePhone', 'HomeAddress', 'VendorRole', 'BranchCategory', 'Job'],
    },
    {
      name: 'Vendor Services Path',
      data: { ServicesAndProviders: 'Vendor_Services' },
      mustShow: ['VendorRole', 'CompanyName', 'BusinessPhone', 'OfficeEmail'],
      mustHide: ['HomePhone', 'HomeAddress', 'ProRoleType', 'BranchCategory', 'Job'],
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
    },
    {
      name: 'Rental Building Path',
      data: { ServicesAndProviders: 'Rental_Building' },
      mustShow: ['CompanyName', 'BusinessPhone', 'OfficeEmail'],
      mustHide: ['HomePhone', 'HomeAddress', 'ProRoleType', 'VendorRole', 'BranchCategory', 'Job'],
    },
    {
      name: 'YouTube Interaction Reveal',
      data: { ServicesAndProviders: 'Clients' },
      ui: { touched: { YouTube: true } },
      mustShow: ['YouTubeThumbnail'],
      mustHide: ['YouTubePlayer'],
    },
    {
      name: 'YouTube Value Reveal',
      data: { ServicesAndProviders: 'Clients', YouTube: 'https://youtube.com/watch?v=abc' },
      mustShow: ['YouTubeThumbnail', 'YouTubePlayer'],
      mustHide: [],
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
