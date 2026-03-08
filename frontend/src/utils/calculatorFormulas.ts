
import { CashFlowInputs, ClosingCostInputs, HomeSceneInputs, MoneySceneInputs } from '../types';

// Calculates closing costs for Buyer and Seller based on spreadsheet logic
export const calculateClosing = (cfInputs: CashFlowInputs, closingInputs: ClosingCostInputs) => {
    const c = closingInputs;
    const cf = cfInputs;

    // --- 1. Broker Fees ---
    // Total Commission = Purchase Price * (Commission Rate / 100)
    // Seller pays the difference between Total and Buyer's Contribution
    const totalCommission = cf.purchasePrice * (c.commissionRate / 100);
    const sellerCommission = totalCommission - c.buyerCommissionContrib;

    // --- 2. Loan Fees (Buyer) ---
    const loanFeesSubtotal = 
        c.originationFee + 
        c.loanDiscountPoints + 
        c.appraisalFee + 
        c.creditReport + 
        c.taxService + 
        c.floodCert + 
        c.underwriting + 
        c.mortgageInsApp + 
        c.assumption;

    // --- 3. Prepaids (Buyer) ---
    const prepaidsSubtotal = 
        c.dailyInterest + 
        c.mortgageInsPremAmount + 
        c.homeownerInsPremAmount;

    // --- 4. Reserves (Buyer) ---
    const monthlyReservesCost = c.homeownerInsReserves + c.mortgageInsReserves + c.propertyTaxReserves;
    const reservesSubtotal = c.escrowDeposit + (c.reservesMonths * monthlyReservesCost);

    // --- 5. Title Charges ---
    const titleChargesBuyer = c.settlementFeeBuyer + c.lenderTitleIns;
    const titleChargesSeller = c.ownerTitleIns;

    // --- 6. Government Recording & Transfer ---
    const recordingBuyer = c.lenderRecording;
    // Seller typically pays transfer taxes (City/State) + their own recording fees
    const recordingSeller = c.cityDeedTax + c.stateDeedTax + c.sellerLenderRecording;

    // --- 7. Additional Settlement ---
    const additionalBuyer = c.otherServices;

    // --- TOTAL SETTLEMENT CHARGES (Detailed Breakdown Sums) ---
    const settlementChargesBorrower = 
        c.buyerCommissionContrib +
        loanFeesSubtotal +
        prepaidsSubtotal +
        reservesSubtotal +
        titleChargesBuyer +
        recordingBuyer +
        additionalBuyer; 

    const settlementChargesSeller = 
        sellerCommission +
        titleChargesSeller +
        recordingSeller;

    // --- Adjustments (Shared) ---
    // In the spreadsheet, these are added to both Buyer's "Gross Due" and Seller's "Gross Due" 
    // (Assuming they are prepaid items reimbursed to Seller, or simply purchase price adjustments)
    const adjustments = c.cityTax + c.countyTax + c.assessments;

    // --- BUYER TOTALS ---
    // Gross Due = Price + Personal Property + Settlement Charges + Adjustments + Aggregate Adj
    const grossDueBuyer = 
        cf.purchasePrice + 
        c.personalProperty + 
        settlementChargesBorrower + 
        adjustments + 
        c.aggregateAdjustmentBuyer; // Usually negative (credit)

    const totalPaidBuyer = 
        c.deposit + 
        c.buyerLoanAmount + 
        c.existingLoan;

    const cashFromBuyer = grossDueBuyer - totalPaidBuyer;

    // --- SELLER TOTALS ---
    // Gross Due = Price + Personal Property + Adjustments
    const grossDueSeller = 
        cf.purchasePrice + 
        c.personalProperty + 
        adjustments;

    // Reductions = Payoffs + Settlement Charges + Existing Loan + Aggregate Adj (Seller)
    const totalReductionsSeller = 
        c.existingLoan + 
        c.payoffFirst + 
        c.payoffSecond + 
        settlementChargesSeller + 
        c.aggregateAdjustmentSeller; 

    const cashToSeller = grossDueSeller - totalReductionsSeller;

    return {
        totalCommission,
        sellerCommission,
        loanFeesSubtotal,
        prepaidsSubtotal,
        monthlyReservesCost,
        reservesSubtotal,
        titleChargesBuyer,
        titleChargesSeller,
        recordingBuyer,
        recordingSeller,
        additionalBuyer,
        settlementChargesBorrower,
        settlementChargesSeller,
        adjustments,
        grossDueBuyer,
        totalPaidBuyer,
        cashFromBuyer,
        grossDueSeller,
        totalReductionsSeller,
        cashToSeller
    };
};

// Calculates monthly cash flows for Investment vs Homeowner
export const calculateCashFlows = (cfInputs: CashFlowInputs, closingData: any) => {
    const i = cfInputs;
    const r = (i.interestRate / 100) / 12;
    const n = i.loanTerm;
    const monthlyPrincipalInterest = i.loanAmount > 0 
      ? i.loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      : 0;
    
    const firstMonthInterest = i.loanAmount * r;
    const firstMonthPrincipal = monthlyPrincipalInterest - firstMonthInterest;
    const monthlyTax = i.propertyTaxYearly / 12;
    const monthlyIns = i.insuranceYearly / 12;
    const monthlyMaint = i.rentalRate * (i.maintenancePercent / 100);
    const monthlyMgmt = i.rentalRate * (i.managementPercent / 100);
    const monthlyVacancy = i.rentalRate * (i.vacancyPercent / 100);
    const monthlyHOA = i.hoaMonthly;

    const totalOperatingCosts = monthlyTax + monthlyIns + monthlyHOA + monthlyMaint + monthlyMgmt + monthlyVacancy;
    const grossRent = i.rentalRate;
    const grossIncome = grossRent - monthlyVacancy; 
    const noi = grossIncome - (monthlyTax + monthlyIns + monthlyHOA + monthlyMaint + monthlyMgmt); 
    const cashFlowPreTax = noi - monthlyPrincipalInterest;
    
    const basis = i.purchasePrice * (i.structurePercent / 100);
    const annualDepreciation = basis / 27.5;
    const monthlyDepreciation = annualDepreciation / 12;

    const taxableIncome = noi - firstMonthInterest - monthlyDepreciation - i.otherDeductions;
    const estimatedTaxes = taxableIncome * (i.incomeTaxRate / 100);
    const netIncomeAfterTaxes = taxableIncome - estimatedTaxes;
    const afterTaxCashFlow = cashFlowPreTax - estimatedTaxes;

    const hoExpenses = monthlyTax + monthlyIns + monthlyHOA + monthlyMaint;
    const taxBenefit = (firstMonthInterest + monthlyTax + i.otherDeductions) * (i.incomeTaxRate / 100);
    const netHoExpenses = hoExpenses - taxBenefit;
    
    const monthlyAppreciation = i.purchasePrice * (i.appreciationRate / 100) / 12;
    const equityGrowth = firstMonthPrincipal + monthlyAppreciation;
    
    const totalCashInvested = closingData.cashFromBuyer;
    const roiPreTax = totalCashInvested > 0 ? ((cashFlowPreTax * 12) / totalCashInvested) * 100 : 0;
    const roiAfterTax = totalCashInvested > 0 ? ((afterTaxCashFlow * 12) / totalCashInvested) * 100 : 0;
    const capRate = i.purchasePrice > 0 ? ((noi * 12) / i.purchasePrice) * 100 : 0;

    return {
      monthlyPrincipalInterest,
      investor: {
        grossRent,
        vacancy: monthlyVacancy,
        grossIncome,
        operatingCosts: totalOperatingCosts,
        incomeBeforeDebtService: noi,
        debtService: monthlyPrincipalInterest,
        cashFlowAfterDebtService: cashFlowPreTax,
        mortgagePrincipleAddBack: firstMonthPrincipal,
        netIncomeBeforeDepreciation: cashFlowPreTax + firstMonthPrincipal,
        depreciationAllowance: monthlyDepreciation,
        taxableIncome,
        estimatedTaxes,
        netIncomeReturnAfterTaxes: netIncomeAfterTaxes,
        deductiblePrincipleAddBack: -firstMonthPrincipal,
        cashFlowBeforeDepreciationAddBack: netIncomeAfterTaxes - firstMonthPrincipal,
        depreciationAddBack: monthlyDepreciation,
        afterTaxCashFlow,
        marketAppreciation: monthlyAppreciation,
        equityGrowth,
        roiPreTax,
        roiAfterTax,
        capRate,
        otherDeductions: i.otherDeductions
      },
      homeowner: {
        rentAvoided: grossRent,
        expenses: hoExpenses,
        taxBenefit,
        netExpenses: netHoExpenses,
        principalPaydown: firstMonthPrincipal,
        appreciation: monthlyAppreciation,
        equityGrowth
      }
    };
};

// Calculates Home Scene (Sell then Buy)
export const calculateHomeScene = (hs: HomeSceneInputs) => {
    // --- Table 1 Calculations ---
    const effectiveSalesPrice = hs.salesPrice * (1 - hs.fastSellFactor / 100);
    const costOfRepairs = (hs.houseSize * hs.repairCostPerSqFt) + hs.structuralRepairs + hs.fixturesReplacement + hs.landscaping;
    const contingency = costOfRepairs * (hs.contingencyFactor / 100);
    const totalRemodel = costOfRepairs + contingency;

    const monthlyPropTax = (hs.salesPrice * (hs.propertyTaxRate / 100)) / 12;
    const monthlyDebtService = (hs.mortgage1Balance + hs.mortgage2Balance) * (0.06 / 12); 
    const monthlyCarrying = hs.monthlyUtilities + monthlyPropTax + monthlyDebtService;
    const carryPeriodMonths = hs.daysToRemodel / 30;
    const carryingCosts = monthlyCarrying * carryPeriodMonths;

    const commissions = effectiveSalesPrice * (hs.agentCommission / 100);
    const closingCostsEstimate = effectiveSalesPrice * 0.0075; 
    const totalCostOfSale = commissions + closingCostsEstimate;

    const totalLiens = hs.mortgage1Balance + hs.mortgage2Balance + hs.liens;
    const salesCashOut = effectiveSalesPrice - totalLiens - totalCostOfSale - totalRemodel - carryingCosts;

    // --- Purchase ---
    const nextAmountFinanced = hs.nextHomePrice * (hs.percentFinanced / 100);
    const nextDownPayment = hs.nextHomePrice - nextAmountFinanced;
    const nextLoanOrigination = nextAmountFinanced * (hs.loanOriginationFee / 100);
    const nextClosingCosts = hs.nextHomePrice * 0.01; 
    const costOfPurchase = nextLoanOrigination + nextClosingCosts;
    
    const netCashToClose = nextDownPayment + costOfPurchase - salesCashOut;

    return {
        effectiveSalesPrice,
        costOfRepairs,
        contingency,
        totalRemodel,
        monthlyCarrying,
        carryingCosts,
        commissions,
        closingCostsEstimate,
        totalCostOfSale,
        totalLiens,
        salesCashOut,
        nextAmountFinanced,
        costOfPurchase,
        netCashToClose,
        nextDownPayment,
        nextLoanOrigination
    };
};

// Calculates Money Scene (Fix and Flip)
export const calculateMoneyScene = (ms: MoneySceneInputs) => {
    // Basic Calculations from Inputs
    const fastSellAmt = ms.arv * (ms.fastSellFactor / 100);
    const farv = ms.arv - fastSellAmt;
    const profitAmt = farv * (ms.discountProfit / 100);

    // Cost of Sales Breakdown
    const commissions = farv * (ms.agentCommissionSell / 100);
    // Use new specific fields if available, otherwise defaults or zero if legacy
    const homeWarranty = ms.homeWarranty || 0;
    const titleFees = ms.titleEscrowFees || 0;
    const buyerAssist = ms.buyerClosingCostAssistance || 0;
    
    // If legacy inputs (0), use the old estimator logic or fallback
    // The previous logic was: const cos = (farv * (ms.agentCommissionSell / 100)) + 3000;
    // We now sum the specific fields. 
    const cos = commissions + homeWarranty + titleFees + buyerAssist;
    
    // Cost of Repairs Breakdown
    const costOfRepairs = (ms.houseSize * ms.repairCostSqFt) + ms.structuralRepairs + ms.fixtures + ms.landscaping;
    const contingency = costOfRepairs * (ms.contingency / 100);
    const totalCor = costOfRepairs + contingency;

    // Carrying Costs Breakdown
    // Calculate months held using (days rehab + days on market) / 30
    const daysHeld = ms.daysToRehab + ms.avgDaysOnMarket;
    const monthsHeld = daysHeld / 30; // Will yield decimal, e.g. 115.5/30 = 3.85
    
    const monthlyTaxes = (ms.assessorValue * (ms.propertyTaxRate / 100)) / 12;
    const monthlyDebt = (ms.amountFinanced * (ms.loanRate / 100)) / 12;
    const insuranceAndFees = ms.insuranceMonthly || 0;
    
    const monthlyHolding = monthlyTaxes + monthlyDebt + ms.utilitiesMonthly + insuranceAndFees;
    const totalCc = monthlyHolding * monthsHeld;

    // Cost of Purchase Breakdown
    const loanOriginationAmt = ms.amountFinanced * (ms.loanOriginationFee / 100);
    const inspection = ms.inspectionFee || 0;
    const closingCosts = ms.buyingClosingCosts || 0;
    
    const totalCop = loanOriginationAmt + ms.finderFee + inspection + closingCosts;

    // Max Allowable Offer (MAO) / Purchase Price Calculation
    // Purchase Price = FARV - Profit - COR - CC - COS - COP
    const purchasePrice = farv - profitAmt - totalCor - totalCc - cos - totalCop;
    
    // Cash In Required
    // Cash In = Purchase Price + COR + COP + CC - Amount Financed
    const cashIn = purchasePrice + totalCor + totalCop + totalCc - ms.amountFinanced;

    // ROI
    const totalGain = profitAmt; // Or (FARV - PurchasePrice - COP - COR - CC - COS) which should equal profitAmt
    const roi = cashIn > 0 ? (totalGain / cashIn) : 0;
    const annualizedRoi = roi * (12 / monthsHeld) * 100;

    return {
       farv,
       fastSellAmt,
       profitAmt,
       totalCop,
       loanOriginationAmt,
       totalCor,
       contingency,
       totalCc,
       monthlyHolding,
       monthsHeld,
       cos,
       purchasePrice,
       cashIn,
       annualizedRoi,
       // Breakdowns exposed for UI
       breakdowns: {
           commissions,
           homeWarranty,
           titleFees,
           buyerAssist,
           inspection,
           closingCosts,
           monthlyTaxes,
           monthlyDebt,
           insuranceAndFees
       }
    };
};
