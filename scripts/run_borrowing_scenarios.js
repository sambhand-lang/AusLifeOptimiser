// Simple scenario runner to validate Borrowing Power outputs (Node.js)
// Run: node scripts/run_borrowing_scenarios.js

const lmiRates = [
  { lvr: 80, rate: 0 },
  { lvr: 85, rate: 0.025 },
  { lvr: 90, rate: 0.045 },
  { lvr: 95, rate: 0.065 },
];

function calculateBorrowingPower(input) {
  const {
    primaryIncome,
    secondaryIncome,
    otherIncome,
    incomeType,
    livingExpenses,
    creditCardLimit,
    carLoan,
    personalLoan,
    otherDebts,
    hasHelpDebt,
    helpDebtBalance,
    interestRate,
    loanTerm,
    currentDeposit,
  } = input;

  const totalPrimaryIncome = primaryIncome;
  const totalSecondaryIncome = incomeType === 'joint' ? secondaryIncome : 0;
  const totalOtherIncome = otherIncome * 0.6;
  const totalAnnualIncome = totalPrimaryIncome + totalSecondaryIncome + totalOtherIncome;
  const totalMonthlyIncome = totalAnnualIncome / 12;

  // HELP simplified (not exercised in sample)
  let helpRepayment = 0;

  const monthlyLivingExpenses = Math.max(livingExpenses, 2000);
  const creditCardPayment = creditCardLimit * 0.03;
  const carLoanPayment = carLoan;
  const personalLoanPayment = personalLoan;
  const otherDebtPayment = otherDebts;

  const totalMonthlyExpenses = monthlyLivingExpenses + creditCardPayment + carLoanPayment + personalLoanPayment + otherDebtPayment + helpRepayment;
  const netIncome = totalMonthlyIncome - totalMonthlyExpenses;

  const assessmentRate = interestRate + 3;
  const monthlyRate = interestRate / 100 / 12;
  const monthlyAssessmentRate = assessmentRate / 100 / 12;
  const totalPayments = loanTerm * 12;

  const dsrLimit = 0.35;
  const maxMonthlyByDSR = totalMonthlyIncome * dsrLimit;
  const maxMonthlyByNetIncome = Math.max(netIncome * 0.9, 0);
  const maxMonthlyRepayment = Math.min(maxMonthlyByDSR, maxMonthlyByNetIncome);

  let stressedLoanAmount = 0;
  if (monthlyAssessmentRate === 0) {
    stressedLoanAmount = maxMonthlyRepayment * totalPayments;
  } else {
    stressedLoanAmount = maxMonthlyRepayment * (Math.pow(1 + monthlyAssessmentRate, totalPayments) - 1) /
      (monthlyAssessmentRate * Math.pow(1 + monthlyAssessmentRate, totalPayments));
  }

  const maxLvr = 0.95;
  const maxLoanFromLvr = currentDeposit * (maxLvr / (1 - maxLvr));
  const finalMaxLoan = Math.min(stressedLoanAmount, maxLoanFromLvr);

  const totalPropertyValue = finalMaxLoan + currentDeposit;
  const lvr = (finalMaxLoan / totalPropertyValue) * 100;

  let lmiCost = 0;
  let lmiRequired = false;
  if (lvr > 80) {
    lmiRequired = true;
    let applicableLmiRate = 0.065;
    for (let i = 0; i < lmiRates.length; i++) {
      if (lvr <= lmiRates[i].lvr) {
        applicableLmiRate = lmiRates[i].rate;
        break;
      }
    }
    lmiCost = finalMaxLoan * applicableLmiRate;
  }

  let monthlyRepayment = 0;
  if (monthlyRate === 0) {
    monthlyRepayment = finalMaxLoan / totalPayments;
  } else {
    monthlyRepayment = finalMaxLoan * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
  }

  const totalMonthlyDebts = monthlyRepayment + creditCardPayment + carLoanPayment + personalLoanPayment + helpRepayment;
  const dtiRatio = (totalMonthlyDebts / totalMonthlyIncome) * 100;

  return {
    totalAnnualIncome,
    totalMonthlyIncome,
    netIncome,
    maxMonthlyRepayment,
    stressedLoanAmount: Math.round(stressedLoanAmount),
    finalMaxLoan: Math.round(finalMaxLoan),
    totalPropertyValue: Math.round(totalPropertyValue),
    lvr: Math.round(lvr),
    lmiCost: Math.round(lmiCost),
    monthlyRepayment: Math.round(monthlyRepayment),
    debtToIncomeRatio: dtiRatio.toFixed(1),
    assessmentRate,
    stressTestPassed: dtiRatio <= 35,
  };
}

// Example scenario (matches your provided inputs)
const scenario = {
  primaryIncome: 150000,
  secondaryIncome: 200000,
  otherIncome: 35000,
  incomeType: 'joint',
  livingExpenses: 5000,
  creditCardLimit: 10000,
  carLoan: 0,
  personalLoan: 0,
  otherDebts: 0,
  hasHelpDebt: false,
  helpDebtBalance: 0,
  interestRate: 6.35,
  loanTerm: 30,
  currentDeposit: 100000,
};

const result = calculateBorrowingPower(scenario);
console.log('Scenario result:');
console.log(JSON.stringify(result, null, 2));

// Print human-readable summary
console.log('\nSummary:');
console.log(`Annual income: $${result.totalAnnualIncome}`);
console.log(`Monthly income: $${Math.round(result.totalMonthlyIncome)}`);
console.log(`Estimated max loan: $${result.finalMaxLoan}`);
console.log(`Monthly repayment (current rate ${scenario.interestRate}%): $${result.monthlyRepayment}`);
console.log(`Property value (loan + deposit): $${result.totalPropertyValue}`);
console.log(`LVR: ${result.lvr}%`);
console.log(`LMI estimate: $${result.lmiCost}`);
console.log(`Debt-to-income ratio: ${result.debtToIncomeRatio}%`);
console.log(`APRA assessment rate: ${result.assessmentRate}%`);
console.log(`Stress test passed: ${result.stressTestPassed}`);
