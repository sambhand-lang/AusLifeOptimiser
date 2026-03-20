export function generateSuburbInsightsText(suburbName: string, scoreBreakdown: any, _state?: string, population?: number) {
  if (!scoreBreakdown) return { explanation: '', bestFor: [], notIdealFor: [] };

  const { affordability, lifestyle, schools, commute, employment } = scoreBreakdown;
  const metrics = [
    { name: 'lifestyle', value: lifestyle || 0 },
    { name: 'schools', value: schools || 0 },
    { name: 'affordability', value: affordability || 0 },
    { name: 'employment', value: employment || 0 },
    { name: 'commute', value: commute || 0 },
  ].sort((a, b) => b.value - a.value);

  const topMetric = metrics[0].name;
  const bottomMetric = metrics[metrics.length - 1].name;

  let explanation = '';

  // Regional Awareness
  const isSmallTown = (population || 0) < 10000;
  const hubTerm = isSmallTown ? 'local employment hubs' : 'major CBD or employment centres';
  const connectivityTerm = isSmallTown ? 'reliable local access' : 'strong city connectivity';

  // Custom intro based on top metric
  if (topMetric === 'lifestyle') {
    explanation += `${suburbName} scores highly for lifestyle, with excellent access to local amenities, dining, and recreation. `;
  } else if (topMetric === 'schools') {
    explanation += `${suburbName} is a standout for families, featuring an excellent concentration of schools and parklands. `;
  } else if (topMetric === 'affordability') {
    explanation += `${suburbName} offers exceptional value, with house prices representing great affordability relative to local incomes. `;
  } else if (topMetric === 'commute') {
    explanation += `Connectivity is the biggest strength of ${suburbName}, offering rapid commutes to ${hubTerm}. `;
  } else {
    explanation += `${suburbName} is supported by strong local employment and economic stability. `;
  }

  // Nuance for 2nd best metric
  if (commute > 70 && topMetric !== 'commute') {
      explanation += `It also boasts fantastic access to ${hubTerm}. `;
  }

  // Custom constraint based on bottom metric
  if (bottomMetric === 'affordability' && affordability < 30) {
    explanation += `However, affordability is a major constraint, with house prices significantly higher than local median incomes. `;
  } else if (bottomMetric === 'commute' && commute < 40) {
    explanation += `However, access to ${hubTerm} is limited, with longer commute times acting as a constraint. `;
  } else if (bottomMetric === 'lifestyle' && lifestyle < 40) {
    explanation += `However, local lifestyle amenities like cafes and entertainment venues are relatively sparse. `;
  } else if (bottomMetric === 'schools' && schools < 40) {
    explanation += `However, educational options within the immediate vicinity are comparatively limited. `;
  } else if (bottomMetric === 'employment' && employment < 40) {
    explanation += `However, local employment opportunities or economic activity may be softer compared to other regions. `;
  }

  // Persona Logic
  const bestFor = [];
  const notIdealFor = [];

  // Best For
  if (lifestyle > 70) bestFor.push('Lifestyle buyers');
  if (schools > 60) bestFor.push('Young families');
  if (affordability > 60) bestFor.push('First home buyers', 'Investors');
  if (commute > 60) bestFor.push(isSmallTown ? 'Local working families' : 'Professionals commuting to CBD');
  if (lifestyle > 70 && affordability < 30) bestFor.push('Established professionals', 'Retirees');

  // Not Ideal For - Every suburb has a trade-off
  if (affordability < 40) notIdealFor.push('Budget-conscious buyers', 'First home buyers');
  if (commute < 40) notIdealFor.push(isSmallTown ? 'Buyers needing city access' : 'CBD working professionals');
  if (lifestyle < 40) notIdealFor.push('Inner-city lifestyle seekers');
  if (schools < 40) notIdealFor.push('Growing families');
  if (employment < 40 && affordability > 60) notIdealFor.push('High-income career climbers');

  const uniqueBestFor = Array.from(new Set(bestFor)).slice(0, 3);
  const uniqueNotIdeal = Array.from(new Set(notIdealFor)).slice(0, 3);

  // Fallbacks to guarantee insight
  if (uniqueBestFor.length === 0) uniqueBestFor.push('Local residents', 'First home buyers');
  if (uniqueNotIdeal.length === 0) {
     if (bottomMetric === 'affordability') uniqueNotIdeal.push('Budget-conscious buyers', 'First home buyers');
     else if (bottomMetric === 'commute') uniqueNotIdeal.push('Commuters');
     else uniqueNotIdeal.push('Buyers needing strict premium amenities');
  }

  // Conclusion sentence based strictly on data alignment
  const isCommuter = commute > 60;
  const isFamily = schools > 60;
  if (!isCommuter && uniqueBestFor.includes('Lifestyle buyers')) {
      explanation += `Best suited for lifestyle buyers rather than ${isSmallTown ? 'city' : 'CBD'}-focused working professionals.`;
  } else if (isCommuter && isFamily) {
      explanation += `An outstanding choice for families requiring ${connectivityTerm}.`;
  } else if (isCommuter) {
      explanation += `Ideally suited for working professionals who value their time.`;
  } else {
      explanation += `A balanced market catering well to ${uniqueBestFor[0]?.toLowerCase()}.`;
  }

  return {
    explanation,
    bestFor: uniqueBestFor,
    notIdealFor: uniqueNotIdeal
  };
}
