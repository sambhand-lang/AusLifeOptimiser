
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { CostOfLivingTable } from '@/components/calculators/CostOfLivingTable';

export function CostOfLivingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-28 pb-12">
      <Card id="calculator" className="w-full max-w-4xl border-emerald-200 shadow-lg mb-8 scroll-mt-24">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-emerald-600 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-6 w-6" />
            Cost of Living Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CostOfLivingTable />
        </CardContent>
      </Card>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-emerald-800">About Aussie Life Optimizer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              We're building free, data-driven tools to help Australians — especially renters, families, and newcomers — make smarter decisions about where and how they live.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our calculators use publicly available data from sources like realestate.com.au, Domain, Numbeo, and Transport NSW (Feb 2026 estimates). All results are indicative — always verify with official sources before making major decisions.
            </p>
            <p className="text-emerald-700 font-medium italic">
              Starting with a Sydney focus, we're expanding to cover all major Australian cities and suburbs.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-emerald-800">Data Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex border-b border-slate-50 pb-2">
              <span className="font-semibold text-slate-700 w-32">Median rents:</span>
              <span className="text-slate-600">realestate.com.au, Domain, PropTrack</span>
            </div>
            <div className="flex border-b border-slate-50 pb-2">
              <span className="font-semibold text-slate-700 w-32">Cost of living:</span>
              <span className="text-slate-600">Numbeo (Feb 2026)</span>
            </div>
            <div className="flex border-b border-slate-50 pb-2">
              <span className="font-semibold text-slate-700 w-32">Transport:</span>
              <span className="text-slate-600">Transport NSW, PTV, Translink</span>
            </div>
            <div className="flex border-b border-slate-50 pb-2">
              <span className="font-semibold text-slate-700 w-32">Suburb data:</span>
              <span className="text-slate-600">ABS, local council reports</span>
            </div>
            <p className="text-xs text-slate-400 mt-4 italic">
              Last updated: Feb 2026. Data is sourced from public reports and market estimates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CostOfLivingPage;
