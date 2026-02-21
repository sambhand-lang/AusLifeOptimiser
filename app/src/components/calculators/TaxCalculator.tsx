import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  taxBrackets2025, 
  medicareLevy, 
  helpRepaymentRates, 
  litoData 
} from '@/data/australianFinancialData';
import { 
  DollarSign, 
  Receipt, 
  GraduationCap,
  Heart,
  PiggyBank,
  Info,
  Calculator
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

export function TaxCalculator() {
  const [annualIncome, setAnnualIncome] = useState<number>(90000);
  const [hasHelpDebt, setHasHelpDebt] = useState<boolean>(false);
  const [hasPrivateHealth, setHasPrivateHealth] = useState<boolean>(false);
  const [deductions, setDeductions] = useState<number>(2000);

  // Calculate tax
  const calculations = useMemo(() => {
    const taxableIncome = Math.max(0, annualIncome - deductions);
    
    // Find applicable tax bracket
    let taxBracket = taxBrackets2025[0];
    for (let i = taxBrackets2025.length - 1; i >= 0; i--) {
      if (taxableIncome >= taxBrackets2025[i].min) {
        taxBracket = taxBrackets2025[i];
        break;
      }
    }

    // Calculate income tax
    let incomeTax = taxBracket.baseTax;
    if (taxableIncome > taxBracket.min) {
      const taxableInBracket = taxBracket.max 
        ? Math.min(taxableIncome, taxBracket.max) - taxBracket.min 
        : taxableIncome - taxBracket.min;
      incomeTax += taxableInBracket * (taxBracket.rate / 100);
    }

    // Calculate Medicare Levy
    let medicare = 0;
    if (taxableIncome > 24276) { // Medicare levy threshold for 2024-25
      medicare = taxableIncome * medicareLevy;
      
      // Medicare Levy Surcharge for high income earners without private health
      if (!hasPrivateHealth && taxableIncome > 93000) {
        let surchargeRate = 0;
        if (taxableIncome <= 108000) surchargeRate = 0.01;
        else if (taxableIncome <= 144000) surchargeRate = 0.0125;
        else surchargeRate = 0.015;
        
        medicare += taxableIncome * surchargeRate;
      }
    }

    // Calculate HELP repayment
    let helpRepayment = 0;
    if (hasHelpDebt) {
      for (let i = helpRepaymentRates.length - 1; i >= 0; i--) {
        if (taxableIncome >= helpRepaymentRates[i].threshold) {
          helpRepayment = taxableIncome * helpRepaymentRates[i].rate;
          break;
        }
      }
    }

    // Calculate LITO (Low Income Tax Offset)
    let lito = 0;
    if (taxableIncome <= litoData.cutOff) {
      lito = litoData.maxOffset;
      if (taxableIncome > litoData.incomeThreshold) {
        const reduction = (taxableIncome - litoData.incomeThreshold) * litoData.phaseOutRate;
        lito = Math.max(0, lito - reduction);
      }
    }

    // Seniors and Pensioners Tax Offset (not implemented for simplicity)
    const sapta = 0;

    // Total tax payable
    const totalTax = incomeTax + medicare + helpRepayment - lito - sapta;
    const takeHomePay = annualIncome - totalTax;
    const effectiveTaxRate = (totalTax / annualIncome) * 100;

    return {
      taxableIncome,
      incomeTax: Math.round(incomeTax),
      medicare: Math.round(medicare),
      helpRepayment: Math.round(helpRepayment),
      lito: Math.round(lito),
      totalTax: Math.round(totalTax),
      takeHomePay: Math.round(takeHomePay),
      effectiveTaxRate: effectiveTaxRate.toFixed(1),
      marginalRate: taxBracket.rate,
      weeklyPay: Math.round(takeHomePay / 52),
      fortnightlyPay: Math.round(takeHomePay / 26),
      monthlyPay: Math.round(takeHomePay / 12),
    };
  }, [annualIncome, hasHelpDebt, hasPrivateHealth, deductions]);

  // Chart data
  const pieData = useMemo(() => [
    { name: 'Take Home Pay', value: calculations.takeHomePay, color: '#22c55e' },
    { name: 'Income Tax', value: calculations.incomeTax, color: '#f97316' },
    { name: 'Medicare', value: calculations.medicare, color: '#ef4444' },
    ...(calculations.helpRepayment > 0 ? [{ name: 'HELP', value: calculations.helpRepayment, color: '#8b5cf6' }] : []),
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Income Details
                </CardTitle>
                <CardDescription>Enter your income information for 2024-25</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Annual Income */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="annualIncome" className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Annual Gross Income
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        id="annualIncome"
                        type="number"
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(Number(e.target.value))}
                        className="w-36 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[annualIncome]}
                    onValueChange={(value) => setAnnualIncome(value[0])}
                    min={0}
                    max={300000}
                    step={1000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>$300k</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="deductions" className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Tax Deductions
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Work-related expenses, donations, etc.</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        id="deductions"
                        type="number"
                        value={deductions}
                        onChange={(e) => setDeductions(Number(e.target.value))}
                        className="w-28 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[deductions]}
                    onValueChange={(value) => setDeductions(value[0])}
                    min={0}
                    max={50000}
                    step={500}
                  />
                </div>

                {/* Options */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base">Additional Options</Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* HELP Debt */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-sm font-medium">Have HELP/HECS Debt</div>
                          <div className="text-xs text-muted-foreground">Higher Education Loan</div>
                        </div>
                      </div>
                      <Switch
                        checked={hasHelpDebt}
                        onCheckedChange={setHasHelpDebt}
                      />
                    </div>

                    {/* Private Health */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="text-sm font-medium">Private Health Insurance</div>
                          <div className="text-xs text-muted-foreground">Avoid Medicare surcharge</div>
                        </div>
                      </div>
                      <Switch
                        checked={hasPrivateHealth}
                        onCheckedChange={setHasPrivateHealth}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Brackets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2024-25 Tax Brackets</CardTitle>
                <CardDescription>Australian individual income tax rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {taxBrackets2025.map((bracket, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        calculations.taxableIncome >= bracket.min && 
                        (bracket.max === null || calculations.taxableIncome <= bracket.max)
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {calculations.taxableIncome >= bracket.min && 
                         (bracket.max === null || calculations.taxableIncome <= bracket.max) && (
                          <Badge variant="default" className="text-xs">Your bracket</Badge>
                        )}
                        <span className="text-sm">
                          {bracket.min === 0 && bracket.max === 18200 
                            ? '$0 - $18,200'
                            : bracket.max === null
                              ? `$${bracket.min.toLocaleString()}+`
                              : `$${bracket.min.toLocaleString()} - $${bracket.max.toLocaleString()}`
                          }
                        </span>
                      </div>
                      <span className="font-medium">{bracket.rate}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {/* Main Result */}
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Annual Take Home Pay</CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  After tax and levies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {formatCurrency(calculations.takeHomePay)}
                </div>
                <div className="text-sm opacity-90">
                  Effective tax rate: {calculations.effectiveTaxRate}%
                </div>
              </CardContent>
            </Card>

            {/* Pay Frequency */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Pay</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Weekly</span>
                  <span className="font-medium">{formatCurrency(calculations.weeklyPay)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Fortnightly</span>
                  <span className="font-medium">{formatCurrency(calculations.fortnightlyPay)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Monthly</span>
                  <span className="font-medium">{formatCurrency(calculations.monthlyPay)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tax Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tax Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Taxable Income</span>
                  <span className="font-medium">{formatCurrency(calculations.taxableIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Income Tax</span>
                  <span className="font-medium text-orange-600">-{formatCurrency(calculations.incomeTax)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    Medicare Levy
                  </span>
                  <span className="font-medium text-red-500">-{formatCurrency(calculations.medicare)}</span>
                </div>
                {calculations.helpRepayment > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      HELP Repayment
                    </span>
                    <span className="font-medium text-purple-600">-{formatCurrency(calculations.helpRepayment)}</span>
                  </div>
                )}
                {calculations.lito > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Low Income Offset</span>
                    <span className="font-medium text-green-600">+{formatCurrency(calculations.lito)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 bg-muted rounded-lg px-3 mt-2">
                  <span className="font-semibold">Total Tax</span>
                  <span className="font-bold text-lg text-red-600">{formatCurrency(calculations.totalTax)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Marginal Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Marginal Tax Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {calculations.marginalRate}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Every extra dollar you earn is taxed at this rate
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Where Your Money Goes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: unknown) => (
                      <span style={{ color: (entry as {color: string}).color }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tax Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Super Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">
                Consider salary sacrificing into super. Contributions are taxed at 15% instead of your marginal rate of {calculations.marginalRate}%.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Tax Deductions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                Keep receipts for work-related expenses. Every $1 deduction saves you ${(calculations.marginalRate / 100).toFixed(2)} in tax.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Private Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700">
                {annualIncome > 93000 && !hasPrivateHealth 
                  ? `You may pay Medicare Levy Surcharge. Private health insurance could save you money.`
                  : `Private health insurance can help you avoid Medicare Levy Surcharge if your income rises.`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center">
          <Info className="h-3 w-3 inline mr-1" />
          This calculator uses 2024-25 Australian tax rates. Results are estimates only and don't include all tax offsets, 
          rebates, or individual circumstances. Consult a tax professional for advice specific to your situation.
        </div>
      </div>
    </TooltipProvider>
  );
}
