"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Wallet, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RentAffordabilityCalculator() {
  const [annualIncome, setAnnualIncome] = useState<number>(90000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(2000);
  const [affordableRent, setAffordableRent] = useState<number>(0);

  useEffect(() => {
    // Calculat monthly take home (rough estimate)
    const monthlyGross = annualIncome / 12;
    // 30% of gross rule of thumb
    const recommendedRent = monthlyGross * 0.3;
    setAffordableRent(Math.round(recommendedRent));
  }, [annualIncome]);

  const weeklyRent = Math.round((affordableRent * 12) / 52);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="pb-3 text-emerald-800">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Income & Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 block">Annual Gross Income ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 block">Monthly Non-Rent Expenses ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <DollarSign className="h-24 w-24" />
          </div>
          <CardContent className="pt-8">
            <div className="space-y-6">
              <div>
                <span className="text-emerald-100 font-medium">Affordable Weekly Rent</span>
                <div className="text-5xl font-bold mt-1">${weeklyRent}</div>
              </div>
              <div className="pt-4 border-t border-emerald-500/30 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-xs text-emerald-100">Recommended Monthly</span>
                  <div className="text-xl font-bold">${affordableRent}</div>
                </div>
                <Badge className="bg-emerald-400/20 text-white border-white/20">30% Rule</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-100 bg-amber-50/50">
        <CardContent className="p-4 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">Rental Stress Warning:</span> Most lenders and experts consider you under 
            "rental stress" if you pay more than <span className="font-bold">30%</span> of your gross income towards housing costs.
            With your current income, that is <span className="font-bold text-lg">${weeklyRent}/wk</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default RentAffordabilityCalculator;
