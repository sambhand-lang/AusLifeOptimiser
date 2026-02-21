import { useState, useEffect } from 'react';
import { 
  Calculator, 
  Home, 
  TrendingUp, 
  PiggyBank, 
  Receipt, 
  MapPin,
  Menu,
  X,
  ExternalLink,
  Heart,
  ChevronRight,
  Star,
  Shield,
  Zap,
  Users,
  Award,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HomeLoanCalculator } from '@/components/calculators/HomeLoanCalculator';
import { StampDutyCalculator } from '@/components/calculators/StampDutyCalculator';
import { BorrowingPowerCalculator } from '@/components/calculators/BorrowingPowerCalculator';
import { SavingsCalculator } from '@/components/calculators/SavingsCalculator';
import { TaxCalculator } from '@/components/calculators/TaxCalculator';
import { SuburbComparison } from '@/components/calculators/SuburbComparison';
import './App.css';

type CalculatorType = 'home' | 'stampduty' | 'borrowing' | 'savings' | 'tax' | 'suburb';

interface CalculatorInfo {
  id: CalculatorType;
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

const calculators: CalculatorInfo[] = [
  {
    id: 'home',
    name: 'Home Loan Repayment',
    shortName: 'Home Loan',
    description: 'Calculate mortgage repayments with extra payment options and amortization charts',
    icon: <Home className="h-6 w-6" />,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Popular',
  },
  {
    id: 'stampduty',
    name: 'Stamp Duty Calculator',
    shortName: 'Stamp Duty',
    description: 'Calculate stamp duty for all 8 Australian states and territories',
    icon: <Receipt className="h-6 w-6" />,
    color: 'from-amber-500 to-orange-500',
    badge: 'Essential',
  },
  {
    id: 'borrowing',
    name: 'Borrowing Power',
    shortName: 'Borrowing',
    description: 'Find out how much you can borrow based on your income and expenses',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'from-blue-500 to-indigo-600',
    badge: 'Popular',
  },
  {
    id: 'savings',
    name: 'Savings Calculator',
    shortName: 'Savings',
    description: 'Plan your savings goals with compound interest projections',
    icon: <PiggyBank className="h-6 w-6" />,
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'tax',
    name: 'Income Tax Calculator',
    shortName: 'Tax',
    description: 'Calculate your take-home pay and tax obligations',
    icon: <Receipt className="h-6 w-6" />,
    color: 'from-rose-500 to-red-600',
  },
  {
    id: 'suburb',
    name: 'Suburb Comparison',
    shortName: 'Suburbs',
    description: 'Compare cost of living across Australian suburbs',
    icon: <MapPin className="h-6 w-6" />,
    color: 'from-cyan-500 to-blue-600',
    badge: 'New',
  },
];

const features = [
  {
    icon: <Shield className="h-8 w-8" />,
    title: '100% Free Forever',
    description: 'No hidden fees, no subscriptions, no sign-ups required. All calculators are completely free.',
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'Lightning Fast',
    description: 'Instant calculations in your browser. No waiting, no server delays.',
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: 'Accurate & Current',
    description: 'Using 2024-25 Australian tax rates, stamp duty rules, and interest rates.',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Built for Aussies',
    description: 'Designed specifically for Australians with local data and regulations.',
  },
];

const stats = [
  { value: '6', label: 'Free Calculators', suffix: '' },
  { value: '8', label: 'States Covered', suffix: '' },
  { value: '25', label: 'Suburbs', suffix: '+' },
  { value: '100', label: 'Free Forever', suffix: '%' },
];

function App() {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'home':
        return <HomeLoanCalculator />;
      case 'stampduty':
        return <StampDutyCalculator />;
      case 'borrowing':
        return <BorrowingPowerCalculator />;
      case 'savings':
        return <SavingsCalculator />;
      case 'tax':
        return <TaxCalculator />;
      case 'suburb':
        return <SuburbComparison />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveCalculator(null)}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-xl gradient-aussie flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                <Star className="h-3 w-3 text-amber-900 fill-amber-900" />
              </div>
            </div>
            <div>
              <h1 className={`font-bold text-xl leading-tight ${scrolled ? 'text-slate-800' : 'text-white'}`}>
                <span className={`${scrolled ? 'text-amber-600' : 'text-amber-400'}`}>Australian</span> <span className={`${scrolled ? 'text-emerald-600' : 'text-emerald-400'}`}>Life Optimiser</span>
              </h1>
              <p className={`text-xs font-medium ${scrolled ? 'text-slate-500' : 'text-slate-300'}`}>Free Australian Calculators</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {calculators.slice(0, 4).map((calc) => (
              <Button
                key={calc.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCalculator(calc.id)}
                className={`gap-2 rounded-full px-4 transition-all ${
                  activeCalculator === calc.id
                    ? 'bg-amber-100 text-amber-700'
                    : `hover:bg-slate-100 ${scrolled ? 'text-slate-800' : 'text-amber-300'}`
                }`}
              >
                {calc.icon}
                <span className="font-medium">{calc.shortName}</span>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCalculator('suburb')}
              className={`gap-2 rounded-full px-4 hover:bg-slate-100 ${scrolled ? 'text-slate-800' : 'text-amber-300'}`}
            >
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Suburbs</span>
            </Button>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCalculator('home')}
              className={scrolled ? 'text-slate-800' : 'text-amber-300'}
            >
              Calculators
            </Button>
            <Button 
              size="sm"
              onClick={() => setActiveCalculator('borrowing')}
              className="gradient-aussie text-white rounded-full px-6 hover:opacity-90 btn-shine"
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`lg:hidden rounded-xl ${scrolled ? 'text-slate-800' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t shadow-xl">
            <div className="container mx-auto px-4 py-6 space-y-2">
              {calculators.map((calc) => (
                <button
                  key={calc.id}
                  onClick={() => {
                    setActiveCalculator(calc.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    activeCalculator === calc.id 
                      ? 'bg-emerald-50 border-2 border-emerald-200' 
                      : 'hover:bg-slate-50 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${calc.color} flex items-center justify-center text-white shadow-lg`}>
                    {calc.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-slate-800">{calc.name}</div>
                    <div className="text-sm text-slate-500">{calc.shortName}</div>
                  </div>
                  {calc.badge && (
                    <Badge className="bg-amber-400 text-amber-900 border-0">
                      {calc.badge}
                    </Badge>
                  )}
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {activeCalculator ? (
          <div className="pt-28 pb-12 bg-slate-50/50 min-h-screen">
            <div className="container mx-auto px-4">
              {/* Back Button */}
              <button
                onClick={() => setActiveCalculator(null)}
                className="group flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-6"
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </div>
                <span className="font-medium">Back to all calculators</span>
              </button>

              {/* Calculator Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${calculators.find(c => c.id === activeCalculator)?.color} flex items-center justify-center text-white shadow-xl`}>
                    {calculators.find(c => c.id === activeCalculator)?.icon}
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
                      {calculators.find(c => c.id === activeCalculator)?.name}
                    </h2>
                  </div>
                </div>
                <p className="text-lg text-slate-600 max-w-2xl">
                  {calculators.find(c => c.id === activeCalculator)?.description}
                </p>
              </div>

              {/* Calculator Component */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderCalculator()}
              </div>
            </div>
          </div>
        ) : (
          /* Home Page */
          <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="/hero-australia.jpg" 
                  alt="Australian landscape" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/30" />
              </div>

              {/* Content */}
              <div className="container mx-auto px-4 relative z-10 pt-24">
                <div className="max-w-3xl">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                    <Heart className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="text-white/90 text-sm font-medium">100% Free - No Sign Up Required</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                    Australian Financial{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                      Calculators
                    </span>
                  </h1>

                  {/* Description */}
                  <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                    Free, accurate calculators designed for Australians. From home loans to tax, 
                    make informed financial decisions with confidence.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-4 mb-12">
                    <Button 
                      size="lg" 
                      onClick={() => setActiveCalculator('home')}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-8 py-6 text-lg font-semibold btn-shine shadow-xl shadow-amber-400/30"
                    >
                      <Home className="h-5 w-5 mr-2" />
                      Calculate Home Loan
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => setActiveCalculator('stampduty')}
                      className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg backdrop-blur-sm"
                    >
                      <Receipt className="h-5 w-5 mr-2" />
                      Stamp Duty
                    </Button>
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex flex-wrap items-center gap-6 text-white/70">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm">2024-25 Rates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm">All 8 States</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm">Instant Results</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scroll Indicator */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                  <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white relative">
              <div className="absolute inset-0 pattern-dots opacity-50" />
              <div className="container mx-auto px-4 relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-5xl md:text-6xl font-bold text-gradient mb-2 stat-number">
                        {stat.value}{stat.suffix}
                      </div>
                      <div className="text-slate-600 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-slate-50">
              <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">
                    Why Choose Us
                  </Badge>
                  <h2 className="text-4xl font-bold text-slate-800 mb-4">
                    Built for <span className="text-gradient">Australians</span>
                  </h2>
                  <p className="text-lg text-slate-600">
                    Our calculators use official Australian data and are designed with local regulations in mind.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {features.map((feature, index) => (
                    <Card key={index} className="card-lift border-0 shadow-xl shadow-slate-200/50 bg-white overflow-hidden group">
                      <CardContent className="p-8">
                        <div className="w-16 h-16 rounded-2xl gradient-aussie flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Calculators Grid Section */}
            <section className="py-20 relative overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 gradient-aussie-hero opacity-5" />
              
              <div className="container mx-auto px-4 relative">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 mb-4">
                    Our Calculators
                  </Badge>
                  <h2 className="text-4xl font-bold text-slate-800 mb-4">
                    Everything You Need
                  </h2>
                  <p className="text-lg text-slate-600">
                    From buying your first home to planning your savings, we've got you covered.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {calculators.map((calc) => (
                    <Card 
                      key={calc.id}
                      className="group cursor-pointer border-0 shadow-xl shadow-slate-200/50 bg-white overflow-hidden card-lift"
                      onClick={() => setActiveCalculator(calc.id)}
                    >
                      <CardContent className="p-0">
                        {/* Header with gradient */}
                        <div className={`h-24 bg-gradient-to-br ${calc.color} relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-white/10" />
                          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                          <div className="absolute top-4 left-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white shadow-lg">
                              {calc.icon}
                            </div>
                          </div>
                          {calc.badge && (
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-white/90 text-slate-800 border-0 shadow-lg">
                                {calc.badge}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">
                            {calc.name}
                          </h3>
                          <p className="text-slate-600 mb-4 line-clamp-2">{calc.description}</p>
                          
                          <div className="flex items-center text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                            <span>Open Calculator</span>
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
              <div className="container mx-auto px-4">
                <div className="relative rounded-3xl overflow-hidden">
                  {/* Background */}
                  <div className="absolute inset-0">
                    <img 
                      src="/finance-abstract.jpg" 
                      alt="Finance" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/95 to-emerald-800/80" />
                  </div>

                  <div className="relative py-16 px-8 md:px-16 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                      Ready to Calculate?
                    </h2>
                    <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                      Start using our free calculators to plan your financial future. 
                      No sign-up, no fees, just accurate results.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <Button 
                        size="lg"
                        onClick={() => setActiveCalculator('borrowing')}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-8 py-6 text-lg font-semibold btn-shine"
                      >
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Check Borrowing Power
                      </Button>
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => setActiveCalculator('tax')}
                        className="bg-transparent bg-transparent border-2 border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-lg"
                      >
                        <Receipt className="h-5 w-5 mr-2" />
                        Calculate Tax
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-slate-50">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-12">
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">
                      FAQ
                    </Badge>
                    <h2 className="text-4xl font-bold text-slate-800">
                      Frequently Asked Questions
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        q: 'Are these calculators accurate?',
                        a: 'Our calculators use official Australian tax brackets, stamp duty rates, and standard lending formulas. However, they provide estimates only. Always consult with a financial professional for advice specific to your situation.',
                      },
                      {
                        q: 'Do I need to create an account?',
                        a: 'No! All our calculators are completely free and require no sign-up or account creation. Just visit the site and start calculating.',
                      },
                      {
                        q: 'How often is the data updated?',
                        a: 'We update our data regularly to reflect changes in tax rates, stamp duty rules, and interest rates. Current data is for the 2024-25 financial year.',
                      },
                      {
                        q: 'Is my data secure?',
                        a: 'Absolutely! All calculations happen in your browser. We don\'t collect or store any of your personal information.',
                      },
                    ].map((faq, index) => (
                      <Card key={index} className="border-0 shadow-lg shadow-slate-200/50">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-bold text-slate-800 mb-2">{faq.q}</h3>
                          <p className="text-slate-600">{faq.a}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-aussie flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xl">Australian <span className="text-emerald-400">Life Optimiser</span></span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Free financial calculators for Australians. Plan your future with accurate, up-to-date tools.
              </p>
              <div className="flex items-center gap-2 text-amber-400">
                <Heart className="h-4 w-4 fill-amber-400" />
                <span className="text-sm">Made with love for Australia</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Calculators</h4>
              <ul className="space-y-3">
                {calculators.slice(0, 4).map((calc) => (
                  <li key={calc.id}>
                    <button 
                      onClick={() => setActiveCalculator(calc.id)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {calc.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><button onClick={() => setActiveCalculator('suburb')} className="text-slate-400 hover:text-emerald-400 transition-colors">Suburb Comparison</button></li>
                <li><a href="/legal/first-home-buyer.html" className="text-slate-400 hover:text-emerald-400 transition-colors">First Home Buyer Guide</a></li>
                <li><a href="/legal/property-market.html" className="text-slate-400 hover:text-emerald-400 transition-colors">Property Market</a></li>
                <li><a href="/legal/interest-rates.html" className="text-slate-400 hover:text-emerald-400 transition-colors">Interest Rates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="/legal/privacy.html" className="text-slate-400 hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/legal/terms.html" className="text-slate-400 hover:text-emerald-400 transition-colors">Terms of Use</a></li>
                <li><a href="/legal/disclaimer.html" className="text-slate-400 hover:text-emerald-400 transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 Australian Life Optimiser. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              For educational purposes only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
