import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield, Zap, Award, Heart, MapPin, Calculator } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-28 pb-20">
      <div className="w-full max-w-4xl px-4 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">
            About <span className="text-emerald-600">Aussie Life Optimizer</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We're building free, data-driven tools to help Australians — especially renters, families, and newcomers — make smarter decisions about where and how they live.
          </p>
        </section>

        {/* Our Mission */}
        <Card id="mission" className="border-emerald-100 shadow-xl overflow-hidden scroll-mt-24">
          <CardHeader className="bg-emerald-600 text-white p-8">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Heart className="h-7 w-7 fill-white/20" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 leading-relaxed text-slate-600">
                <p>
                  Finding a place to live in Australia is more challenging than ever. Between rising rents and complex cost-of-living calculations, it's easy to feel overwhelmed.
                </p>
                <p>
                  Aussie Life Optimizer was born out of a desire to bring transparency to the property market. We combine public data with intuitive interfaces to help you estimate costs before you commit to a move.
                </p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-600 text-white p-2 rounded-lg shrink-0"><Shield className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-bold text-slate-800">100% Free</h4>
                    <p className="text-sm text-slate-500">No paywalls, no subscriptions, no accounts. Just tools.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-amber-500 text-white p-2 rounded-lg shrink-0"><Zap className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-bold text-slate-800">Fast & Private</h4>
                    <p className="text-sm text-slate-500">Calculations happen in your browser. We don't save your financial data.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Focus & Expansion */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-rose-500" />
              Where We Are
            </h3>
            <p className="text-slate-600 leading-relaxed italic">
              "Starting with a Sydney focus, we're expanding to cover all major Australian cities and suburbs."
            </p>
            <p className="text-slate-600">
              Today, we cover major capitals like Sydney, Melbourne, and Brisbane, with more local council data being added every month to help families across the country.
            </p>
          </div>
          <div className="space-y-4">
            <h3 id="accuracy" className="text-2xl font-bold text-slate-800 flex items-center gap-2 scroll-mt-24">
              <Award className="h-6 w-6 text-amber-500" />
              Accuracy Notice
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Our calculators use publicly available data from sources like realestate.com.au, Domain, Numbeo, and Transport NSW (Feb 2026 estimates).
            </p>
            <p className="text-slate-500 text-sm bg-slate-100 p-4 rounded-xl">
              <span className="font-bold">Important:</span> All results are indicative. Always verify with official sources, bank statements, or professional financial advisors before making major decisions.
            </p>
          </div>
        </section>

        {/* Data Sources Grid */}
        <section id="data-sources" className="space-y-6 scroll-mt-24">
          <h3 className="text-2xl font-bold text-slate-800 text-center">Our Data Sources</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h5 className="font-bold text-slate-800 mb-2 underline decoration-emerald-200 decoration-4">Median Rents</h5>
              <p className="text-slate-500 text-sm">realestate.com.au<br/>Domain<br/>PropTrack</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h5 className="font-bold text-slate-800 mb-2 underline decoration-amber-200 decoration-4">Cost of Living</h5>
              <p className="text-slate-500 text-sm">Numbeo<br/>(Feb 2026 Estimates)</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h5 className="font-bold text-slate-800 mb-2 underline decoration-blue-200 decoration-4">Transport</h5>
              <p className="text-slate-500 text-sm">Transport NSW<br/>PTV (VIC)<br/>Translink (QLD)</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h5 className="font-bold text-slate-800 mb-2 underline decoration-pink-200 decoration-4">Suburb Data</h5>
              <p className="text-slate-500 text-sm">ABS<br/>Local Council Reports</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <div className="bg-slate-900 rounded-3xl p-10 text-center text-white space-y-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-3xl font-bold">Try our calculators today</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Ready to plan your next move? Explore our free tools and start optimizing your life in Australia.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
