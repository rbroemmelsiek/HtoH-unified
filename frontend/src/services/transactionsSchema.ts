import { TableDefinition } from '../types';

/**
 * Canonical Transactions schema (refined from AppSheet export).
 * Improvements:
 * - Optimized showIf logic for faster evaluation.
 * - Added virtual fields for video switching (IFS logic).
 * - Full field parity with provided JSON structure including required and formula attributes.
 * - Field names updated to match space-delimited AppSheet/CSV format for better data mapping.
 */
export const TRANSACTIONS_TABLE_DEF: TableDefinition = {
  id: 'transactions',
  name: 'Transactions',
  keyField: 'TransactionID',
  labelField: 'Property_Street',
  schema: [
    // --- SECTION: TRANSACTION TYPE ---
    { name: 'deal_info_break', label: 'Transaction Type', type: 'PageBreak' },
    { 
      name: 'TransactionTemplateID', 
      label: 'Service Plan', 
      type: 'Enum', 
      enumCategory: 'Sell_Buy_Remodel_Refi',
      enumCategoryAliases: ['TransactionTemplateID'],
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "Sell_Buy_Remodel_Refi"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { 
      name: 'Related TransactionParties', 
      label: 'Add your Client(s)', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      required: false,
      isVirtual: false 
    },
    { 
      name: 'TransactionType', 
      label: 'Client Transaction Type', 
      type: 'Enum', 
      enumCategory: 'TransactionType', 
      enumCategoryAliases: ['TransactionTypes'], 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "TransactionTypes"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    {
      name: 'TypeOfSale',
      label: 'Type of Sale',
      type: 'Enum',
      enumCategory: 'TypeOfSale',
      enumValueSource: 'displayName',
      showIf: "['Purchase', 'Listing'].includes(data.TransactionType)",
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "TypeOfSale"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    {
      name: 'FinancingType',
      label: 'Financing Type',
      type: 'Enum',
      enumCategory: 'FinancingType',
      enumValueSource: 'displayName',
      showIf: "data.TransactionType === 'Purchase'",
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "FinancingType"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { 
      name: 'Related TransactionContacts', 
      label: 'Add Vendor(s)', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      required: false,
      isVirtual: false
    },
    { 
      name: 'LeaseTermOneYearPlus', 
      label: 'Lease Term 1 Year Plus', 
      type: 'Yes/No', 
      showIf: "data.TransactionType === 'Lease'",
      required: false,
      isVirtual: false
    },

    // --- SECTION: HOME FACTS ---
    { name: 'home_facts_break', label: "Seller's Home Facts", type: 'PageBreak' },
    { 
      name: 'PropertyType', 
      label: 'Property Type', 
      type: 'Enum', 
      enumCategory: 'PropertyType', 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "PropertyType"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { 
      name: 'HomeStyle', 
      label: 'Home Style', 
      type: 'Enum', 
      enumCategory: 'HomeStyle', 
      enumCategoryAliases: ['Home_Style'], 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "Home_Style"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { 
      name: 'ExteriorFinish', 
      label: 'Exterior Finish', 
      type: 'EnumList', 
      enumCategory: 'ExteriorFinish', 
      enumCategoryAliases: ['Exterior_Finish'], 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "Exterior_Finish"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { 
      name: 'RoofType', 
      label: 'Roof Type', 
      type: 'Enum', 
      enumCategory: 'RoofType', 
      enumCategoryAliases: ['Roof_Type'], 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "Roof_Type"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { name: 'SqFt', label: 'SqFt', type: 'Number', required: false, isVirtual: false },
    { name: 'LotSizeAcre', label: 'Lot Size (Acre)', type: 'Decimal', required: false, isVirtual: false },
    { name: 'Beds', label: 'Beds', type: 'Number', required: false, isVirtual: false },
    { name: 'Baths', label: 'Baths', type: 'Decimal', required: false, isVirtual: false },
    { 
      name: 'AdditionalRooms', 
      label: 'Additional Rooms', 
      type: 'EnumList', 
      enumCategory: 'AdditionalRooms', 
      enumCategoryAliases: ['Additional_Rooms'], 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "Additional_Rooms"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { name: 'Stories', label: 'Stories', type: 'Number', required: false, isVirtual: false },
    { name: 'GarageCars', label: 'Garage Cars', type: 'Number', required: false, isVirtual: false },
    { name: 'YearBuilt', label: 'Year Built', type: 'Date', required: false, isVirtual: false },
    { name: 'YearRemodeled', label: 'Year Remodeled', type: 'Date', required: false, isVirtual: false },
    { 
      name: 'InsideIncluded', 
      label: 'Inside Included', 
      type: 'EnumList', 
      enumCategory: 'InsideIncluded', 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "InsideIncluded"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { 
      name: 'ApplianceFuelType', 
      label: 'Appliance Fuel Type', 
      type: 'EnumList', 
      enumCategory: 'ApplianceFuelType', 
      enumCategoryAliases: ['Appliance_Fuel_Type'], 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "Appliance_Fuel_Type"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { 
      name: 'OutsideIncluded', 
      label: 'Outside Included', 
      type: 'EnumList', 
      enumCategory: 'OutsideIncluded', 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "OutsideIncluded"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { 
      name: 'Equestrian', 
      label: 'Equestrian', 
      type: 'EnumList', 
      enumCategory: 'Equestrian', 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "Equestrian"), data.SortOrder)',
      showIf: "data.OutsideIncluded && data.OutsideIncluded.includes('Equestrian')",
      required: false,
      isVirtual: false
    },
    { 
      name: 'View', 
      label: 'View', 
      type: 'EnumList', 
      enumCategory: 'View', 
      enumCategoryAliases: ['Views'], 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "Views"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { name: 'InHOA', label: 'In HOA', type: 'Yes/No', showIf: "['Purchase', 'Listing'].includes(data.TransactionType)", required: false, isVirtual: false },
    { name: 'InFloodZone', label: 'In Flood Zone', type: 'Yes/No', showIf: "['Purchase', 'Listing'].includes(data.TransactionType)", required: false, isVirtual: false },
    { name: 'HighFireZone', label: 'In High Fire Zone', type: 'Yes/No', showIf: "['Purchase', 'Listing'].includes(data.TransactionType)", required: false, isVirtual: false },
    { name: 'Additional Property Info', label: 'Additional Property Info', type: 'LongText', placeholder: 'Dictate or type...', required: false, isVirtual: false },
    { name: 'Agreements Describe', label: 'Agreements Describe', type: 'LongText', placeholder: 'Dictate or type...', required: false, isVirtual: false },

    // --- SECTION: MOBILE HOME ---
    { 
      name: 'mobile_home_break', 
      label: 'Mobile Home Details', 
      type: 'PageBreak', 
      showIf: "['Manufactured Home'].includes(data.PropertyType)" 
    },
    { name: 'Mobile_Home_Year', label: 'Mobile Home Year', type: 'Date', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Lot_Number', label: 'Lot Number', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Mobile_Home_Make', label: 'Mobile Home Make', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Unit_Number', label: 'Unit Number', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Mobile_Home_Serial_No', label: 'Mobile Home Serial No', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Block', label: 'Block', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Mobile_Home_HCD_Decal', label: 'Mobile Home HCD Decal', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Subdivision', label: 'Subdivision', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Plat_Book', label: 'Plat Book', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },
    { name: 'Page_Number', label: 'Page Number', type: 'Text', showIf: "['Manufactured Home'].includes(data.PropertyType)", required: false, isVirtual: false },

    // --- SECTION: LEGAL & LISTING ---
    { name: 'legal_listing_break', label: 'Legal & Listing', type: 'PageBreak', showIf: "['Purchase', 'Listing', 'Lease'].includes(data.TransactionType)" },
    { name: 'Listed_Price', label: 'Listed Price', type: 'Price', showIf: "['Purchase', 'Listing', 'Lease'].includes(data.TransactionType)", required: false, isVirtual: false },
    { name: 'ProbateAuthority', label: 'Probate Authority', type: 'Text', showIf: "data.TypeOfSale === '1031 Exchange'", required: false, isVirtual: false },
    { name: 'Attorney', label: 'Attorney', type: 'Text', showIf: "data.ProbateAuthority === 'Y'", required: false, isVirtual: false },
    { name: 'AttorneyContact', label: 'Attorney Contact', type: 'Text', showIf: "data.ProbateAuthority === 'Y'", required: false, isVirtual: false },
    { name: 'Property_Street', label: 'Property Street', type: 'Address', required: false, isVirtual: false },
    { name: 'Property_City', label: 'Property City', type: 'Text', required: false, isVirtual: false },
    { name: 'Property_County', label: 'Property County', type: 'Text', required: false, isVirtual: false },
    { 
      name: 'Property_State', 
      label: 'Property State', 
      type: 'Enum', 
      enumCategory: 'State', 
      enumValueSource: 'displayName',
      validIf: 'ORDERBY(FILTER(EnumsCatalog, data.EnumCategory === "State"), data.SortOrder)',
      required: false,
      isVirtual: false
    },
    { name: 'Property_Zip', label: 'Property Zip', type: 'Number', required: false, isVirtual: false },
    { name: 'MLS_Number', label: 'MLS Number', type: 'Text', required: false, isVirtual: false },
    { name: 'MLS_Description', label: 'MLS Description', type: 'LongText', placeholder: 'Dictate or type...', required: false, isVirtual: false },
    { name: 'Legal_Description', label: 'Legal Description', type: 'Text', required: false, isVirtual: false },
    { name: 'Tax_ID', label: 'Tax ID', type: 'Text', required: false, isVirtual: false },
    { name: 'Assessor_Parcel_No', label: 'Assessor Parcel No', type: 'Text', required: false, isVirtual: false },
    { name: 'Listing_Date', label: 'Listing Date', type: 'Date', initialValue: 'TODAY()', required: false, isVirtual: false },
    { name: 'Expiration_Date', label: 'Expiration Date', type: 'Date', initialValue: 'TODAY()', required: false, isVirtual: false },
    { name: 'Listing_Agreement_Date', label: 'Listing Agreement Date', type: 'Date', initialValue: 'TODAY()', required: false, isVirtual: false },

    // --- SECTION: SELLER FINANCIALS ---
    { name: 'seller_financials_break', label: 'Seller Financials', type: 'PageBreak', showIf: "data.TransactionType === 'Listing'" },
    { name: 'Balance_1st_Mortgage', label: 'Balance 1st Mortgage', type: 'Price', required: false, isVirtual: false },
    { name: 'Balance_2nd_Mortgage', label: 'Balance 2nd Mortgage', type: 'Price', required: false, isVirtual: false },
    { name: 'Other_Liens', label: 'Other Liens', type: 'Price', required: false, isVirtual: false },
    { name: 'Other_Liens_Description', label: 'Other Liens Description', type: 'LongText', placeholder: 'Dictate or type...', required: false, isVirtual: false },
    { name: 'Total_Encumbrances', label: 'Total Encumbrances', type: 'Price', required: false, isVirtual: false },
    { name: 'HOA_Dues', label: 'HOA Dues', type: 'Price', required: false, isVirtual: false },
    { name: 'Transfer_Fee', label: 'Transfer Fee', type: 'Price', required: false, isVirtual: false },
    { name: 'Doc_Preparation_Fees', label: 'Doc Preparation Fees', type: 'Price', required: false, isVirtual: false },
    { 
      name: 'Property_Includes', 
      label: 'Property Includes', 
      type: 'EnumList', 
      enumCategory: 'Property_Includes',
      enumValueSource: 'displayName',
      required: false,
      isVirtual: false
    },
    { 
      name: 'Property_Excludes', 
      label: 'Property Excludes', 
      type: 'EnumList', 
      enumCategory: 'Property_Excludes',
      enumValueSource: 'displayName',
      required: false,
      isVirtual: false
    },
    { name: 'Leased_Items', label: 'Leased Items', type: 'LongText', placeholder: 'Dictate or type...', required: false, isVirtual: false },
    { name: 'Supplemental_Info', label: 'Supplemental Info', type: 'LongText', placeholder: 'Dictate or type...', required: false, isVirtual: false },

    // --- SECTION: BUYER FINANCIALS ---
    { name: 'buyer_financials_break', label: 'Buyer Financials', type: 'PageBreak', showIf: "data.TransactionType === 'Purchase'" },
    { name: 'Purchase_Price', label: 'Purchase Price', type: 'Price', required: false, isVirtual: false },
    { name: 'Purchase_Agreement_Date', label: 'Purchase Agreement Date', type: 'DateTime', initialValue: 'TODAY()', required: false, isVirtual: false },
    { name: 'Closing_Date', label: 'Closing Date', type: 'DateTime', required: false, isVirtual: false },
    { name: 'Deposit_Amount', label: 'Deposit Amount', type: 'Price', required: false, isVirtual: false },
    { name: 'Deposit_1st_Increase', label: 'Deposit 1st Increase', type: 'Price', required: false, isVirtual: false },
    { name: 'Deposit_2nd_Increase', label: 'Deposit 2nd Increase', type: 'Price', required: false, isVirtual: false },
    { name: 'Deposit_3rd_Increase', label: 'Deposit 3rd Increase', type: 'Price', required: false, isVirtual: false },
    { name: 'Total_Amount_Financed', label: 'Total Amount Financed', type: 'Price', required: false, isVirtual: false },
    { name: 'Offer_Date', label: 'Offer Date', type: 'DateTime', initialValue: 'NOW()', required: false, isVirtual: false },
    { name: 'Offer_Acceptance_Date', label: 'Offer Acceptance Date', type: 'DateTime', required: false, isVirtual: false },
    { name: 'Offer_Expire_Date', label: 'Offer Expire Date', type: 'Date', required: false, isVirtual: false },
    { name: 'Offer_Expire_Time', label: 'Offer Expire Time', type: 'Time', required: false, isVirtual: false },

    // --- SECTION: FORMS ---
    { name: 'forms_engine_break', label: 'Transaction Forms', type: 'PageBreak' },
    { 
      name: 'SelectedFormInstances', 
      label: 'Selected Forms', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      formula: 'REF_ROWS("FormInstance", "Transaction_ID")',
      required: false,
      isVirtual: false
    },
    { 
      name: 'AllRelatedProperties', 
      label: 'All Related Properties', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      required: false,
      isVirtual: false
    },

    // --- SECTION: SECURITY & SYS KEYS ---
    { name: 'security_break', label: 'Security', type: 'PageBreak' },
    { name: 'TransactionID', label: 'Transaction ID', type: 'Text', initialValue: 'UNIQUEID()', readOnly: true, required: false, isVirtual: false },
    { name: 'Added By', label: 'Added By', type: 'Email', initialValue: 'USEREMAIL()', readOnly: true, required: false, isVirtual: false },
    { name: 'TenantID', label: 'Tenant ID', type: 'Text', initialValue: 'USERSETTINGS("TenantID")', readOnly: true, required: false, isVirtual: false },
    { 
      name: 'SecurityLevel', 
      label: 'Security Level', 
      type: 'Number', 
      initialValue: 'USERSETTINGS("SecurityLevel")', 
      formula: 'LOOKUP(data.Email,"AppUsers","Email","SecurityLevel")',
      readOnly: true,
      required: false,
      isVirtual: false
    },
    { name: 'OwnerEmail', label: 'Owner Email', type: 'Email', initialValue: 'USERSETTINGS("SelectedRootEmail")', readOnly: true, required: false, isVirtual: false },
    { name: 'SupervisorEmail', label: 'Supervisor Email', type: 'Email', initialValue: 'USERSETTINGS("SupervisorEmail")', readOnly: true, required: false, isVirtual: false },
    { name: 'ShareWith', label: 'Share With', type: 'Email', required: false, isVirtual: false },
    { name: 'DateAdded', label: 'Date Added', type: 'DateTime', initialValue: 'NOW()', readOnly: true, required: false, isVirtual: false },

    // --- VIRTUAL / COMPUTED FIELDS ---
    { 
      name: 'Related TransactionParties_Virtual', 
      label: 'Related TransactionParties', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      formula: 'REF_ROWS("TransactionParties","Transaction_ID")',
      hidden: true,
      isVirtual: true
    },
    { 
      name: 'Related TransactionContacts_Virtual', 
      label: 'Related TransactionContacts', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      formula: 'REF_ROWS("TransactionContacts","TransactionID")',
      hidden: true,
      isVirtual: true
    },
    { 
      name: 'Related FormInstances_Virtual', 
      label: 'Related FormInstances', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      formula: 'REF_ROWS("FormInstance", "Transaction_ID")',
      hidden: true,
      isVirtual: true
    },
    { 
      name: 'RelatedProperties_Virtual', 
      label: 'Related Properties', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      formula: 'REF_ROWS("RelatedProperties", "Transaction_ID")',
      hidden: true,
      isVirtual: true
    },
    { 
      name: 'AllRelatedProperties_Virtual', 
      label: 'All Related Properties', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      formula: 'SELECT(RelatedProperties.RelatedProperties_ID, data.Transaction_ID === data._THISROW.TransactionID)',
      hidden: true,
      isVirtual: true
    },
    { 
      name: 'Party Name', 
      label: 'Party Name', 
      type: 'EnumList', 
      enumValueSource: 'displayName',
      formula: 'data.Related TransactionParties.ContactName',
      hidden: true,
      isVirtual: true
    },
    { 
      name: '_FullAddress', 
      label: 'Full Address', 
      type: 'Address', 
      formula: 'CONCATENATE(data.Property_Street, " ", data.Property_City, " ", (LOOKUP(data.Property_State, "EnumsCatalog", "Unique_ID", "DisplayName")), " ", data.Property_Zip)',
      hidden: true,
      isVirtual: true
    },

    // --- VIDEO SWITCH FIELDS (SHOW TYPE) ---
    { 
      name: 'FinancingType Switch', 
      label: 'Financing Type Video', 
      type: 'Show', 
      showIf: 'ISNOTBLANK(data.FinancingType)',
      formula: 'IFS(ISBLANK(data.FinancingType), "", data.FinancingType === "Conventional Loan", "https://www.youtube.com/embed/l-rKCVKUjLU", data.FinancingType === "FHA Loan", "https://www.youtube.com/embed/rgUBO16uIhM", data.FinancingType === "VA Loan", "https://www.youtube.com/embed/rgUBO16uIhM", data.FinancingType === "Cash", "https://www.youtube.com/embed/43hES0qvu60", data.FinancingType === "Seller Financing", "https://www.youtube.com/embed/2tFszPARx1M", data.FinancingType === "Assumption", "https://www.youtube.com/embed/K0o6ipRjJtE", TRUE, "https://www.youtube.com/embed/K0o6ipRjJtE")',
      hidden: false,
      isVirtual: true
    },
    { 
      name: 'Video Switch', 
      label: 'Guidance Video', 
      type: 'Show', 
      showIf: 'ISNOTBLANK(data.FinancingType)',
      formula: 'IFS(ISBLANK(data.FinancingType), "", IN(data.FinancingType, LIST("Conventional Loan","FHA Loan","VA Loan")), "https://www.youtube.com/embed/K0o6ipRjJtE", data.FinancingType === "Cash", "https://www.youtube.com/embed/43hES0qvu60", data.FinancingType === "Seller Financing", "https://www.youtube.com/embed/2tFszPARx1M", data.FinancingType === "Assumption", "https://www.youtube.com/embed/-VnzFq1RTs4", TRUE, "https://www.youtube.com/embed/2tFszPARx1M")',
      hidden: false,
      isVirtual: true
    },
    { 
      name: 'ServicePlan Switch', 
      label: 'Service Plan Overview', 
      type: 'Show', 
      showIf: 'ISNOTBLANK(data.TransactionTemplateID)',
      formula: 'IFS(ISBLANK(data.TransactionTemplateID), "", IN(data.TransactionTemplateID, LIST("Braveheart (Military)","Braveheart (First Responders)","Commercial Sale - Buyer\'s Agent")), "https://www.youtube.com/embed/7P9PmPYWOGk", data.TransactionTemplateID === "Buy a Home", "https://www.youtube.com/embed/d6lWTQZhsx0", data.TransactionTemplateID === "Sell then Buy Home", "https://www.youtube.com/embed/5rY119xePFo", data.TransactionTemplateID === "Sell a Home", "https://www.youtube.com/embed/Aq-QD0luOCE", data.TransactionTemplateID === "Remodel Home", "https://www.youtube.com/embed/9HZSQw6kjlw", data.TransactionTemplateID === "Buy a Vacation Home", "https://www.youtube.com/embed/w71YrDkC18A", data.TransactionTemplateID === "Buy your First Home", "https://www.youtube.com/embed/RV_gck6eeos", data.TransactionTemplateID === "Investor Buy and Hold", "https://www.youtube.com/embed/5MwlbScdzac", data.TransactionTemplateID === "Finance your Home", "https://www.youtube.com/embed/9HZSQw6kjlw", data.TransactionTemplateID === "Rent or Buy", "https://www.youtube.com/embed/GOiAkECP1fE", data.TransactionTemplateID === "Investor Flip", "https://www.youtube.com/embed/8zEQC94dyH8", data.TransactionTemplateID === "DEFAULT", "https://www.youtube.com/embed/7P9PmPYWOGk", TRUE, "https://www.youtube.com/embed/7P9PmPYWOGk")',
      hidden: false,
      isVirtual: true
    },
    { 
      name: 'TransactionTypes Switch', 
      label: 'Transaction Type Guidance', 
      type: 'Show', 
      showIf: 'ISNOTBLANK(data.TransactionType)',
      formula: 'IFS(ISBLANK(data.TransactionType), "", data.TransactionType === "Purchase", "https://www.youtube.com/embed/vzrQuDwpN58", data.TransactionType === "Listing", "https://www.youtube.com/embed/D-bwmjv6IqU", data.TransactionType === "Lease", "https://www.youtube.com/embed/jBaTuXO51pE", data.TransactionType === "Refinance", "https://www.youtube.com/embed/gbTZUdYZUjQ", data.TransactionType === "Remodel", "https://www.youtube.com/embed/okgpfO0e8YI", TRUE, "")',
      hidden: false,
      isVirtual: true
    },
    { name: 'InHOA switch', label: 'HOA Information', type: 'Show', showIf: 'data.InHOA === TRUE', formula: '"https://www.youtube.com/embed/D_PBfEi-f_4"', hidden: false, isVirtual: true },
    { name: 'InFloodZone Switch', label: 'Flood Zone Information', type: 'Show', showIf: 'data.InFloodZone === TRUE', formula: '"https://www.youtube.com/embed/1UxyPOO6-5s"', hidden: false, isVirtual: true },
    { name: 'HighFireZone Switch', label: 'Fire Zone Information', type: 'Show', showIf: 'data.HighFireZone === TRUE', formula: '"https://www.youtube.com/embed/23_f8C_cfw4"', hidden: false, isVirtual: true },
    { name: 'ApplianceFuel Switch', label: 'Appliance & Fuel Info', type: 'Show', showIf: 'ISNOTBLANK(data.ApplianceFuelType)', formula: '"https://www.youtube.com/embed/FmSPziTFjeU"', hidden: false, isVirtual: true },
    { name: 'YearBuilt Switch', label: 'Property Age Info', type: 'Show', showIf: 'ISNOTBLANK(data.YearBuilt)', formula: '"https://www.youtube.com/embed/nESHBRteq7I"', hidden: false, isVirtual: true },
    { name: 'InsideIncluded Switch', label: 'Inside Included Features', type: 'Show', showIf: 'ISNOTBLANK(data.InsideIncluded)', formula: '"https://www.youtube.com/embed/ZLquk0Q0l5o"', hidden: false, isVirtual: true },
    { name: 'Additional Property Info Switch', label: 'Property Details Video', type: 'Show', showIf: 'ISNOTBLANK(data["Additional Property Info"])', formula: '"https://www.youtube.com/embed/v3XyyAWUa3U"', hidden: false, isVirtual: true },
    { name: 'Agreements Describe Switch', label: 'Agreements Overview', type: 'Show', showIf: 'ISNOTBLANK(data["Agreements Describe"])', formula: '"https://www.youtube.com/embed/zrY7vQkpOBo"', hidden: false, isVirtual: true },
    { name: 'OutsideIncluded Switch', label: 'Outside Included Features', type: 'Show', showIf: 'ISNOTBLANK(data.OutsideIncluded)', formula: '"https://www.youtube.com/embed/RyFJw6fFkmw"', hidden: false, isVirtual: true },
    { name: 'MobileHomeYear Switch', label: 'Mobile Home Age Info', type: 'Show', showIf: 'ISNOTBLANK(data.Mobile_Home_Year)', formula: '"https://www.youtube.com/embed/6P8zF5VWQwI"', hidden: false, isVirtual: true },
    { name: 'MobileHomeMake Switch', label: 'Mobile Home Manufacturer', type: 'Show', showIf: 'ISNOTBLANK(data.Mobile_Home_Make)', formula: '"https://www.youtube.com/embed/kFx4AXZ8ed0"', hidden: false, isVirtual: true },
    { name: 'ListedPrice Switch', label: 'Pricing Strategy', type: 'Show', showIf: 'ISNOTBLANK(data.Listed_Price)', formula: '"https://www.youtube.com/embed/5q1Aa_G3Smo"', hidden: false, isVirtual: true },
    { name: 'PropertyStreet Switch', label: 'Property Location Info', type: 'Show', showIf: 'ISNOTBLANK(data.Property_Street)', formula: '"https://www.youtube.com/embed/DY8g1cIHYuw"', hidden: false, isVirtual: true },
    { name: 'MLS_Number Switch', label: 'MLS System Info', type: 'Show', showIf: 'ISNOTBLANK(data.MLS_Number)', formula: '"https://www.youtube.com/embed/DXio12IpyYk"', hidden: false, isVirtual: true },
    { name: 'MLS_Description Switch', label: 'Writing Compelling Descriptions', type: 'Show', showIf: 'ISNOTBLANK(data.MLS_Description)', formula: '"https://www.youtube.com/embed/1BRCfGygfnw"', hidden: false, isVirtual: true },
    { name: 'APN Switch', label: 'Parcel Number Guidance', type: 'Show', showIf: 'ISNOTBLANK(data.Assessor_Parcel_No)', formula: '"https://www.youtube.com/embed/9vzmsTniwW8"', hidden: false, isVirtual: true },
    { name: 'Expiration_Date Switch', label: 'Listing Expiration Info', type: 'Show', showIf: 'data.Expiration_Date > TODAY()', formula: '"https://www.youtube.com/embed/wzv7DPHPlp8"', hidden: false, isVirtual: true },
    { name: 'TransactionClients Switch', label: 'Client Representation', type: 'Show', showIf: 'ISNOTBLANK(data["Related TransactionParties"])', formula: '"https://www.youtube.com/embed/V04jPFR8ueU"', hidden: false, isVirtual: true },
    { name: 'TransactionContacts Switch', label: 'Vendor Coordination', type: 'Show', showIf: 'ISNOTBLANK(data["Related TransactionContacts"])', formula: '"https://www.youtube.com/embed/uhCcmXQW08w"', hidden: false, isVirtual: true },
    { name: 'PurchasePrice Switch', label: 'Purchase Offer Strategy', type: 'Show', showIf: 'ISNOTBLANK(data.Purchase_Price)', formula: '"https://www.youtube.com/embed/ddUXge8erCE"', hidden: false, isVirtual: true },
    { name: 'PurchaseAgreementDate Switch', label: 'Contract Timeline Info', type: 'Show', showIf: 'data.Purchase_Agreement_Date !== TODAY()', formula: '"https://www.youtube.com/embed/nUaT_8PDH0E"', hidden: false, isVirtual: true },
    { name: 'ClosingDate Switch', label: 'Closing Process Overview', type: 'Show', showIf: 'data.Closing_Date > TODAY()', formula: '"https://www.youtube.com/embed/QwtTFkyt7s4"', hidden: false, isVirtual: true },
    { name: 'DepositAmount Switch', label: 'Earnest Money Guidance', type: 'Show', showIf: 'ISNOTBLANK(data.Deposit_Amount)', formula: '"https://www.youtube.com/embed/cCdL4JVMwbo"', hidden: false, isVirtual: true },
    { name: 'Deposit1stIncrease Switch', label: 'Deposit Increase Info', type: 'Show', showIf: 'ISNOTBLANK(data.Deposit_1st_Increase)', formula: '"https://www.youtube.com/embed/UD7iYFoFpBs"', hidden: false, isVirtual: true },
    { name: 'OfferDate Switch', label: 'Offer Submission Info', type: 'Show', showIf: 'ISNOTBLANK(data.Offer_Date)', formula: '"https://www.youtube.com/embed/8bv_TvbKp3E"', hidden: false, isVirtual: true },
    { name: 'OfferExpireDate Switch', label: 'Offer Expiration Guidance', type: 'Show', showIf: 'ISNOTBLANK(data.Offer_Expire_Date)', formula: '"https://www.youtube.com/embed/_NCekGF7Ry0"', hidden: false, isVirtual: true },
    { name: 'OfferAcceptanceDate Switch', label: 'Acceptance & Ratification', type: 'Show', showIf: 'ISNOTBLANK(data.Offer_Acceptance_Date)', formula: '"https://www.youtube.com/embed/VEfrh8_6e5w"', hidden: false, isVirtual: true },
    { name: 'TotalAmountFinanced Switch', label: 'Financing & Loans', type: 'Show', showIf: 'ISNOTBLANK(data.Total_Amount_Financed)', formula: '"https://www.youtube.com/embed/K0o6ipRjJtE"', hidden: false, isVirtual: true },
    { name: 'ListingDate Switch', label: 'listing Timeline', type: 'Show', showIf: 'data.Listing_Date !== TODAY()', formula: '"https://www.youtube.com/embed/pNG2Fuj2XrA"', hidden: false, isVirtual: true },
    { 
      name: 'TypeOfSale Switch', 
      label: 'Special Sale Types Guidance', 
      type: 'Show', 
      showIf: 'ISNOTBLANK(data.TypeOfSale)', 
      formula: 'IFS(ISBLANK(data.TypeOfSale), "", data.TypeOfSale === "Standard Sale", "https://www.youtube.com/embed/61EFfBdqmlw", data.TypeOfSale === "Sell & Buy Home", "https://www.youtube.com/embed/bP_nr5tFhi8", data.TypeOfSale === "Probate/Trust/Estate", "https://www.youtube.com/embed/tcH1Cfhem20", data.TypeOfSale === "REO/Foreclosure", "https://www.youtube.com/embed/Jtmds0ggc9c", data.TypeOfSale === "Short Sale", "https://www.youtube.com/embed/XK3vAi0NP3w", data.TypeOfSale === "New Construction (Subdivision)", "https://www.youtube.com/embed/6P8zF5VWQwI", data.TypeOfSale === "New Home (No Subdivision)", "https://www.youtube.com/embed/6P8zF5VWQwI", data.TypeOfSale === "1031 Exchange", "https://www.youtube.com/embed/pmKmLXW-Zbk", data.TypeOfSale === "Manufactured Home", "https://www.youtube.com/embed/kFx4AXZ8ed0", data.TypeOfSale === "Flipper Sale", "https://www.youtube.com/embed/C5ewmKdO6tI", data.TypeOfSale === "Any Sale", "https://www.youtube.com/embed/6P8zF5VWQwI", TRUE, "https://www.youtube.com/embed/6P8zF5VWQwI")',
      hidden: false,
      isVirtual: true
    },
    { 
      name: 'PropertyType Switch', 
      label: 'Property Type Info', 
      type: 'Show', 
      showIf: 'ISNOTBLANK(data.PropertyType)', 
      formula: 'IFS(ISBLANK(data.PropertyType), "", data.PropertyType === "Single Family", "https://www.youtube.com/embed/DY8g1cIHYuw", data.PropertyType === "Condominium", "https://www.youtube.com/embed/1RbBPGnnCQk", data.PropertyType === "Manufactured Home", "https://www.youtube.com/embed/kFx4AXZ8ed0", data.PropertyType === "Vacant Land", "https://www.youtube.com/embed/IbPHwaOt37o", IN(data.PropertyType, LIST("Residential (1-4 Units)","Residential (5+Units)","Townhome/Rowhouse","Coop","Apartment","Mixed Use","Commercial Industrial","Other")), "https://www.youtube.com/embed/6P8zF5VWQwI", TRUE, "https://www.youtube.com/embed/6P8zF5VWQwI")',
      hidden: false,
      isVirtual: true
    },
    { name: 'Balance1stMortgage Switch', label: 'Mortgage Information', type: 'Show', showIf: 'ISNOTBLANK(data.Balance_1st_Mortgage)', formula: '"https://www.youtube.com/embed/G-2PwzlKUM0"', hidden: false, isVirtual: true },
    { name: 'OtherLiens Switch', label: 'Other Liens Info', type: 'Show', showIf: 'ISNOTBLANK(data.Other_Liens)', formula: '"https://www.youtube.com/embed/SCKZTGrJsh4"', hidden: false, isVirtual: true },
    { name: 'OtherLiensDescription Switch', label: 'Lien Descriptions', type: 'Show', showIf: 'ISNOTBLANK(data.Other_Liens_Description)', formula: '"https://www.youtube.com/embed/1wcgjLOze4k"', hidden: false, isVirtual: true },
    { name: 'TotalEncumbrances Switch', label: 'Encumbrance Overview', type: 'Show', showIf: 'ISNOTBLANK(data.Total_Encumbrances)', formula: '"https://www.youtube.com/embed/o54DfyewUKw"', hidden: false, isVirtual: true },
    { name: 'HOADues Switch', label: 'HOA Fees Guidance', type: 'Show', showIf: 'ISNOTBLANK(data.HOA_Dues)', formula: '"https://www.youtube.com/embed/1RbBPGnnCQk"', hidden: false, isVirtual: true },
    { name: 'DocPreparationFees Switch', label: 'Document Fees Info', type: 'Show', showIf: 'ISNOTBLANK(data.Doc_Preparation_Fees)', formula: '"https://www.youtube.com/embed/D_PBfEi-f_4"', hidden: false, isVirtual: true },
    { name: 'TransferFee Switch', label: 'Transfer Taxes & Fees', type: 'Show', showIf: 'ISNOTBLANK(data.Transfer_Fee)', formula: '"https://www.youtube.com/embed/9m2b9nHF5O4"', hidden: false, isVirtual: true },
    { name: 'LeasedItems Switch', label: 'Leased Equipment Info', type: 'Show', showIf: 'ISNOTBLANK(data.Leased_Items)', formula: '"https://www.youtube.com/embed/gP3an1pfIzw"', hidden: false, isVirtual: true },
    { name: 'SupplementalInfo Switch', label: 'Supplemental Data Guidance', type: 'Show', showIf: 'ISNOTBLANK(data.Supplemental_Info)', formula: '"https://www.youtube.com/embed/DQAMUrX4VhM"', hidden: false, isVirtual: true },
  ],
};
