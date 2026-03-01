import React from "react";

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
}

function getScoreColor(score: number): string {
  if (score >= 80) return "from-emerald-400 to-emerald-600";
  if (score >= 60) return "from-amber-300 to-amber-500";
  return "from-rose-400 to-red-600";
}

const breakdownLabels: { key: keyof ScoreBreakdown; label: string; color: string }[] = [
  { key: "affordability", label: "Affordability", color: "bg-emerald-400" },
  { key: "employment", label: "Employment", color: "bg-amber-400" },
  { key: "commute", label: "Commute", color: "bg-cyan-400" },
  { key: "schools", label: "Schools", color: "bg-blue-400" },
  { key: "lifestyle", label: "Lifestyle", color: "bg-pink-400" },
];

export const SuburbScoreCard: React.FC<SuburbScoreCardProps> = ({
  suburbName,
  state,
  overallScore,
  scoreBreakdown = {},
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
      </div>
      {/* Breakdown Bars */}
      <div className="w-full flex flex-col gap-3">
        {breakdownLabels.map(({ key, label, color }) => {
          const value = scoreBreakdown[key];
          if (value == null) return null;
          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-600">{label}</span>
                <span className="text-xs font-bold text-slate-700">{Math.round(value)}</span>
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
