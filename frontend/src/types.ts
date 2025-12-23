

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  agentId?: string;
  audioUrl?: string; // For caching TTS result
}

export interface Suggestion {
  id: string;
  text: string;
}

export type MesopType = 
  'Address' | 'App' | 'ChangeCounter' | 'ChangeLocation' | 'ChangeTimestamp' | 
  'Color' | 'Date' | 'DateTime' | 'Time' | 'Decimal' | 'Number' | 'Percent' | 
  'Price' | 'Progress' | 'Duration' | 'Email' | 'File' | 'Image' | 'LatLong' | 
  'LongText' | 'Name' | 'Phone' | 'Ref' | 'Signature' | 'Text' | 'Thumbnail' | 
  'Url' | 'Video' | 'XY' | 'Yes/No' | 'Enum' | 'EnumList' | 'Drawing' | 'PageBreak' | 'SectionHeader';

export interface FieldDef {
  name: string;
  label: string;
  type: MesopType;
  options?: string[];
  readOnly?: boolean;
  placeholder?: string;
  defaultValue?: any;
  hidden?: boolean;
  description?: string; // Tooltip help text
}

export interface TableDefinition {
  id: string;
  name: string;
  schema: FieldDef[];
  keyField: string;
  labelField: string;
}

export interface AppConfig {
  corpusData: string;
  corpusFileName: string | null;
  tableDefinitions: TableDefinition[];
  maxFileSizeMB: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  avatarIcon: string; 
  imageUrl: string;
  color: string;
  voiceName: 'Kore' | 'Fenrir' | 'Puck' | 'Charon' | 'Zephyr';
  tools: string[];
  customEndpoints: string[];
}

export interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  channel: string;
  views: string;
  date: string;
  duration: string;
  likes: number;
}

export type ExpandedWidgetType = 'calendar' | 'maps' | 'places' | 'youtube' | 'graph' | 'forms' | 'contacts' | 'plan' | 'academy' | 'academy_hub' | 'kindle' | null;
export type TargetTool = 'general' | 'forms' | 'contacts';

// --- CALCULATOR TYPES ---

export interface CashFlowInputs {
  scenarioName: string;
  purchasePrice: number;
  downPayment: number;
  capitalImprovements: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  rentalRate: number;
  appreciationRate: number;
  structurePercent: number;
  managementPercent: number;
  insuranceYearly: number;
  maintenancePercent: number;
  hoaMonthly: number;
  vacancyPercent: number;
  propertyTaxYearly: number;
  incomeTaxRate: number;
  otherDeductions: number;
}

export interface ClosingCostInputs {
  personalProperty: number;
  cityTax: number;
  countyTax: number;
  assessments: number;
  existingLoan: number;
  buyerLoanAmount: number;
  deposit: number;
  commissionRate: number;
  buyerCommissionContrib: number;
  originationFee: number;
  loanDiscountPoints: number;
  appraisalFee: number;
  creditReport: number;
  taxService: number;
  floodCert: number;
  underwriting: number;
  mortgageInsApp: number;
  assumption: number;
  dailyInterest: number;
  mortgageInsPremMonths: number;
  mortgageInsPremAmount: number;
  homeownerInsPremMonths: number;
  homeownerInsPremAmount: number;
  escrowDeposit: number;
  reservesMonths: number;
  homeownerInsReserves: number;
  mortgageInsReserves: number;
  propertyTaxReserves: number;
  settlementFeeBuyer: number;
  lenderTitleIns: number;
  lenderRecording: number;
  otherServices: number;
  aggregateAdjustmentBuyer: number;
  payoffFirst: number;
  payoffSecond: number;
  aggregateAdjustmentSeller: number;
  ownerTitleIns: number;
  cityDeedTax: number;
  stateDeedTax: number;
  sellerLenderRecording: number;
}

export interface HomeSceneInputs {
  scenarioName: string;
  salesPrice: number;
  avgDaysOnMarket: number;
  fastSellFactor: number;
  mortgage1Balance: number;
  mortgage2Balance: number;
  liens: number;
  agentCommission: number;
  houseSize: number;
  repairCostPerSqFt: number;
  structuralRepairs: number;
  fixturesReplacement: number;
  landscaping: number;
  daysToRemodel: number;
  contingencyFactor: number;
  monthlyUtilities: number;
  propertyTaxRate: number;
  nextHomePrice: number;
  percentFinanced: number;
  loanOriginationFee: number;
  loanRate: number;
  loanPeriod: number;
}

export interface MoneySceneInputs {
  scenarioName: string;
  assessorValue: number;
  arv: number;
  fastSellFactor: number; // %
  discountProfit: number; // %
  amountFinanced: number;
  loanOriginationFee: number; // %
  loanRate: number; // %
  loanPeriod: number; // months
  finderFee: number;
  agentCommissionSell: number; // %
  houseSize: number;
  repairCostSqFt: number;
  structuralRepairs: number;
  fixtures: number;
  landscaping: number;
  contingency: number; // %
  daysToRehab: number;
  avgDaysOnMarket: number;
  utilitiesMonthly: number;
  propertyTaxRate: number; // %
  // New Fields for Breakdown Accuracy
  inspectionFee: number;
  buyingClosingCosts: number; 
  insuranceMonthly: number;
  homeWarranty: number;
  titleEscrowFees: number;
  buyerClosingCostAssistance: number;
}

export const DEFAULT_SYSTEM_INSTRUCTION = `You are a helpful, precise AI assistant.
1. You must strictly adhere to the provided Knowledge Base (Corpus) if available.
2. If the answer is not in the Corpus, politely state that you don't know based on the available data.
3. Maintain a professional and neutral tone.
4. Do not hallucinate facts.`;

export const AVAILABLE_TOOLS = [
  "Web Search",
  "Calculator",
  "Code Interpreter",
  "Calendar Integration",
  "Property Database",
  "Forms Library",
  "Contacts Directory",
  "Service Plan Widget",
  "Google Maps API",
  "Google Places API",
  "YouTube Data API",
  "Graph Widget", 
  "Gmail API",
  "Google Drive API",
  "Google Sheets API",
  "Image Generation (Imagen)",
  "Video Generation (Veo)",
  "Voice (TTS)"
];

export const AVAILABLE_VOICES = ['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'];

export const TRANSACTIONAL_SERVICES = [
  "Agent", "Salesperson", "Broker", "Seller Agent", "Seller Broker", 
  "Buyer Agent", "Buyer Broker", "Landlord Agent", "Escrow Officer", 
  "Title Company", "Transaction Coordinator", "Attorney", "Loan Officer", "Realtor"
];

export const VENDOR_SERVICES = [
  "Appraiser", "Attorney", "Cabinet Maker", "Carpenter", "Concrete Mason", 
  "Contractor", "Demolition", "Electrician", "Flooring", "Gardener", 
  "Home Warranty", "Homeowners Association", "House Cleaner", "Inspector Pest", 
  "Inspector Property", "Inspector Roof", "Inspector Sewer-Well", "Insurance", 
  "Interior Designer", "Junk Removal", "Landscaper", "Movers", "Notary", 
  "Painter", "Pest Control", "Photographer Videographer", "Plumber", 
  "Pool Service", "Roofer", "Staging Home Service", "Tile and Granite Mason", 
  "Utilities", "Vendor", "Other"
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'service_plan',
    name: "Agent's Service Plan",
    role: 'Transparent Service',
    description: 'Outline of services and commitments.',
    systemInstruction: 'You are the Agent Service Plan expert. Explain the value proposition, services included, and transparency of the agency agreement.',
    avatarIcon: 'FileSignature',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=256&q=80',
    color: 'bg-blue-600',
    voiceName: 'Kore',
    tools: ['Web Search'],
    customEndpoints: []
  },
  {
    id: 'ethics_advisor',
    name: 'Ai Ethics Advisor',
    role: 'Risk Mitigation',
    description: 'Ensures fairness, ethics, and legal compliance.',
    systemInstruction: 'You are the Ai Ethics Advisor. Your goal is to ensure all actions, advice, and documents adhere strictly to Real Estate ethics, Fair Housing laws, and moral integrity. Be cautious, cite rules, and warn against risky or unethical behavior. Prioritize doing the right thing over closing the deal.',
    avatarIcon: 'Scale',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80', 
    color: 'bg-emerald-700',
    voiceName: 'Kore',
    tools: ['Web Search', 'Property Database'],
    customEndpoints: []
  },
  {
    id: 'key_maker',
    name: 'Ai Key Maker',
    role: 'Home Prospector',
    description: 'Unlocks complex deals and finds solutions.',
    systemInstruction: 'You are the Ai Key Maker. You solve impossible problems. You find the "key" to unlocking a stalled deal, a difficult client, or a complex negotiation. You are cryptic but highly effective. Focus on critical path solutions and removing roadblocks.',
    avatarIcon: 'Key',
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
    color: 'bg-indigo-600',
    voiceName: 'Fenrir',
    tools: ['Calculator', 'Code Interpreter'],
    customEndpoints: []
  },
  {
    id: 'purchase_specialist',
    name: 'Ai Termsheet Expert',
    role: 'Negotiating Instrument',
    description: 'Meticulous contract review and generation.',
    systemInstruction: 'You are the Ai Termsheet Expert. You are a meticulous contract expert. Your objective is to review agreements for errors, suggest protective clauses, and explain fine print in simple terms. Be formal, precise, and detail-oriented. Protect the client from liability.',
    avatarIcon: 'FileSignature',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    color: 'bg-rose-600',
    voiceName: 'Puck',
    tools: ['Web Search'],
    customEndpoints: []
  },
  {
    id: 'negotiating_coach',
    name: 'Ai Negotiating Coach',
    role: 'Behavioral Economics',
    description: 'Expert advice on closing and negotiation.',
    systemInstruction: 'You are the Ai Negotiating Coach. You are a seasoned veteran of sales. You provide scripts, psychological tactics, and negotiation strategies. You are encouraging but firm. Focus on leverage, pricing strategies, and closing the deal effectively.',
    avatarIcon: 'Handshake',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    color: 'bg-amber-600',
    voiceName: 'Charon',
    tools: ['Calculator'],
    customEndpoints: []
  },
  {
    id: 'forms_librarian',
    name: 'Ai Forms Librarian',
    role: 'Quick Lookup',
    description: 'Organizes and finds the correct forms.',
    systemInstruction: 'You are the Ai Forms Librarian. Your expertise is in locating, explaining, and organizing real estate forms. You ensure the correct versions are used, help users navigate the library of documents, and provide clarity on which forms are required for specific transaction types.',
    avatarIcon: 'Library',
    imageUrl: 'https://images.unsplash.com/photo-1598550832205-d41fcd7546e5?auto=format&fit=crop&w=256&q=80',
    color: 'bg-teal-700',
    voiceName: 'Zephyr',
    tools: ['Property Database', 'Calendar Integration', 'Forms Library', 'Contacts Directory'],
    customEndpoints: []
  },
  {
    id: 'talent_scout',
    name: 'AI Talent Scout',
    role: 'Professionals Finder',
    description: 'Connects with top real estate professionals.',
    systemInstruction: 'You are the AI Talent Scout. You help find inspectors, contractors, and other professionals needed for the transaction. You have a database of vetted vendors.',
    avatarIcon: 'Handshake',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=256&q=80',
    color: 'bg-purple-600',
    voiceName: 'Puck',
    tools: ['Contacts Directory'],
    customEndpoints: []
  },
  {
    id: 'transaction_coordinator',
    name: 'Ai Transaction',
    role: 'Coordinate Closing Service',
    description: 'Manages the closing process and timeline.',
    systemInstruction: 'You are the Transaction Coordinator. You track deadlines, ensure all paperwork is submitted on time, and coordinate between all parties to ensure a smooth closing.',
    avatarIcon: 'FileSignature',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=256&q=80',
    color: 'bg-cyan-600',
    voiceName: 'Kore',
    tools: ['Calendar Integration'],
    customEndpoints: []
  },
  {
    id: 'agent_advocate',
    name: 'Agent Advocate GPT',
    role: 'Link to Prospects',
    description: 'Advocates for the agent and connects with prospects.',
    systemInstruction: 'You are the Agent Advocate. You help nurture leads, explain the value of the agent to potential clients, and represent the agent\'s best interests in preliminary discussions.',
    avatarIcon: 'Handshake',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=256&q=80',
    color: 'bg-orange-600',
    voiceName: 'Fenrir',
    tools: ['Contacts Directory'],
    customEndpoints: []
  },
  {
    id: 'marketing_shaman',
    name: 'Ai Marketing Shaman',
    role: 'Personalized Messaging',
    description: 'Creates compelling marketing content.',
    systemInstruction: 'You are the Marketing Shaman. You craft creative, personalized, and compelling marketing messages, listings descriptions, and social media content to sell homes faster.',
    avatarIcon: 'Scale',
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea0e935640e?auto=format&fit=crop&w=256&q=80',
    color: 'bg-pink-600',
    voiceName: 'Charon',
    tools: ['Web Search'],
    customEndpoints: []
  },
  {
    id: 'client_care',
    name: 'Ai Client Care',
    role: 'White Glove Support',
    description: 'Provides exceptional client support.',
    systemInstruction: 'You are the Client Care AI. Your sole focus is ensuring the client feels supported, heard, and valued throughout the stressful process of buying or selling a home. You provide "White Glove" service.',
    avatarIcon: 'Handshake',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7985c2d17554?auto=format&fit=crop&w=256&q=80',
    color: 'bg-sky-600',
    voiceName: 'Zephyr',
    tools: ['Contacts Directory'],
    customEndpoints: []
  }
];