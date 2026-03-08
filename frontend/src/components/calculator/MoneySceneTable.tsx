
import React, { useRef, useState } from 'react';
import { Edit2, X } from 'lucide-react';
import { MoneySceneInputs, FieldDef } from '../../types';
import { calculateMoneyScene } from '../../utils/calculatorFormulas';
import { LabelWithTooltip, formatNumber, rowStyle, cellStyle, numCellStyle } from './Shared';
import { FormsWidget } from '../FormsWidget';

interface MoneySceneTableProps {
    inputs: MoneySceneInputs;
    onUpdate: (inputs: MoneySceneInputs) => void;
    onClose: () => void;
}

const MONEY_SCENE_SCHEMA: FieldDef[] = [
    // Step 1: Valuation (Title passed via prop to FormsWidget)
    { name: 'scenarioName', label: 'Scenario Name', type: 'Text', description: "Home Address Example: '123 Cherry Ln-ARM Financing'" },
    { name: 'assessorValue', label: "Assessor's Value", type: 'Price', description: "What is the home's assessed value?" },
    { name: 'arv', label: 'After Repair Value (ARV)', type: 'Price', description: "What is your estimate of the home's value after you've made improvements?" },
    { name: 'fastSellFactor', label: 'Fast Sell Factor', type: 'Percent', description: "Discounting your market ready home in most markets creates the best buyer opportunities." },
    { name: 'discountProfit', label: 'Discount / Profit', type: 'Percent', description: "What is your estimated % profit? The profit is calculated as a percentage of your Fast Sell Price." },

    { name: 'pb1', label: 'Financing', type: 'PageBreak' },

    // Step 2: Financing
    { name: 'amountFinanced', label: 'Amount Financed', type: 'Price', description: "How much will you finance for the home's purchase?" },
    { name: 'loanOriginationFee', label: 'Loan Origination Fee', type: 'Percent', description: "Percentage of your Amount Financed." },
    { name: 'loanRate', label: 'Loan Rate', type: 'Percent', description: "Rate for Amount Financed. Ask your Lender Ambassador." },
    { name: 'loanPeriod', label: 'Loan Period (months)', type: 'Number', description: "Term of loan to full amortization. Ex. 360 months for 30 years." },
    { name: 'finderFee', label: "Finder's Fee (Buy side)", type: 'Price', description: "Often the best deals are found because you have others looking out for you." },
    { name: 'agentCommissionSell', label: 'Agents Commission-Sell Side', type: 'Percent', description: "Sales commission for selling home." },

    { name: 'pb2', label: 'Improvements', type: 'PageBreak' },

    // Step 3: Improvements
    { name: 'houseSize', label: 'Home Size (sq ft.)', type: 'Number', description: "How large is the living space? Used to calculate improvement budget." },
    { name: 'repairCostSqFt', label: 'Repair Cost ($/sq ft)', type: 'Price', description: "What is your '$'s per square foot budget' for the home's interior repair/improvements?" },
    { name: 'structuralRepairs', label: 'Structural Repairs', type: 'Price', description: "What is your budget for the home's structural improvements? Ex. roof replacement" },
    { name: 'fixtures', label: 'Fixtures/Appliances', type: 'Price', description: "What is your budget for the home's Fixtures/Appliances Replacements?" },
    { name: 'landscaping', label: 'Landscaping', type: 'Price', description: "What is your budget for the home's landscaping improvements?" },

    { name: 'pb3', label: 'Costs', type: 'PageBreak' },

    // Step 4: Costs
    { name: 'contingency', label: 'Contingency Factor', type: 'Percent', description: "Your safety buffer for overages in improvements and time on market." },
    { name: 'daysToRehab', label: 'Days to Rehab', type: 'Number', description: "Estimate how many days you've scheduled to complete work." },
    { name: 'avgDaysOnMarket', label: 'Avg Days on Market', type: 'Number', description: "Ask your Agent Ambassador what the current 'average days on market' for this home?" },
    { name: 'utilitiesMonthly', label: 'Utilities ($/mo.)', type: 'Price', description: "What is your budget for the home's utilities costs per month?" },
    { name: 'propertyTaxRate', label: 'Property Tax (%)', type: 'Percent', description: "Annual percentage rate of Assessed Value." },

    { name: 'sh1', label: 'Detailed Fee Breakdown', type: 'SectionHeader' },
    { name: 'inspectionFee', label: 'Inspection Fee', type: 'Price' },
    { name: 'buyingClosingCosts', label: 'Buying Closing Costs', type: 'Price' },
    { name: 'homeWarranty', label: 'Home Warranty', type: 'Price' },
    { name: 'titleEscrowFees', label: 'Title/Escrow Fees', type: 'Price' },
    { name: 'buyerClosingCostAssistance', label: 'Buyer Closing Assist', type: 'Price' },
];

export const MoneySceneTable: React.FC<MoneySceneTableProps> = ({
    inputs, onUpdate, onClose
}) => {
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);
    const [showModal, setShowModal] = useState(false);

    // Calculation
    const msCalc = calculateMoneyScene(inputs);

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
        onUpdate(data as MoneySceneInputs);
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
                            schema={MONEY_SCENE_SCHEMA}
                            data={inputs}
                            onSave={handleFormSave}
                            onCancel={() => setShowModal(false)}
                            title="Investor Scenario Calculator"
                            onClose={() => setShowModal(false)}
                            firstStepTitle="Valuation"
                        />
                    </div>
                </div>
            )}

            <div className="sticky top-[56px] bg-slate-800 z-40 pb-3 px-4 pt-4 border-b border-slate-700 flex justify-between items-start shadow-sm min-h-[70px]">
                <div className="flex flex-col gap-1">
                    <div className="text-xl font-serif font-semibold text-white uppercase tracking-widest">MONEY SCENE</div>
                    <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">INVESTOR SCENARIOS: BUY A HOME, THEN SELL IT</div>
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
                    <thead className="bg-slate-800 text-xs text-slate-500 font-semibold uppercase border-b border-slate-700">
                        <tr>
                            <th className="py-3 px-2 md:px-4 w-[60%] bg-slate-800 border-b border-slate-700 truncate">Scenario Name: {inputs.scenarioName}</th>
                            <th className="py-3 px-2 md:px-4 w-[40%] text-right bg-slate-800 border-b border-slate-700">OUTPUT</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-sans divide-y divide-slate-700/50 text-slate-300">
                        {/* Table 1: Scenario Output */}
                        <tr className="bg-slate-800/50 font-bold text-slate-400 border-b border-slate-600"><td className="py-2 px-4" colSpan={2}>Scenario Output (Max Allowable Offer)</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="After Repair Value (ARV)" description="What is your estimate of the home's value after you've made improvements?" /></td><td className={numCellStyle}>${formatNumber(inputs.arv.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Fast Sell Factor" description="Discounting your market ready home in most markets creates the best buyer opportunities." /> ({inputs.fastSellFactor}%)</td><td className={numCellStyle}>(${formatNumber(msCalc.fastSellAmt.toFixed(0))})</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Fast After Repair Value (FARV)" description="ARV minus the Fast Sell reduction." /></td><td className={numCellStyle}>${formatNumber(msCalc.farv.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Discount / Profit" description="What is your estimated % profit? The profit is calculated as a percentage of your Fast Sell Price." /> ({inputs.discountProfit}%)</td><td className={numCellStyle}>${formatNumber(msCalc.profitAmt.toFixed(0))}</td></tr>

                        <tr><td colSpan={2} className="h-4 bg-slate-900 border-none"></td></tr>

                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Purchase (COP)" description="Total costs to acquire the property (fees, closing, etc)." /></td><td className={numCellStyle}>${formatNumber(msCalc.totalCop.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Repair (COR)" description="Total construction, renovation and contingency costs." /></td><td className={numCellStyle}>${formatNumber(msCalc.totalCor.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Carrying Costs (CC)" description="Holding costs (taxes, insurance, utilities, debt) during rehab and sale." /></td><td className={numCellStyle}>${formatNumber(msCalc.totalCc.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Sale (COS)" description="Commissions and closing costs when selling the property." /></td><td className={numCellStyle}>${formatNumber(msCalc.cos.toFixed(0))}</td></tr>

                        <tr className="bg-slate-700/30 font-bold text-emerald-400 border-t border-slate-600"><td className={cellStyle}>Calculated Purchase Price</td><td className={numCellStyle}>${formatNumber(msCalc.purchasePrice.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Amount Financed" description="How much will you finance for the home's purchase?" /></td><td className={numCellStyle}>(${formatNumber(inputs.amountFinanced.toFixed(0))})</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Total Investment/Cash In" description="Total cash required from you (Downpayment + COR + COP + CC)." /></td><td className={numCellStyle}>${formatNumber(msCalc.cashIn.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}>Time Invested (months)</td><td className={numCellStyle}>{msCalc.monthsHeld.toFixed(2)}</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-emerald-400 border-t border-slate-600"><td className={cellStyle}><LabelWithTooltip label="ROI" description="Return on Investment (Annualized)" /> (Annualized)</td><td className={numCellStyle}>{formatNumber(msCalc.annualizedRoi.toFixed(2))}%</td></tr>

                        {/* Table 2: Terms Sheet Breakdown */}
                        <tr><td colSpan={2} className="h-8 bg-slate-900 border-none flex items-center px-4 font-bold text-slate-500 uppercase tracking-widest pt-4">Terms Sheet: Buy & Sell</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Cost of Purchase Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Loan Origination Fee" description="Percentage of your Amount Financed." /></td><td className={numCellStyle}>${formatNumber(msCalc.loanOriginationAmt.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Finder's Fee" description="Often the best deals are found because you have others looking out for you." /></td><td className={numCellStyle}>${formatNumber(inputs.finderFee.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Inspection" description="Cost of property inspection." /></td><td className={numCellStyle}>${formatNumber(msCalc.breakdowns.inspection.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Closing Costs" description="Estimated title/escrow/recording fees for purchase." /></td><td className={numCellStyle}>${formatNumber(msCalc.breakdowns.closingCosts.toFixed(0))}</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-slate-300 border-t border-slate-600"><td className={cellStyle}>Total Cost of Purchase (COP)</td><td className={numCellStyle}>${formatNumber(msCalc.totalCop.toFixed(0))}</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Cost of Repair Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Whole House Cosmetic Major" description="Total of sqft based repair cost (Home Improvements * SqFt)" /></td><td className={numCellStyle}>${formatNumber((inputs.houseSize * inputs.repairCostSqFt).toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Structural" description="Budget for the home's structural improvements? Ex. roof replacement" /></td><td className={numCellStyle}>${formatNumber(inputs.structuralRepairs.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Fixtures/Appliances" description="Budget for the home's Fixtures/Appliances Replacements" /></td><td className={numCellStyle}>${formatNumber(inputs.fixtures.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Landscaping" description="Budget for the home's landscaping improvements" /></td><td className={numCellStyle}>${formatNumber(inputs.landscaping.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Contingency Factor" description="Your safety buffer for overages in improvements and time on market." /></td><td className={numCellStyle}>${formatNumber(msCalc.contingency.toFixed(0))}</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-slate-300 border-t border-slate-600"><td className={cellStyle}>Total Cost of Repairs (COR)</td><td className={numCellStyle}>${formatNumber(msCalc.totalCor.toFixed(0))}</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Carrying Costs Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}>Carry Period (months)</td><td className={numCellStyle}>{msCalc.monthsHeld.toFixed(2)}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Taxes" description="Pro-rated property taxes based on Assessed Value" /></td><td className={numCellStyle}>${formatNumber((msCalc.breakdowns.monthlyTaxes * msCalc.monthsHeld).toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Fees/Insurance" description="Monthly HOA + Insurance costs" /></td><td className={numCellStyle}>${formatNumber((msCalc.breakdowns.insuranceAndFees * msCalc.monthsHeld).toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Utilities/Services" description="Monthly utilities budget" /></td><td className={numCellStyle}>${formatNumber((inputs.utilitiesMonthly * msCalc.monthsHeld).toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Debt Service" description="Loan interest payments" /></td><td className={numCellStyle}>${formatNumber((msCalc.breakdowns.monthlyDebt * msCalc.monthsHeld).toFixed(0))}</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-slate-300 border-t border-slate-600"><td className={cellStyle}>Total Carrying Costs (CC)</td><td className={numCellStyle}>${formatNumber(msCalc.totalCc.toFixed(0))}</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Cost of Sales Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Agent Commissions" description="Sales commission for selling home." /></td><td className={numCellStyle}>${formatNumber(msCalc.breakdowns.commissions.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Home Warranty" description="Cost of home warranty for the buyer." /></td><td className={numCellStyle}>${formatNumber(msCalc.breakdowns.homeWarranty.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Title Insurance, Escrow & Fees" description="Closing fees for sale." /></td><td className={numCellStyle}>${formatNumber(msCalc.breakdowns.titleFees.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Buyer Closing Costs" description="Credit to buyer." /></td><td className={numCellStyle}>${formatNumber(msCalc.breakdowns.buyerAssist.toFixed(0))}</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-slate-300 border-t border-slate-600"><td className={cellStyle}>Total Cost of Sales (COS)</td><td className={numCellStyle}>${formatNumber(msCalc.cos.toFixed(0))}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
