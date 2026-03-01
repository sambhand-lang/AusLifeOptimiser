import { getTopRankedSuburbs } from '@/lib/suburbs';
import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';

export const dynamic = 'force-dynamic';

export default async function SuburbRankingsPage() {
  const suburbs = getTopRankedSuburbs(50);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-emerald-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-700 mb-8 text-center">Top 50 Suburbs by Score</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {suburbs.map((suburb: any) => (
            <SuburbScoreCard
              key={suburb.slug}
              suburbName={suburb.suburb_name}
              state={suburb.state}
              overallScore={suburb.overallScore}
              scoreBreakdown={suburb.scoreBreakdown}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
