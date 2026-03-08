import { Link } from 'react-router-dom';
import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';
import { MapPin, ArrowRight, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SuburbRankings() {
   // hardcoded standard list for the rankings page as an entrypoint
   const mockRankings = [
       { suburbName: 'Sydney', state: 'NSW', overallScore: 92, scoreBreakdown: { affordability: 80, employment: 95, commute: 88, schools: 90, lifestyle: 93 } },
       { suburbName: 'Melbourne', state: 'VIC', overallScore: 89, scoreBreakdown: { affordability: 78, employment: 90, commute: 85, schools: 88, lifestyle: 91 } },
       { suburbName: 'Brisbane', state: 'QLD', overallScore: 85, scoreBreakdown: { affordability: 82, employment: 87, commute: 80, schools: 86, lifestyle: 88 } },
       { suburbName: 'Parramatta', state: 'NSW', overallScore: 82, scoreBreakdown: { affordability: 85, employment: 88, commute: 75, schools: 80, lifestyle: 81 } },
   ];

   return (
       <div className="pt-28 pb-12 bg-slate-50/50 min-h-screen">
         <div className="container mx-auto px-4 max-w-6xl">
           <div className="text-center mb-16">
               <Badge className="bg-amber-100 text-amber-900 mb-6 px-4 py-1.5 text-sm font-bold tracking-wide uppercase border border-amber-200">
                   <Trophy className="h-4 w-4 inline mr-2 text-amber-600" />
                   Official Rankings
               </Badge>
               <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 mb-6 font-serif tracking-tight">
                   Best Suburbs in Australia
               </h1>
               <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                   Explore the highest scoring locations across the country based on affordability, employment, commute, schools, and lifestyle.
               </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {mockRankings.map((suburb, idx) => (
                  <Link to={`/suburbs/${suburb.state.toLowerCase()}/${suburb.suburbName.toLowerCase()}`} key={idx} className="group block focus:outline-none focus:ring-4 ring-emerald-200 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 card-lift">
                      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 h-full flex flex-col relative">
                          <div className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
                              #{idx + 1}
                          </div>
                          <div className="p-4 pt-12">
                             <SuburbScoreCard 
                                suburbName={suburb.suburbName}
                                state={suburb.state}
                                overallScore={suburb.overallScore}
                                scoreBreakdown={suburb.scoreBreakdown}
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
         </div>
       </div>
   );
}
