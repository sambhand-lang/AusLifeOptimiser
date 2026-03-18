"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { MapPin, ArrowLeftRight } from 'lucide-react';

const CITIES = [
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Canberra', 'Darwin'
];

type CityData = {
  rent: number;
  groceries: number;
  transport: number;
  ptCap: number;
  utilities: number;
  dining: number;
  coffee: number;
  gym: number;
  childcare: number;
  salary: number;
};

const cityDataMap: Record<string, CityData> = {
  'Sydney': { rent: 780, groceries: 560, transport: 217, ptCap: 50, utilities: 270, dining: 30, coffee: 5.5, gym: 78, childcare: 2500, salary: 90000 },
  'Melbourne': { rent: 575, groceries: 510, transport: 217, ptCap: 50, utilities: 250, dining: 26, coffee: 5.0, gym: 70, childcare: 2300, salary: 82000 },
  'Brisbane': { rent: 600, groceries: 520, transport: 180, ptCap: 45, utilities: 240, dining: 25, coffee: 4.8, gym: 65, childcare: 2100, salary: 78000 },
  'Perth': { rent: 580, groceries: 530, transport: 180, ptCap: 45, utilities: 230, dining: 24, coffee: 4.5, gym: 60, childcare: 2000, salary: 80000 },
  'Adelaide': { rent: 520, groceries: 500, transport: 160, ptCap: 40, utilities: 260, dining: 23, coffee: 4.5, gym: 55, childcare: 1900, salary: 75000 },
  'Hobart': { rent: 500, groceries: 540, transport: 150, ptCap: 35, utilities: 280, dining: 22, coffee: 4.8, gym: 60, childcare: 1800, salary: 72000 },
  'Canberra': { rent: 650, groceries: 550, transport: 180, ptCap: 48, utilities: 250, dining: 28, coffee: 5.2, gym: 75, childcare: 2400, salary: 88000 },
  'Darwin': { rent: 620, groceries: 580, transport: 160, ptCap: 40, utilities: 320, dining: 27, coffee: 5.5, gym: 70, childcare: 2200, salary: 85000 },
};

const CATEGORIES = [
  { key: 'rent', label: 'Rent (weekly)' },
  { key: 'groceries', label: 'Groceries (monthly)' },
  { key: 'transport', label: 'Transport (monthly)' },
  { key: 'ptCap', label: 'PT Weekly Cap' },
  { key: 'utilities', label: 'Utilities (monthly)' },
  { key: 'dining', label: 'Dining Out (per meal)' },
  { key: 'coffee', label: 'Coffee' },
  { key: 'gym', label: 'Gym (monthly)' },
  { key: 'childcare', label: 'Childcare (monthly)' },
  { key: 'salary', label: 'Median Salary (annual)' },
];

function formatCurrency(value: number) {
  const hasDecimal = value % 1 !== 0;
  return `$${hasDecimal ? value.toFixed(1) : value.toLocaleString()}`;
}

export function CostOfLivingTable() {
  const [cityA, setCityA] = useState('Sydney');
  const [cityB, setCityB] = useState('Melbourne');

  const dataA = cityDataMap[cityA];
  const dataB = cityDataMap[cityB];

  return (
    <Card className="border-emerald-200 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-6 w-6" />
            Compare Cities
          </CardTitle>
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-lg border border-white/20">
            <select 
              value={cityA} 
              onChange={(e) => setCityA(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {CITIES.map(c => <option key={c} value={c} className="text-slate-800">{c}</option>)}
            </select>
            <ArrowLeftRight className="h-4 w-4 text-emerald-200" />
            <select 
              value={cityB} 
              onChange={(e) => setCityB(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {CITIES.map(c => <option key={c} value={c} className="text-slate-800">{c}</option>)}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-emerald-50/50">
              <TableHead className="px-6 py-4 text-left font-bold text-slate-700">Category</TableHead>
              <TableHead className="px-6 py-4 text-center font-bold text-slate-700">{cityA}</TableHead>
              <TableHead className="px-6 py-4 text-center font-bold text-slate-700">{cityB}</TableHead>
              <TableHead className="px-6 py-4 text-center font-bold text-slate-700">Diff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CATEGORIES.map((cat, idx) => {
              const valA = dataA[cat.key as keyof CityData];
              const valB = dataB[cat.key as keyof CityData];
              const diff = valA - valB;
              const isPositive = diff > 0;
              const diffText = diff === 0 ? '$0' : `${isPositive ? '+' : '-'}$${Math.abs(diff).toLocaleString()}`;
              
              return (
                <TableRow key={idx} className="hover:bg-emerald-50/30 transition-colors">
                  <TableCell className="px-6 py-4 font-medium text-slate-600">{cat.label}</TableCell>
                  <TableCell className="px-6 py-4 text-center text-slate-800 font-semibold">{formatCurrency(valA)}</TableCell>
                  <TableCell className="px-6 py-4 text-center text-slate-800 font-semibold">{formatCurrency(valB)}</TableCell>
                  <TableCell className={`px-6 py-4 text-center font-bold ${diff === 0 ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {diffText}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default CostOfLivingTable;
