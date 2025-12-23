
import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CashFlowInputs, ClosingCostInputs } from '../../types';
import { calculateClosing } from '../../utils/calculatorFormulas';
import { TableInput, formatNumber, LabelWithTooltip } from './Shared';

interface CashToCloseTableProps {
    cfInputs: CashFlowInputs;
    closingInputs: ClosingCostInputs;
    onUpdateCf: (val: CashFlowInputs) => void;
    onUpdateClosing: (val: ClosingCostInputs) => void;
    onClose: () => void;
}

// Section Header Component
const SectionHeader = ({ title }: { title: string }) => (
    <tr className="bg-slate-800 border-y border-slate-600">
        <td colSpan={2} className="py-2 px-3 font-bold text-[10px] md:text-xs text-slate-400 uppercase tracking-wider border-r border-slate-600">
            {title}
        </td>
        <td colSpan={2} className="py-2 px-3 font-bold text-[10px] md:text-xs text-slate-400 uppercase tracking-wider">
            {title}
        </td>
    </tr>
);

export const CashToCloseTable: React.FC<CashToCloseTableProps> = ({
    cfInputs, closingInputs, onUpdateCf, onUpdateClosing, onClose
}) => {
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    // Calculation
    const closing = calculateClosing(cfInputs, closingInputs);

    // State Updates
    const setClosing = (updater: (prev: ClosingCostInputs) => ClosingCostInputs) => {
        onUpdateClosing(updater(closingInputs));
    };

    const handlePurchasePriceChange = (val: number) => {
        onUpdateCf({ ...cfInputs, purchasePrice: val });
    };

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

    // Styles
    const inputClass = "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40";
    const redInputClass = "bg-red-500/10 border-red-500/20 hover:border-red-500/40";
    const neutralInputClass = "bg-slate-700/50 border-slate-600 hover:border-slate-500";

    // Column Widths: 
    // On Desktop (md), Width is 100%. Columns: 35/15/35/15.
    // On Mobile, Table Width is 200%. Columns: 35/15/35/15 relative to that 200%.
    // Effectively, Buyer side takes 50% of 200% = 100% of container.
    // 35% of 200% = 70% of container for label.
    // 15% of 200% = 30% of container for value.
    const labelColWidth = "w-[35%]";
    const valueColWidth = "w-[15%]";

    // Increased padding (py-3) and added align-middle to prevent overlap bugs
    const labelCell = `py-3 px-3 text-slate-300 border-r border-slate-700/50 text-xs ${labelColWidth} align-middle`;
    const inputCell = `py-3 px-2 border-r border-slate-600 ${valueColWidth} align-middle`;
    const redCellWrapper = `py-3 px-2 border-l border-slate-600 ${valueColWidth} align-middle`;
    const valueCell = `py-3 px-3 text-right font-mono text-slate-300 border-r border-slate-600 text-xs ${valueColWidth} align-middle`;

    return (
        <div className="flex flex-col relative h-auto bg-slate-800 text-slate-300">
            {/* Header - Sticky under CalculatorBar */}
            <div className="sticky top-[56px] bg-slate-800 z-40 px-4 py-2 border-b border-slate-700 flex justify-between items-center shadow-sm min-h-[56px]">
                <div className="flex flex-col">
                    <div className="text-lg font-serif font-semibold text-white uppercase tracking-widest leading-none">CASH TO CLOSE</div>
                    <div className="text-[9px] text-slate-400 font-medium tracking-wide uppercase leading-none mt-1">ESTIMATE YOUR CLOSING COSTS</div>
                </div>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors flex-shrink-0"><X size={18} /></button>
            </div>

            <div
                ref={tableContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`flex-1 overflow-x-auto overflow-y-visible relative pb-10 no-scrollbar cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            >
                {/* Table width is 200% on mobile (so Buyer Side fills screen), 100% on desktop */}
                <table className="w-[200%] md:w-full text-left border-collapse text-xs font-sans table-fixed">
                    <thead className="bg-slate-800 text-[10px] md:text-xs text-slate-500 font-semibold uppercase border-b border-slate-700">
                        <tr>
                            {/* Buyer Header - 50% of table width (fills container on mobile) */}
                            <th colSpan={2} className="py-2 px-4 border-b border-slate-700 border-r border-slate-600 text-left bg-slate-800 w-[50%]">
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-400 font-bold text-sm">BUYER</span>
                                    <span className="text-slate-500 opacity-70">123 Cherry Ln</span>
                                </div>
                            </th>
                            {/* Seller Header - 50% of table width */}
                            <th colSpan={2} className="py-2 px-4 border-b border-slate-700 bg-slate-800 w-[50%]">
                                <div className="flex justify-between items-center">
                                    <span className="text-emerald-400 font-bold text-sm">SELLER</span>
                                    <span className="text-slate-500 opacity-70">123 Cherry Ln</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">

                        {/* --- TOP SECTION: Gross Amounts --- */}
                        <tr className="bg-slate-800 font-bold text-slate-400 text-[10px] uppercase tracking-wide border-b border-slate-600">
                            <td colSpan={2} className="py-2 px-3 border-r border-slate-600">Gross Amount Due from Buyer</td>
                            <td colSpan={2} className="py-2 px-3">Gross Amount Due to Seller</td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Contract sales price" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={cfInputs.purchasePrice} onChange={handlePurchasePriceChange} /></td>
                            <td className={labelCell}><LabelWithTooltip label="Contract sales price" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={cfInputs.purchasePrice} onChange={handlePurchasePriceChange} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Personal property" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.personalProperty} onChange={(v: any) => setClosing(p => ({ ...p, personalProperty: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="Personal property" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.personalProperty} onChange={(v: any) => setClosing(p => ({ ...p, personalProperty: v }))} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Settlement charges to borrower" /></td>
                            <td className={valueCell}>{formatNumber(closing.settlementChargesBorrower.toFixed(2))}</td>
                            <td className={labelCell}></td>
                            <td className="py-3 px-3 align-middle"></td>
                        </tr>

                        {/* Adjustments */}
                        <SectionHeader title="Adjustments for items prepaid / unpaid" />
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="City/town taxes" /></td>
                            <td className={inputCell}><TableInput className={neutralInputClass} value={closingInputs.cityTax} onChange={(v: any) => setClosing(p => ({ ...p, cityTax: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="City/town taxes" /></td>
                            <td className={inputCell}><TableInput className={neutralInputClass} value={closingInputs.cityTax} onChange={(v: any) => setClosing(p => ({ ...p, cityTax: v }))} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="County taxes" /></td>
                            <td className={inputCell}><TableInput className={neutralInputClass} value={closingInputs.countyTax} onChange={(v: any) => setClosing(p => ({ ...p, countyTax: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="County taxes" /></td>
                            <td className={inputCell}><TableInput className={neutralInputClass} value={closingInputs.countyTax} onChange={(v: any) => setClosing(p => ({ ...p, countyTax: v }))} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Assessments" /></td>
                            <td className={inputCell}><TableInput className={neutralInputClass} value={closingInputs.assessments} onChange={(v: any) => setClosing(p => ({ ...p, assessments: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="Assessments" /></td>
                            <td className={inputCell}><TableInput className={neutralInputClass} value={closingInputs.assessments} onChange={(v: any) => setClosing(p => ({ ...p, assessments: v }))} /></td>
                        </tr>

                        {/* Gross Totals */}
                        <tr className="bg-slate-700/30 font-bold border-y border-slate-600">
                            <td className={`py-3 px-3 text-emerald-400 border-r border-slate-600 align-middle ${labelColWidth}`}>Gross Amount Due from Buyer</td>
                            <td className={`py-3 px-3 text-right font-mono text-emerald-400 border-r border-slate-600 align-middle ${valueColWidth}`}>${formatNumber(closing.grossDueBuyer.toFixed(0))}</td>
                            <td className={`py-3 px-3 text-emerald-400 border-r border-slate-600 align-middle ${labelColWidth}`}>Gross Amount Due to Seller</td>
                            <td className={`py-3 px-3 text-right font-mono text-emerald-400 align-middle ${valueColWidth}`}>${formatNumber(closing.grossDueSeller.toFixed(0))}</td>
                        </tr>

                        {/* Credits / Reductions */}
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Deposit or earnest money" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.deposit} onChange={(v: any) => setClosing(p => ({ ...p, deposit: v }))} /></td>
                            <td className={labelCell}>Excess deposit</td>
                            <td className={valueCell}>-</td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Principal amount of new loan(s)" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.buyerLoanAmount} onChange={(v: any) => setClosing(p => ({ ...p, buyerLoanAmount: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="Settlement charges to seller" /></td>
                            <td className={valueCell}>{formatNumber(closing.settlementChargesSeller.toFixed(0))}</td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Existing loan(s) taken subject to" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.existingLoan} onChange={(v: any) => setClosing(p => ({ ...p, existingLoan: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="Existing loan(s) taken subject to" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.existingLoan} onChange={(v: any) => setClosing(p => ({ ...p, existingLoan: v }))} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}></td>
                            <td className={`py-3 px-3 border-r border-slate-600 ${valueColWidth}`}></td>
                            <td className={labelCell}><LabelWithTooltip label="Payoff of first mortgage loan" /></td>
                            <td className={redCellWrapper}><TableInput className={redInputClass} value={closingInputs.payoffFirst} onChange={(v: any) => setClosing(p => ({ ...p, payoffFirst: v }))} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}></td>
                            <td className={`py-3 px-3 border-r border-slate-600 ${valueColWidth}`}></td>
                            <td className={labelCell}><LabelWithTooltip label="Payoff of second mortgage loan" /></td>
                            <td className={redCellWrapper}><TableInput className={redInputClass} value={closingInputs.payoffSecond} onChange={(v: any) => setClosing(p => ({ ...p, payoffSecond: v }))} /></td>
                        </tr>

                        {/* Total Paid/Reduction */}
                        <tr className="bg-slate-700/30 font-bold border-y border-slate-600">
                            <td className={`py-3 px-3 text-emerald-400 border-r border-slate-600 align-middle ${labelColWidth}`}>Total Paid by/for Buyer</td>
                            <td className={`py-3 px-3 text-right font-mono text-emerald-400 border-r border-slate-600 align-middle ${valueColWidth}`}>${formatNumber(closing.totalPaidBuyer.toFixed(0))}</td>
                            <td className={`py-3 px-3 text-emerald-400 border-r border-slate-600 align-middle ${labelColWidth}`}>Total Reduction Amount Due Seller</td>
                            <td className={`py-3 px-3 text-right font-mono text-emerald-400 align-middle ${valueColWidth}`}>${formatNumber(closing.totalReductionsSeller.toFixed(0))}</td>
                        </tr>

                        {/* Cash Summary */}
                        <tr className="bg-slate-800 font-bold text-[10px] text-slate-400 uppercase tracking-wide border-b border-slate-600">
                            <td colSpan={2} className="py-2 px-3 border-r border-slate-600">Cash at Settlement from/to Buyer</td>
                            <td colSpan={2} className="py-2 px-3">Cash at Settlement to/from Seller</td>
                        </tr>
                        <tr className="border-b border-slate-600">
                            <td className={`py-3 px-3 font-bold text-slate-200 border-r border-slate-600 text-sm align-middle ${labelColWidth}`}>Cash From / (To) Buyer</td>
                            <td className={`py-3 px-3 text-right font-mono font-bold text-sm text-emerald-400 border-r border-slate-600 align-middle ${valueColWidth}`}>${formatNumber(closing.cashFromBuyer.toFixed(2))}</td>
                            <td className={`py-3 px-3 font-bold text-slate-200 border-r border-slate-600 text-sm align-middle ${labelColWidth}`}>Cash To / (From) Seller</td>
                            <td className={`py-3 px-3 text-right font-mono font-bold text-sm text-emerald-400 align-middle ${valueColWidth}`}>${formatNumber(closing.cashToSeller.toFixed(2))}</td>
                        </tr>

                        {/* --- BROKER FEES --- */}
                        <SectionHeader title="Real Estate Broker Fees" />
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Sales Commission Paid (%)" /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-orange-500/5 align-middle ${valueColWidth}`}></td>
                            <td className={labelCell}><LabelWithTooltip label="Sales Commission Paid (%)" /></td>
                            <td className={redCellWrapper}><TableInput className={redInputClass} value={closingInputs.commissionRate} onChange={(v: any) => setClosing(p => ({ ...p, commissionRate: v }))} isPercent={true} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}>Sales Commission Paid ($)</td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-orange-500/5 align-middle ${valueColWidth}`}></td>
                            <td className={labelCell}>Sales Commission Paid ($)</td>
                            <td className={valueCell}>{formatNumber(closing.totalCommission.toFixed(0))}</td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Buyer's Contribution" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.buyerCommissionContrib} onChange={(v: any) => setClosing(p => ({ ...p, buyerCommissionContrib: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="Seller's Contribution" /></td>
                            <td className={valueCell}>{formatNumber(closing.sellerCommission.toFixed(0))}</td>
                        </tr>

                        {/* --- LOAN ITEMS --- */}
                        <SectionHeader title="Items Payable in Connection with Loan" />
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Origination Fee" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.originationFee} onChange={(v: any) => setClosing(p => ({ ...p, originationFee: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Loan Discount (points)" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.loanDiscountPoints} onChange={(v: any) => setClosing(p => ({ ...p, loanDiscountPoints: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Appraisal fee" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.appraisalFee} onChange={(v: any) => setClosing(p => ({ ...p, appraisalFee: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Credit report" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.creditReport} onChange={(v: any) => setClosing(p => ({ ...p, creditReport: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Tax service" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.taxService} onChange={(v: any) => setClosing(p => ({ ...p, taxService: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Flood certification" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.floodCert} onChange={(v: any) => setClosing(p => ({ ...p, floodCert: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Underwriting fee" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.underwriting} onChange={(v: any) => setClosing(p => ({ ...p, underwriting: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Mortgage Insurance Application fee" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.mortgageInsApp} onChange={(v: any) => setClosing(p => ({ ...p, mortgageInsApp: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Assumption fee" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.assumption} onChange={(v: any) => setClosing(p => ({ ...p, assumption: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}>Subtotal Loan Items</td>
                            <td className={`py-3 px-3 text-right font-mono bg-slate-700/30 border-r border-slate-600 text-slate-300 align-middle ${valueColWidth}`}>{formatNumber(closing.loanFeesSubtotal.toFixed(0))}</td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>

                        {/* --- PREPAIDS --- */}
                        <SectionHeader title="Items Required by Lender in Advance" />
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Daily interest charges" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.dailyInterest} onChange={(v: any) => setClosing(p => ({ ...p, dailyInterest: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Mortgage insurance premium" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.mortgageInsPremAmount} onChange={(v: any) => setClosing(p => ({ ...p, mortgageInsPremAmount: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Homeowner's insurance premium" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.homeownerInsPremAmount} onChange={(v: any) => setClosing(p => ({ ...p, homeownerInsPremAmount: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>

                        {/* --- RESERVES --- */}
                        <SectionHeader title="Reserves Deposited with Lender" />
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Initial deposit for escrow" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.escrowDeposit} onChange={(v: any) => setClosing(p => ({ ...p, escrowDeposit: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Months in reserve" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.reservesMonths} onChange={(v: any) => setClosing(p => ({ ...p, reservesMonths: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Homeowner's insurance ($/month)" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.homeownerInsReserves} onChange={(v: any) => setClosing(p => ({ ...p, homeownerInsReserves: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Mortgage insurance ($/month)" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.mortgageInsReserves} onChange={(v: any) => setClosing(p => ({ ...p, mortgageInsReserves: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Property Taxes ($/month)" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.propertyTaxReserves} onChange={(v: any) => setClosing(p => ({ ...p, propertyTaxReserves: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}>Subtotal Reserves</td>
                            <td className={`py-3 px-3 text-right font-mono bg-slate-700/30 border-r border-slate-600 text-slate-300 align-middle ${valueColWidth}`}>{formatNumber(closing.reservesSubtotal.toFixed(0))}</td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>

                        {/* --- AGGREGATE ADJUSTMENT --- */}
                        <tr className="border-b border-slate-600">
                            <td className={`py-3 px-3 font-bold border-r border-slate-600 text-slate-400 align-middle ${labelColWidth}`}>Aggregate Adjustment</td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.aggregateAdjustmentBuyer} onChange={(v: any) => setClosing(p => ({ ...p, aggregateAdjustmentBuyer: v }))} /></td>
                            <td className={`py-3 px-3 font-bold border-r border-slate-600 text-slate-400 align-middle ${labelColWidth}`}>Aggregate Adjustment</td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.aggregateAdjustmentSeller} onChange={(v: any) => setClosing(p => ({ ...p, aggregateAdjustmentSeller: v }))} /></td>
                        </tr>

                        {/* --- TITLE CHARGES --- */}
                        <SectionHeader title="Title Charges" />
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Settlement or closing fee" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.settlementFeeBuyer} onChange={(v: any) => setClosing(p => ({ ...p, settlementFeeBuyer: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Lender's title insurance" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.lenderTitleIns} onChange={(v: any) => setClosing(p => ({ ...p, lenderTitleIns: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="Owner's title insurance" /></td>
                            <td className={redCellWrapper}><TableInput className={redInputClass} value={closingInputs.ownerTitleIns} onChange={(v: any) => setClosing(p => ({ ...p, ownerTitleIns: v }))} /></td>
                        </tr>

                        {/* --- RECORDING --- */}
                        <SectionHeader title="Government Recording and Transfer Charges" />
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Lender's Recording Fee" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.lenderRecording} onChange={(v: any) => setClosing(p => ({ ...p, lenderRecording: v }))} /></td>
                            <td className={labelCell}><LabelWithTooltip label="City/County tax/stamps" /></td>
                            <td className={redCellWrapper}><TableInput className={redInputClass} value={closingInputs.cityDeedTax} onChange={(v: any) => setClosing(p => ({ ...p, cityDeedTax: v }))} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-orange-500/5 align-middle ${valueColWidth}`}></td>
                            <td className={labelCell}><LabelWithTooltip label="State tax/stamps" /></td>
                            <td className={redCellWrapper}><TableInput className={redInputClass} value={closingInputs.stateDeedTax} onChange={(v: any) => setClosing(p => ({ ...p, stateDeedTax: v }))} /></td>
                        </tr>
                        <tr>
                            <td className={labelCell}></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-orange-500/5 align-middle ${valueColWidth}`}></td>
                            <td className={labelCell}><LabelWithTooltip label="Seller Lender Recording" /></td>
                            <td className={redCellWrapper}><TableInput className={redInputClass} value={closingInputs.sellerLenderRecording} onChange={(v: any) => setClosing(p => ({ ...p, sellerLenderRecording: v }))} /></td>
                        </tr>

                        {/* --- ADDITIONAL --- */}
                        <SectionHeader title="Additional Settlement Charges" />
                        <tr>
                            <td className={labelCell}><LabelWithTooltip label="Other required services" /></td>
                            <td className={inputCell}><TableInput className={inputClass} value={closingInputs.otherServices} onChange={(v: any) => setClosing(p => ({ ...p, otherServices: v }))} /></td>
                            <td className={`py-3 px-3 border-r border-slate-600 bg-slate-800/30 ${labelColWidth}`} colSpan={2}></td>
                        </tr>

                        {/* Totals Footer */}
                        <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-600">
                            <td className={`py-4 px-3 text-right border-r border-slate-600 text-slate-400 text-xs uppercase align-middle ${labelColWidth}`}>TOTAL SETTLEMENT CHARGES</td>
                            <td className={`py-4 px-3 text-right font-mono text-emerald-400 border-r border-slate-600 text-sm align-middle ${valueColWidth}`}>${formatNumber(closing.settlementChargesBorrower.toFixed(0))}</td>
                            <td className={`py-4 px-3 text-right border-r border-slate-600 text-slate-400 text-xs uppercase align-middle ${labelColWidth}`}>TOTAL SETTLEMENT CHARGES</td>
                            <td className={`py-4 px-3 text-right font-mono text-emerald-400 text-sm align-middle ${valueColWidth}`}>${formatNumber(closing.settlementChargesSeller.toFixed(0))}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
