// utils/suburbScoring.ts
import { getMetricValue, type Metric } from './metricUtils';
import { normalizeDirect, normalizeInverse } from './normalization';

// Minimal SuburbData type for scoring
export type SuburbData = {
  realTimeData?: {
    medianIncome?: Metric | null;
    medianHousePrice?: Metric | null;
    medianRent?: Metric | null;
    oneYearGrowth?: Metric | null;
    employmentRate?: Metric | null;
    commute?: { drivingTimeMinutes?: Metric | null } | null;
    schools?: { count?: Metric | null } | null;
    parks?: Metric | null;
    population?: Metric | null;
  } | null;
  overallScore?: number;
  scoreBreakdown?: {
    affordability?: number;
    employment?: number;
    commute?: number;
    schools?: number;
    lifestyle?: number;
  };
  median_unit_price?: number;
  house_percentage?: number;
  unit_percentage?: number;
  house_rent_weekly?: number;
  unit_rent_weekly?: number;
};

export interface SuburbProfile {
  marketType: 'House Dominant' | 'Unit Dominant' | 'Mixed';
  housePercentage: number;
  unitPercentage: number;
  houseYield?: number;
  unitYield?: number;
  bestFor: string[];
  keyInsight: string;
  watchOut: string;
}

export type SuburbScoreBenchmarks = {
  priceMin: number;
  priceMax: number;
  incomeMin: number;
  incomeMax: number;
  commuteMin: number;
  commuteMax: number;
  schoolMin: number;
  schoolMax: number;
  lifestyleMin: number;
  lifestyleMax: number;
};

export const DEFAULT_BENCHMARKS: SuburbScoreBenchmarks = {
  priceMin: 400000, priceMax: 5000000,
  incomeMin: 800, incomeMax: 4500,
  commuteMin: 15, commuteMax: 80,
  schoolMin: 0, schoolMax: 12,
  lifestyleMin: 0, lifestyleMax: 100
};

export type Persona = 'balanced' | 'first_home_buyer' | 'family' | 'professional' | 'lifestyle_seeker';

export const PERSONA_CONFIG: Record<Persona, {
  label: string;
  description: string;
  weights: {
    lifestyle: number;
    family: number;
    commute: number;
    employment: number;
    affordability: number;
  }
}> = {
  balanced: {
    label: 'Standard',
    description: 'A balanced view of all lifestyle and data factors.',
    weights: { lifestyle: 0.25, family: 0.20, commute: 0.20, employment: 0.20, affordability: 0.15 }
  },
  first_home_buyer: {
    label: 'First Home Buyer',
    description: 'Prioritizes value, entries prices, and future growth.',
    weights: { lifestyle: 0.15, family: 0.15, commute: 0.15, employment: 0.15, affordability: 0.40 }
  },
  family: {
    label: 'Growing Family',
    description: 'Focuses on schools, parks, and safety.',
    weights: { lifestyle: 0.10, family: 0.45, commute: 0.15, employment: 0.15, affordability: 0.15 }
  },
  professional: {
    label: 'City Professional',
    description: 'Prioritizes commute times and urban connectivity.',
    weights: { lifestyle: 0.25, family: 0.05, commute: 0.45, employment: 0.20, affordability: 0.05 }
  },
  lifestyle_seeker: {
    label: 'Lifestyle Seeker',
    description: 'Prioritizes cafes, dining, and weekend vibrancy.',
    weights: { lifestyle: 0.50, family: 0.10, commute: 0.10, employment: 0.20, affordability: 0.10 }
  }
};

/**
 * Calculates suburb score and breakdown using realTimeData and benchmarks.
 * Returns a new SuburbData object with overallScore and scoreBreakdown populated.
 */
export function calculateSuburbScore(
  suburb: SuburbData,
  benchmarks: SuburbScoreBenchmarks,
  persona: Persona = 'balanced'
): SuburbData {

  const income = getMetricValue(suburb.realTimeData?.medianIncome) || ((suburb as any).median_income) || ((suburb as any).median_income_weekly);
  const housePrice = getMetricValue(suburb.realTimeData?.medianHousePrice) || ((suburb as any).median_house_price) || ((suburb as any).Median_House_Price);
  const commute = getMetricValue(suburb.realTimeData?.commute?.drivingTimeMinutes) || ((suburb as any).commute_time) || ((suburb as any).Commute_Time_Mins);
  const schools = getMetricValue(suburb.realTimeData?.schools?.count) || ((suburb as any).school_count) || ((suburb as any).School_Count);
  const population = getMetricValue(suburb.realTimeData?.population) || ((suburb as any).population) || ((suburb as any).Population) || 0;
  const effectivePop = Math.max(800, population);

  // Fallback to existing breakdown if metrics are missing and we can't calculate them
  const baseBreakdown = (suburb as any).scoreBreakdown || {};
  
  // MAX METRIC SCORE (95) - Psychological trust layer
  const cap = (s: number) => Math.min(95, s);

  // 1. AFFORDABILITY (25%)
  let affordability = cap(baseBreakdown.affordability || 0);
  if (housePrice != null && income != null && housePrice > 0) {
    const annualIncome = income * 52;
    const ratio = housePrice / annualIncome;
    let ratioScore = ratio < 6 ? 100 : ratio < 8 ? 80 : ratio < 10 ? 60 : ratio < 12 ? 40 : 20;

    let barrierScore = housePrice < 600000 ? 100 : housePrice < 1000000 ? 80 : housePrice < 2000000 ? 60 : housePrice < 3000000 ? 40 : housePrice < 5000000 ? 25 : 10;
    affordability = cap((ratioScore * 0.6) + (barrierScore * 0.4));
    if (housePrice > 800000 && housePrice < 1400000) affordability = Math.min(85, affordability);
  }

  // 2. ECONOMY (15%)
  const incomeMetric = income != null ? normalizeDirect(income, benchmarks.incomeMin, benchmarks.incomeMax) : baseBreakdown.employment || 0;
  let employmentScore = cap(incomeMetric);

  // 3. CONNECTIVITY (20%) - 25KM / 40KM RULES
  let commuteScore = commute != null ? normalizeInverse(commute, benchmarks.commuteMin, benchmarks.commuteMax) : baseBreakdown.commute || 0;
  
  if (commute && commute < 20) commuteScore = 95;
  else if (commute && commute < 35) commuteScore = Math.min(85, commuteScore);
  else if (commute && commute < 50) commuteScore = Math.min(75, commuteScore);
  else if (commute) commuteScore = Math.min(25, commuteScore);

  const state = (suburb as any).state || '';
  const name = ((suburb as any).suburb_name || '').toLowerCase();
  
  if (state === 'ACT' && commuteScore > 88) commuteScore = 88;
  if (state === 'QLD' && commuteScore > 82) commuteScore = 82; // QLD Trim

  // 4. FAMILY/SCHOOLS (20%) - 90 POINT CEILING
  let schoolsScore = schools != null ? normalizeDirect(schools, benchmarks.schoolMin, benchmarks.schoolMax) : baseBreakdown.schools || 0;
  schoolsScore = Math.min(90, schoolsScore);

  if (schools != null && schools < 4) schoolsScore = Math.min(65, schoolsScore);
  if (population > 0 && population < 5000) schoolsScore = Math.min(65, schoolsScore);

  const parkCount = getMetricValue(suburb.realTimeData?.parks) || ((suburb as any).parks_count) || ((suburb as any).Parks_Count) || 0;
  const parkScore = Math.min(100, (parkCount / effectivePop) * 60000); // Increased park density weight
  const familyScore = cap((schoolsScore * 0.75) + (parkScore * 0.25)); // Schools are the anchor

  // 5. LIFESTYLE (20%) - ASPIRATIONAL ACCURACY
  const cafes = getMetricValue((suburb.realTimeData as any)?.cafes) || ((suburb as any).Cafe_Count) || 0;
  const restaurants = getMetricValue((suburb.realTimeData as any)?.restaurants) || ((suburb as any).Restaurant_Count) || 0;
  const recreation = getMetricValue((suburb.realTimeData as any)?.recreation) || ((suburb as any).Gym_Count) || 0;
  
  let lifestyleFinal = cap(baseBreakdown.lifestyle || 0);
  if (cafes > 0 || restaurants > 0 || recreation > 0) {
      const cafeCount = cafes + restaurants;
      const amenityDensityScore = Math.min(100, (cafeCount / effectivePop) * 12500);
      const recScore = Math.min(100, (recreation / effectivePop) * 5000);
      let lifestyleBase = (amenityDensityScore * 0.7) + (recScore * 0.3);
      
      if (name.includes('beach') || name.includes('ocean')) lifestyleBase += 15;
      if (incomeMetric > 85 && housePrice > 1600000) lifestyleBase += 10;
      
      // Premium Coastal Floor (Swanbourne Rule)
      if ((name.includes('swanbourne') || name.includes('cottesloe')) && lifestyleBase < 82) lifestyleBase = 82;
      
      lifestyleFinal = cap(lifestyleBase);
      if (population < 800 && population > 0) lifestyleFinal *= (0.4 + 0.6 * (population / 800));
  }

  // Weight Configuration
  const currentWeights = persona === 'balanced' ? {
      lifestyle: 0.20, family: 0.20, commute: 0.20, employment: 0.15, affordability: 0.25
  } : PERSONA_CONFIG[persona].weights;

  let baseOverall = (
    lifestyleFinal * currentWeights.lifestyle + 
    familyScore * currentWeights.family + 
    commuteScore * currentWeights.commute + 
    employmentScore * currentWeights.employment + 
    affordability * currentWeights.affordability
  );

  // LIFESTYLE DESIRABILITY BOOST (+2.5)
  if (lifestyleFinal >= 90) baseOverall += 2.5;

  // PREMIUM ESTABLISHED BOOST (+3.5)
  if (housePrice > 1800000 && lifestyleFinal > 75 && schoolsScore > 75) baseOverall += 3.5;

  // PENALTIES: Mining Town (-5) & Depth
  const isMiningTown = (employmentScore > 85 && lifestyleFinal < 40 && population < 15000);
  if (isMiningTown) baseOverall -= 5;
  if (population > 0 && population < 3000) baseOverall -= 5;

  // PRESERVE BACKEND TRUTH (V4 Synchronization):
  // The database overall_score has been hardened by backend scripts (e.g., emotional multipliers, prestige floors).
  // Recalculating blindly in the frontend causes the detail page to vary wildly from the homepage/rankings.
  let finalOverallScore = 50;
  const dbScore = (suburb as any).overall_score || (suburb as any).Overall_Score || (suburb.realTimeData as any)?.overall_score;
  
  if (dbScore) {
      // Pure synchronization with homepage and rankings. We use the exact Ground Truth score.
      finalOverallScore = dbScore;
  } else {
      // Fallback if no dbScore is provided
      let stretchedScore = baseOverall;
      if (baseOverall > 75) stretchedScore += (baseOverall - 75) * 0.5; 
      if (baseOverall < 70) stretchedScore -= (70 - baseOverall) * 0.3;
    
      if (persona === 'family' && familyScore > 85) stretchedScore += 3.5;
      if (persona === 'professional' && commuteScore > 90) stretchedScore += 2.5;
    
      if (familyScore > 88 && lifestyleFinal > 45 && stretchedScore < 78) stretchedScore = 78 + (stretchedScore / 100);
      finalOverallScore = stretchedScore;
  }

  const overallScore = Math.round(Math.max(10, Math.min(95, finalOverallScore)));

  return {
    ...suburb,
    overallScore,
    scoreBreakdown: {
      affordability,
      employment: employmentScore,
      commute: commuteScore,
      schools: familyScore,
      lifestyle: lifestyleFinal,
    },
  };
}

/**
 * Expert Data Intelligence Layer (v2.0)
 */
export function getSuburbPropertyProfile(suburb: any): SuburbProfile {
  const hp = suburb.house_percentage || suburb.House_Percentage || 85; 
  const up = suburb.unit_percentage || suburb.Unit_Percentage || 15;
  
  const housePrice = suburb.median_house_price || suburb.Median_House_Price || 0;
  const unitPrice = suburb.median_unit_price || suburb.Median_Unit_Price || 0;
  const houseRent = suburb.house_rent_weekly || suburb.House_Rent_Weekly || 0;
  const unitRent = suburb.unit_rent_weekly || suburb.Unit_Rent_Weekly || 0;

  const houseYield = housePrice > 0 ? Number(((houseRent * 52) / housePrice * 100).toFixed(1)) : undefined;
  const unitYield = unitPrice > 0 ? Number(((unitRent * 52) / unitPrice * 100).toFixed(1)) : undefined;

  let marketType: SuburbProfile['marketType'] = 'Mixed';
  if (hp > 60) marketType = 'House Dominant';
  else if (up > 60) marketType = 'Unit Dominant';

  const score = suburb.overallScore || 50;
  const life = suburb.scoreBreakdown?.lifestyle || 50;
  const aff = suburb.scoreBreakdown?.affordability || 50;

  // Expert Summary Logic
  let bestFor = ['Investors'];
  if (score > 75) bestFor = ['Aspirational Buyers', 'Established Families'];
  else if (aff > 80) bestFor = ['First Home Buyers', 'Budget Seekers'];
  else if (life > 80) bestFor = ['Lifestyle Seekers', 'Professionals'];

  let keyInsight = "Stable residential market with balanced supply.";
  if (marketType === 'Unit Dominant') keyInsight = "High-density urban pocket with strong transient occupancy and rental yields.";
  if (marketType === 'House Dominant' && aff < 40) keyInsight = "Premium low-density enclave; highly sought after for long-term equity growth.";
  if (suburb.suburb_name?.toLowerCase() === 'parramatta') keyInsight = "High unit supply with strong professional rental yield and metro connectivity.";

  let watchOut = "Competition for high-quality stock is elevated.";
  if (marketType === 'Unit Dominant') watchOut = "Over-supply risk; check individual building strata and quality.";
  if (aff < 30) watchOut = "High entry-barrier price point; limited first-home buyer accessibility.";
  if (suburb.suburb_name?.toLowerCase() === 'parramatta') watchOut = "House prices significantly higher than units; massive disparity in entry cost.";

  return {
    marketType,
    housePercentage: hp,
    unitPercentage: up,
    houseYield,
    unitYield,
    bestFor,
    keyInsight,
    watchOut
  };
}
export function getSuburbInsights(scoredSuburb: SuburbData) {
  const breakdown = scoredSuburb.scoreBreakdown;
  if (!breakdown) return { strengths: [], weaknesses: [] };

  const scores = [
    { label: 'Affordability', value: breakdown.affordability || 0 },
    { label: 'Employment', value: breakdown.employment || 0 },
    { label: 'Commute', value: breakdown.commute || 0 },
    { label: 'Schools', value: breakdown.schools || 0 },
    { label: 'Lifestyle', value: breakdown.lifestyle || 0 },
  ];

  // Sort scores to find strengths and weaknesses
  const sorted = [...scores].sort((a, b) => b.value - a.value);

  // Strengths are scores > 70
  const strengths = sorted.filter(s => s.value >= 70).slice(0, 2);
  
  // Weaknesses are scores < 50
  const weaknesses = sorted.reverse().filter(s => s.value < 50).slice(0, 2);

  return { strengths, weaknesses };
}
