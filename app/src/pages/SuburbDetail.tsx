import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, ChevronLeft, Building, Users, GraduationCap, Clock, CheckCircle2, XCircle, Search, Info } from 'lucide-react';
import { calculateSuburbScore, getSuburbInsights } from '@/utils/suburbScoring';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

export function SuburbDetail() {
  const navigate = useNavigate();
  const { state, name } = useParams<{ state: string; name: string }>();
  const [loading, setLoading] = useState(true);
  const [suburb, setSuburb] = useState<any | null>(null);
  const [nearbySuburbs, setNearbySuburbs] = useState<any[]>([]);
  const [compareQuery, setCompareQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

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
          const scored = calculateSuburbScore(detailData, benchmarks);
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
  }, [state, name]);

  if (loading) return <div className="p-12 text-center text-emerald-600 font-semibold animate-pulse pt-32">Loading {name}...</div>;
  if (!suburb) return <div className="p-12 text-center text-red-500 pt-32">Suburb not found in {state?.toUpperCase()}.</div>;

  const { strengths, weaknesses } = suburb ? getSuburbInsights(suburb) : { strengths: [], weaknesses: [] };

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
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-emerald-100/80 text-emerald-800 border-emerald-200">
                Postcode {suburb.postcode}
            </Badge>
            <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                {suburb.state}
            </Badge>
            {suburb.rank && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 font-bold">
                    <TrendingUp className="h-3 w-3" />
                    #{suburb.rank.toLocaleString()} in Australia
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
                    {strengths.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase mb-2 tracking-widest">Strengths</div>
                            <div className="space-y-2">
                                {strengths.map(s => (
                                    <div key={s.label} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-700 font-medium">{s.label} ({s.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {weaknesses.length > 0 && (
                        <div>
                            <div className="text-[10px] font-bold text-rose-600 uppercase mb-2 tracking-widest">Weaknesses</div>
                            <div className="space-y-2">
                                {weaknesses.map(w => (
                                    <div key={w.label} className="flex items-start gap-2">
                                        <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                                        <span className="text-sm text-slate-700 font-medium">{w.label} ({Math.round(w.value)})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
             </Card>

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
                           {suburb.realTimeData?.population?.value?.toLocaleString() || 'N/A'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 font-medium">Source: ABS 2021 Census</div>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="h-10 w-10 text-emerald-600" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Median Household Income</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">
                           ${suburb.realTimeData?.medianIncome?.value?.toLocaleString() || 'N/A'}
                           <span className="text-sm font-bold text-slate-400 ml-1 italic tracking-normal">/ week</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 font-medium">Source: ABS 2021 Census</div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Building className="h-10 w-10 text-amber-600" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Median House Price</div>
                        <div className="text-3xl font-black text-amber-600 tracking-tight">
                           {suburb.realTimeData?.medianHousePrice?.value ? `$${(suburb.realTimeData.medianHousePrice.value / 1000000).toFixed(1)}M` : 'N/A'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 font-medium">Source: Valuer General / PropTrack 2025</div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <GraduationCap className="h-10 w-10 text-emerald-600" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schools (Primary/Sec)</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">
                           {suburb.realTimeData?.schools?.count?.value || '0'}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-2 font-medium">Source: Dept. Education / MySchool</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-emerald-100/30 rounded-3xl overflow-hidden card-lift">
                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl text-emerald-900 flex items-center font-bold">
                         <TrendingUp className="h-5 w-5 mr-2 text-emerald-600" />
                         Lifestyle Score ({Math.round(suburb.scoreBreakdown?.lifestyle || 0)})
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-emerald-300" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="bg-slate-800 text-white max-w-xs text-[11px] leading-relaxed p-3 rounded-xl">
                                Lifestyle is calculated based on:
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                    <li>Green Space (Parks density per 10k people)</li>
                                    <li>Social Hubs (Cafes & Restaurants density)</li>
                                    <li>Recreation (Gyms, Cinemas, Libraries, Pitches)</li>
                                    <li>Connectivity (Postcode walkability/transit)</li>
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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
                        <span className="text-sm font-medium text-slate-500 mb-1">Recreation</span>
                        <span className="text-xl font-bold text-slate-800">{suburb.realTimeData?.recreation?.value || 0}</span>
                    </div>
                </CardContent>
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

            {/* Nearby Suburbs Section */}
            {nearbySuburbs.length > 0 && (
                <div className="mt-12 pt-12 border-t border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        Nearby Suburbs to Compare
                        <Badge variant="outline" className="text-[10px] text-slate-400">SEO Boost</Badge>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {nearbySuburbs.map((s: any) => (
                            <Link 
                                key={s.ssc} 
                                to={`/suburbs/${s.state.toLowerCase()}/${s.suburb_name.toLowerCase().replace(/\s+/g, '-')}`}
                                className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-md shadow-emerald-900/5 hover:border-emerald-200 hover:shadow-emerald-900/10 transition-all text-center"
                            >
                                <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 truncate mb-1">{s.suburb_name}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
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
          </div>
        </div>
      </div>
    </div>
  );
}
