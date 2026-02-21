import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { currentInterestRates } from '@/data/australianFinancialData';
import { 
  DollarSign, 
  Calendar, 
  Percent, 
  TrendingDown, 
  TrendingUp,
  Info,
  Home,
  Clock,
  PiggyBank
} from 'lucide-react';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface RepaymentSchedule {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

export function HomeLoanCalculator() {
  const [loanAmount, setLoanAmount] = useState<number>(600000);
  const [interestRate, setInterestRate] = useState<number>(currentInterestRates.averageVariableRate);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [repaymentType, setRepaymentType] = useState<'principal_interest' | 'interest_only'>('principal_interest');
  const [repaymentFrequency, setRepaymentFrequency] = useState<'monthly' | 'fortnightly' | 'weekly'>('monthly');
  const [extraRepayment, setExtraRepayment] = useState<number>(0);
  const [showExtraRepayment, setShowExtraRepayment] = useState<boolean>(false);

  // Calculate repayments
  const calculations = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTerm * 12;
    
    let regularRepayment = 0;
    let totalInterest = 0;
    let totalCost = 0;
    const schedule: RepaymentSchedule[] = [];

    if (repaymentType === 'principal_interest') {
      if (monthlyRate === 0) {
        regularRepayment = loanAmount / totalPayments;
      } else {
        regularRepayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);
      }

      let balance = loanAmount;
      let totalInterestPaid = 0;
      
      schedule.push({ year: 0, principal: 0, interest: 0, balance });

      for (let year = 1; year <= loanTerm; year++) {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;

        for (let month = 0; month < 12; month++) {
          if (balance <= 0) break;
          
          const interestPayment = balance * monthlyRate;
          const principalPayment = regularRepayment - interestPayment + extraRepayment;
          
          if (balance - principalPayment < 0) {
            yearlyPrincipal += balance;
            balance = 0;
          } else {
            yearlyPrincipal += principalPayment;
            balance -= principalPayment;
          }
          
          yearlyInterest += interestPayment;
          totalInterestPaid += interestPayment;
        }

        schedule.push({
          year,
          principal: Math.round(yearlyPrincipal),
          interest: Math.round(yearlyInterest),
          balance: Math.round(balance),
        });
      }

      totalInterest = totalInterestPaid;
      totalCost = loanAmount + totalInterest;
    } else {
      regularRepayment = loanAmount * monthlyRate;
      totalInterest = regularRepayment * totalPayments;
      totalCost = loanAmount + totalInterest;
      
      for (let year = 0; year <= loanTerm; year++) {
        schedule.push({
          year,
          principal: year === loanTerm ? loanAmount : 0,
          interest: Math.round(regularRepayment * 12),
          balance: year === loanTerm ? 0 : loanAmount,
        });
      }
    }

    let displayRepayment = regularRepayment;
    if (repaymentFrequency === 'fortnightly') {
      displayRepayment = (regularRepayment * 12) / 26;
    } else if (repaymentFrequency === 'weekly') {
      displayRepayment = (regularRepayment * 12) / 52;
    }

    return {
      regularRepayment: displayRepayment,
      totalInterest,
      totalCost,
      schedule,
    };
  }, [loanAmount, interestRate, loanTerm, repaymentType, repaymentFrequency, extraRepayment]);

  // Calculate time saved
  const timeSaved = useMemo(() => {
    if (!showExtraRepayment || extraRepayment === 0 || repaymentType === 'interest_only') {
      return { years: 0, months: 0 };
    }

    const monthlyRate = interestRate / 100 / 12;
    const regularRepayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm * 12)) / 
                            (Math.pow(1 + monthlyRate, loanTerm * 12) - 1);
    const totalRepayment = regularRepayment + extraRepayment;

    let balance = loanAmount;
    let months = 0;

    while (balance > 0 && months < loanTerm * 12) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = totalRepayment - interestPayment;
      balance -= principalPayment;
      months++;
    }

    const originalMonths = loanTerm * 12;
    const savedMonths = originalMonths - months;

    return {
      years: Math.floor(savedMonths / 12),
      months: savedMonths % 12,
    };
  }, [loanAmount, interestRate, loanTerm, extraRepayment, showExtraRepayment, repaymentType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatFrequency = () => {
    switch (repaymentFrequency) {
      case 'fortnightly': return 'fortnight';
      case 'weekly': return 'week';
      default: return 'month';
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Loan Details</CardTitle>
                    <CardDescription>Enter your loan information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Loan Amount */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="loanAmount" className="text-base font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      Loan Amount
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500 font-medium">$</span>
                      <Input
                        id="loanAmount"
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-36 text-right font-semibold border-slate-200 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[loanAmount]}
                    onValueChange={(value) => setLoanAmount(value[0])}
                    min={100000}
                    max={5000000}
                    step={10000}
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>$100k</span>
                    <span>$2.5M</span>
                    <span>$5M</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="interestRate" className="text-base font-semibold flex items-center gap-2">
                      <Percent className="h-4 w-4 text-emerald-600" />
                      Interest Rate
                      <Badge variant="outline" className="text-xs font-normal">
                        Avg: {currentInterestRates.averageVariableRate}%
                      </Badge>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="interestRate"
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-24 text-right font-semibold border-slate-200 focus:border-emerald-500"
                        step={0.01}
                      />
                      <span className="text-sm text-slate-500 font-medium">%</span>
                    </div>
                  </div>
                  <Slider
                    value={[interestRate]}
                    onValueChange={(value) => setInterestRate(value[0])}
                    min={1}
                    max={10}
                    step={0.01}
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>1%</span>
                    <span>5%</span>
                    <span>10%</span>
                  </div>
                </div>

                {/* Loan Term */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="loanTerm" className="text-base font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      Loan Term
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="loanTerm"
                        type="number"
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                        className="w-20 text-right font-semibold border-slate-200 focus:border-emerald-500"
                      />
                      <span className="text-sm text-slate-500 font-medium">years</span>
                    </div>
                  </div>
                  <Slider
                    value={[loanTerm]}
                    onValueChange={(value) => setLoanTerm(value[0])}
                    min={5}
                    max={40}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>5 yrs</span>
                    <span>20 yrs</span>
                    <span>40 yrs</span>
                  </div>
                </div>

                {/* Repayment Type */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Repayment Type</Label>
                  <Tabs value={repaymentType} onValueChange={(v) => setRepaymentType(v as 'principal_interest' | 'interest_only')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="principal_interest">Principal & Interest</TabsTrigger>
                      <TabsTrigger value="interest_only">Interest Only</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Repayment Frequency */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Repayment Frequency</Label>
                  <Tabs value={repaymentFrequency} onValueChange={(v) => setRepaymentFrequency(v as 'monthly' | 'fortnightly' | 'weekly')}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                      <TabsTrigger value="fortnightly">Fortnightly</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Extra Repayments */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <PiggyBank className="h-4 w-4 text-emerald-600" />
                      Extra Repayments
                    </Label>
                    <Switch
                      checked={showExtraRepayment}
                      onCheckedChange={setShowExtraRepayment}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                  {showExtraRepayment && (
                    <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="extraRepayment" className="text-sm text-slate-600">Extra per month</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">$</span>
                          <Input
                            id="extraRepayment"
                            type="number"
                            value={extraRepayment}
                            onChange={(e) => setExtraRepayment(Number(e.target.value))}
                            className="w-28 text-right font-semibold border-slate-200 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <Slider
                        value={[extraRepayment]}
                        onValueChange={(value) => setExtraRepayment(value[0])}
                        min={0}
                        max={5000}
                        step={50}
                      />
                      {(timeSaved.years > 0 || timeSaved.months > 0) && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-emerald-600" />
                            <span className="font-semibold text-emerald-800">Time Saved</span>
                          </div>
                          <p className="text-emerald-700">
                            You'll save{' '}
                            <span className="font-bold text-lg">
                              {timeSaved.years > 0 ? `${timeSaved.years} year${timeSaved.years > 1 ? 's' : ''}` : ''}
                              {timeSaved.years > 0 && timeSaved.months > 0 ? ' and ' : ''}
                              {timeSaved.months > 0 ? `${timeSaved.months} month${timeSaved.months > 1 ? 's' : ''}` : ''}
                            </span>
                            {' '}on your loan term
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Main Result Card */}
            <Card className="border-0 shadow-xl shadow-emerald-200/50 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-400" />
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500 font-medium mb-2">
                    {formatFrequency().charAt(0).toUpperCase() + formatFrequency().slice(1)}ly Repayment
                  </p>
                  <div className="text-4xl font-bold text-gradient mb-2">
                    {formatCurrency(calculations.regularRepayment)}
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    {repaymentType === 'principal_interest' ? 'Principal & Interest' : 'Interest Only'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="text-slate-600 font-medium">Total Interest</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      {formatCurrency(calculations.totalInterest)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg shadow-slate-200/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="text-slate-600 font-medium">Total Cost</span>
                    </div>
                    <span className="text-xl font-bold text-slate-800">
                      {formatCurrency(calculations.totalCost)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card className="border-0 shadow-xl shadow-slate-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-emerald-600" />
                  Loan Balance Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={calculations.schedule}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="year" 
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(value) => `Y${value}`}
                      />
                      <YAxis 
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Principal vs Interest Chart */}
            <Card className="border-0 shadow-xl shadow-slate-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="h-5 w-5 text-emerald-600" />
                  Principal vs Interest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={calculations.schedule.filter((_, i) => i % 2 === 0)}>
                      <defs>
                        <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="year" 
                        stroke="#94a3b8"
                        fontSize={11}
                      />
                      <YAxis 
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="principal"
                        name="Principal"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#colorPrincipal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="interest"
                        name="Interest"
                        stroke="#f97316"
                        strokeWidth={2}
                        fill="url(#colorInterest)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-slate-600">Principal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-slate-600">Interest</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 text-sm text-slate-500 bg-slate-50 rounded-xl p-4">
          <Info className="h-5 w-5 flex-shrink-0 text-slate-400 mt-0.5" />
          <p>
            This calculator provides estimates only. Actual repayments may vary based on your lender's fees, 
            charges, and specific loan terms. Always consult with a licensed mortgage broker or financial advisor.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
