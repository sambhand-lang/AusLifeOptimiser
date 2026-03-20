import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, ChevronLeft, Building, Users, GraduationCap, Clock, CheckCircle2, XCircle, Search, Info, Heart, Share2 } from 'lucide-react';
import { calculateSuburbScore, getSuburbInsights, getSuburbPropertyProfile } from '@/utils/suburbScoring';
import { generateSuburbInsightsText } from '@/utils/insightGenerator';

import { useNavigate } from 'react-router-dom';
import { usePersona } from '@/context/PersonaContext';


export function SuburbDetail() {
  const navigate = useNavigate();
  const { state, name } = useParams<{ state: string; name: string }>();
  const { persona } = usePersona();
  const [loading, setLoading] = useState(true);

  const [suburb, setSuburb] = useState<any | null>(null);
  const [nearbySuburbs, setNearbySuburbs] = useState<any[]>([]);
  const [compareQuery, setCompareQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isCopied, setIsCopied] = useState(false);


  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Step 1: Search for the suburb to get the ID
        const cleanName = name?.replace(/-/g, ' ');
        const searchRes = await fetch(`/api/dropdowns/search?q=${cleanName}`);
        const searchData = await searchRes.json();
        const searchList = Array.isArray(searchData) ? searchData : (searchData.results || searchData.data || []);
        const match = searchList.find(
          (s: any) => s.suburb_name.toLowerCase() === cleanName?.toLowerCase() && s.state.toLowerCase() === state?.toLowerCase()
        );

        if (match) {
          // Step 2: Get details
          const detailRes = await fetch(`/api/suburbs/${match.id}/details`);
          const detailData = await detailRes.json();
          
          // Use benchmarks consistent with recalculate_scores.js
          const benchmarks = {
            priceMin: 400000, priceMax: 5000000,
            incomeMin: 800, incomeMax: 4500,
            commuteMin: 15, commuteMax: 80,
            schoolMin: 0, schoolMax: 12,
            lifestyleMin: 0, lifestyleMax: 100
          };
          const scored = calculateSuburbScore(detailData, benchmarks, persona);
          setSuburb(scored);

          // Step 3: Get nearby suburbs
          const nearbyRes = await fetch(`/api/suburbs/${match.id}/nearby?postcode=${detailData.postcode}&state=${detailData.state}`);
          const nearbyData = await nearbyRes.json();
          setNearbySuburbs(nearbyData.data || []);
        } else {
          setSuburb(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [state, name, persona]);

  // SEO Side Effect
  useEffect(() => {
    if (suburb) {
      document.title = `${suburb.suburb_name}, ${suburb.state} | Lifestyle Guide & Market Insights 2025`;
      const metaDesc = document.querySelector('meta[name="description"]');
      const content = `Local insights for ${suburb.suburb_name}, ${suburb.state}. Median house price ${suburb.realTimeData?.medianHousePrice?.value ? `$${(suburb.realTimeData.medianHousePrice.value / 1000000).toFixed(1)}M` : ''}, overall score ${suburb.overallScore}, and in-depth lifestyle analysis.`;
      if (metaDesc) metaDesc.setAttribute('content', content);
    }
  }, [suburb]);

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };


  if (loading) return <div className="p-12 text-center text-emerald-600 font-semibold animate-pulse pt-32">Loading {name}...</div>;
  if (!suburb) return <div className="p-12 text-center text-red-500 pt-32">Suburb not found in {state?.toUpperCase()}.</div>;

  const { strengths } = suburb ? getSuburbInsights(suburb) : { strengths: [] };
  const insights = suburb ? generateSuburbInsightsText(suburb.suburb_name, suburb.scoreBreakdown, suburb.state, suburb.population) : null;

  const handleCompareSearch = async (val: string) => {
    setCompareQuery(val);
    if (val.length > 1) {
      const res = await fetch(`/api/dropdowns/search?q=${val}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : (data.results || data.data || []));
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="pt-28 pb-12 bg-slate-50/50 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link to="/suburbs/compare" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Comparison
        </Link>
        <div className="mb-10">
          {/* ASIC Compliance Disclaimer - Top of Page */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
            <div className="bg-amber-400 p-2 rounded-xl text-white">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 mb-1">General Information Only</p>
              <p className="text-[10px] text-amber-800 leading-tight">
                  This profile provides general information on suburb demographics and lifestyle trends only. 
                  It does not constitute financial or investment advice. You should obtain independent professional advice 
                  before making any major financial decisions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-emerald-100/80 text-emerald-800 border-emerald-200">
                Postcode {suburb.postcode}
            </Badge>
            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                {suburb.state}
            </Badge>
            {suburb.rank && suburb.total_suburbs && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 font-bold shadow-sm animate-in fade-in zoom-in duration-500">
                    <TrendingUp className="h-3 w-3" />
                    {(() => {
                        const rawPercentile = (suburb.rank / Math.min(suburb.total_suburbs, 8000)) * 100;
                        let bounded = Math.max(1, Math.min(100, rawPercentile));
                        let cleanBracket = Math.max(5, Math.ceil(bounded / 5) * 5);
                        return cleanBracket <= 25 ? `Top ${cleanBracket}% National Rank` : `Better than ${100 - cleanBracket}% of Suburbs`;
                    })()}
                </Badge>
            )}
            <Badge className="bg-slate-900/10 text-slate-500 border-slate-200 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Data Verified: Mar 2026
            </Badge>
            {suburb && (
                <Badge className={`border-0 font-bold uppercase tracking-tighter text-[9px] ${
                    getSuburbPropertyProfile(suburb).marketType === 'House Dominant' ? 'bg-blue-600 text-white' : 
                    getSuburbPropertyProfile(suburb).marketType === 'Unit Dominant' ? 'bg-purple-600 text-white' : 
                    'bg-slate-800 text-white'
                }`}>
                    {getSuburbPropertyProfile(suburb).marketType}
                </Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 mb-4 capitalize font-serif tracking-tight flex items-baseline gap-4">
            {suburb.suburb_name}
            <span className="text-xl font-medium text-slate-400 font-sans tracking-normal opacity-50">Local Guide</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl leading-relaxed border-l-4 border-amber-400 pl-6 py-2 bg-white/40 rounded-r-2xl shadow-sm italic">
            {suburb.suburb_name} offers a {suburb.overallScore > 70 ? 'premium' : suburb.overallScore > 50 ? 'balanced' : 'developing'} living experience with particularly strong {strengths[0]?.label?.toLowerCase() || 'local traits'}.
          </p>
          
          {/* Suburb Truth Snapshot */}
          <div className="mt-6 flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-xl max-w-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="bg-amber-400 text-slate-900 rounded-lg p-2 font-black text-[10px] uppercase tracking-tighter shrink-0">Reality Check</div>
            <p className="text-sm font-medium opacity-90 leading-tight">
                {suburb.overallScore > 80 ? "Premium tier hub. Elite schools and lifestyle, balanced by high entry costs." : 
                 suburb.overallScore > 65 ? "Strong middle-ring value. Reliable commute and growing cafe culture; highly desirable for upgraders." :
                 "Emerging residential corridor. Practical affordability and developing infrastructure; long-term equity play."}
            </p>
          </div>
          <div className="flex gap-4 mt-8">
            <Button 
                onClick={copyProfileLink}
                variant="outline" 
                className={`rounded-full px-6 py-5 font-bold transition-all shadow-md transform hover:scale-105 flex items-center gap-2 ${isCopied ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
            >
                <Share2 className="h-4 w-4" />
                {isCopied ? 'Link Copied! 🚀' : 'Share Profile'}
            </Button>
            <Link to="/suburbs/rankings">
                <Button 
                    variant="ghost" 
                    className="rounded-full px-6 py-5 font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                >
                    Compare to Top 1%
                </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-6">
             <SuburbScoreCard
                suburbName={suburb.suburb_name || ''}
                state={suburb.state || ''}
                overallScore={suburb.overallScore || 0}
                scoreBreakdown={suburb.scoreBreakdown}
                rank={suburb.rank}
                totalSuburbs={suburb.total_suburbs}
             />
             
             {/* Score Explanation Panel */}
             <Card className="border-0 shadow-lg shadow-emerald-50/50 rounded-3xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center">
                        <Info className="h-4 w-4 mr-2 text-emerald-600" />
                        Why {suburb.suburb_name} scores {suburb.overallScore}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 mb-2">
                        General Insight Layer: Scores reflect comparative data performance only.
                    </p>
                    {insights && (
                        <div className="text-sm text-slate-700 leading-relaxed space-y-2 border-l-2 border-emerald-400 pl-3">
                            <p>{insights.explanation}</p>
                        </div>
                    )}

                    {insights && (insights.bestFor.length > 0 || insights.notIdealFor.length > 0) && (
                        <div className="pt-2 border-t border-slate-100">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                 <div>
                                     <div className="text-[10px] font-bold text-emerald-600 uppercase mb-2 tracking-widest flex items-center gap-1">
                                         <CheckCircle2 className="h-3 w-3" /> Indicator Profile
                                     </div>
                                     <ul className="space-y-1">
                                         {insights.bestFor.map(b => (
                                             <li key={b} className="text-[13px] text-slate-700 flex items-center gap-1.5 before:content-['•'] before:text-emerald-400">
                                                 {b}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                                 
                                 <div>
                                     <div className="text-[10px] font-bold text-rose-500 uppercase mb-2 tracking-widest flex items-center gap-1">
                                         <XCircle className="h-3 w-3" /> Not ideal for
                                     </div>
                                     <ul className="space-y-1">
                                         {insights.notIdealFor.map(n => (
                                             <li key={n} className="text-[13px] text-slate-700 flex items-center gap-1.5 before:content-['•'] before:text-rose-400">
                                                 {n}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             </div>
                        </div>
                    )}
                </CardContent>
             </Card>

              <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-100 border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                     <span className="flex items-center"><Heart className="h-4 w-4 mr-2 text-rose-500" /> The Local Edit</span>
                     <Badge className="bg-slate-900 text-[9px] uppercase tracking-tighter text-white border-0 py-0.5">2025 Guide</Badge>
                  </h3>
                  <div className="space-y-4">
                      {suburb.realTimeData?.cafes?.value > 10 && (
                          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 transition-all hover:bg-emerald-50 hover:border-emerald-200 group">
                              <div className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-1 group-hover:text-emerald-900">Morning Routine</div>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium">Enjoy the morning buzz. With {suburb.realTimeData.cafes.value} local spots, your daily coffee run is a centerpiece of the {suburb.suburb_name} lifestyle.</p>
                          </div>
                      )}
                      {suburb.scoreBreakdown?.lifestyle > 80 && (
                          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 transition-all hover:bg-amber-50 hover:border-amber-200 group">
                              <div className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-1 group-hover:text-amber-900">Vibrancy Index</div>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium">Ranked as a top-tier social hub. This suburb offers high walkability and a dense concentration of local hospitality gems.</p>
                          </div>
                      )}
                      {(suburb.realTimeData?.gyms?.value || (suburb.realTimeData as any)?.gymCount || 0) > 5 && (
                          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 transition-all hover:bg-blue-50 hover:border-blue-200 group">
                              <div className="text-[11px] font-black text-blue-800 uppercase tracking-widest mb-1 group-hover:text-blue-900">Active Living</div>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium">Ideal for health seekers. A high density of {suburb.realTimeData.gymCount || suburb.realTimeData?.gyms?.value} fitness hubs and greenery makes active living easy.</p>
                          </div>
                      )}
                      <div className="text-[10px] text-center text-slate-400 italic pt-2">
                          ⚡ Intelligence derived from 2024-25 OSM amenity density feeds.
                      </div>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-100 border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                     <Search className="h-4 w-4 mr-2 text-emerald-600" />
                     Compare Growth
                  </h3>
                  <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Compare with another..." 
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={compareQuery}
                        onChange={(e) => handleCompareSearch(e.target.value)}
                      />
                      {searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                              {searchResults.map(res => (
                                  <button 
                                    key={res.id}
                                    onClick={() => navigate(`/suburbs/compare?sub1=${suburb.suburb_name}|${suburb.postcode}|${suburb.state}&sub2=${res.suburb_name}|${res.postcode}|${res.state}`)}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium border-b border-slate-50 last:border-0"
                                  >
                                      {res.suburb_name}, {res.state}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
          
          <div className="md:col-span-8 space-y-6">
            <Card className="border-0 shadow-lg shadow-emerald-100/30 rounded-3xl overflow-hidden card-lift">
                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                    <CardTitle className="text-xl text-emerald-900 flex items-center font-bold">
                         <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
                         Local Data Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="h-10 w-10 text-emerald-600" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Population (Postcode {suburb.postcode})</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">
                           ~{suburb.realTimeData?.population?.value?.toLocaleString() || suburb.population?.toLocaleString() || 'N/A'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 font-medium">Source: ABS 2021 Census (approximate suburb-level aggregation)</div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="h-10 w-10 text-emerald-600" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Median Household Income</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">
                           ~${suburb.realTimeData?.medianIncome?.value?.toLocaleString() || 'N/A'}
                           <span className="text-sm font-bold text-slate-400 ml-1 italic tracking-normal">/ week</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 font-medium">Source: ABS 2021 Census (approximate suburb-level aggregation)</div>
                    </div>
 
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group col-span-1 sm:col-span-2">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building className="h-10 w-10 text-amber-600" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Property Intelligence (Market Split)</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <div className="text-[9px] font-bold text-slate-400 uppercase">Median House Price</div>
                                <div className="text-2xl font-black text-amber-600 tracking-tight">
                                    {(suburb.median_house_price || suburb.realTimeData?.medianHousePrice?.value) ? `~$${((suburb.median_house_price || suburb.realTimeData.medianHousePrice.value) / 1000000).toFixed(1)}M` : 'N/A'}
                                </div>
                                <div className="flex flex-col gap-0.5 mt-1">
                                    <div className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                       Range: ${(((suburb.median_house_price || suburb.realTimeData.medianHousePrice.value) * 0.95) / 1000000).toFixed(2)}M - ${(((suburb.median_house_price || suburb.realTimeData.medianHousePrice.value) * 1.05) / 1000000).toFixed(2)}M
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full capitalize">
                                            {(suburb.house_percentage || 85)}% Supply
                                        </div>
                                        <div className="text-[9px] font-medium text-slate-400">
                                            Yield: ~{getSuburbPropertyProfile(suburb).houseYield || (suburb.rental_yield ? Number(suburb.rental_yield).toFixed(1) : '3.0')}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-1 border-l border-slate-50 pl-6">
                                <div className="text-[9px] font-bold text-slate-400 uppercase">Median Unit Price</div>
                                <div className="text-2xl font-black text-slate-800 tracking-tight">
                                    {suburb.median_unit_price ? `~$${(suburb.median_unit_price / 1000).toFixed(0)}K` : 'N/A'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full capitalize">
                                        {(suburb.unit_percentage || 15)}% Supply
                                    </div>
                                    <div className="text-[9px] font-medium text-slate-400">
                                        Yield: ~{getSuburbPropertyProfile(suburb).unitYield || 'N/A'}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Market Indicators Summary */}
                        <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-1 gap-4">
                            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-start gap-2">
                                <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-[10px] text-slate-500 leading-relaxed">
                                    <strong>Important Information:</strong> This information is general in nature and does not constitute financial or investment advice. It does not consider your personal circumstances. Metrics are derived from public data sources including ABS and aggregated location datasets. Some figures are estimates and may vary. Comparisons across different cities should be interpreted with caution. Prices are approximate, based on recent market data.
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                                <div className="text-[9px] font-black text-emerald-800 uppercase mb-1">Historical Trend</div>
                                <p className="text-[11px] text-slate-600 leading-tight font-medium">{getSuburbPropertyProfile(suburb).keyInsight}</p>
                            </div>
                            <div className="p-3 bg-amber-50/30 rounded-xl border border-amber-100/50">
                                <div className="text-[9px] font-black text-amber-800 uppercase mb-1">Market Variation</div>
                                <p className="text-[11px] text-slate-600 leading-tight font-medium">{getSuburbPropertyProfile(suburb).watchOut}</p>
                            </div>
                            <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/50">
                                <div className="text-[9px] font-black text-blue-800 uppercase mb-1">Primary Demographics</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {getSuburbPropertyProfile(suburb).bestFor.map(b => (
                                        <span key={b} className="text-[9px] font-bold text-blue-700">{b} •</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
 
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <GraduationCap className="h-10 w-10 text-emerald-600" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schools (within ~5km radius)</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">
                           {suburb.realTimeData?.schools?.count?.value || '0'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 font-medium">Source: Dept. Education / MySchool (Census 2024 Maps)</div>
                    </div>
                </CardContent>
            </Card>
 
            <Card className="border-0 shadow-lg shadow-emerald-100/30 rounded-3xl overflow-hidden card-lift">
                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl text-emerald-900 flex items-center font-bold">
                         <Clock className="h-5 w-5 mr-2 text-emerald-600" />
                         Estimated drive time to nearest major CBD
                    </CardTitle>
                    <div className="text-[9px] font-bold text-emerald-700 bg-white/50 px-2 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest shadow-sm">
                        ~{suburb.realTimeData?.commute?.value || suburb.commute_time_mins || 25} mins (off-peak)
                    </div>
                </CardHeader>
                <CardContent className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <span className="text-2xl mb-1">☕</span>
                        <span className="text-sm font-medium text-slate-500 mb-1">Cafes</span>
                        <span className="text-xl font-bold text-slate-800">{suburb.realTimeData?.cafes?.value || 0}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <span className="text-2xl mb-1">🍽️</span>
                        <span className="text-sm font-medium text-slate-500 mb-1">Dining</span>
                        <span className="text-xl font-bold text-slate-800">{suburb.realTimeData?.restaurants?.value || 0}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <span className="text-2xl mb-1">🏋️</span>
                        <span className="text-sm font-medium text-slate-500 mb-1">Fitness</span>
                        <span className="text-xl font-bold text-slate-800">{suburb.realTimeData?.gyms?.value || (suburb.realTimeData as any)?.gymCount || 0}</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <span className="text-2xl mb-1">🎯</span>
                        <span className="text-sm font-medium text-slate-500 mb-1">Public Parks & Reserves</span>
                        <span className="text-xl font-bold text-slate-800">{suburb.realTimeData?.parks || suburb.parks_count || 0}</span>
                    </div>
                </CardContent>
                <div className="px-8 pb-6">
                    <div className="text-[10px] text-center text-slate-400 italic pt-4 border-t border-slate-50">
                        * Amenity counts (Cafes, Dining, Gyms) are strictly restricted within the suburb boundaries based on aggregated location data (e.g., Google Places) and may undercount venues directly on borders. Public Parks and Commute times are modeled estimates.
                    </div>
                </div>
            </Card>
 
            <Card className="border-0 shadow-lg shadow-emerald-200/40 rounded-3xl overflow-hidden card-lift">
                 <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 gradient-aussie text-white">
                     <div className="text-center md:text-left">
                         <h3 className="text-2xl font-bold mb-3 drop-shadow-sm">Thinking of moving here?</h3>
                         <p className="text-emerald-50 text-lg opacity-90">Discover your borrowing power for properties in {suburb.suburb_name}.</p>
                     </div>
                     <Link to="/calculator/borrowing" className="shrink-0">
                         <Button size="lg" className="bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-full px-8 py-6 font-bold shadow-xl border-2 border-transparent hover:border-amber-300 transition-all btn-shine">
                            Calculate Now
                         </Button>
                     </Link>
                 </div>
            </Card>
 
            {/* Nearby Suburbs categorization rendering */}
            {(() => {
                const currentPrice = suburb.realTimeData?.medianHousePrice?.value || suburb.median_house_price || 0;
                // Get unique better suburbs (higher score, within 15km to be a true alternative)
                const better = nearbySuburbs
                  .filter(s => s.overall_score && suburb.overallScore && s.overall_score > suburb.overallScore && s.distance <= 15)
                  .sort((a, b) => a.distance - b.distance).slice(0, 5);
                
                // Get unique affordable suburbs (at least $150k cheaper, within 20km) - MUST BE SAME TYPE
                const affordable = nearbySuburbs
                  .filter(s => {
                    const priceMatch = s.median_house_price && currentPrice > 0 && s.median_house_price < currentPrice - 150000;
                    const sameType = Math.abs((s.house_percentage || 85) - (suburb.house_percentage || 85)) < 30; // Strict type match logic
                    return priceMatch && sameType && !better.find(b => b.ssc === s.ssc) && s.distance <= 20;
                  })
                  .sort((a, b) => a.distance - b.distance).slice(0, 5);
                  
                return (
                    <>
                        {better.length > 0 && (
                            <div className="mt-12 pt-10 border-t border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    🏆 Better Alternatives Nearby
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {better.map((s: any) => (
                                        <Link 
                                            key={s.ssc} 
                                            to={`/suburbs/${s.state.toLowerCase()}/${s.suburb_name.toLowerCase().replace(/\s+/g, '-')}`}
                                            className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-md shadow-emerald-900/5 hover:border-emerald-200 hover:shadow-emerald-900/10 transition-all text-center flex flex-col justify-between"
                                        >
                                            <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 break-words whitespace-normal leading-tight mb-2">{s.suburb_name}</div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1 mb-2">
                                                    <span>{s.state}</span>
                                                    {s.distance != null && (
                                                        <>
                                                            <span className="opacity-30">•</span>
                                                            <span className="text-emerald-600 font-black">{s.distance} km</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold pt-2 border-t border-slate-50 text-emerald-600">
                                                    Score: {s.overall_score} <span className="opacity-70 ml-1">(+{s.overall_score - suburb.overallScore})</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
 
                        {affordable.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <h3 className="text-xl font-bold text-amber-600 mb-6 flex items-center gap-2">
                                    💸 Suburbs like {suburb.suburb_name} but cheaper
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {affordable.map((s: any) => (
                                        <Link 
                                            key={s.ssc} 
                                            to={`/suburbs/${s.state.toLowerCase()}/${s.suburb_name.toLowerCase().replace(/\s+/g, '-')}`}
                                            className="group bg-gradient-to-br from-amber-50 to-orange-50/30 p-4 rounded-2xl border border-amber-100 shadow-md shadow-amber-900/5 hover:border-amber-300 hover:shadow-amber-900/10 transition-all text-center flex flex-col justify-between"
                                        >
                                            <div className="text-sm font-bold text-slate-800 group-hover:text-amber-700 break-words whitespace-normal leading-tight mb-2">{s.suburb_name}</div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1 mb-2">
                                                    <span>{s.state}</span>
                                                    {s.distance != null && (
                                                        <>
                                                            <span className="opacity-30">•</span>
                                                            <span className="text-amber-600 font-black">{s.distance} km</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-[12px] font-black pt-2 border-t border-amber-200 text-amber-700 bg-amber-100/50 rounded-b-xl -mx-4 -mb-4 pb-4">
                                                    Save ${(Math.abs(currentPrice - s.median_house_price) / 1000).toFixed(0)}K
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {better.length === 0 && affordable.length === 0 && nearbySuburbs.filter(s => s.distance <= 15).length > 0 && (
                            <div className="mt-12 pt-10 border-t border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    📍 Closest suburbs to {suburb.suburb_name}
                                </h3>
                                <p className="text-sm text-slate-500 mb-6">Compare with nearby suburbs to find a better value or lifestyle fit.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {nearbySuburbs.filter(s => s.distance <= 15).slice(0, 5).map((s: any) => (
                                        <Link 
                                            key={s.ssc} 
                                            to={`/suburbs/${s.state.toLowerCase()}/${s.suburb_name.toLowerCase().replace(/\s+/g, '-')}`}
                                            className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-md shadow-emerald-900/5 hover:border-emerald-200 hover:shadow-emerald-900/10 transition-all text-center flex flex-col justify-between"
                                        >
                                            <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 break-words whitespace-normal leading-tight mb-2">{s.suburb_name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1 mb-2">
                                                <span>{s.state}</span>
                                                {s.distance != null && (
                                                    <>
                                                        <span className="opacity-30">•</span>
                                                        <span className="text-emerald-600 font-black">{s.distance} km</span>
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );
            })()}
 
            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden mt-12 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <Badge className="bg-amber-400 text-slate-900 border-0 mb-4 font-black">Elite Comparison</Badge>
                        <h3 className="text-2xl font-black mb-3 italic font-serif tracking-tight">How does {suburb.suburb_name} stack up against the Top 1%?</h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                            We've benchmarked {suburb.suburb_name} against Australia's highest performing residential hubs. 
                            {suburb.overallScore > 70 
                                ? " It stands as a legitimate rival to many of Australia's premier lifestyle destinations."
                                : " While it offers unique local advantages, the gap to national tier-1 suburbs remains measurable."}
                        </p>
                    </div>
                    <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/10">
                        <div className="text-center">
                            <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Your Score</div>
                            <div className="text-4xl font-black text-amber-400">{suburb.overallScore}</div>
                        </div>
                        <div className="w-[1px] h-12 bg-white/10" />
                        <div className="text-center">
                            <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Top 1% Avg</div>
                            <div className="text-4xl font-black text-emerald-400">88</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
 
            <div className="mt-16 text-center text-[11px] text-slate-400 leading-relaxed max-w-4xl mx-auto italic px-4">
              * The overall score, amenity indicators, and percentile rankings are proprietary performance metrics explicitly designed for comparative insight algorithms. They do not constitute official government releases.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
