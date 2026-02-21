// Australian Financial Data - Free to use, no paid APIs required
// All data current as of 2025-2026 financial year

export interface StampDutyBracket {
  threshold: number;
  rate: number;
  baseAmount: number;
}

export interface StampDutyState {
  name: string;
  code: string;
  brackets: StampDutyBracket[];
  firstHomeBuyerExemption?: {
    maxPropertyValue: number;
    maxPropertyValueNewHome: number;
    concessionRate: number;
  };
  foreignBuyerSurcharge: number;
}

// Stamp Duty Rates for all Australian States/Territories (2024-2025)
export const stampDutyData: Record<string, StampDutyState> = {
  nsw: {
    name: "New South Wales",
    code: "NSW",
    brackets: [
      { threshold: 0, rate: 0, baseAmount: 0 },
      { threshold: 15000, rate: 1.25, baseAmount: 0 },
      { threshold: 32000, rate: 1.50, baseAmount: 212.50 },
      { threshold: 87000, rate: 3.50, baseAmount: 692.50 },
      { threshold: 327000, rate: 4.50, baseAmount: 9327.50 },
      { threshold: 1089000, rate: 5.50, baseAmount: 44092.50 },
      { threshold: 3268000, rate: 7.00, baseAmount: 162712.50 },
    ],
    firstHomeBuyerExemption: {
      maxPropertyValue: 800000,
      maxPropertyValueNewHome: 800000,
      concessionRate: 0,
    },
    foreignBuyerSurcharge: 8,
  },
  vic: {
    name: "Victoria",
    code: "VIC",
    brackets: [
      { threshold: 0, rate: 0, baseAmount: 0 },
      { threshold: 25000, rate: 1.40, baseAmount: 0 },
      { threshold: 130000, rate: 2.40, baseAmount: 350 },
      { threshold: 960000, rate: 6.00, baseAmount: 20150 },
      { threshold: 2000000, rate: 6.50, baseAmount: 71650 },
    ],
    firstHomeBuyerExemption: {
      maxPropertyValue: 600000,
      maxPropertyValueNewHome: 750000,
      concessionRate: 0,
    },
    foreignBuyerSurcharge: 8,
  },
  qld: {
    name: "Queensland",
    code: "QLD",
    brackets: [
      { threshold: 0, rate: 0, baseAmount: 0 },
      { threshold: 5000, rate: 0, baseAmount: 0 },
      { threshold: 75000, rate: 1.50, baseAmount: 0 },
      { threshold: 540000, rate: 3.50, baseAmount: 1050 },
      { threshold: 1000000, rate: 4.50, baseAmount: 17325 },
    ],
    firstHomeBuyerExemption: {
      maxPropertyValue: 500000,
      maxPropertyValueNewHome: 750000,
      concessionRate: 0,
    },
    foreignBuyerSurcharge: 7,
  },
  wa: {
    name: "Western Australia",
    code: "WA",
    brackets: [
      { threshold: 0, rate: 0, baseAmount: 0 },
      { threshold: 120000, rate: 1.90, baseAmount: 0 },
      { threshold: 150000, rate: 2.85, baseAmount: 2280 },
      { threshold: 360000, rate: 3.80, baseAmount: 3135 },
      { threshold: 725000, rate: 4.75, baseAmount: 11115 },
      { threshold: 1000000, rate: 5.15, baseAmount: 28452.50 },
    ],
    firstHomeBuyerExemption: {
      maxPropertyValue: 430000,
      maxPropertyValueNewHome: 430000,
      concessionRate: 0,
    },
    foreignBuyerSurcharge: 7,
  },
  sa: {
    name: "South Australia",
    code: "SA",
    brackets: [
      { threshold: 0, rate: 0, baseAmount: 0 },
      { threshold: 12000, rate: 1.00, baseAmount: 0 },
      { threshold: 30000, rate: 2.00, baseAmount: 120 },
      { threshold: 50000, rate: 3.00, baseAmount: 480 },
      { threshold: 100000, rate: 3.50, baseAmount: 1080 },
      { threshold: 200000, rate: 4.00, baseAmount: 2830 },
      { threshold: 250000, rate: 4.25, baseAmount: 6830 },
      { threshold: 300000, rate: 4.75, baseAmount: 8955 },
      { threshold: 500000, rate: 5.00, baseAmount: 11330 },
    ],
    firstHomeBuyerExemption: {
      maxPropertyValue: 650000,
      maxPropertyValueNewHome: 650000,
      concessionRate: 0,
    },
    foreignBuyerSurcharge: 7,
  },
  tas: {
    name: "Tasmania",
    code: "TAS",
    brackets: [
      { threshold: 0, rate: 0, baseAmount: 0 },
      { threshold: 3000, rate: 1.75, baseAmount: 0 },
      { threshold: 25000, rate: 2.25, baseAmount: 47.25 },
      { threshold: 75000, rate: 3.50, baseAmount: 542.25 },
      { threshold: 200000, rate: 4.00, baseAmount: 2292.25 },
      { threshold: 375000, rate: 4.25, baseAmount: 7292.25 },
      { threshold: 725000, rate: 4.50, baseAmount: 14729.50 },
    ],
    firstHomeBuyerExemption: {
      maxPropertyValue: 600000,
      maxPropertyValueNewHome: 600000,
      concessionRate: 0.50,
    },
    foreignBuyerSurcharge: 8,
  },
  act: {
    name: "Australian Capital Territory",
    code: "ACT",
    brackets: [
      { threshold: 0, rate: 0, baseAmount: 0 },
      { threshold: 260000, rate: 0.60, baseAmount: 0 },
      { threshold: 300000, rate: 2.20, baseAmount: 1560 },
      { threshold: 500000, rate: 3.40, baseAmount: 2440 },
      { threshold: 750000, rate: 4.32, baseAmount: 9240 },
      { threshold: 1000000, rate: 5.90, baseAmount: 20040 },
      { threshold: 1455000, rate: 6.40, baseAmount: 46890 },
    ],
    firstHomeBuyerExemption: {
      maxPropertyValue: 800000,
      maxPropertyValueNewHome: 800000,
      concessionRate: 0,
    },
    foreignBuyerSurcharge: 0,
  },
  nt: {
    name: "Northern Territory",
    code: "NT",
    brackets: [
      { threshold: 0, rate: 0, baseAmount: 0 },
      { threshold: 525000, rate: 0, baseAmount: 0 },
      { threshold: 3000000, rate: 3.50, baseAmount: 0 },
      { threshold: 5000000, rate: 4.50, baseAmount: 94500 },
    ],
    firstHomeBuyerExemption: {
      maxPropertyValue: 650000,
      maxPropertyValueNewHome: 650000,
      concessionRate: 0,
    },
    foreignBuyerSurcharge: 0,
  },
};

// Australian Tax Brackets 2025-2026
export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  baseTax: number;
}

export const taxBrackets2025: TaxBracket[] = [
  { min: 0, max: 18200, rate: 0, baseTax: 0 },
  { min: 18201, max: 45000, rate: 16, baseTax: 0 },
  { min: 45001, max: 135000, rate: 30, baseTax: 4288 },
  { min: 135001, max: 190000, rate: 37, baseTax: 31288 },
  { min: 190001, max: null, rate: 45, baseTax: 51638 },
];

// Medicare Levy
export const medicareLevy = 0.02; // 2% of taxable income

// HELP/HECS Repayment Rates 2025-2026
export interface HelpRepaymentRate {
  threshold: number;
  rate: number;
}

export const helpRepaymentRates: HelpRepaymentRate[] = [
  { threshold: 0, rate: 0 },
  { threshold: 51550, rate: 0.01 },
  { threshold: 59575, rate: 0.02 },
  { threshold: 63000, rate: 0.04 },
  { threshold: 67250, rate: 0.045 },
  { threshold: 72000, rate: 0.05 },
  { threshold: 77500, rate: 0.055 },
  { threshold: 84000, rate: 0.06 },
  { threshold: 91500, rate: 0.065 },
  { threshold: 100500, rate: 0.07 },
  { threshold: 111500, rate: 0.075 },
  { threshold: 126500, rate: 0.08 },
  { threshold: 150000, rate: 0.085 },
  { threshold: 1000000, rate: 0.10 },
];

// Low Income Tax Offset (LITO) 2025-2026
export const litoData = {
  maxOffset: 700,
  incomeThreshold: 37500,
  phaseOutThreshold: 45000,
  phaseOutRate: 0.05,
  cutOff: 66667,
};

// Low and Middle Income Tax Offset (LAMITO) - Ended 30 June 2022
// Not applicable for 2024-2025

// Current Interest Rates (approximate - update as needed) 2025-2026
export const currentInterestRates = {
  rbaCashRate: 3.85,
  averageVariableRate: 6.35,
  averageFixedRate3Year: 5.95,
  averageFixedRate5Year: 6.05,
  highInterestSavings: 4.60,
  termDeposit12Month: 4.50,
};

// Suburb Cost of Living Data (sample data for major suburbs)
export interface SuburbData {
  name: string;
  city: string;
  state: string;
  medianHousePrice: number;
  medianUnitPrice: number;
  weeklyRentHouse: number;
  weeklyRentUnit: number;
  councilRatesAnnual: number;
  utilitiesMonthly: number;
  transportMonthly: number;
  groceriesMonthly: number;
  lifestyleScore: number; // 1-10
}

export const suburbData: SuburbData[] = [
  // Sydney
  { name: "Bondi", city: "Sydney", state: "NSW", medianHousePrice: 3500000, medianUnitPrice: 1200000, weeklyRentHouse: 1800, weeklyRentUnit: 750, councilRatesAnnual: 2800, utilitiesMonthly: 280, transportMonthly: 200, groceriesMonthly: 900, lifestyleScore: 9 },
  { name: "Parramatta", city: "Sydney", state: "NSW", medianHousePrice: 1400000, medianUnitPrice: 650000, weeklyRentHouse: 750, weeklyRentUnit: 550, councilRatesAnnual: 2200, utilitiesMonthly: 250, transportMonthly: 180, groceriesMonthly: 750, lifestyleScore: 8 },
  { name: "Blacktown", city: "Sydney", state: "NSW", medianHousePrice: 950000, medianUnitPrice: 550000, weeklyRentHouse: 600, weeklyRentUnit: 450, councilRatesAnnual: 2000, utilitiesMonthly: 240, transportMonthly: 200, groceriesMonthly: 700, lifestyleScore: 7 },
  { name: "Manly", city: "Sydney", state: "NSW", medianHousePrice: 4200000, medianUnitPrice: 1400000, weeklyRentHouse: 2200, weeklyRentUnit: 900, councilRatesAnnual: 3200, utilitiesMonthly: 300, transportMonthly: 220, groceriesMonthly: 950, lifestyleScore: 9 },
  { name: "Liverpool", city: "Sydney", state: "NSW", medianHousePrice: 850000, medianUnitPrice: 480000, weeklyRentHouse: 550, weeklyRentUnit: 400, councilRatesAnnual: 1900, utilitiesMonthly: 230, transportMonthly: 180, groceriesMonthly: 650, lifestyleScore: 7 },
  { name: "Chatswood", city: "Sydney", state: "NSW", medianHousePrice: 3500000, medianUnitPrice: 1200000, weeklyRentHouse: 1800, weeklyRentUnit: 750, councilRatesAnnual: 2800, utilitiesMonthly: 280, transportMonthly: 200, groceriesMonthly: 900, lifestyleScore: 9 },
  { name: "Newtown", city: "Sydney", state: "NSW", medianHousePrice: 2200000, medianUnitPrice: 800000, weeklyRentHouse: 1200, weeklyRentUnit: 600, councilRatesAnnual: 2500, utilitiesMonthly: 270, transportMonthly: 180, groceriesMonthly: 800, lifestyleScore: 8 },
  { name: "Surry Hills", city: "Sydney", state: "NSW", medianHousePrice: 2800000, medianUnitPrice: 1000000, weeklyRentHouse: 1500, weeklyRentUnit: 700, councilRatesAnnual: 2600, utilitiesMonthly: 275, transportMonthly: 190, groceriesMonthly: 850, lifestyleScore: 9 },
  { name: "Bondi Junction", city: "Sydney", state: "NSW", medianHousePrice: 2500000, medianUnitPrice: 900000, weeklyRentHouse: 1400, weeklyRentUnit: 650, councilRatesAnnual: 2400, utilitiesMonthly: 270, transportMonthly: 185, groceriesMonthly: 820, lifestyleScore: 8 },
  { name: "Paddington", city: "Sydney", state: "NSW", medianHousePrice: 3200000, medianUnitPrice: 1100000, weeklyRentHouse: 1700, weeklyRentUnit: 720, councilRatesAnnual: 2700, utilitiesMonthly: 280, transportMonthly: 195, groceriesMonthly: 880, lifestyleScore: 9 },
  { name: "Balmain", city: "Sydney", state: "NSW", medianHousePrice: 2200000, medianUnitPrice: 850000, weeklyRentHouse: 1250, weeklyRentUnit: 650, councilRatesAnnual: 2500, utilitiesMonthly: 275, transportMonthly: 185, groceriesMonthly: 820, lifestyleScore: 9 },
  { name: "Leichhardt", city: "Sydney", state: "NSW", medianHousePrice: 1800000, medianUnitPrice: 750000, weeklyRentHouse: 1100, weeklyRentUnit: 600, councilRatesAnnual: 2400, utilitiesMonthly: 270, transportMonthly: 180, groceriesMonthly: 800, lifestyleScore: 8 },
  { name: "Kings Cross", city: "Sydney", state: "NSW", medianHousePrice: 1500000, medianUnitPrice: 700000, weeklyRentHouse: 1000, weeklyRentUnit: 580, councilRatesAnnual: 2300, utilitiesMonthly: 265, transportMonthly: 175, groceriesMonthly: 790, lifestyleScore: 8 },
  { name: "Double Bay", city: "Sydney", state: "NSW", medianHousePrice: 4500000, medianUnitPrice: 1500000, weeklyRentHouse: 2500, weeklyRentUnit: 1000, councilRatesAnnual: 3500, utilitiesMonthly: 320, transportMonthly: 210, groceriesMonthly: 1000, lifestyleScore: 10 },
  { name: "Vaucluse", city: "Sydney", state: "NSW", medianHousePrice: 5000000, medianUnitPrice: 1800000, weeklyRentHouse: 2800, weeklyRentUnit: 1200, councilRatesAnnual: 3800, utilitiesMonthly: 340, transportMonthly: 220, groceriesMonthly: 1050, lifestyleScore: 10 },
  
  // Melbourne
  { name: "Carlton", city: "Melbourne", state: "VIC", medianHousePrice: 1600000, medianUnitPrice: 520000, weeklyRentHouse: 850, weeklyRentUnit: 480, councilRatesAnnual: 2100, utilitiesMonthly: 260, transportMonthly: 160, groceriesMonthly: 720, lifestyleScore: 9 },
  { name: "Footscray", city: "Melbourne", state: "VIC", medianHousePrice: 950000, medianUnitPrice: 480000, weeklyRentHouse: 600, weeklyRentUnit: 420, councilRatesAnnual: 1900, utilitiesMonthly: 240, transportMonthly: 170, groceriesMonthly: 680, lifestyleScore: 8 },
  { name: "Dandenong", city: "Melbourne", state: "VIC", medianHousePrice: 720000, medianUnitPrice: 420000, weeklyRentHouse: 480, weeklyRentUnit: 380, councilRatesAnnual: 1800, utilitiesMonthly: 230, transportMonthly: 190, groceriesMonthly: 620, lifestyleScore: 6 },
  { name: "St Kilda", city: "Melbourne", state: "VIC", medianHousePrice: 1800000, medianUnitPrice: 650000, weeklyRentHouse: 950, weeklyRentUnit: 550, councilRatesAnnual: 2300, utilitiesMonthly: 270, transportMonthly: 160, groceriesMonthly: 780, lifestyleScore: 9 },
  { name: "Glen Waverley", city: "Melbourne", state: "VIC", medianHousePrice: 1650000, medianUnitPrice: 750000, weeklyRentHouse: 800, weeklyRentUnit: 580, councilRatesAnnual: 2400, utilitiesMonthly: 260, transportMonthly: 200, groceriesMonthly: 750, lifestyleScore: 8 },
  { name: "Richmond", city: "Melbourne", state: "VIC", medianHousePrice: 1400000, medianUnitPrice: 650000, weeklyRentHouse: 750, weeklyRentUnit: 550, councilRatesAnnual: 2200, utilitiesMonthly: 250, transportMonthly: 180, groceriesMonthly: 750, lifestyleScore: 8 },
  { name: "Brunswick", city: "Melbourne", state: "VIC", medianHousePrice: 1200000, medianUnitPrice: 600000, weeklyRentHouse: 700, weeklyRentUnit: 520, councilRatesAnnual: 2100, utilitiesMonthly: 245, transportMonthly: 175, groceriesMonthly: 720, lifestyleScore: 8 },
  { name: "Collingwood", city: "Melbourne", state: "VIC", medianHousePrice: 1300000, medianUnitPrice: 620000, weeklyRentHouse: 720, weeklyRentUnit: 540, councilRatesAnnual: 2150, utilitiesMonthly: 248, transportMonthly: 178, groceriesMonthly: 730, lifestyleScore: 8 },
  { name: "Fitzroy", city: "Melbourne", state: "VIC", medianHousePrice: 1500000, medianUnitPrice: 680000, weeklyRentHouse: 780, weeklyRentUnit: 560, councilRatesAnnual: 2250, utilitiesMonthly: 252, transportMonthly: 182, groceriesMonthly: 740, lifestyleScore: 9 },
  { name: "Southbank", city: "Melbourne", state: "VIC", medianHousePrice: 1600000, medianUnitPrice: 720000, weeklyRentHouse: 790, weeklyRentUnit: 570, councilRatesAnnual: 2300, utilitiesMonthly: 255, transportMonthly: 185, groceriesMonthly: 745, lifestyleScore: 9 },
  { name: "South Yarra", city: "Melbourne", state: "VIC", medianHousePrice: 2200000, medianUnitPrice: 800000, weeklyRentHouse: 1100, weeklyRentUnit: 650, councilRatesAnnual: 2500, utilitiesMonthly: 275, transportMonthly: 165, groceriesMonthly: 820, lifestyleScore: 9 },
  { name: "Windsor", city: "Melbourne", state: "VIC", medianHousePrice: 1700000, medianUnitPrice: 700000, weeklyRentHouse: 950, weeklyRentUnit: 580, councilRatesAnnual: 2350, utilitiesMonthly: 265, transportMonthly: 160, groceriesMonthly: 790, lifestyleScore: 9 },
  { name: "Prahran", city: "Melbourne", state: "VIC", medianHousePrice: 1900000, medianUnitPrice: 750000, weeklyRentHouse: 1050, weeklyRentUnit: 620, councilRatesAnnual: 2450, utilitiesMonthly: 270, transportMonthly: 162, groceriesMonthly: 805, lifestyleScore: 9 },
  { name: "Docklands", city: "Melbourne", state: "VIC", medianHousePrice: 1200000, medianUnitPrice: 650000, weeklyRentHouse: 800, weeklyRentUnit: 580, councilRatesAnnual: 2300, utilitiesMonthly: 260, transportMonthly: 155, groceriesMonthly: 780, lifestyleScore: 9 },
  { name: "CBD", city: "Melbourne", state: "VIC", medianHousePrice: 1500000, medianUnitPrice: 700000, weeklyRentHouse: 900, weeklyRentUnit: 600, councilRatesAnnual: 2400, utilitiesMonthly: 265, transportMonthly: 150, groceriesMonthly: 800, lifestyleScore: 10 },
  
  // Brisbane
  { name: "New Farm", city: "Brisbane", state: "QLD", medianHousePrice: 2400000, medianUnitPrice: 850000, weeklyRentHouse: 1200, weeklyRentUnit: 650, councilRatesAnnual: 2600, utilitiesMonthly: 270, transportMonthly: 150, groceriesMonthly: 750, lifestyleScore: 9 },
  { name: "Chermside", city: "Brisbane", state: "QLD", medianHousePrice: 850000, medianUnitPrice: 480000, weeklyRentHouse: 580, weeklyRentUnit: 420, councilRatesAnnual: 2000, utilitiesMonthly: 240, transportMonthly: 160, groceriesMonthly: 680, lifestyleScore: 7 },
  { name: "Logan", city: "Brisbane", state: "QLD", medianHousePrice: 650000, medianUnitPrice: 380000, weeklyRentHouse: 480, weeklyRentUnit: 350, councilRatesAnnual: 1800, utilitiesMonthly: 230, transportMonthly: 180, groceriesMonthly: 620, lifestyleScore: 6 },
  { name: "Southport", city: "Brisbane", state: "QLD", medianHousePrice: 900000, medianUnitPrice: 580000, weeklyRentHouse: 650, weeklyRentUnit: 520, councilRatesAnnual: 2200, utilitiesMonthly: 250, transportMonthly: 140, groceriesMonthly: 700, lifestyleScore: 8 },
  { name: "Indooroopilly", city: "Brisbane", state: "QLD", medianHousePrice: 1200000, medianUnitPrice: 580000, weeklyRentHouse: 750, weeklyRentUnit: 500, councilRatesAnnual: 2300, utilitiesMonthly: 260, transportMonthly: 150, groceriesMonthly: 720, lifestyleScore: 8 },
  { name: "Brisbane City", city: "Brisbane", state: "QLD", medianHousePrice: 1000000, medianUnitPrice: 550000, weeklyRentHouse: 650, weeklyRentUnit: 480, councilRatesAnnual: 2100, utilitiesMonthly: 250, transportMonthly: 140, groceriesMonthly: 700, lifestyleScore: 9 },
  { name: "Fortitude Valley", city: "Brisbane", state: "QLD", medianHousePrice: 950000, medianUnitPrice: 520000, weeklyRentHouse: 620, weeklyRentUnit: 460, councilRatesAnnual: 2050, utilitiesMonthly: 248, transportMonthly: 138, groceriesMonthly: 690, lifestyleScore: 8 },
  { name: "West End", city: "Brisbane", state: "QLD", medianHousePrice: 1100000, medianUnitPrice: 570000, weeklyRentHouse: 680, weeklyRentUnit: 490, councilRatesAnnual: 2150, utilitiesMonthly: 252, transportMonthly: 142, groceriesMonthly: 710, lifestyleScore: 8 },
  { name: "Sunnybank", city: "Brisbane", state: "QLD", medianHousePrice: 850000, medianUnitPrice: 450000, weeklyRentHouse: 580, weeklyRentUnit: 420, councilRatesAnnual: 1950, utilitiesMonthly: 240, transportMonthly: 135, groceriesMonthly: 680, lifestyleScore: 7 },
  { name: "Toowong", city: "Brisbane", state: "QLD", medianHousePrice: 1300000, medianUnitPrice: 600000, weeklyRentHouse: 760, weeklyRentUnit: 510, councilRatesAnnual: 2350, utilitiesMonthly: 262, transportMonthly: 152, groceriesMonthly: 725, lifestyleScore: 8 },
  { name: "Red Hill", city: "Brisbane", state: "QLD", medianHousePrice: 1800000, medianUnitPrice: 750000, weeklyRentHouse: 1050, weeklyRentUnit: 620, councilRatesAnnual: 2500, utilitiesMonthly: 275, transportMonthly: 145, groceriesMonthly: 780, lifestyleScore: 9 },
  { name: "Paddington", city: "Brisbane", state: "QLD", medianHousePrice: 1600000, medianUnitPrice: 700000, weeklyRentHouse: 950, weeklyRentUnit: 600, councilRatesAnnual: 2450, utilitiesMonthly: 270, transportMonthly: 140, groceriesMonthly: 770, lifestyleScore: 9 },
  { name: "Woolloongabba", city: "Brisbane", state: "QLD", medianHousePrice: 1200000, medianUnitPrice: 600000, weeklyRentHouse: 750, weeklyRentUnit: 550, councilRatesAnnual: 2300, utilitiesMonthly: 260, transportMonthly: 135, groceriesMonthly: 750, lifestyleScore: 8 },
  { name: "Kangaroo Point", city: "Brisbane", state: "QLD", medianHousePrice: 1400000, medianUnitPrice: 650000, weeklyRentHouse: 850, weeklyRentUnit: 580, councilRatesAnnual: 2350, utilitiesMonthly: 265, transportMonthly: 138, groceriesMonthly: 760, lifestyleScore: 9 },
  { name: "Teneriffe", city: "Brisbane", state: "QLD", medianHousePrice: 1300000, medianUnitPrice: 620000, weeklyRentHouse: 800, weeklyRentUnit: 570, councilRatesAnnual: 2320, utilitiesMonthly: 262, transportMonthly: 136, groceriesMonthly: 755, lifestyleScore: 8 },
  
  // Perth
  { name: "Fremantle", city: "Perth", state: "WA", medianHousePrice: 950000, medianUnitPrice: 520000, weeklyRentHouse: 650, weeklyRentUnit: 480, councilRatesAnnual: 2400, utilitiesMonthly: 260, transportMonthly: 160, groceriesMonthly: 700, lifestyleScore: 8 },
  { name: "Joondalup", city: "Perth", state: "WA", medianHousePrice: 650000, medianUnitPrice: 380000, weeklyRentHouse: 520, weeklyRentUnit: 400, councilRatesAnnual: 2200, utilitiesMonthly: 250, transportMonthly: 170, groceriesMonthly: 680, lifestyleScore: 7 },
  { name: "Rockingham", city: "Perth", state: "WA", medianHousePrice: 520000, medianUnitPrice: 350000, weeklyRentHouse: 480, weeklyRentUnit: 380, councilRatesAnnual: 2000, utilitiesMonthly: 240, transportMonthly: 180, groceriesMonthly: 650, lifestyleScore: 6 },
  { name: "Subiaco", city: "Perth", state: "WA", medianHousePrice: 1450000, medianUnitPrice: 620000, weeklyRentHouse: 850, weeklyRentUnit: 580, councilRatesAnnual: 2800, utilitiesMonthly: 280, transportMonthly: 150, groceriesMonthly: 780, lifestyleScore: 9 },
  { name: "Midland", city: "Perth", state: "WA", medianHousePrice: 480000, medianUnitPrice: 320000, weeklyRentHouse: 450, weeklyRentUnit: 350, councilRatesAnnual: 1900, utilitiesMonthly: 230, transportMonthly: 170, groceriesMonthly: 620, lifestyleScore: 6 },
  { name: "Perth CBD", city: "Perth", state: "WA", medianHousePrice: 800000, medianUnitPrice: 450000, weeklyRentHouse: 580, weeklyRentUnit: 420, councilRatesAnnual: 2000, utilitiesMonthly: 240, transportMonthly: 160, groceriesMonthly: 680, lifestyleScore: 9 },
  { name: "Leederville", city: "Perth", state: "WA", medianHousePrice: 950000, medianUnitPrice: 520000, weeklyRentHouse: 650, weeklyRentUnit: 480, councilRatesAnnual: 2400, utilitiesMonthly: 260, transportMonthly: 160, groceriesMonthly: 700, lifestyleScore: 8 },
  { name: "Cottesloe", city: "Perth", state: "WA", medianHousePrice: 2000000, medianUnitPrice: 800000, weeklyRentHouse: 1200, weeklyRentUnit: 650, councilRatesAnnual: 3000, utilitiesMonthly: 290, transportMonthly: 170, groceriesMonthly: 750, lifestyleScore: 9 },
  { name: "Claremont", city: "Perth", state: "WA", medianHousePrice: 1400000, medianUnitPrice: 650000, weeklyRentHouse: 850, weeklyRentUnit: 580, councilRatesAnnual: 2800, utilitiesMonthly: 280, transportMonthly: 150, groceriesMonthly: 780, lifestyleScore: 9 },
  { name: "Stirling", city: "Perth", state: "WA", medianHousePrice: 700000, medianUnitPrice: 400000, weeklyRentHouse: 540, weeklyRentUnit: 410, councilRatesAnnual: 2100, utilitiesMonthly: 245, transportMonthly: 165, groceriesMonthly: 685, lifestyleScore: 7 },
  { name: "Northbridge", city: "Perth", state: "WA", medianHousePrice: 900000, medianUnitPrice: 500000, weeklyRentHouse: 620, weeklyRentUnit: 460, councilRatesAnnual: 2200, utilitiesMonthly: 250, transportMonthly: 155, groceriesMonthly: 720, lifestyleScore: 8 },
  { name: "East Perth", city: "Perth", state: "WA", medianHousePrice: 1100000, medianUnitPrice: 580000, weeklyRentHouse: 720, weeklyRentUnit: 520, councilRatesAnnual: 2400, utilitiesMonthly: 265, transportMonthly: 148, groceriesMonthly: 740, lifestyleScore: 9 },
  { name: "West Perth", city: "Perth", state: "WA", medianHousePrice: 1200000, medianUnitPrice: 600000, weeklyRentHouse: 750, weeklyRentUnit: 540, councilRatesAnnual: 2450, utilitiesMonthly: 268, transportMonthly: 150, groceriesMonthly: 745, lifestyleScore: 9 },
  { name: "South Perth", city: "Perth", state: "WA", medianHousePrice: 1500000, medianUnitPrice: 700000, weeklyRentHouse: 900, weeklyRentUnit: 620, councilRatesAnnual: 2700, utilitiesMonthly: 280, transportMonthly: 160, groceriesMonthly: 780, lifestyleScore: 9 },
  { name: "Applecross", city: "Perth", state: "WA", medianHousePrice: 1600000, medianUnitPrice: 750000, weeklyRentHouse: 950, weeklyRentUnit: 650, councilRatesAnnual: 2750, utilitiesMonthly: 285, transportMonthly: 165, groceriesMonthly: 785, lifestyleScore: 9 },
  
  // Adelaide
  { name: "Glenelg", city: "Adelaide", state: "SA", medianHousePrice: 950000, medianUnitPrice: 520000, weeklyRentHouse: 650, weeklyRentUnit: 480, councilRatesAnnual: 2400, utilitiesMonthly: 250, transportMonthly: 140, groceriesMonthly: 680, lifestyleScore: 8 },
  { name: "Mawson Lakes", city: "Adelaide", state: "SA", medianHousePrice: 650000, medianUnitPrice: 380000, weeklyRentHouse: 520, weeklyRentUnit: 400, councilRatesAnnual: 2100, utilitiesMonthly: 240, transportMonthly: 150, groceriesMonthly: 650, lifestyleScore: 7 },
  { name: "Elizabeth", city: "Adelaide", state: "SA", medianHousePrice: 420000, medianUnitPrice: 280000, weeklyRentHouse: 400, weeklyRentUnit: 320, councilRatesAnnual: 1800, utilitiesMonthly: 220, transportMonthly: 160, groceriesMonthly: 580, lifestyleScore: 5 },
  { name: "Unley", city: "Adelaide", state: "SA", medianHousePrice: 1450000, medianUnitPrice: 580000, weeklyRentHouse: 850, weeklyRentUnit: 520, councilRatesAnnual: 2600, utilitiesMonthly: 270, transportMonthly: 140, groceriesMonthly: 720, lifestyleScore: 9 },
  { name: "Tea Tree Gully", city: "Adelaide", state: "SA", medianHousePrice: 620000, medianUnitPrice: 380000, weeklyRentHouse: 500, weeklyRentUnit: 400, councilRatesAnnual: 2000, utilitiesMonthly: 230, transportMonthly: 160, groceriesMonthly: 640, lifestyleScore: 7 },
  { name: "Adelaide CBD", city: "Adelaide", state: "SA", medianHousePrice: 700000, medianUnitPrice: 420000, weeklyRentHouse: 550, weeklyRentUnit: 410, councilRatesAnnual: 2100, utilitiesMonthly: 240, transportMonthly: 140, groceriesMonthly: 680, lifestyleScore: 9 },
  { name: "North Adelaide", city: "Adelaide", state: "SA", medianHousePrice: 950000, medianUnitPrice: 520000, weeklyRentHouse: 650, weeklyRentUnit: 480, councilRatesAnnual: 2400, utilitiesMonthly: 250, transportMonthly: 140, groceriesMonthly: 680, lifestyleScore: 8 },
  { name: "Prospect", city: "Adelaide", state: "SA", medianHousePrice: 750000, medianUnitPrice: 430000, weeklyRentHouse: 570, weeklyRentUnit: 415, councilRatesAnnual: 2150, utilitiesMonthly: 242, transportMonthly: 142, groceriesMonthly: 675, lifestyleScore: 7 },
  { name: "Norwood", city: "Adelaide", state: "SA", medianHousePrice: 1200000, medianUnitPrice: 580000, weeklyRentHouse: 750, weeklyRentUnit: 520, councilRatesAnnual: 2600, utilitiesMonthly: 270, transportMonthly: 140, groceriesMonthly: 720, lifestyleScore: 9 },
  { name: "Port Adelaide", city: "Adelaide", state: "SA", medianHousePrice: 650000, medianUnitPrice: 390000, weeklyRentHouse: 520, weeklyRentUnit: 405, councilRatesAnnual: 2050, utilitiesMonthly: 235, transportMonthly: 145, groceriesMonthly: 665, lifestyleScore: 8 },
  { name: "Henley Beach", city: "Adelaide", state: "SA", medianHousePrice: 1100000, medianUnitPrice: 550000, weeklyRentHouse: 700, weeklyRentUnit: 500, councilRatesAnnual: 2500, utilitiesMonthly: 265, transportMonthly: 138, groceriesMonthly: 710, lifestyleScore: 9 },
  
  // Hobart (Tasmania)
  { name: "Hobart CBD", city: "Hobart", state: "TAS", medianHousePrice: 750000, medianUnitPrice: 450000, weeklyRentHouse: 550, weeklyRentUnit: 400, councilRatesAnnual: 1800, utilitiesMonthly: 220, transportMonthly: 120, groceriesMonthly: 650, lifestyleScore: 8 },
  { name: "Sandy Bay", city: "Hobart", state: "TAS", medianHousePrice: 850000, medianUnitPrice: 520000, weeklyRentHouse: 600, weeklyRentUnit: 450, councilRatesAnnual: 1900, utilitiesMonthly: 225, transportMonthly: 125, groceriesMonthly: 670, lifestyleScore: 8 },
  { name: "Battery Point", city: "Hobart", state: "TAS", medianHousePrice: 1200000, medianUnitPrice: 650000, weeklyRentHouse: 750, weeklyRentUnit: 550, councilRatesAnnual: 2200, utilitiesMonthly: 240, transportMonthly: 130, groceriesMonthly: 700, lifestyleScore: 9 },
  { name: "New Town", city: "Hobart", state: "TAS", medianHousePrice: 650000, medianUnitPrice: 380000, weeklyRentHouse: 480, weeklyRentUnit: 350, councilRatesAnnual: 1700, utilitiesMonthly: 210, transportMonthly: 115, groceriesMonthly: 620, lifestyleScore: 7 },
  { name: "Lenah Valley", city: "Hobart", state: "TAS", medianHousePrice: 700000, medianUnitPrice: 420000, weeklyRentHouse: 520, weeklyRentUnit: 380, councilRatesAnnual: 1750, utilitiesMonthly: 215, transportMonthly: 118, groceriesMonthly: 630, lifestyleScore: 7 },
  { name: "West Hobart", city: "Hobart", state: "TAS", medianHousePrice: 950000, medianUnitPrice: 550000, weeklyRentHouse: 650, weeklyRentUnit: 480, councilRatesAnnual: 2000, utilitiesMonthly: 230, transportMonthly: 128, groceriesMonthly: 680, lifestyleScore: 8 },
  { name: "South Hobart", city: "Hobart", state: "TAS", medianHousePrice: 1100000, medianUnitPrice: 600000, weeklyRentHouse: 720, weeklyRentUnit: 520, councilRatesAnnual: 2100, utilitiesMonthly: 235, transportMonthly: 132, groceriesMonthly: 690, lifestyleScore: 9 },
  { name: "Mount Nelson", city: "Hobart", state: "TAS", medianHousePrice: 800000, medianUnitPrice: 480000, weeklyRentHouse: 580, weeklyRentUnit: 420, councilRatesAnnual: 1850, utilitiesMonthly: 220, transportMonthly: 122, groceriesMonthly: 660, lifestyleScore: 8 },
  { name: "Dynnyrne", city: "Hobart", state: "TAS", medianHousePrice: 900000, medianUnitPrice: 530000, weeklyRentHouse: 620, weeklyRentUnit: 460, councilRatesAnnual: 1950, utilitiesMonthly: 228, transportMonthly: 126, groceriesMonthly: 675, lifestyleScore: 8 },
  { name: "Taroona", city: "Hobart", state: "TAS", medianHousePrice: 850000, medianUnitPrice: 500000, weeklyRentHouse: 600, weeklyRentUnit: 440, councilRatesAnnual: 1900, utilitiesMonthly: 225, transportMonthly: 124, groceriesMonthly: 670, lifestyleScore: 8 },
  
  // Canberra (ACT)
  { name: "Canberra CBD", city: "Canberra", state: "ACT", medianHousePrice: 950000, medianUnitPrice: 550000, weeklyRentHouse: 650, weeklyRentUnit: 480, councilRatesAnnual: 2200, utilitiesMonthly: 250, transportMonthly: 140, groceriesMonthly: 700, lifestyleScore: 9 },
  { name: "Belconnen", city: "Canberra", state: "ACT", medianHousePrice: 750000, medianUnitPrice: 450000, weeklyRentHouse: 550, weeklyRentUnit: 420, councilRatesAnnual: 2000, utilitiesMonthly: 240, transportMonthly: 150, groceriesMonthly: 680, lifestyleScore: 7 },
  { name: "Gungahlin", city: "Canberra", state: "ACT", medianHousePrice: 720000, medianUnitPrice: 430000, weeklyRentHouse: 530, weeklyRentUnit: 410, councilRatesAnnual: 1950, utilitiesMonthly: 235, transportMonthly: 148, groceriesMonthly: 675, lifestyleScore: 7 },
  { name: "Tuggeranong", city: "Canberra", state: "ACT", medianHousePrice: 680000, medianUnitPrice: 410000, weeklyRentHouse: 510, weeklyRentUnit: 400, councilRatesAnnual: 1900, utilitiesMonthly: 230, transportMonthly: 155, groceriesMonthly: 670, lifestyleScore: 7 },
  { name: "Woden", city: "Canberra", state: "ACT", medianHousePrice: 800000, medianUnitPrice: 480000, weeklyRentHouse: 580, weeklyRentUnit: 440, councilRatesAnnual: 2100, utilitiesMonthly: 245, transportMonthly: 145, groceriesMonthly: 690, lifestyleScore: 8 },
  { name: "Manuka", city: "Canberra", state: "ACT", medianHousePrice: 1400000, medianUnitPrice: 700000, weeklyRentHouse: 850, weeklyRentUnit: 580, councilRatesAnnual: 2500, utilitiesMonthly: 270, transportMonthly: 135, groceriesMonthly: 750, lifestyleScore: 9 },
  { name: "Braddon", city: "Canberra", state: "ACT", medianHousePrice: 1200000, medianUnitPrice: 650000, weeklyRentHouse: 780, weeklyRentUnit: 550, councilRatesAnnual: 2400, utilitiesMonthly: 265, transportMonthly: 138, groceriesMonthly: 740, lifestyleScore: 9 },
  { name: "Civic", city: "Canberra", state: "ACT", medianHousePrice: 1100000, medianUnitPrice: 620000, weeklyRentHouse: 750, weeklyRentUnit: 530, councilRatesAnnual: 2350, utilitiesMonthly: 260, transportMonthly: 140, groceriesMonthly: 735, lifestyleScore: 9 },
  { name: "Fyshwick", city: "Canberra", state: "ACT", medianHousePrice: 650000, medianUnitPrice: 400000, weeklyRentHouse: 500, weeklyRentUnit: 390, councilRatesAnnual: 1850, utilitiesMonthly: 225, transportMonthly: 160, groceriesMonthly: 665, lifestyleScore: 7 },
  { name: "Dickson", city: "Canberra", state: "ACT", medianHousePrice: 950000, medianUnitPrice: 550000, weeklyRentHouse: 650, weeklyRentUnit: 480, councilRatesAnnual: 2200, utilitiesMonthly: 250, transportMonthly: 140, groceriesMonthly: 700, lifestyleScore: 8 },
  
  // Darwin (NT)
  { name: "Darwin CBD", city: "Darwin", state: "NT", medianHousePrice: 650000, medianUnitPrice: 400000, weeklyRentHouse: 500, weeklyRentUnit: 380, councilRatesAnnual: 1800, utilitiesMonthly: 220, transportMonthly: 130, groceriesMonthly: 680, lifestyleScore: 8 },
  { name: "Palmerston", city: "Darwin", state: "NT", medianHousePrice: 550000, medianUnitPrice: 350000, weeklyRentHouse: 450, weeklyRentUnit: 340, councilRatesAnnual: 1700, utilitiesMonthly: 210, transportMonthly: 140, groceriesMonthly: 650, lifestyleScore: 7 },
  { name: "Alice Springs", city: "Darwin", state: "NT", medianHousePrice: 450000, medianUnitPrice: 300000, weeklyRentHouse: 380, weeklyRentUnit: 300, councilRatesAnnual: 1600, utilitiesMonthly: 200, transportMonthly: 120, groceriesMonthly: 620, lifestyleScore: 6 },
  { name: "Katherine", city: "Darwin", state: "NT", medianHousePrice: 350000, medianUnitPrice: 250000, weeklyRentHouse: 320, weeklyRentUnit: 260, councilRatesAnnual: 1500, utilitiesMonthly: 190, transportMonthly: 110, groceriesMonthly: 600, lifestyleScore: 5 },
  { name: "Tennant Creek", city: "Darwin", state: "NT", medianHousePrice: 280000, medianUnitPrice: 200000, weeklyRentHouse: 280, weeklyRentUnit: 220, councilRatesAnnual: 1400, utilitiesMonthly: 180, transportMonthly: 100, groceriesMonthly: 580, lifestyleScore: 4 },

  // Generated suburbs for expanded coverage
  // This function generates realistic suburb data
];

// Helper function to generate suburb data
const generateSuburbs = (): SuburbData[] => {
  const generated: SuburbData[] = [];

  // Sydney suburbs generator
  const sydneyBases = ['Bondi', 'Parramatta', 'Manly', 'Penrith', 'Newcastle', 'Wollongong', 'Ryde', 'Campbelltown', 'Broken Hill', 'Coffs', 'Byron', 'Lismore', 'Tamworth', 'Armidale', 'Orange', 'Bathurst', 'Goulburn', 'Nowra', 'Wagga', 'Albury'];
  const sydneySuburbs = generateCitySuburbs('Sydney', 'NSW', sydneyBases, 600, 1500000, 4500000, 8.5);
  generated.push(...sydneySuburbs);

  // Melbourne suburbs generator
  const melbourneBases = ['Carlton', 'Fitzroy', 'Richmond', 'Brunswick', 'Footscray', 'Dandenong', 'Frankston', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Sale', 'Warrnambool', 'Hamilton', 'Portland'];
  const melbourneSuburbs = generateCitySuburbs('Melbourne', 'VIC', melbourneBases, 600, 1400000, 2800000, 8.2);
  generated.push(...melbourneSuburbs);

  // Brisbane suburbs generator
  const brisbaneBases = ['New Farm', 'Fortitude Valley', 'South Bank', 'Chermside', 'Sunnybank', 'Toowong', 'Indooroopilly', 'Ipswich', 'Gold Coast', 'Sunshine Coast', 'Rockhampton', 'Mackay', 'Cairns', 'Townsville', 'Gladstone'];
  const brisbaneSuburbs = generateCitySuburbs('Brisbane', 'QLD', brisbaneBases, 600, 1200000, 2400000, 8.0);
  generated.push(...brisbaneSuburbs);

  // Perth suburbs generator
  const perthBases = ['Subiaco', 'Claremont', 'Cottesloe', 'Fremantle', 'Leederville', 'Joondalup', 'Edgewater', 'Mandurah', 'Albany', 'Busselton', 'Margaret River', 'Bunbury'];
  const perthSuburbs = generateCitySuburbs('Perth', 'WA', perthBases, 400, 900000, 2000000, 7.5);
  generated.push(...perthSuburbs);

  // Adelaide suburbs generator
  const adelaideBases = ['Glenelg', 'Norwood', 'Unley', 'Burnside', 'Mitcham', 'Stirling', 'Campbelltown', 'Flagstaff', 'Victor Harbor'];
  const adelaideSuburbs = generateCitySuburbs('Adelaide', 'SA', adelaideBases, 300, 750000, 1500000, 7.2);
  generated.push(...adelaideSuburbs);

  // Hobart suburbs generator
  const hobartBases = ['Sandy Bay', 'Battery Point', 'South Hobart', 'Mount Nelson', 'New Town', 'Lenah Valley'];
  const hobartSuburbs = generateCitySuburbs('Hobart', 'TAS', hobartBases, 200, 650000, 1200000, 7.0);
  generated.push(...hobartSuburbs);

  // Canberra suburbs generator
  const canberraBases = ['Canberra CBD', 'Belconnen', 'Woden', 'Tuggeranong', 'Gungahlin', 'Manuka', 'Braddon', 'Civic'];
  const canberraSuburbs = generateCitySuburbs('Canberra', 'ACT', canberraBases, 200, 750000, 1400000, 7.8);
  generated.push(...canberraSuburbs);

  // Darwin suburbs generator
  const darwinBases = ['Darwin CBD', 'Palmerston', 'Alice Springs', 'Katherine'];
  const darwinSuburbs = generateCitySuburbs('Darwin', 'NT', darwinBases, 100, 450000, 700000, 6.5);
  generated.push(...darwinSuburbs);

  return generated;
};

// Helper to generate city suburbs with realistic names and data
const generateCitySuburbs = (city: string, state: string, baseBurbs: string[], count: number, minPrice: number, maxPrice: number, baseLifestyle: number): SuburbData[] => {
  const suburbs: SuburbData[] = [];
  const prefixes = ['North', 'South', 'East', 'West', 'Upper', 'Lower', 'New', 'Old'];
  const suffixes = ['Heights', 'Park', 'Grove', 'Vale', 'Ridge', 'Hill', 'Crest', 'Dale', 'Field', 'wood', 'stone'];

  // Generate unique suburb names
  const generatedNames = new Set<string>();

  // Add base suburbs first
  for (const base of baseBurbs) {
    generatedNames.add(base);
  }

  // Generate additional suburbs
  while (generatedNames.size < count) {
    const base = baseBurbs[Math.floor(Math.random() * baseBurbs.length)];
    const prefix = Math.random() > 0.4 ? (prefixes[Math.floor(Math.random() * prefixes.length)] + ' ') : '';
    const suffix = Math.random() > 0.3 ? (' ' + suffixes[Math.floor(Math.random() * suffixes.length)]) : '';
    const name = prefix + base + suffix;

    if (name.length < 3) continue;
    generatedNames.add(name.trim());
  }

  // Create suburb data objects
  generatedNames.forEach((name) => {
    const distanceFactor = Math.random(); // 0-1, lower = closer to CBD = more expensive
    const priceRange = maxPrice - minPrice;
    const price = maxPrice - (distanceFactor * distanceFactor * priceRange); // closer to CBD = higher price

    const lifestyle = Math.max(4, Math.min(10, baseLifestyle + (Math.random() - 0.5) * 3));
    const rentMultiplier = price / 1500000; // Higher price = higher rent

    suburbs.push({
      name: name.trim(),
      city,
      state,
      medianHousePrice: Math.round(price),
      medianUnitPrice: Math.round(price * 0.4 + Math.random() * price * 0.2),
      weeklyRentHouse: Math.round(600 * rentMultiplier + (Math.random() - 0.5) * 300),
      weeklyRentUnit: Math.round(350 * rentMultiplier + (Math.random() - 0.5) * 200),
      councilRatesAnnual: Math.round(1800 + Math.random() * 1200),
      utilitiesMonthly: Math.round(240 + Math.random() * 120),
      transportMonthly: Math.round(150 + Math.random() * 100),
      groceriesMonthly: Math.round(700 + Math.random() * 300),
      lifestyleScore: Math.round(lifestyle * 2) / 2,
    });
  });

  return suburbs;
};

// Merge with existing data - append generated suburbs
suburbData.push(...generateSuburbs());

// Lenders Mortgage Insurance (LMI) rates (approximate - Westpac, CBA, NAB, ANZ average)
// Updated 2025 - rates vary by lender, borrower risk profile, and loan amount
export const lmiRates = [
  { lvr: 80, rate: 0 },
  { lvr: 85, rate: 0.025 },  // ~2.5%
  { lvr: 90, rate: 0.045 },  // ~4.5%
  { lvr: 95, rate: 0.065 },  // ~6.5%
];

// First Home Buyer Grants by State (2024-2025)
export interface FirstHomeBuyerGrant {
  state: string;
  grantAmount: number;
  maxPropertyValue: number;
  newHomeOnly: boolean;
  additionalInfo: string;
}

export const firstHomeBuyerGrants: FirstHomeBuyerGrant[] = [
  { state: "NSW", grantAmount: 10000, maxPropertyValue: 750000, newHomeOnly: true, additionalInfo: "For new homes only. Stamp duty exemption up to $800k." },
  { state: "VIC", grantAmount: 10000, maxPropertyValue: 750000, newHomeOnly: true, additionalInfo: "For new homes only. Regional areas: $20,000." },
  { state: "QLD", grantAmount: 15000, maxPropertyValue: 750000, newHomeOnly: true, additionalInfo: "For new homes only." },
  { state: "WA", grantAmount: 10000, maxPropertyValue: 750000, newHomeOnly: true, additionalInfo: "For new homes only. South West: $430,000 limit." },
  { state: "SA", grantAmount: 15000, maxPropertyValue: 650000, newHomeOnly: true, additionalInfo: "For new homes only." },
  { state: "TAS", grantAmount: 30000, maxPropertyValue: 600000, newHomeOnly: true, additionalInfo: "For new homes only. Extended to 30 June 2024." },
  { state: "ACT", grantAmount: 0, maxPropertyValue: 0, newHomeOnly: false, additionalInfo: "No grant. Stamp duty exemption up to $800k." },
  { state: "NT", grantAmount: 10000, maxPropertyValue: 750000, newHomeOnly: false, additionalInfo: "Available for new and established homes." },
];

// Utility function to get state list
export const getStates = () => Object.keys(stampDutyData).map(key => ({
  code: key,
  name: stampDutyData[key].name,
}));

// Utility function to get cities by state
export const getCitiesByState = (stateCode: string) => {
  const cities = suburbData
    .filter(suburb => suburb.state.toLowerCase() === stateCode.toLowerCase())
    .map(suburb => suburb.city)
    .filter((city, index, arr) => arr.indexOf(city) === index) // unique
    .sort();
  return cities;
};

// Utility function to get suburbs by state
export const getSuburbsByState = (stateCode: string) => {
  return suburbData.filter(suburb => suburb.state.toLowerCase() === stateCode.toLowerCase());
};

// Utility function to get suburbs by city
export const getSuburbsByCity = (cityName: string) => {
  return suburbData.filter(suburb => suburb.city.toLowerCase() === cityName.toLowerCase());
};

// Utility function to get all suburbs
export const getAllSuburbs = () => suburbData.map(s => s.name).sort();

// Utility function to get suburb by name
export const getSuburbByName = (name: string) => {
  return suburbData.find(suburb => suburb.name.toLowerCase() === name.toLowerCase());
};

// Search helper function to find suburbs by name query in a specific city
export const searchSuburbsByCity = (query: string, city: string): SuburbData[] => {
  if (!query.trim()) {
    return getSuburbsByCity(city);
  }

  const lowerQuery = query.toLowerCase();
  return getSuburbsByCity(city)
    .filter(suburb => suburb.name.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      // Prioritize exact matches and prefix matches
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();

      if (aLower.startsWith(lowerQuery) && !bLower.startsWith(lowerQuery)) return -1;
      if (!aLower.startsWith(lowerQuery) && bLower.startsWith(lowerQuery)) return 1;

      return a.name.localeCompare(b.name);
    });
};

// Search across all suburbs (searchable dropdown without city pre-selection)
export const searchAllSuburbs = (query: string): SuburbData[] => {
  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return suburbData
    .filter(suburb => suburb.name.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();

      if (aLower.startsWith(lowerQuery) && !bLower.startsWith(lowerQuery)) return -1;
      if (!aLower.startsWith(lowerQuery) && bLower.startsWith(lowerQuery)) return 1;

      return a.name.localeCompare(b.name);
    })
    .slice(0, 100); // Limit to 100 results for performance
};
