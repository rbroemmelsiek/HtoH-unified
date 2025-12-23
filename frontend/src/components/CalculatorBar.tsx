
import React, { useState, useRef, useEffect } from 'react';
import { DollarSign, Activity, HelpCircle, X, ChevronRight, Check, RefreshCw, Banknote, Handshake, ArrowLeftRight, Scale, CircleDollarSign } from 'lucide-react';
import { CashFlowInputs, ClosingCostInputs, HomeSceneInputs, MoneySceneInputs } from '../types';
import { formatNumber, FIELD_DESCRIPTIONS } from './calculator/Shared';
import { CashToCloseTable } from './calculator/CashToCloseTable';
import { CashFlowsTable } from './calculator/CashFlowsTable';
import { HomeSceneTable } from './calculator/HomeSceneTable';
import { MoneySceneTable } from './calculator/MoneySceneTable';

interface CalculatorBarProps {
  isVisible: boolean;
  value: string;
  onChange: (val: string) => void;
  onExpand?: (expanded: boolean) => void;
}

const DEFAULT_INPUTS: CashFlowInputs = {
  scenarioName: 'EXAMPLE SCENARIO',
  purchasePrice: 499000,
  downPayment: 52000,
  capitalImprovements: 12000,
  loanAmount: 320000,
  interestRate: 5.0,
  loanTerm: 360,
  rentalRate: 3211,
  appreciationRate: 4.0,
  structurePercent: 80,
  managementPercent: 10,
  insuranceYearly: 1200,
  maintenancePercent: 3,
  hoaMonthly: 50,
  vacancyPercent: 5,
  propertyTaxYearly: 6000,
  incomeTaxRate: 30,
  otherDeductions: 0
};

const DEFAULT_CLOSING_INPUTS: ClosingCostInputs = {
  personalProperty: 300000,
  cityTax: 75,
  countyTax: 75,
  assessments: 55,
  existingLoan: 13,
  buyerLoanAmount: 321,
  deposit: 123,
  buyerCommissionContrib: 2003,
  originationFee: 321,
  loanDiscountPoints: 2,
  appraisalFee: 321,
  creditReport: 123,
  taxService: 32,
  floodCert: 133,
  underwriting: 321,
  mortgageInsApp: 321,
  assumption: 321,
  dailyInterest: 321,
  mortgageInsPremMonths: 12,
  mortgageInsPremAmount: 12,
  homeownerInsPremMonths: 12,
  homeownerInsPremAmount: 12,
  escrowDeposit: 321321,
  reservesMonths: 12,
  homeownerInsReserves: 3546,
  mortgageInsReserves: 1311,
  propertyTaxReserves: 333,
  settlementFeeBuyer: 2500,
  lenderTitleIns: 4000,
  lenderRecording: 50,
  otherServices: 30,
  aggregateAdjustmentBuyer: -195898,
  commissionRate: 15,
  payoffFirst: 250000,
  payoffSecond: 250000,
  aggregateAdjustmentSeller: 12967,
  ownerTitleIns: 4000,
  cityDeedTax: 123,
  stateDeedTax: 321,
  sellerLenderRecording: 123
};

const DEFAULT_HOME_SCENE_INPUTS: HomeSceneInputs = {
  scenarioName: "123 Cherry Ln-Remodel Only",
  salesPrice: 1250000,
  avgDaysOnMarket: 45,
  fastSellFactor: 2,
  mortgage1Balance: 400000,
  mortgage2Balance: 0,
  liens: 0,
  agentCommission: 5,
  houseSize: 2200,
  repairCostPerSqFt: 50,
  structuralRepairs: 15000,
  fixturesReplacement: 8000,
  landscaping: 5000,
  daysToRemodel: 60,
  contingencyFactor: 10,
  monthlyUtilities: 400,
  propertyTaxRate: 1.2,
  nextHomePrice: 1500000,
  percentFinanced: 80,
  loanOriginationFee: 1,
  loanRate: 6.5,
  loanPeriod: 360
};

const DEFAULT_MONEY_SCENE_INPUTS: MoneySceneInputs = {
  scenarioName: "EXAMPLE: SCENARIO A",
  assessorValue: 490000,
  arv: 575000,
  fastSellFactor: 2.0,
  discountProfit: 3.0,
  amountFinanced: 427000,
  loanOriginationFee: 1.25,
  loanRate: 6.0,
  loanPeriod: 360,
  finderFee: 200,
  agentCommissionSell: 6.0,
  houseSize: 2560,
  repairCostSqFt: 11,
  structuralRepairs: 0,
  fixtures: 0,
  landscaping: 2000,
  contingency: 10.0,
  daysToRehab: 60,
  avgDaysOnMarket: 45,
  utilitiesMonthly: 100,
  propertyTaxRate: 1.25,
  // New Fields
  inspectionFee: 392,
  buyingClosingCosts: 3920,
  insuranceMonthly: 127, // Approx from Fees/Insurance ($490) / 3.85
  homeWarranty: 490,
  titleEscrowFees: 1409,
  buyerClosingCostAssistance: 1225
};

export const CalculatorBar: React.FC<CalculatorBarProps> = ({ isVisible, value, onChange, onExpand }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'none' | 'closing' | 'flows' | 'homescene' | 'moneyscene'>('none');
  
  // State for Inputs
  const [cfInputs, setCfInputs] = useState<CashFlowInputs>(DEFAULT_INPUTS);
  const [closingInputs, setClosingInputs] = useState<ClosingCostInputs>(DEFAULT_CLOSING_INPUTS);
  const [homeSceneInputs, setHomeSceneInputs] = useState<HomeSceneInputs>(DEFAULT_HOME_SCENE_INPUTS);
  const [moneySceneInputs, setMoneySceneInputs] = useState<MoneySceneInputs>(DEFAULT_MONEY_SCENE_INPUTS);
  
  const inputRefRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const val = parseFloat(value);
    if (!isNaN(val) && Math.abs(val - cfInputs.purchasePrice) > 0.01) {
       setCfInputs(prev => ({ ...prev, purchasePrice: val }));
    }
  }, [value]);

  useEffect(() => {
    if (onExpand) {
      onExpand(activeTab !== 'none');
    }
  }, [activeTab, onExpand]);

  const displayValue = formatNumber(value);

  const handleMainValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawNumeric = input.value.replace(/,/g, '');
    if (!/^\d*\.?\d*$/.test(rawNumeric)) return;
    onChange(rawNumeric);
  };

  const toggleTab = (tab: typeof activeTab) => {
      setActiveTab(prev => prev === tab ? 'none' : tab);
  };

  return (
    <>
      <div className={`w-full px-4 py-1 pointer-events-none relative z-40 transition-all duration-400 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`relative mx-auto bg-slate-900 rounded-2xl shadow-xl pointer-events-auto flex flex-col transition-all duration-300 ${activeTab !== 'none' ? 'max-w-4xl' : 'max-w-md'}`}>
          <div className="flex items-center justify-between gap-4 p-2 sticky top-1 z-50 bg-slate-900 rounded-2xl shadow-lg border border-white">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider whitespace-nowrap pl-8">Est. Sales Value</label>
            <div className="flex items-center justify-end flex-1"><span className="text-white text-2xl font-mono mr-2 font-light">$</span><input ref={inputRefRef} type="text" value={displayValue} onChange={handleMainValueChange} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} className="w-full bg-transparent text-green-400 text-right font-mono text-2xl outline-none focus:ring-0 border-none p-0 pr-2.5 placeholder-green-400/30" placeholder="0.00" inputMode="decimal" /></div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-50">
                <button onClick={() => toggleTab('closing')} className={`bg-slate-900 border border-t-0 border-slate-700 rounded-b-lg px-3 py-0.5 transition-colors shadow-md flex items-center justify-center w-12 h-6 ${activeTab === 'closing' ? 'text-white bg-slate-800' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`} title="Cash To Close"><Handshake size={16} /></button>
                <button onClick={() => toggleTab('flows')} className={`bg-slate-900 border border-t-0 border-slate-700 rounded-b-lg px-3 py-0.5 transition-colors shadow-md flex items-center justify-center w-12 h-6 ${activeTab === 'flows' ? 'text-white bg-slate-800' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`} title="Cash Flows"><ArrowLeftRight size={16} /></button>
                <button onClick={() => toggleTab('homescene')} className={`bg-slate-900 border border-t-0 border-slate-700 rounded-b-lg px-3 py-0.5 transition-colors shadow-md flex items-center justify-center w-12 h-6 ${activeTab === 'homescene' ? 'text-white bg-slate-800' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`} title="Home Scenarios"><Scale size={16} /></button>
                <button onClick={() => toggleTab('moneyscene')} className={`bg-slate-900 border border-t-0 border-slate-700 rounded-b-lg px-3 py-0.5 transition-colors shadow-md flex items-center justify-center w-12 h-6 ${activeTab === 'moneyscene' ? 'text-white bg-slate-800' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`} title="Money Scenarios"><CircleDollarSign size={16} /></button>
            </div>
          </div>
          <div className={`bg-slate-800 rounded-b-2xl transition-all duration-300 ease-in-out border-t border-slate-700 ${activeTab !== 'none' ? 'opacity-100 max-h-none overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            
            {activeTab === 'closing' && (
              <CashToCloseTable 
                cfInputs={cfInputs} 
                closingInputs={closingInputs} 
                onUpdateCf={setCfInputs} 
                onUpdateClosing={setClosingInputs} 
                onClose={() => setActiveTab('none')} 
              />
            )}

            {activeTab === 'flows' && (
              <CashFlowsTable 
                cfInputs={cfInputs} 
                closingInputs={closingInputs}
                onUpdate={setCfInputs} 
                onClose={() => setActiveTab('none')} 
              />
            )}

            {activeTab === 'homescene' && (
              <HomeSceneTable 
                inputs={homeSceneInputs} 
                onUpdate={setHomeSceneInputs} 
                onClose={() => setActiveTab('none')} 
              />
            )}

            {activeTab === 'moneyscene' && (
              <MoneySceneTable 
                inputs={moneySceneInputs} 
                onUpdate={setMoneySceneInputs} 
                onClose={() => setActiveTab('none')} 
              />
            )}

          </div>
        </div>
      </div>
    </>
  );
};
