import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { currentInterestRates, lmiRates, helpRepaymentRates } from '@/data/australianFinancialData';
import { 
  Users, 
  CreditCard, 
  Car, 
  GraduationCap,
  Info,
  TrendingUp,
  PiggyBank,
  Calculator
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function BorrowingPowerCalculator() {
  // Income
  const [incomeType, setIncomeType] = useState<'single' | 'joint'>('single');
  const [primaryIncome, setPrimaryIncome] = useState<number>(90000);
  const [secondaryIncome, setSecondaryIncome] = useState<number>(60000);
  const [otherIncome, setOtherIncome] = useState<number>(0);
  
  // Expenses
  const [livingExpenses, setLivingExpenses] = useState<number>(2500);
  const [creditCardLimit, setCreditCardLimit] = useState<number>(10000);
  const [carLoan, setCarLoan] = useState<number>(0);
  const [personalLoan, setPersonalLoan] = useState<number>(0);
  const [otherDebts, setOtherDebts] = useState<number>(0);
  const [hasHelpDebt, setHasHelpDebt] = useState<boolean>(false);
  const [helpDebtBalance, setHelpDebtBalance] = useState<number>(30000);
  
  // Loan preferences
  const [interestRate, setInterestRate] = useState<number>(currentInterestRates.averageVariableRate);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [currentDeposit, setCurrentDeposit] = useState<number>(100000);

  // Calculate borrowing power
  const calculations = useMemo(() => {
    // ==================== AUSTRALIAN LENDING STANDARDS ====================
    
    // Total income
    const totalPrimaryIncome = primaryIncome;
    const totalSecondaryIncome = incomeType === 'joint' ? secondaryIncome : 0;
    const totalOtherIncome = otherIncome * 0.6; // Only 60% of other income typically counted
    const totalAnnualIncome = totalPrimaryIncome + totalSecondaryIncome + totalOtherIncome;
    const totalMonthlyIncome = totalAnnualIncome / 12;

    // HELP/HECS repayment - using proper ASIC calculated rates
    let helpRepayment = 0;
    if (hasHelpDebt && helpDebtBalance > 0) {
      // Find applicable HELP repayment rate based on income
      let applicableRate = 0;
      for (let i = helpRepaymentRates.length - 1; i >= 0; i--) {
        if (totalAnnualIncome >= helpRepaymentRates[i].threshold) {
          applicableRate = helpRepaymentRates[i].rate;
          break;
        }
      }
      helpRepayment = totalAnnualIncome * applicableRate / 12;
    }

    // Monthly expenses
    const monthlyLivingExpenses = Math.max(livingExpenses, 2000); // Minimum living expenses
    
    // Credit card minimum payment (lenders assess at 3% of total limit, not balance)
    const creditCardPayment = creditCardLimit * 0.03;
    
    // Other debt repayments (assessed as provided)
    const carLoanPayment = carLoan;
    const personalLoanPayment = personalLoan;
    const otherDebtPayment = otherDebts;

    // Total monthly obligations
    const totalMonthlyExpenses = monthlyLivingExpenses + creditCardPayment + 
                                  carLoanPayment + personalLoanPayment + otherDebtPayment + helpRepayment;

    // Net income after obligations
    const netIncome = totalMonthlyIncome - totalMonthlyExpenses;

    // ==================== APRA SERVICEABILITY STRESS TEST ====================
    // APRA requires assessment at the greater of:
    // 1. Current rate + 3%
    // 2. The loan's comparison rate
    // For conservatism, we use current rate + 3%
    
    const assessmentRate = interestRate + 3; // APRA standard buffer
    const monthlyRate = interestRate / 100 / 12;
    const monthlyAssessmentRate = assessmentRate / 100 / 12;
    const totalPayments = loanTerm * 12;
    
    // ==================== LENDING RATIO CONSTRAINTS ====================
    // Australian lenders apply multiple constraints:
    // 1. Loan-to-Value Ratio (LVR) - max typically 95% with LMI
    // 2. Debt Service Ratio (DSR) - typically 30-35% of gross income for all debts
    // 3. Net Serviceability - residual income after all expenses
    
    // Serviceability constraints
    const dsrLimit = 0.35; // 35% DSR - conservative for Australian lending
    const maxMonthlyByDSR = totalMonthlyIncome * dsrLimit;
    const maxMonthlyByNetIncome = Math.max(netIncome * 0.9, 0); // 90% of net income
    
    // Use the lower constraint
    const maxMonthlyRepayment = Math.min(maxMonthlyByDSR, maxMonthlyByNetIncome);

    // Calculate loan amount at stressed rate
    let stressedLoanAmount = 0;
    if (monthlyAssessmentRate === 0) {
      stressedLoanAmount = maxMonthlyRepayment * totalPayments;
    } else {
      stressedLoanAmount = maxMonthlyRepayment * (Math.pow(1 + monthlyAssessmentRate, totalPayments) - 1) / 
                          (monthlyAssessmentRate * Math.pow(1 + monthlyAssessmentRate, totalPayments));
    }

    // LVR constraint - maximum 95% (beyond requires LMI and often not available)
    const maxLvr = 0.95; // 95% LVR maximum
    // Max loan allowed by LVR given deposit: loan = deposit * (LVR / (1 - LVR))
    const maxLoanFromLvr = currentDeposit * (maxLvr / (1 - maxLvr));
    const finalMaxLoan = Math.min(stressedLoanAmount, maxLoanFromLvr);

    // Calculate LVR and LMI
    const totalPropertyValue = finalMaxLoan + currentDeposit;
    const lvr = (finalMaxLoan / totalPropertyValue) * 100;
    
    let lmiCost = 0;
    let lmiRequired = false;
    if (lvr > 80) {
      lmiRequired = true;
      // Find appropriate LMI rate
      let applicableLmiRate = 0.065; // Default to highest if exceeds 95%
      for (let i = 0; i < lmiRates.length; i++) {
        if (lvr <= lmiRates[i].lvr) {
          applicableLmiRate = lmiRates[i].rate;
          break;
        }
      }
      lmiCost = finalMaxLoan * applicableLmiRate;
    }

    // Calculate actual monthly repayment at current (not stressed) rate
    let monthlyRepayment = 0;
    if (monthlyRate === 0) {
      monthlyRepayment = finalMaxLoan / totalPayments;
    } else {
      monthlyRepayment = finalMaxLoan * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }

    // Calculate debt-to-income ratio (all debts vs gross income)
    const totalMonthlyDebts = monthlyRepayment + creditCardPayment + carLoanPayment + personalLoanPayment + helpRepayment;
    const dtiRatio = (totalMonthlyDebts / totalMonthlyIncome) * 100;

    return {
      totalAnnualIncome,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      netIncome,
      maxMonthlyRepayment,
      maxLoanAmount: Math.round(finalMaxLoan),
      totalPropertyValue: Math.round(totalPropertyValue),
      lvr: Math.round(lvr),
      lmiCost: Math.round(lmiCost),
      lmiRequired,
      monthlyRepayment: Math.round(monthlyRepayment),
      helpRepayment: Math.round(helpRepayment),
      debtToIncomeRatio: dtiRatio.toFixed(1),
      assessmentRate,
      stressTestPassed: dtiRatio <= 35,
    };
  }, [
    incomeType, primaryIncome, secondaryIncome, otherIncome,
    livingExpenses, creditCardLimit, carLoan, personalLoan, otherDebts,
    hasHelpDebt, helpDebtBalance, interestRate, loanTerm, currentDeposit
  ]);

  // Chart data
  const chartData = useMemo(() => [
    { name: 'Income', value: calculations.totalMonthlyIncome, color: '#22c55e' },
    { name: 'Expenses', value: calculations.totalMonthlyExpenses, color: '#f97316' },
    { name: 'Mortgage', value: calculations.monthlyRepayment, color: '#3b82f6' },
    { name: 'Remaining', value: Math.max(0, calculations.netIncome - calculations.monthlyRepayment), color: '#8b5cf6' },
  ], [calculations]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Income Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Income Details
                </CardTitle>
                <CardDescription>Your household income information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Income Type */}
                <Tabs value={incomeType} onValueChange={(v) => setIncomeType(v as 'single' | 'joint')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single Income</TabsTrigger>
                    <TabsTrigger value="joint">Joint Application</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Primary Income */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base">
                      {incomeType === 'single' ? 'Your Annual Income' : 'Primary Applicant Income'}
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={primaryIncome}
                        onChange={(e) => setPrimaryIncome(Number(e.target.value))}
                        className="w-28 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[primaryIncome]}
                    onValueChange={(value) => setPrimaryIncome(value[0])}
                    min={30000}
                    max={300000}
                    step={1000}
                  />
                </div>

                {/* Secondary Income */}
                {incomeType === 'joint' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base">Secondary Applicant Income</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={secondaryIncome}
                          onChange={(e) => setSecondaryIncome(Number(e.target.value))}
                          className="w-28 text-right"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[secondaryIncome]}
                      onValueChange={(value) => setSecondaryIncome(value[0])}
                      min={0}
                      max={300000}
                      step={1000}
                    />
                  </div>
                )}

                {/* Other Income */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base flex items-center gap-2">
                      Other Income (rent, investments)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Lenders typically only count 60% of other income</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={otherIncome}
                        onChange={(e) => setOtherIncome(Number(e.target.value))}
                        className="w-28 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[otherIncome]}
                    onValueChange={(value) => setOtherIncome(value[0])}
                    min={0}
                    max={100000}
                    step={1000}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Expenses Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Expenses & Debts
                </CardTitle>
                <CardDescription>Your monthly financial commitments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Living Expenses */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base">Monthly Living Expenses</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={livingExpenses}
                        onChange={(e) => setLivingExpenses(Number(e.target.value))}
                        className="w-28 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[livingExpenses]}
                    onValueChange={(value) => setLivingExpenses(value[0])}
                    min={1000}
                    max={10000}
                    step={100}
                  />
                </div>

                {/* Credit Card */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base flex items-center gap-2">
                      Total Credit Card Limits
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Lenders assess based on limits, not balances</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={creditCardLimit}
                        onChange={(e) => setCreditCardLimit(Number(e.target.value))}
                        className="w-28 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[creditCardLimit]}
                    onValueChange={(value) => setCreditCardLimit(value[0])}
                    min={0}
                    max={100000}
                    step={1000}
                  />
                </div>

                {/* Other Loans */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      Car Loan/mth
                    </Label>
                    <Input
                      type="number"
                      value={carLoan}
                      onChange={(e) => setCarLoan(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Personal Loan/mth</Label>
                    <Input
                      type="number"
                      value={personalLoan}
                      onChange={(e) => setPersonalLoan(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Other Debts/mth</Label>
                    <Input
                      type="number"
                      value={otherDebts}
                      onChange={(e) => setOtherDebts(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* HELP Debt */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Have HELP/HECS Debt?
                    </Label>
                    <Switch
                      checked={hasHelpDebt}
                      onCheckedChange={setHasHelpDebt}
                    />
                  </div>
                  {hasHelpDebt && (
                    <div className="space-y-2">
                      <Label className="text-sm">HELP Debt Balance</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={helpDebtBalance}
                          onChange={(e) => setHelpDebtBalance(Number(e.target.value))}
                          className="w-36"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Loan Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Loan Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Interest Rate</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-24"
                        step={0.01}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Loan Term</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">years</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Current Deposit</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={currentDeposit}
                        onChange={(e) => setCurrentDeposit(Number(e.target.value))}
                        className="w-28"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {/* Main Result */}
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Borrowing Power</CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  Estimated maximum loan amount
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {formatCurrency(calculations.maxLoanAmount)}
                </div>
                <div className="text-sm opacity-90">
                  Based on {formatCurrency(calculations.totalAnnualIncome)}/year income
                </div>
              </CardContent>
            </Card>

            {/* Property Value */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Maximum Property Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(calculations.totalPropertyValue)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={calculations.lvr <= 80 ? 'default' : 'destructive'}>
                    LVR {calculations.lvr}%
                  </Badge>
                  {calculations.lvr > 80 && (
                    <span className="text-orange-600">LMI required</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Income</span>
                  <span className="font-medium text-green-600">{formatCurrency(calculations.totalMonthlyIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Living Expenses</span>
                  <span className="font-medium text-orange-600">-{formatCurrency(livingExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Other Debts</span>
                  <span className="font-medium text-orange-600">
                    -{formatCurrency(creditCardLimit * 0.03 + carLoan + personalLoan + otherDebts + calculations.helpRepayment)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Mortgage Repayment</span>
                  <span className="font-medium text-blue-600">-{formatCurrency(calculations.monthlyRepayment)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-muted rounded-lg px-3">
                  <span className="font-semibold">Remaining</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(Math.max(0, calculations.netIncome - calculations.monthlyRepayment))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* LMI Warning */}
            {calculations.lvr > 80 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-800">LMI Estimate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700 mb-1">
                    {formatCurrency(calculations.lmiCost)}
                  </div>
                  <div className="text-sm text-orange-600">
                    Lenders Mortgage Insurance required for LVR over 80%
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deposit Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-primary" />
                  Your Deposit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {formatCurrency(currentDeposit)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {((currentDeposit / calculations.totalPropertyValue) * 100).toFixed(1)}% of property value
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Don't forget stamp duty, legal fees, and other costs (~5%)
                </div>
              </CardContent>
            </Card>

            {/* Debt to Income */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Debt to Income Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {calculations.debtToIncomeRatio}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Lenders typically prefer under 35%
                </div>
              </CardContent>
            </Card>

            {/* APRA Stress Test */}
            <Card className={calculations.stressTestPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${calculations.stressTestPassed ? 'text-green-800' : 'text-red-800'}`}>
                  APRA Stress Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className={`text-2xl font-bold ${calculations.stressTestPassed ? 'text-green-700' : 'text-red-700'}`}>
                    {calculations.stressTestPassed ? '✓ PASSED' : '✗ CAUTION'}
                  </div>
                  <div className="text-sm text-gray-700">
                    Assessed at <span className="font-semibold">{calculations.assessmentRate.toFixed(2)}%</span> (stress +3%)
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Australian Prudential Regulation Authority requires assessment at current rate + 3%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    width={80}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Australian Lending Guidelines */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Info className="h-5 w-5" />
              Australian Lending Standards & Your Assessment
            </CardTitle>
            <CardDescription className="text-blue-800">
              How your borrowing power is calculated by Australian lenders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-blue-900">
              <div>
                <div className="font-semibold mb-1">✓ Income Assessed (ASIC Guidelines)</div>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Salary/wages: 100% (must be stable for 2+ years)</li>
                  <li>Other income (rent, investments): 60% only</li>
                  <li>Bonus/overtime: Usually only if consistent (3+ years)</li>
                </ul>
              </div>
              
              <div>
                <div className="font-semibold mb-1">✓ APRA Stress Testing (Current Standard)</div>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Assessment at current rate + 3% (APRA requirement)</li>
                  <li>Must still service mortgage if rates rise significantly</li>
                  <li>Debt-to-income ratio typically capped at 35% of gross salary</li>
                </ul>
              </div>

              <div>
                <div className="font-semibold mb-1">✓ Expenses Assessed</div>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Living expenses: Based on your estimate (minimum ~$2,000/month)</li>
                  <li>Credit card limits: 3% of total limit (not balance)</li>
                  <li>All existing debts: Car loans, personal loans, HELP/HECS</li>
                </ul>
              </div>

              <div>
                <div className="font-semibold mb-1">⚠️ Important Notes for Australian Borrowers</div>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>LMI required if LVR exceeds 80% (recommended down payment: 20%)</li>
                  <li>Include stamp duty, legal fees, and inspections in your budget</li>
                  <li>Lenders may ask for: payslips (2 months), tax returns (2 years), bank statements</li>
                  <li>First Home Buyer Scheme: Check your state's eligibility and grants</li>
                  <li>Credit score matters: Check your credit report via ASIC's free tools</li>
                </ul>
              </div>

              <div className="bg-white rounded p-3 border-l-4 border-blue-400">
                <div className="font-semibold text-xs mb-1">💡 Tip: Get Pre-Approval</div>
                <p className="text-xs">
                  Major banks (CBA, Westpac, NAB, ANZ) offer free pre-approval letters showing what you can borrow. 
                  This takes 1-2 days and helps when making offers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center space-y-2">
          <div>
            <Info className="h-3 w-3 inline mr-1" />
            This calculator provides estimates based on APRA guidelines and typical lending criteria.
          </div>
          <div className="text-xs text-orange-600">
            ⚠️ Actual borrowing capacity varies by lender. Always seek professional financial advice and get formal pre-approval before making offers.
          </div>
          <div className="text-xs text-gray-500">
            Data current as of February 2026. Interest rates and lending criteria change regularly.
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
