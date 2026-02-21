import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { currentInterestRates } from '@/data/australianFinancialData';
import { 
  PiggyBank, 
  Target, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Info,
  Wallet
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

interface YearlyData {
  year: number;
  balance: number;
  contributions: number;
  interest: number;
}

export function SavingsCalculator() {
  const [initialDeposit, setInitialDeposit] = useState<number>(10000);
  const [regularContribution, setRegularContribution] = useState<number>(500);
  const [contributionFrequency, setContributionFrequency] = useState<'weekly' | 'fortnightly' | 'monthly'>('monthly');
  const [interestRate, setInterestRate] = useState<number>(currentInterestRates.highInterestSavings);
  const [savingsTerm, setSavingsTerm] = useState<number>(5);
  const [taxRate, setTaxRate] = useState<number>(32.5);
  const [calculationMode, setCalculationMode] = useState<'savings' | 'goal'>('savings');
  const [targetAmount, setTargetAmount] = useState<number>(100000);

  // Calculate savings growth
  // Interest is earned monthly but tax on interest is applied annually (at year end).
  const calculations = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const monthlyContribution = contributionFrequency === 'weekly'
      ? regularContribution * 52 / 12
      : contributionFrequency === 'fortnightly'
        ? regularContribution * 26 / 12
        : regularContribution;

    let balance = initialDeposit;
    let totalContributions = initialDeposit;
    let totalInterest = 0;
    const schedule: YearlyData[] = [];

    // Add initial state
    schedule.push({
      year: 0,
      balance: Math.round(balance),
      contributions: Math.round(totalContributions),
      interest: 0,
    });

    for (let year = 1; year <= savingsTerm; year++) {
      let yearlyGrossInterest = 0;
      let yearlyContributions = 0;

      for (let month = 1; month <= 12; month++) {
        const interestEarned = balance * monthlyRate;
        // Credit gross interest monthly
        balance += monthlyContribution + interestEarned;
        yearlyContributions += monthlyContribution;
        yearlyGrossInterest += interestEarned;
      }

      // At year end, compute tax on total interest earned that year and deduct
      const taxOnInterest = yearlyGrossInterest * (taxRate / 100);
      const yearlyNetInterest = yearlyGrossInterest - taxOnInterest;

      // Deduct tax from the balance (represents tax paid on interest)
      balance -= taxOnInterest;

      totalContributions += yearlyContributions;
      totalInterest += yearlyNetInterest;

      schedule.push({
        year,
        balance: Math.round(balance),
        contributions: Math.round(totalContributions),
        interest: Math.round(totalInterest),
      });
    }

    return {
      finalBalance: Math.round(balance),
      totalContributions: Math.round(totalContributions),
      totalInterest: Math.round(totalInterest),
      schedule,
      monthlyContribution: Math.round(monthlyContribution),
    };
  }, [initialDeposit, regularContribution, contributionFrequency, interestRate, savingsTerm, taxRate]);

  // Calculate time to reach goal
  const goalCalculation = useMemo(() => {
    if (calculationMode !== 'goal') return null;

    const monthlyRate = interestRate / 100 / 12;
    const monthlyContribution = contributionFrequency === 'weekly' 
      ? regularContribution * 52 / 12 
      : contributionFrequency === 'fortnightly' 
        ? regularContribution * 26 / 12 
        : regularContribution;

    let balance = initialDeposit;
    let months = 0;
    const maxMonths = 600; // 50 years max

    // Accumulate gross interest monthly and deduct tax annually (at each 12-month boundary).
    let grossInterestAccum = 0;
    while (balance < targetAmount && months < maxMonths) {
      const interestEarned = balance * monthlyRate;
      balance += monthlyContribution + interestEarned;
      grossInterestAccum += interestEarned;
      months++;

      // At year end, deduct tax on accumulated interest
      if (months % 12 === 0) {
        const taxOnInterest = grossInterestAccum * (taxRate / 100);
        balance -= taxOnInterest;
        grossInterestAccum = 0;
      }
    }

    // If goal reached mid-year, deduct pro-rated tax on accumulated interest
    if (grossInterestAccum > 0) {
      const taxOnInterest = grossInterestAccum * (taxRate / 100);
      balance -= taxOnInterest;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    return {
      years,
      months: remainingMonths,
      totalMonths: months,
      isAchievable: months < maxMonths,
    };
  }, [calculationMode, initialDeposit, regularContribution, contributionFrequency, interestRate, targetAmount, taxRate]);

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-primary" />
                  Savings Details
                </CardTitle>
                <CardDescription>Plan your savings journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Selection */}
                <Tabs value={calculationMode} onValueChange={(v) => setCalculationMode(v as 'savings' | 'goal')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="savings" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Calculate Growth
                    </TabsTrigger>
                    <TabsTrigger value="goal" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Reach a Goal
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Initial Deposit */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="initialDeposit" className="text-base flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Initial Deposit
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        id="initialDeposit"
                        type="number"
                        value={initialDeposit}
                        onChange={(e) => setInitialDeposit(Number(e.target.value))}
                        className="w-32 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[initialDeposit]}
                    onValueChange={(value) => setInitialDeposit(value[0])}
                    min={0}
                    max={100000}
                    step={1000}
                  />
                </div>

                {/* Regular Contribution */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="regularContribution" className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Regular Contribution
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        id="regularContribution"
                        type="number"
                        value={regularContribution}
                        onChange={(e) => setRegularContribution(Number(e.target.value))}
                        className="w-28 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[regularContribution]}
                    onValueChange={(value) => setRegularContribution(value[0])}
                    min={0}
                    max={5000}
                    step={50}
                  />
                </div>

                {/* Contribution Frequency */}
                <div className="space-y-3">
                  <Label className="text-base">Contribution Frequency</Label>
                  <Tabs value={contributionFrequency} onValueChange={(v) => setContributionFrequency(v as 'weekly' | 'fortnightly' | 'monthly')}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="fortnightly">Fortnightly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-sm text-muted-foreground">
                    Equivalent to {formatCurrency(calculations.monthlyContribution)} per month
                  </p>
                </div>

                {/* Interest Rate */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="interestRate" className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Interest Rate (p.a.)
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Current high-interest savings: ~{currentInterestRates.highInterestSavings}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="interestRate"
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-24 text-right"
                        step={0.01}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Slider
                    value={[interestRate]}
                    onValueChange={(value) => setInterestRate(value[0])}
                    min={0.5}
                    max={8}
                    step={0.05}
                  />
                </div>

                {/* Tax Rate */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="taxRate" className="text-base flex items-center gap-2">
                      Your Marginal Tax Rate
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Interest income is taxed at your marginal rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="taxRate"
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-24 text-right"
                        step={0.5}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Slider
                    value={[taxRate]}
                    onValueChange={(value) => setTaxRate(value[0])}
                    min={0}
                    max={47}
                    step={0.5}
                  />
                </div>

                {/* Term or Goal */}
                {calculationMode === 'savings' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="savingsTerm" className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Savings Term
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="savingsTerm"
                          type="number"
                          value={savingsTerm}
                          onChange={(e) => setSavingsTerm(Number(e.target.value))}
                          className="w-20 text-right"
                        />
                        <span className="text-sm text-muted-foreground">years</span>
                      </div>
                    </div>
                    <Slider
                      value={[savingsTerm]}
                      onValueChange={(value) => setSavingsTerm(value[0])}
                      min={1}
                      max={30}
                      step={1}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="targetAmount" className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Target Amount
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          id="targetAmount"
                          type="number"
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(Number(e.target.value))}
                          className="w-36 text-right"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[targetAmount]}
                      onValueChange={(value) => setTargetAmount(value[0])}
                      min={10000}
                      max={1000000}
                      step={10000}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {/* Main Result */}
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {calculationMode === 'savings' ? 'Final Balance' : 'Time to Goal'}
                </CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  {calculationMode === 'savings' 
                    ? `After ${savingsTerm} years` 
                    : `To reach ${formatCurrency(targetAmount)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calculationMode === 'savings' ? (
                  <div className="text-4xl font-bold mb-2">
                    {formatCurrency(calculations.finalBalance)}
                  </div>
                ) : goalCalculation?.isAchievable ? (
                  <div className="text-4xl font-bold mb-2">
                    {goalCalculation.years > 0 && `${goalCalculation.years}y `}
                    {goalCalculation.months > 0 && `${goalCalculation.months}m`}
                  </div>
                ) : (
                  <div className="text-2xl font-bold mb-2">
                    Goal not achievable
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Initial Deposit</span>
                  <span className="font-medium">{formatCurrency(initialDeposit)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Contributions</span>
                  <span className="font-medium">{formatCurrency(calculations.totalContributions)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Interest Earned (after tax)</span>
                  <span className="font-medium text-green-600">+{formatCurrency(calculations.totalInterest)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-muted rounded-lg px-3 mt-2">
                  <span className="font-semibold">Total Balance</span>
                  <span className="font-bold text-lg">{formatCurrency(calculations.finalBalance)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Interest Rate Badge */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Interest Rate Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nominal Rate</span>
                  <Badge variant="outline">{interestRate}% p.a.</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">After Tax ({taxRate}%)</span>
                  <Badge variant="outline">{(interestRate * (1 - taxRate / 100)).toFixed(2)}% p.a.</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Interest is taxed at your marginal tax rate
                </div>
              </CardContent>
            </Card>

            {/* Savings Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-800">Savings Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-blue-700">
                <p>• Set up automatic transfers on payday</p>
                <p>• Compare high-interest savings accounts</p>
                <p>• Consider a term deposit for larger amounts</p>
                <p>• Use the 50/30/20 budgeting rule</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Savings Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculations.schedule}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `Year ${value}`}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Total Balance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorBalance)"
                  />
                  <Area
                    type="monotone"
                    dataKey="contributions"
                    name="Your Contributions"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#colorContributions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Total Balance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Your Contributions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center">
          <Info className="h-3 w-3 inline mr-1" />
          This calculator assumes constant interest rates and regular contributions. 
          Actual returns may vary. Interest is calculated monthly and compounded. Tax on interest is deducted annually.
        </div>
      </div>
    </TooltipProvider>
  );
}
