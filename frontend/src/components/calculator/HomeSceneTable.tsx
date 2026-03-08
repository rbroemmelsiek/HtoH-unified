
import React, { useRef, useState, useEffect } from 'react';
import { Edit2, X } from 'lucide-react';
import { HomeSceneInputs, FieldDef } from '../../types';
import { calculateHomeScene } from '../../utils/calculatorFormulas';
import { LabelWithTooltip, formatNumber, rowStyle, cellStyle, numCellStyle } from './Shared';
import { FormsWidget } from '../FormsWidget';

interface HomeSceneTableProps {
    inputs: HomeSceneInputs;
    onOpenInputs?: () => void; // Deprecated, kept for interface compatibility if needed
    onUpdate: (inputs: HomeSceneInputs) => void;
    onClose: () => void;
}

const HOME_SCENE_SCHEMA: FieldDef[] = [
    // Section 1: Home Scene
    { name: 'scenarioName', label: 'Scenario Name', type: 'Text', description: 'Home Address Example: "123 Cherry Ln-Remodel Only"' },
    { name: 'salesPrice', label: 'Sales Price', type: 'Price', description: 'Enter the anticipated sales price of your current home. Speak with your Agent Ambassador and consult the MarketPrice tool.' },
    { name: 'avgDaysOnMarket', label: 'Avg. Days on Market', type: 'Number', description: 'If you are NOT vacating your current home before the sale closes, enter 0. If you are, enter the average time on market for a home in your neighborhood.' },
    { name: 'fastSellFactor', label: 'Fast Sell Factor', type: 'Percent', description: 'In nearly all markets, a slightly discounted price (2-4%) will generate a faster sale and often a higher sales price.' },

    { name: 'pb1', label: 'Debits & Expenses', type: 'PageBreak' },

    // Section 2: Debits & Expenses
    { name: 'mortgage1Balance', label: '1st Trust Deed', type: 'Price', description: 'Enter the remaining balance due if you have a mortgage on your current home. Enter 0 otherwise.' },
    { name: 'mortgage2Balance', label: '2nd Trust Deed', type: 'Price', description: 'Enter the remaining balance due if you have a 2nd mortgage on your current home. Enter 0 otherwise.' },
    { name: 'liens', label: 'Taxes & Other Liens', type: 'Price', description: 'Enter the balance due if you have any existing liens, judgments, or back taxes on your current home.' },
    { name: 'agentCommission', label: "Agents' Commission (Current Home)", type: 'Percent', description: 'Sales commission for selling home. 5-6% is customary.' },

    { name: 'pb2', label: 'Improvements/Repairs', type: 'PageBreak' },

    // Section 3: Improvements/Repairs
    { name: 'houseSize', label: 'House Size (Sq. ft.)', type: 'Number', description: "Enter the home's square footage if you are improving." },
    { name: 'repairCostPerSqFt', label: 'House Repair (Cost/sq. ft.)', type: 'Price', description: 'Enter the remodelling estimated cost per square foot.' },
    { name: 'structuralRepairs', label: 'Structural Repairs ($)', type: 'Price', description: 'If the home remodelling/repair includes structural improvements, enter the cost here. Ex. New roof.' },
    { name: 'fixturesReplacement', label: 'Fixtures/Appliances Replacement ($)', type: 'Price', description: 'Enter the cost of new fixtures and appliances. Ex. Fixture: bathtub, Appliance: refrigerator' },
    { name: 'landscaping', label: 'Landscaping ($)', type: 'Price', description: 'Enter the cost of landscaping improvements.' },

    { name: 'pb3', label: 'Additional Repair Related Numbers', type: 'PageBreak' },

    // Section 4: Additional Repair Related Numbers
    { name: 'daysToRemodel', label: 'Days to Remodel', type: 'Number', description: 'If you are purchasing the home but not occupying it, enter the number of days to complete it. HomeScene calculates the carrying costs.' },
    { name: 'contingencyFactor', label: 'Contingency Factor (%)', type: 'Percent', description: 'Contingency factor covers unexpected expenses or delays. Ex. 10 (for 10%).' },
    { name: 'monthlyUtilities', label: 'Utilities/Ins./Services ($/mo.)', type: 'Price', description: 'If you are not living in the home during remodel, enter the monthly utility, insurance and other services costs here.' },
    { name: 'propertyTaxRate', label: 'Property Tax (%)', type: 'Percent', description: 'Property tax is also a carrying costs for a home that you are paying for but not occupying. Enter its percentage here. Ex. 1.2 (for 1.2%).' },

    { name: 'pb4', label: 'Your Next Dream Home', type: 'PageBreak' },

    // Section 5: Your Next Dream Home
    { name: 'nextHomePrice', label: 'Purchase Price ($)', type: 'Price', description: 'Enter the purchase price of your Next Dream Home.' },
    { name: 'percentFinanced', label: '% Financed', type: 'Percent', description: 'Enter the % of the purchase price that you are financing. Ex. Finance 80 or 90 (for 80%, 90%).' },
    { name: 'loanOriginationFee', label: 'Loan Origination Fee (%)', type: 'Percent', description: 'Percentage of your new loan. Ask your Lender Ambassador.' },
    { name: 'loanRate', label: 'Loan Rate', type: 'Percent', description: 'Annual percentage rate of your loan financing the purchase of your Next Dream Home.' },
    { name: 'loanPeriod', label: 'Loan Period (months)', type: 'Number', description: 'For a 30 year loan, enter 360. For a 15 year loan, enter 180. If you have a 5 year loan amortized over 30 years, enter 360.' },
];

export const HomeSceneTable: React.FC<HomeSceneTableProps> = ({
    inputs, onUpdate, onClose
}) => {
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);
    const [showModal, setShowModal] = useState(false);

    // Column Resizing State
    const [splitRatio, setSplitRatio] = useState(60); // Default 60%
    const [isResizing, setIsResizing] = useState(false);

    // Calculation
    const hsCalc = calculateHomeScene(inputs);

    // Drag Logic (Scroll)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!tableContainerRef.current) return;
        // Don't init scroll drag if we are resizing
        if (isResizing) return;

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
            onUpdate(data as HomeSceneInputs);
        }
        setShowModal(false);
    };

    // Resizer Logic
    const startResizing = (e: React.MouseEvent) => {
        // Only allow resizing on desktop/tablet (approx > 768px)
        if (window.innerWidth < 768) return;

        e.stopPropagation(); // Prevent scroll drag
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isResizing || !tableRef.current) return;

            const tableRect = tableRef.current.getBoundingClientRect();
            const relativeX = e.clientX - tableRect.left;
            const newRatio = (relativeX / tableRect.width) * 100;

            // Constrain between 40% and 60%
            const clampedRatio = Math.max(40, Math.min(60, newRatio));
            setSplitRatio(clampedRatio);
        };

        const handleGlobalMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isResizing]);

    return (
        <div className="flex flex-col relative h-auto">
            {/* Modal Wrapper around FormsWidget */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 md:pt-20 p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="w-full max-w-3xl relative z-10 h-auto max-h-[85vh] flex flex-col shadow-2xl rounded-xl overflow-hidden">
                        <FormsWidget
                            schema={HOME_SCENE_SCHEMA}
                            data={inputs}
                            onSave={handleFormSave}
                            onCancel={() => setShowModal(false)}
                            title="Home Scene Calculator"
                            onClose={() => setShowModal(false)}
                            firstStepTitle="Home Scene"
                        />
                    </div>
                </div>
            )}

            <div className="sticky top-[56px] bg-slate-800 z-40 pb-3 px-4 pt-4 border-b border-slate-700 flex justify-between items-start shadow-sm min-h-[70px]">
                <div className="flex flex-col gap-1">
                    <div className="text-xl font-serif font-semibold text-white uppercase tracking-widest">HOME SCENE</div>
                    <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">HOME OWNER SCENARIOS: SELL YOUR HOME, BUY NEXT</div>
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
                <table ref={tableRef} className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-slate-800 text-xs text-slate-500 font-semibold uppercase border-b border-slate-700">
                        <tr>
                            <th
                                style={{ width: `${splitRatio}%` }}
                                className="py-3 px-2 md:px-4 bg-slate-800 border-b border-slate-700 relative group transition-[width] duration-75 ease-out"
                            >
                                <div className="truncate">Scenario Name: {inputs.scenarioName}</div>
                                {/* Draggable Divider */}
                                <div
                                    onMouseDown={startResizing}
                                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 z-20 hidden md:flex items-center justify-center group-hover:bg-blue-400/20 active:bg-blue-600 transition-colors"
                                >
                                    <div className="w-[1px] h-full bg-slate-700 group-hover:bg-blue-400 active:bg-blue-500"></div>
                                </div>
                            </th>
                            <th
                                style={{ width: `${100 - splitRatio}%` }}
                                className="py-3 px-2 md:px-4 text-right bg-slate-800 border-b border-slate-700 transition-[width] duration-75 ease-out"
                            >
                                OUTPUT
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-sans divide-y divide-slate-700/50 text-slate-300">
                        {/* Table 1: Output Snapshot */}
                        <tr className="bg-slate-800/50 font-bold text-slate-400 border-b border-slate-600"><td className="py-2 px-4" colSpan={2}>Scenario Output</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Current Home Sales Price" description="Enter the anticipated sales price of your current home. Speak with your Agent Ambassador and consult the MarketPrice tool." /></td><td className={numCellStyle}>${formatNumber(inputs.salesPrice.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Fast Sell Factor" description="In nearly all markets, a slightly discounted price (2-4%) will generate a faster sale and often a higher sales price. Consider this vs your Carrying Costs if you are leaving your home vacant." /> ({inputs.fastSellFactor}%)</td><td className={numCellStyle}>${formatNumber((inputs.salesPrice - hsCalc.effectiveSalesPrice).toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Taxes & Other Liens" description="Enter the balance due if you have any existing liens, judgments, or back taxes on your current home. Enter 0 otherwise." /></td><td className={numCellStyle}>${formatNumber(hsCalc.totalLiens.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Sale (COS)" description="Sum of Agents' Commissions (customarily 5-6%) and estimated Title/Escrow fees (approx 0.75%)." /></td><td className={numCellStyle}>${formatNumber(hsCalc.totalCostOfSale.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Repair/Remodel (COR)" description="Total estimated cost for repairs, remodeling, structural work, landscaping, and contingency." /></td><td className={numCellStyle}>${formatNumber(hsCalc.totalRemodel.toFixed(0))}</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-emerald-400 border-t border-slate-600"><td className={cellStyle}><LabelWithTooltip label="Sales Cash Out" description="Net proceeds from the sale after paying off liens, costs of sale, repairs, and carrying costs." /></td><td className={numCellStyle}>${formatNumber(hsCalc.salesCashOut.toFixed(0))}</td></tr>

                        <tr><td colSpan={2} className="h-4 bg-slate-900 border-none"></td></tr>

                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Purchase Price - Next Home" description="Enter the purchase price of your Next Dream Home." /></td><td className={numCellStyle}>${formatNumber(inputs.nextHomePrice.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Amount Financed" description="Calculated loan amount based on the Financing % entered." /></td><td className={numCellStyle}>${formatNumber(hsCalc.nextAmountFinanced.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Purchase (COP)" description="Total costs to acquire the new home, including Loan Origination Fees and estimated Closing Costs." /></td><td className={numCellStyle}>${formatNumber(hsCalc.costOfPurchase.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Carrying Costs (CC)" description="Estimated holding costs (Utilities, Insurance, Taxes, Debt Service) during the remodel period." /></td><td className={numCellStyle}>${formatNumber(hsCalc.carryingCosts.toFixed(0))}</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-emerald-400 border-t border-slate-600"><td className={cellStyle}><LabelWithTooltip label="Net Cash to Close" description="Total cash required to close on the new home, accounting for the down payment, purchase costs, and proceeds from the previous sale." /> / (Surplus)</td><td className={numCellStyle}>${formatNumber(hsCalc.netCashToClose.toFixed(0))}</td></tr>

                        {/* Table 2: Terms Sheet Breakdown */}
                        <tr><td colSpan={2} className="h-8 bg-slate-900 border-none flex items-center px-4 font-bold text-slate-500 uppercase tracking-widest pt-4">Terms Sheet: Sell & Buy</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-400 border-b border-slate-600"><td className="py-2 px-4" colSpan={2}>SALE OF CURRENT HOME</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Sales Price" description="Enter the anticipated sales price of your current home. Speak with your Agent Ambassador and consult the MarketPrice tool." /></td><td className={numCellStyle}>${formatNumber(inputs.salesPrice.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Fast Sell Factor" description="In nearly all markets, a slightly discounted price (2-4%) will generate a faster sale and often a higher sales price. Consider this vs your Carrying Costs if you are leaving your home vacant." /> ({inputs.fastSellFactor}%)</td><td className={numCellStyle}>(${formatNumber((inputs.salesPrice - hsCalc.effectiveSalesPrice).toFixed(0))})</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Outstanding Liens (OS)" description="Enter the balance due if you have any existing liens, judgments, or back taxes on your current home." /></td><td className={numCellStyle}>(${formatNumber(hsCalc.totalLiens.toFixed(0))})</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Sale (COS)" description="Sum of Agents' Commissions (customarily 5-6%) and estimated Title/Escrow fees (approx 0.75%)." /></td><td className={numCellStyle}>(${formatNumber(hsCalc.totalCostOfSale.toFixed(0))})</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Repair/Remodel (COR)" description="Total estimated cost for repairs, remodeling, structural work, landscaping, and contingency." /></td><td className={numCellStyle}>(${formatNumber(hsCalc.totalRemodel.toFixed(0))})</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Carrying Costs (CC)" description="Estimated holding costs (Utilities, Insurance, Taxes, Debt Service) during the remodel period." /></td><td className={numCellStyle}>(${formatNumber(hsCalc.carryingCosts.toFixed(0))})</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-emerald-400 border-t border-slate-600"><td className={cellStyle}>Cash at Close (Net Proceeds)</td><td className={numCellStyle}>${formatNumber(hsCalc.salesCashOut.toFixed(0))}</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-400 border-b border-slate-600"><td className="py-2 px-4" colSpan={2}>PURCHASE OF NEXT HOME</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Purchase Price - Next Home" description="Enter the purchase price of your Next Dream Home." /></td><td className={numCellStyle}>${formatNumber(inputs.nextHomePrice.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Amount Financed" description="Calculated loan amount based on the Financing % entered." /></td><td className={numCellStyle}>(${formatNumber(hsCalc.nextAmountFinanced.toFixed(0))})</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Cost of Purchase (COP)" description="Total costs to acquire the new home, including Loan Origination Fees and estimated Closing Costs." /></td><td className={numCellStyle}>${formatNumber(hsCalc.costOfPurchase.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Sales Cash Out" description="Net proceeds from the sale after paying off liens, costs of sale, repairs, and carrying costs." /> (Applied)</td><td className={numCellStyle}>(${formatNumber(hsCalc.salesCashOut.toFixed(0))})</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-emerald-400 border-t border-slate-600"><td className={cellStyle}><LabelWithTooltip label="Net Cash to Close" description="Total cash required to close on the new home, accounting for the down payment, purchase costs, and proceeds from the previous sale." /> / (Surplus Cash)</td><td className={numCellStyle}>${formatNumber(hsCalc.netCashToClose.toFixed(0))}</td></tr>

                        {/* Sub-Worksheets */}
                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Cost of Purchase Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Loan Origination Fee (%)" description="Percentage of your new loan. Ask your Lender Ambassador." /></td><td className={numCellStyle}>${formatNumber(hsCalc.nextLoanOrigination.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}>Closing Costs/Inspections (Est.)</td><td className={numCellStyle}>${formatNumber((hsCalc.costOfPurchase - hsCalc.nextLoanOrigination).toFixed(0))}</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Cost of Repair/Remodel Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Repair Cost (per sq. ft.)" description="Enter the remodelling estimated cost per square foot." /> (SqFt x Cost)</td><td className={numCellStyle}>${formatNumber((inputs.houseSize * inputs.repairCostPerSqFt).toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Structural Repairs" description="If the home remodelling/repair includes structural improvements, enter the cost here. Ex. New roof." /></td><td className={numCellStyle}>${formatNumber(inputs.structuralRepairs.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Fixtures/Appliances" description="Enter the cost of new fixtures and appliances. Ex. Fixture: bathtub, Appliance: refrigerator" /></td><td className={numCellStyle}>${formatNumber(inputs.fixturesReplacement.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Landscaping" description="Enter the cost of landscaping improvements." /></td><td className={numCellStyle}>${formatNumber(inputs.landscaping.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Contingency Factor" description="Contingency factor covers unexpected expenses or delays. Ex. 10 (for 10%)." /> ({inputs.contingencyFactor}%)</td><td className={numCellStyle}>${formatNumber(hsCalc.contingency.toFixed(0))}</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Carrying Costs Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Days to Remodel" description="If you are purchasing the home but not occupying it, enter the number of days to complete it. HomeScene calculates the carrying costs." /></td><td className={numCellStyle}>{inputs.daysToRemodel}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}>Monthly Carrying (Utils + Tax + Debt)</td><td className={numCellStyle}>${formatNumber(hsCalc.monthlyCarrying.toFixed(0))}</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Cost of Sales Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Agents' Commission" description="Sales commission for selling home. 5-6% is customary." /></td><td className={numCellStyle}>${formatNumber(hsCalc.commissions.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}>Title/Escrow/Fees (Est)</td><td className={numCellStyle}>${formatNumber(hsCalc.closingCostsEstimate.toFixed(0))}</td></tr>

                        <tr className="bg-slate-800/50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-600"><td className="py-2 px-4 pt-4" colSpan={2}>Outstanding Liens Sub-Worksheet</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="1st Trust Deed" description="Enter the remaining balance due if you have a mortgage on your current home. Enter 0 otherwise." /></td><td className={numCellStyle}>${formatNumber(inputs.mortgage1Balance.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="2nd Trust Deed" description="Enter the remaining balance due if you have a 2nd mortgage on your current home. Enter 0 otherwise." /></td><td className={numCellStyle}>${formatNumber(inputs.mortgage2Balance.toFixed(0))}</td></tr>
                        <tr className={rowStyle}><td className={cellStyle}><LabelWithTooltip label="Taxes & Other Liens" description="Enter the balance due if you have any existing liens, judgments, or back taxes on your current home. Enter 0 otherwise." /></td><td className={numCellStyle}>${formatNumber(inputs.liens.toFixed(0))}</td></tr>
                        <tr className="bg-slate-700/30 font-bold text-slate-300 border-t border-slate-600"><td className={cellStyle}>Total Liens</td><td className={numCellStyle}>${formatNumber(hsCalc.totalLiens.toFixed(0))}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
