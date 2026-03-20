import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';
import { MapPin, ArrowRight, Trophy, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateSuburbScore, DEFAULT_BENCHMARKS } from '@/utils/suburbScoring';
import { usePersona } from '@/context/PersonaContext';


const AUSTRALIAN_STATES = [
  { value: "all", label: "National (All Australia)" },
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "Northern Territory" },
];

export function SuburbRankings() {
   const [searchParams, setSearchParams] = useSearchParams();
    const [rankings, setRankings] = useState<any[]>([]);
    const { persona } = usePersona();
    const [loading, setLoading] = useState(true);

   const stateFilter = searchParams.get('state') || 'all';

   useEffect(() => {
     async function fetchRankings() {
       try {
         setLoading(true);
          const url = stateFilter !== 'all' 
             ? `/api/suburbs/rankings?state=${stateFilter}&limit=40` 
             : '/api/suburbs/rankings?limit=40';
          const res = await fetch(url);
          const data = await res.json();
          
          // Re-calculate scores based on current persona and re-sort
          const recalculated = (data.data || []).map((s: any) => {
              // Convert DB structure to what calculateSuburbScore expects if necessary
              // Actually, calculateSuburbScore handles some fallback fields
              return calculateSuburbScore(s, DEFAULT_BENCHMARKS, persona);
          });
          
          recalculated.sort((a: any, b: any) => b.overallScore - a.overallScore);
          setRankings(recalculated.slice(0, 16)); // Show top 16 for better grid
        } catch (err) {

         console.error('Failed to fetch rankings:', err);
       } finally {
         setLoading(false);
       }
     }
     fetchRankings();
   }, [stateFilter, persona]);


   const handleStateChange = (value: string) => {
     if (value === 'all') {
       searchParams.delete('state');
     } else {
       searchParams.set('state', value);
     }
     setSearchParams(searchParams);
   };

   return (
       <div className="pt-28 pb-12 bg-slate-50/50 min-h-screen">
         <div className="container mx-auto px-4 max-w-6xl">
           <div className="text-center mb-12">
               <Badge className="bg-amber-100 text-amber-900 mb-6 px-4 py-1.5 text-sm font-bold tracking-wide uppercase border border-amber-200">
                   <Trophy className="h-4 w-4 inline mr-2 text-amber-600" />
                   Official 2025 Rankings
               </Badge>
               <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 mb-6 font-serif tracking-tight">
                   Best Suburbs in {stateFilter === 'all' ? 'Australia' : AUSTRALIAN_STATES.find(s => s.value === stateFilter)?.label}
               </h1>
               <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
                   Explore the highest scoring locations across the country based on affordability, employment, commute, schools, and lifestyle.
               </p>

               {/* State Filter UI */}
               <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 max-w-xl mx-auto mb-16">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold px-4">
                     <Filter className="h-4 w-4 text-emerald-600" />
                     <span className="text-sm">Filter by State:</span>
                  </div>
                  <Select value={stateFilter} onValueChange={handleStateChange}>
                    <SelectTrigger className="w-full md:w-[240px] bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-emerald-500/20">
                      <SelectValue placeholder="Select a State" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-xl shadow-2xl border-slate-100">
                      <SelectGroup>
                        {AUSTRALIAN_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value} className="focus:bg-emerald-50 focus:text-emerald-900 rounded-lg">
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
               </div>
           </div>
           
           {loading ? (
              <div className="flex justify-center py-20 w-full col-span-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                  <p className="text-sm font-medium text-slate-400">Loading top locations...</p>
                </div>
              </div>
            ) : rankings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {rankings.map((suburb, idx) => (
                   <Link 
                    to={`/suburbs/${suburb.state.toLowerCase()}/${suburb.suburb_name.toLowerCase().replace(/\s+/g, '-')}`} 
                    key={idx} 
                    className="group block focus:outline-none focus:ring-4 ring-emerald-200 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 card-lift"
                   >
                       <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 h-full flex flex-col relative">
                           <div className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                               #{idx + 1}
                           </div>
                           <div className="p-4 pt-12">
                              <SuburbScoreCard 
                                 suburbName={suburb.suburb_name}
                                 state={suburb.state}
                                 overallScore={suburb.overallScore}
                                 scoreBreakdown={suburb.scoreBreakdown}
                                 rank={suburb.rank}
                                 totalSuburbs={suburb.total_suburbs}
                               />
                           </div>
                           <div className="mt-auto bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-t border-emerald-100 p-5 flex items-center justify-between group-hover:bg-emerald-100 transition-colors">
                              <span className="font-semibold text-emerald-800 text-sm flex items-center group-hover:text-emerald-900 transition-colors">
                                  <MapPin className="h-4 w-4 mr-2 opacity-70" />
                                  View Full Report
                              </span>
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow group-hover:bg-emerald-50 transition-all">
                                  <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                           </div>
                       </div>
                   </Link>
               ))}
              </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-500 text-lg">No rankings available for {stateFilter} yet.</p>
                </div>
            )}
         </div>
       </div>
   );
}
