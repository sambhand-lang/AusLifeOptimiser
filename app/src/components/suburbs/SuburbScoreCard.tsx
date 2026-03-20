import React from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ScoreBreakdown {
  affordability?: number;
  employment?: number;
  commute?: number;
  schools?: number;
  lifestyle?: number;
}

interface SuburbScoreCardProps {
  suburbName: string;
  state: string;
  overallScore: number;
  scoreBreakdown?: ScoreBreakdown;
  rank?: number;
  totalSuburbs?: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "from-emerald-400 to-emerald-600";
  if (score >= 60) return "from-amber-300 to-amber-500";
  return "from-rose-400 to-red-600";
}

const breakdownLabels: { key: keyof ScoreBreakdown; label: string; color: string; description: string }[] = [
  { key: "affordability", label: "Affordability", color: "bg-emerald-400", description: "Based on median house prices, rent, and local income levels." },
  { key: "employment", label: "Employment", color: "bg-amber-400", description: "Based on median weekly household income and local economic activity." },
  { key: "commute", label: "Commute", color: "bg-cyan-400", description: "Analysis of driving times and public transport proximity to CBD." },
  { key: "schools", label: "Schools", color: "bg-blue-400", description: "Density of primary and secondary schools within the suburb area." },
  { key: "lifestyle", label: "Lifestyle", color: "bg-pink-400", description: "Richness of amenities: Parks, Cafes, Recreation, and Walkability." },
];

export const SuburbScoreCard: React.FC<SuburbScoreCardProps> = ({
  suburbName,
  state,
  overallScore,
  scoreBreakdown = {},
  rank,
  totalSuburbs
}) => {
  const scoreColor = getScoreColor(overallScore);

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 flex flex-col items-center gap-6 transition-all duration-300">
      {/* Score Badge */}
      <div className={`relative w-32 h-32 flex items-center justify-center rounded-full bg-gradient-to-br ${scoreColor} shadow-xl mb-2`}>
        <span className="text-5xl font-extrabold text-white drop-shadow-lg">{overallScore}</span>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white/80 tracking-wide">Score</span>
      </div>
      {/* Suburb Info */}
      <div className="text-center">
        <div className="text-xl font-bold text-emerald-700">{suburbName}</div>
        <div className="text-sm text-emerald-400 font-medium">{state}</div>
        {rank && totalSuburbs && (
          <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {(() => {
                // Approximate valid suburbs by assuming maybe 8,000 score effectively >0
                // Use a ceiling bracket of 5 for a cleaner look (Top 5%, Top 10%, Top 15%)
                 const bracket = Math.max(1, Math.min(100, (rank / totalSuburbs) * 100));
                 const cleanBracket = Math.max(1, Math.ceil(bracket / 5) * 5);
                 return `TOP ${cleanBracket}% IN AUSTRALIA`;
            })()}
          </div>
        )}
      </div>
      {/* Breakdown Bars */}
      <div className="w-full flex flex-col gap-3">
        {breakdownLabels.map(({ key, label, color }) => {
          const value = scoreBreakdown[key];
          if (value == null) return null;
          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{label}</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-3 w-3 text-slate-300 hover:text-slate-500 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-800 text-white text-[10px] border-0 rounded-lg shadow-xl">
                                {key === 'commute' ? (
                                    value >= 80 ? "Under 20 mins to nearest major employment hub" :
                                    value >= 50 ? "30-45 mins to nearest major employment hub" :
                                    "Limited public transport / 45+ mins to major hub"
                                ) : breakdownLabels.find(l => l.key === key)?.description}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <span className="text-xs font-bold text-emerald-600">{Math.round(value)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${color}`}
                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
