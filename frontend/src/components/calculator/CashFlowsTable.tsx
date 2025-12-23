
import React, { useRef, useState } from 'react';
import { Edit2, X } from 'lucide-react';
import { CashFlowInputs, ClosingCostInputs, FieldDef } from '../../types';
import { calculateClosing, calculateCashFlows } from '../../utils/calculatorFormulas';
import { LabelWithTooltip, formatNumber, rowStyle } from './Shared';
import { FormsWidget } from '../FormsWidget';

interface CashFlowsTableProps {
    cfInputs: CashFlowInputs;
    closingInputs: ClosingCostInputs;
    onUpdate: (val: CashFlowInputs) => void;
    onClose: () => void;
}

const CASH_FLOW_SCHEMA: FieldDef[] = [
    // Step 1: Cash & Financing
    { name: 'scenarioName', label: 'Scenario Name', type: 'Text', description: "Name of Scenario" },
    { name: 'purchasePrice', label: 'Purchase Price ($)', type: 'Price', description: 'Purchase Price entered is used to determine your ROI / appreciation.' },
    { name: 'downPayment', label: 'Down Payment ($)', type: 'Price' },
    { name: 'capitalImprovements', label: 'Capital Improvements ($)', type: 'Price', description: 'Capital improvements are typically any improvements beyond maintenance. Consult the tax code.' },
    { name: 'loanAmount', label: 'Loan Amount ($)', type: 'Price', description: 'Enter 0 if no loan is used to finance purchase.' },
    { name: 'interestRate', label: 'Interest Rate (Annual %)', type: 'Percent', description: 'Provide APR (annual percentage rate) which includes discount points. Enter 0 if no loan is used.' },
    { name: 'loanTerm', label: 'Loan Term (months)', type: 'Number', description: 'Term of amortized Loan. Enter 360 for 30 years. Enter 180 for 15 years. Enter 0 if no loan is used.' },

    { name: 'pb1', label: 'Market Statistics', type: 'PageBreak' },

    // Step 2: Market Statistics
    { name: 'rentalRate', label: 'Current Rental Rate ($/month)', type: 'Price', description: "Even you're buying the home for yourself, learn how your home may be a future income source." },
    { name: 'appreciationRate', label: 'Market Appreciation Rate (%/year)', type: 'Percent', description: 'Typical long term appreciation rates are between 3-4%/year but these vary widely.' },
    { name: 'structurePercent', label: 'Structure % of Value', type: 'Percent', description: '60-80% is typical for a single family home.' },

    { name: 'pb2', label: 'Expenses & Taxes', type: 'PageBreak' },

    // Step 3: Expenses & Taxes
    { name: 'managementPercent', label: 'Property Management (%)', type: 'Percent', description: 'As a percentage of monthly rent (typically 6-10%). Enter 0 if you are managing the property or are not renting it.' },
    { name: 'insuranceYearly', label: 'Property Insurance ($ per year)', type: 'Price', description: "Homeowner' Insurance or Hazard Insurance" },
    { name: 'maintenancePercent', label: 'Maintenance (%)', type: 'Percent', description: 'Monthly maintenance as a percentage of monthly rent. Condos are very low.' },
    { name: 'hoaMonthly', label: 'HOA fees ($/month)', type: 'Price', description: "Homeowner's Associate Fees. All condos and some housing developments may have these." },
    { name: 'vacancyPercent', label: 'Vacancy Rate (%)', type: 'Percent', description: 'Typical vacancy rate is 5-10% per year. If 0, then home is fully rented.' },
    { name: 'propertyTaxYearly', label: 'Property Tax ($/year)', type: 'Price', description: 'Typically as a % of purchase price, include all local and state property taxes.', placeholder: '6000' },
    { name: 'incomeTaxRate', label: 'Ordinary Income Tax Rate (%)', type: 'Percent', description: 'Combine federal & state: Typically between 30% and 40% when combined.' },
    { name: 'otherDeductions', label: 'Other deductions ($/mo)', type: 'Price', description: 'Any other monthly tax-deductible expenses.' },
];

// Responsive Cell Styles - Uses Shared cell styles which have reduced padding for mobile
const cellStyle = "py-2 px-1 md:px-4 text-slate-300 text-[10px] md:text-xs align-middle break-words whitespace-normal";
const numCellStyle = "py-2 px-1 md:px-4 text-right font-mono text-slate-300 text-[10px] md:text-xs align-middle whitespace-normal break-all md:break-normal md:whitespace-nowrap";

export const CashFlowsTable: React.FC<CashFlowsTableProps> = ({
    cfInputs, closingInputs, onUpdate, onClose
}) => {
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);
    const [showModal, setShowModal] = useState(false);

    // Calculate Closing to get Cash Invested
    const closing = calculateClosing(cfInputs, closingInputs);

    // Calculate Flows - Ensure inputs are numbers to prevent errors
    const safeCfInputs = {
        ...cfInputs,
        purchasePrice: Number(cfInputs.purchasePrice) || 0,
    };
    const flows = calculateCashFlows(safeCfInputs, closing);

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!tableContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - tableContainerRef.current.offsetLeft);
        setScrollLeftState(tableContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !tableContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - tableContainerRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        tableContainerRef.current.scrollLeft = scrollLeftState - walk;
    };

    const handleFormSave = (data: any) => {
        if (onUpdate) {
            const numericData = Object.entries(data).reduce((acc, [key, val]) => {
                if (key === 'scenarioName') {
                    acc[key] = val;
                } else {
                    acc[key] = val === '' ? 0 : Number(val);
                }
                return acc;
            }, {} as any);
            onUpdate(numericData as CashFlowInputs);
        }
        setShowModal(false);
    };

    return (
        <div className="flex flex-col relative h-auto">
            {/* Modal Wrapper around FormsWidget */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 md:pt-20 p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="w-full max-w-3xl relative z-10 h-auto max-h-[85vh] flex flex-col shadow-2xl rounded-xl overflow-hidden">
                        <FormsWidget
                            schema={CASH_FLOW_SCHEMA}
                            data={cfInputs}
                            onSave={handleFormSave}
                            onCancel={() => setShowModal(false)}
                            title="Cash Flow Assumptions"
                            onClose={() => setShowModal(false)}
                            firstStepTitle="Cash & Financing"
                        />
                    </div>
                </div>
            )}

            <div className="sticky top-[56px] bg-slate-800 z-40 pb-3 px-4 pt-4 border-b border-slate-700 flex justify-between items-start shadow-sm min-h-[70px]">
                <div className="flex flex-col gap-1">
                    <div className="text-xl font-serif font-semibold text-white uppercase tracking-widest">CASH FLOWS</div>
                    <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">INVESTOR vs HOMEOWNER ANALYSIS</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141D84] hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm"><Edit2 size={12} /><span>Inputs</span></button>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                </div>
            </div>
            <div
                ref={tableContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`flex-1 overflow-x-auto overflow-y-visible relative pb-6 no-scrollbar cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            >
                <table className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-slate-800 text-[10px] md:text-xs text-slate-500 font-semibold uppercase border-b border-slate-700">
                        <tr>
                            <th className="py-3 px-1 md:px-4 w-[40%] bg-slate-800 border-b border-slate-700 truncate">Metric - {cfInputs.scenarioName}</th>
                            <th className="py-3 px-1 md:px-4 w-[30%] text-right bg-slate-800 border-b border-slate-700">Monthly</th>
                            <th className="py-3 px-1 md:px-4 w-[30%] text-right bg-slate-800 border-b border-slate-700">Annually</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-sans divide-y divide-slate-700/50 text-slate-300">
                        {/* Homeowner Section */}
                        <tr className="bg-slate-800/50 font-bold text-slate-400 border-b border-slate-600 text-[10px] uppercase tracking-wider"><td className="py-2 px-4" colSpan={3}>Homeowner CashFlows</td></tr>

                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Rent Avoided" description="Estimated market rent you save by owning instead of renting." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.homeowner.rentAvoided.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.homeowner.rentAvoided * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Expenses" description="Total monthly outflow: Mortgage, Property Tax, Insurance, HOA, and Maintenance." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.homeowner.expenses.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.homeowner.expenses * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Tax Benefit" description="Estimated income tax savings from deducting mortgage interest and property taxes." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.homeowner.taxBenefit.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.homeowner.taxBenefit * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Net Expenses" description="Effective cost of owning after accounting for tax savings." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.homeowner.netExpenses.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.homeowner.netExpenses * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Principal Paydown" description="Portion of mortgage payment that builds equity by reducing loan balance." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.homeowner.principalPaydown.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.homeowner.principalPaydown * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Appreciation" description="Estimated increase in property value based on market appreciation rate." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.homeowner.appreciation.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.homeowner.appreciation * 12).toFixed(0))}</td>
                        </tr>
                        <tr className="bg-slate-700/30 font-bold text-emerald-400 border-t border-slate-600">
                            <td className={cellStyle}><LabelWithTooltip label="Total Equity Growth" description="Combined wealth generation from Principal Paydown and Market Appreciation." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.homeowner.equityGrowth.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.homeowner.equityGrowth * 12).toFixed(0))}</td>
                        </tr>

                        {/* Investor Section */}
                        <tr className="bg-slate-800/50 font-bold text-slate-400 border-b border-slate-600 border-t border-slate-600 text-[10px] uppercase tracking-wider"><td className="py-2 px-4" colSpan={3}>Investor CashFlows</td></tr>

                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Gross Income" description="Total rental income minus estimated vacancy losses." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.grossIncome.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.grossIncome * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Operating Expenses" description="All costs to operate the property excluding debt service (Taxes, Ins, Maint, Mgmt, HOA)." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.operatingCosts.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.operatingCosts * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Net Operating Income (NOI)" description="Profitability of the property before deducting mortgage payments." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.incomeBeforeDebtService.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.incomeBeforeDebtService * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Debt Service" description="Monthly mortgage principal and interest payment." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.debtService.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.debtService * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Cash Flow (Pre-Tax)" description="Net income remaining in your pocket after paying all operating expenses and mortgage." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.cashFlowAfterDebtService.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.cashFlowAfterDebtService * 12).toFixed(0))}</td>
                        </tr>

                        {/* Detailed Tax & Depreciation Analysis */}
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Mortgage Principal Add-Back" description="Principal payments are not tax deductible, so they are added back to income for tax purposes." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.mortgagePrincipleAddBack.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.mortgagePrincipleAddBack * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Net Income Before Depreciation" description="Cash flow adjusted for principal payments." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.netIncomeBeforeDepreciation.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.netIncomeBeforeDepreciation * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Depreciation Allowance" description="Non-cash deduction for wear and tear on the property structure (27.5 years)." /></td>
                            <td className={numCellStyle}>(${formatNumber(flows.investor.depreciationAllowance.toFixed(0))})</td>
                            <td className={numCellStyle}>(${formatNumber((flows.investor.depreciationAllowance * 12).toFixed(0))})</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Taxable Income" description="The amount of income you actually pay taxes on." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.taxableIncome.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.taxableIncome * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Estimated Taxes" description="Tax liability based on your income tax rate." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.estimatedTaxes.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.estimatedTaxes * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Net Income After Taxes" description="Income remaining after estimated taxes are paid." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.netIncomeReturnAfterTaxes.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.netIncomeReturnAfterTaxes * 12).toFixed(0))}</td>
                        </tr>

                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="After Tax Cash Flow" description="Actual cash in pocket after operations, mortgage, and taxes." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.afterTaxCashFlow.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.afterTaxCashFlow * 12).toFixed(0))}</td>
                        </tr>

                        {/* Investment Returns */}
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Market Appreciation" description="Estimated increase in property value." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.marketAppreciation.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.marketAppreciation * 12).toFixed(0))}</td>
                        </tr>
                        <tr className={rowStyle}>
                            <td className={cellStyle}><LabelWithTooltip label="Equity + Market Growth" description="Total wealth accumulation from principal paydown and appreciation." /></td>
                            <td className={numCellStyle}>${formatNumber(flows.investor.equityGrowth.toFixed(0))}</td>
                            <td className={numCellStyle}>${formatNumber((flows.investor.equityGrowth * 12).toFixed(0))}</td>
                        </tr>

                        <tr className="bg-slate-700/30 font-bold text-emerald-400 border-t border-slate-600">
                            <td className={cellStyle}><LabelWithTooltip label="ROI (Pre-Tax)" description="Cash on Cash Return before taxes." /></td>
                            <td className={numCellStyle}>-</td>
                            <td className={numCellStyle}>{formatNumber(flows.investor.roiPreTax.toFixed(2))}%</td>
                        </tr>
                        <tr className="bg-slate-700/30 font-bold text-emerald-400">
                            <td className={cellStyle}><LabelWithTooltip label="ROI (After-Tax)" description="Cash on Cash Return after estimated taxes." /></td>
                            <td className={numCellStyle}>-</td>
                            <td className={numCellStyle}>{formatNumber(flows.investor.roiAfterTax.toFixed(2))}%</td>
                        </tr>
                        <tr className="bg-slate-700/30 font-bold text-emerald-400">
                            <td className={cellStyle}><LabelWithTooltip label="Capitalization Rate" description="Rate of return on a real estate investment property based on the income that the property is expected to generate." /></td>
                            <td className={numCellStyle}>-</td>
                            <td className={numCellStyle}>{formatNumber(flows.investor.capRate.toFixed(2))}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
