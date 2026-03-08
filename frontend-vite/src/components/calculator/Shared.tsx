
import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

export const rowStyle = "border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors";
// Reduced padding on mobile (px-1) to ensure tables fit without clipping
export const cellStyle = "py-2 px-1 md:px-4 text-slate-300 text-[10px] md:text-xs align-middle break-words whitespace-normal";
export const numCellStyle = "py-2 px-1 md:px-4 text-right font-mono text-slate-300 text-[10px] md:text-xs align-middle whitespace-normal break-all md:break-normal md:whitespace-nowrap";

export const formatNumber = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const strVal = val.toString();
  const parts = strVal.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

export const formatPrice = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '';
  return formatNumber(num.toFixed(2));
};

export const formatPercent = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '';
  // Preserve 2–4 decimals: pad to 2, cap at 4
  const parts = num.toString().split('.');
  if (parts.length > 1) {
    let decimals = parts[1];
    decimals = decimals.slice(0, 4);
    if (decimals.length < 2) decimals = decimals.padEnd(2, '0');
    return `${formatNumber(parts[0])}.${decimals}%`;
  }
  return `${formatNumber(parts[0])}.00%`;
};

export const FIELD_DESCRIPTIONS: Record<string, string> = {
  // Cash Flow & General
  'Purchase Price ($)': 'Purchase Price entered is used to determine your ROI / appreciation.',
  'Capital Improvements ($)': 'Capital improvements are typically any improvements beyond maintenance. Consult the tax code.',
  'Loan Amount ($)': 'Enter 0 if no loan is used to finance purchase.',
  'Interest Rate (Annual %)': 'Provide APR (annual percentage rate) which includes discount points. Enter 0 if no loan is used.',
  'Loan Term (months)': 'Term of amortized Loan. Enter 360 for 30 years. Enter 180 for 15 years. Enter 0 if no loan is used.',
  'Current Rental Rate ($/month)': 'Expected monthly rent from tenants.',
  'Market Appreciation Rate (%/year)': 'Estimated yearly increase in property value.',
  'Structure % of Value': 'Percentage of purchase price allocated to the building structure (depreciable), distinct from land.',
  'Property Management (%)': 'Fees paid to a property manager, typically a percentage of monthly rent (typically 6-10%). Enter 0 if you are managing the property or are not renting it.',
  'Property Insurance ($ per year)': 'Annual cost of hazard/fire insurance.',
  'Maintenance (%)': 'Estimated annual maintenance costs as a percentage of monthly rent. Condos are very low.',
  'HOA fees ($/month)': "Monthly Home Owners Association dues. All condos and some housing developments may have these.",
  'Vacancy Rate (%)': 'Estimated percentage of time the property will be vacant. Typical vacancy rate is 5-10% per year.',
  'Property Tax ($/year)': 'Annual property taxes. Typically as a % of purchase price, include all local and state property taxes.',
  'Ordinary Income Tax Rate (%)': 'Your marginal income tax rate, used to calculate tax benefits. Typically between 30% and 40% when combined.',
  'Other deductible expenses': 'Any other monthly tax-deductible expenses.',

  // Closing Costs
  'Contract sales price': 'Your Purchase Contract spells out the sales price and other material conditions of the sale.',
  'Personal property': "If personal property is a part of the purchase, include it's sale price separately.",
  'Settlement charges to borrower': 'Total of all loan, title, and recording fees for the buyer.',
  'City/town taxes': 'Use minus sign with number for unpaid (e.g. -75). Prorated city taxes.',
  'County taxes': 'Use minus sign with number for unpaid (e.g. -75). Prorated county taxes.',
  'Assessments': 'Use minus sign with number for unpaid (e.g. -55). Special assessments or liens.',
  'Deposit or earnest money': 'Cash already paid by buyer to hold the home.',
  'Principal amount of new loan(s)': 'Total amount being borrowed.',
  'Settlement charges to seller': 'Total closing costs deducted from seller proceeds.',
  'Existing loan(s) taken subject to': 'Taken subject to: Assumption of loans owing by the Seller.',
  'Payoff of first mortgage loan': "Amount to pay off seller's existing first mortgage.",
  'Payoff of second mortgage loan': "Amount to pay off seller's existing second mortgage or HELOC.",
  'Sales Commission Paid (%)': 'Commission Paid at Settlement by Seller as a percentage of the Purchase Price. Commission Contributed (below by Buyer) is subtracted from this amount.',
  "Buyer's Contribution": "Paid From Buyer's Funds at Settlement. Enter amount of commission contribution paid by the Buyer from Commission Paid.",
  "Seller's Contribution": "Portion of commission paid by seller.",
  'Origination Fee': "Lender's loan origination fee.",
  'Loan Discount (points)': 'Your credit or charge (points) for the specific interest rate chosen. Ex. Pay 2 Points for lower interest; Enter 2 for 2%.',
  'Appraisal fee': 'Fee for property appraisal required by lender.',
  'Credit report': 'Fee for buyer credit check.',
  'Tax service': 'Fee to verify tax status.',
  'Flood certification': 'As required by Lender to certify flood zone status.',
  'Underwriting fee': 'Lender fee for loan underwriting.',
  'Mortgage Insurance Application fee': 'As required by lender, typically private mortgage insurance is needed for loans of greater than 80% LTV.',
  'Assumption fee': "Fee to Seller's lender to transfer liability if Buyer is assuming Seller's loan.",
  'Daily interest charges': 'Total daily interest charges depends on your closing date. Maximum amount is 30 days of interest for monthly payments.',
  'Mortgage insurance premium': 'Prepaid mortgage insurance charges.',
  'Homeowner\'s insurance premium': 'Prepaid homeowner\'s insurance charges.',
  'Initial deposit for escrow': 'Deposit for your reserves/impound account ($).',
  'Months in reserve': 'Number of months in reserve as required for taxes and insurance.',
  'Settlement or closing fee': 'Fee paid to title/escrow company for conducting the closing.',
  'Lender\'s title insurance': 'Buyer must provide title insurance for and on behalf of the Lender (calculated on loan amount).',
  'Owner\'s title insurance': "It is convention that the Seller provides the Buyer an owner's title insurance policy (calculated on sales price).",
  'Lender\'s Recording Fee': "County Recorder's Office fee for new deed/mortgage.",
  'City/County tax/stamps': 'Title Transfer tax (City/County).',
  'State tax/stamps': 'Title Transfer tax (State).',
  'Seller Lender Recording': "Release of existing Liens from Title at County Recorder's Office.",
  'Other required services': 'Fed-ex fees, wire fees, notarization fees, courier fees, archival fees.',
};

export const LabelWithTooltip = ({ label, children, description }: { label: string, children?: React.ReactNode, description?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const descText = description || FIELD_DESCRIPTIONS[label];
  
    if (!descText) {
      return <span>{children || label}</span>;
    }
  
    return (
      <div className="flex items-center gap-1.5 relative group">
        <span className="cursor-pointer flex items-center gap-1 leading-tight break-words" onClick={() => setIsOpen(!isOpen)}>{children || label}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="text-slate-500 hover:text-blue-400 focus:outline-none flex-shrink-0"
          aria-label="Info"
        >
          <Info size={12} />
        </button>
        {/* Tooltip: Positioned above (bottom-full) with marginBottom to prevent clipping */}
        <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 w-64 z-50 bg-slate-800 text-slate-200 text-[10px] p-2.5 rounded border border-slate-600 shadow-xl whitespace-normal leading-relaxed pointer-events-none">
            {descText}
            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-slate-800 border-b border-r border-slate-600 transform rotate-45"></div>
        </div>
        {/* Mobile Click State */}
        {isOpen && (
          <div className="absolute left-0 bottom-full mb-2 w-64 z-50 bg-slate-800 text-slate-200 text-[10px] p-2.5 rounded border border-slate-600 shadow-xl whitespace-normal leading-relaxed block md:hidden">
            {descText}
            <div className="absolute -bottom-1 left-3 w-2 h-2 bg-slate-800 border-b border-r border-slate-600 transform rotate-45"></div>
          </div>
        )}
        {isOpen && (
          <div className="fixed inset-0 z-40 bg-transparent md:hidden" onClick={() => setIsOpen(false)}></div>
        )}
      </div>
    );
};

export const TableInput = ({ value, onChange, type = 'currency', isPercent = false, align = 'right', disabled = false, small = false, className = '', placeholder }: any) => {
    const [localVal, setLocalVal] = useState(value !== undefined && value !== null ? value.toString() : '');
    
    useEffect(() => { 
      if (value !== undefined && value !== null) {
        setLocalVal(value.toString()); 
      } else {
        setLocalVal('');
      }
    }, [value]);
    
    const normalizePercent = (val: string) => {
      const num = parseFloat(val);
      if (isNaN(num)) return '';
      const parts = num.toString().split('.');
      if (parts.length > 1) {
        let decimals = parts[1].slice(0, 4);
        if (decimals.length < 2) decimals = decimals.padEnd(2, '0');
        return `${parts[0]}.${decimals}`;
      }
      return `${parts[0]}.00`;
    };

    const getDisplayValue = () => {
      if (type === 'currency' && localVal) return formatPrice(localVal);
      if (isPercent && localVal) return formatPercent(localVal).replace('%',''); // percent sign rendered separately
      return formatNumber(localVal);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '');
      // allow empty or numeric with optional decimal
      if (/^-?\d*\.?\d*$/.test(raw)) {
        setLocalVal(raw);
      }
    };

    const handleBlur = () => {
        if (localVal === '') {
          if (value !== undefined && value !== null) setLocalVal(value.toString());
          return;
        }
        if (isPercent) {
          const normalized = normalizePercent(localVal);
          if (normalized) {
            setLocalVal(normalized);
            const num = parseFloat(normalized);
            if (!isNaN(num)) onChange(num);
          }
          return;
        }
        const num = parseFloat(localVal);
        if (!isNaN(num)) {
          if (type === 'currency') {
            onChange(num);
            setLocalVal(num.toFixed(2));
          } else {
            onChange(num);
          }
        } else if (value !== undefined && value !== null) {
          setLocalVal(value.toString());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
      <div className={`relative w-full ${small ? 'max-w-[80px]' : ''} ${align === 'right' ? 'ml-auto' : ''} ${className}`}>
          <input 
            type="text" 
            value={getDisplayValue()}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full bg-transparent border border-slate-600 rounded-[4px] px-1 py-1 text-xs font-mono text-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all ${align === 'right' ? 'text-right' : 'text-left'} ${disabled ? 'opacity-50 cursor-not-allowed border-transparent' : 'hover:border-slate-500'}`} 
          />
          {type === 'currency' && localVal && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[10px]">$</span>}
          {isPercent && localVal && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[10px]">%</span>}
      </div>
    );
};
