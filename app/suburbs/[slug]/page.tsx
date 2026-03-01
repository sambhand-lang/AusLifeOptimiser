
export const dynamic = 'force-dynamic';
export const revalidate = 86400;
import { notFound } from 'next/navigation';
import { getSuburbBySlug } from '@/lib/suburbs';
import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';
import { Button } from '@/components/ui/button';
import { MapPin, Wallet, Percent, Car, School } from 'lucide-react';
import Link from 'next/link';

export default async function SuburbDetailPage({ params }: { params: { slug: string } }) {
  const suburb = getSuburbBySlug(params.slug);
  if (!suburb) return notFound();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-emerald-50 to-white py-8 px-2">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Suburb Name & State */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
          <MapPin className="h-6 w-6 text-emerald-500" />
          <h1 className="text-3xl font-bold text-emerald-700 text-center sm:text-left">{suburb.suburb_name}</h1>
          <span className="text-lg text-emerald-400 font-semibold">{suburb.state}</span>
        </div>
        {/* Large Score Badge */}
        {suburb.overallScore && (
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-100 text-emerald-700 text-4xl font-extrabold px-10 py-6 shadow-lg border-4 border-emerald-300">
              {suburb.overallScore}
            </div>
          </div>
        )}
        {/* Breakdown Grid */}
        {suburb.scoreBreakdown && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
            {Object.entries(suburb.scoreBreakdown).map(([key, value]) => (
              <div key={key} className="bg-white rounded-xl shadow border border-emerald-100 p-3 flex flex-col items-center">
                <span className="text-xs text-slate-500 font-semibold mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className="text-lg font-bold text-emerald-700">{value}</span>
              </div>
            ))}
          </div>
        )}
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
          <div className="flex items-center gap-2 p-4 bg-white rounded-xl shadow border border-emerald-100">
            <Wallet className="h-5 w-5 text-emerald-400" />
            <span className="font-medium text-slate-700">Median Income:</span>
            <span className="font-bold text-emerald-700">{suburb.medianIncome ? `$${suburb.medianIncome.toLocaleString()}` : "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 p-4 bg-white rounded-xl shadow border border-emerald-100">
            <Percent className="h-5 w-5 text-emerald-400" />
            <span className="font-medium text-slate-700">Employment Rate:</span>
            <span className="font-bold text-emerald-700">{suburb.employmentRate != null ? `${suburb.employmentRate}%` : "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 p-4 bg-white rounded-xl shadow border border-emerald-100">
            <Car className="h-5 w-5 text-emerald-400" />
            <span className="font-medium text-slate-700">Commute (min):</span>
            <span className="font-bold text-emerald-700">{suburb.commuteTime != null ? suburb.commuteTime : "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 p-4 bg-white rounded-xl shadow border border-emerald-100">
            <School className="h-5 w-5 text-emerald-400" />
            <span className="font-medium text-slate-700">Schools:</span>
            <span className="font-bold text-emerald-700">{suburb.schoolsCount != null ? suburb.schoolsCount : "N/A"}</span>
          </div>
        </div>
        {/* Compare Button */}
        <div className="flex justify-center mt-8">
          <Link href={`/suburbs/compare?sub1=${params.slug}`} passHref legacyBehavior>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full px-8 py-4 text-lg font-semibold flex items-center gap-2 shadow-none"
            >
              <MapPin className="h-5 w-5 mr-2 text-emerald-500" />
              Compare this suburb
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
