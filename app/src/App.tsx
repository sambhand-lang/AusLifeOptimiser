import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { SuburbDetail } from '@/pages/SuburbDetail';
import { SuburbRankings } from '@/pages/SuburbRankings';
import { CostOfLivingPage } from '@/pages/CostOfLivingPage';
import { AboutPage } from '@/pages/AboutPage';
import {
  Calculator,
  Home,
  TrendingUp,
  PiggyBank,
  Receipt,
  MapPin,
  Menu,
  X,
  Heart,
  ChevronRight,
  Star,
  Shield,
  Zap,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  Globe,
  FileSearch,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CostOfLivingTable } from '@/components/calculators/CostOfLivingTable';
import { Badge } from '@/components/ui/badge';
import { HomeLoanCalculator } from '@/components/calculators/HomeLoanCalculator';
import { StampDutyCalculator } from '@/components/calculators/StampDutyCalculator';
import { BorrowingPowerCalculator } from '@/components/calculators/BorrowingPowerCalculator';
import { SavingsCalculator } from '@/components/calculators/SavingsCalculator';
import { TaxCalculator } from '@/components/calculators/TaxCalculator';
import { SuburbComparison2 } from '@/components/calculators/SuburbComparison2';
import { RentAffordabilityCalculator } from '@/components/calculators/RentAffordabilityCalculator';
import './App.css';
import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';
import { HeroSearch } from '@/components/suburbs/HeroSearch';
import { PersonaProvider, usePersona } from '@/context/PersonaContext';
import { PERSONA_CONFIG } from '@/utils/suburbScoring';
import type { Persona } from '@/utils/suburbScoring';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


type CalculatorType = 'home' | 'stampduty' | 'borrowing' | 'savings' | 'tax' | 'suburb' | 'costliving' | 'rentaffordability';

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
  {
    id: 'costliving',
    name: 'Cost of Living Comparison',
    shortName: 'Cost of Living',
    description: 'Compare key cost of living items between 8 major Australian cities',
    icon: <MapPin className="h-6 w-6" />,
    color: 'from-amber-500 to-emerald-600',
    badge: 'Popular',
  },
  {
    id: 'rentaffordability',
    name: 'Rent Affordability',
    shortName: 'Rent Calculator',
    description: 'Find out how much rent you can afford based on your income',
    icon: <Wallet className="h-6 w-6" />,
    color: 'from-emerald-400 to-teal-500',
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
  { value: '18,500', label: 'Suburbs Analysed', suffix: '+' },
  { value: '50,000', label: 'Monthly Calculations', suffix: '+' },
  { value: '8', label: 'States Covered', suffix: '' },
  { value: '100', label: 'Free Forever', suffix: '%' },
];

function InnerApp() {
  const { persona, setPersona } = usePersona();
  const currentPersona = PERSONA_CONFIG[persona];
  const navigate = useNavigate();

  const location = useLocation();
  const activeCalcParam = location.pathname.startsWith('/calculator/') ? location.pathname.split('/calculator/')[1] : null;
  const activeCalculatorPath = location.pathname === '/suburbs/compare' ? 'suburb' : activeCalcParam;
  const activeCalculator = activeCalculatorPath as CalculatorType | null;
  
  const setActiveCalculator = (calc: string | null) => {
    if (calc === null) navigate('/');
    else if (calc === 'suburb') navigate('/suburbs/compare');
    else navigate(`/calculator/${calc}`);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // Scroll logic
    if (!location.hash) {
      window.scrollTo(0, 0);
    } else {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

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
        return <SuburbComparison2 />;
      case 'costliving':
        return <CostOfLivingTable />;
      case 'rentaffordability':
        return <RentAffordabilityCalculator />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
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
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-full px-4 hover:bg-slate-100 ${scrolled ? 'text-slate-800' : 'text-amber-300'} flex items-center transition-all duration-200`}
              >
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Calculators</span>
                <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:rotate-90" />
              </Button>
              <div className="absolute left-0 top-[calc(100%-8px)] pt-4 min-w-[220px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-white border border-emerald-100 rounded-xl shadow-xl overflow-hidden">
                  <ul className="py-2">
                    {calculators.map((calc) => (
                      <li key={calc.id}>
                        <button
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150 flex items-center gap-3"
                          onClick={() => setActiveCalculator(calc.id)}
                        >
                          <span className="text-emerald-500 opacity-60">{calc.icon}</span>
                          <span className="font-medium">{calc.shortName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-full px-4 hover:bg-slate-100 ${scrolled ? 'text-slate-800' : 'text-amber-300'} flex items-center transition-all duration-200`}
              >
                <Home className="h-4 w-4" />
                <span className="font-medium">Home Buying</span>
                <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:rotate-90" />
              </Button>
              <div className="absolute left-0 top-[calc(100%-8px)] pt-4 min-w-[220px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-white border border-emerald-100 rounded-xl shadow-xl overflow-hidden">
                  <ul className="py-2">
                    <li>
                      <button
                        className="w-full text-left px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                        onClick={() => setActiveCalculator('borrowing')}
                      >
                        Borrowing Power
                      </button>
                    </li>
                    <li>
                      <button
                        className="w-full text-left px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                        onClick={() => setActiveCalculator('stampduty')}
                      >
                        Stamp Duty Calculator
                      </button>
                    </li>
                    <li>
                      <button
                        className="w-full text-left px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                        onClick={() => setActiveCalculator('home')}
                      >
                        Home Loan Repayments
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-full px-4 hover:bg-slate-100 ${scrolled ? 'text-slate-800' : 'text-amber-300'} flex items-center transition-all duration-200`}
              >
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Suburbs</span>
                <ChevronRight className="h-4 w-4 ml-1 transition-transform duration-200 group-hover:rotate-90" />
              </Button>
              <div className="absolute left-0 top-[calc(100%-8px)] pt-4 min-w-[200px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-white border border-emerald-100 rounded-xl shadow-xl overflow-hidden">
                  <ul className="py-2">
                    <li>
                      <Link
                        to="/suburbs/rankings"
                        className="block w-full text-left px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                      >
                        Suburb Rankings
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/cost-of-living"
                        className="block w-full text-left px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                      >
                        Cost of Living
                      </Link>
                    </li>
                    <li>
                      <button
                        className="w-full text-left px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                        onClick={() => setActiveCalculator('suburb')}
                      >
                        Compare Suburbs
                      </button>
                    </li>
                    <li>
                      <Link
                        to="/about#accuracy"
                        className="block w-full text-left px-4 py-3.5 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                      >
                        Ranking Methodology
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCalculator('savings')}
              className={`gap-2 rounded-full px-4 hover:bg-slate-100 ${scrolled ? 'text-slate-800' : 'text-amber-300'} transition-all`}
            >
              <PiggyBank className="h-4 w-4" />
              <span className="font-medium">Savings</span>
            </Button>
            
            <Link to="/about">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 rounded-full px-4 hover:bg-slate-100 ${scrolled ? 'text-slate-800' : 'text-amber-300'} transition-all`}
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">About</span>
              </Button>
            </Link>

            <div className="h-8 w-[1px] bg-white/20 mx-2 hidden lg:block" />

            <div className="relative group">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-3 rounded-full px-5 border-2 transition-all duration-300 shadow-md transform hover:scale-105 ${
                      scrolled 
                        ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700' 
                        : 'bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="flex flex-col items-start leading-none gap-0.5">
                      <span className="text-[10px] uppercase tracking-widest opacity-70 font-bold">Your Goal</span>
                      <span className="font-bold">{currentPersona.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 rotate-90 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 p-2 bg-white/95 backdrop-blur-xl border-emerald-100 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 border-b border-emerald-50 mb-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Personalize Your Score</h4>
                    <p className="text-[11px] text-slate-500 mt-1">We recalculate all suburb rankings based on what matters most to you.</p>
                  </div>
                  {(Object.keys(PERSONA_CONFIG) as Persona[]).map((pKey) => (
                    <DropdownMenuItem
                      key={pKey}
                      onClick={() => setPersona(pKey)}
                      className={`p-3 rounded-xl cursor-pointer transition-all mb-1 ${
                        persona === pKey ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold flex items-center gap-2">
                          {PERSONA_CONFIG[pKey].label}
                          {persona === pKey && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                        </span>
                        <span className={`text-[10px] mt-0.5 ${persona === pKey ? 'opacity-80' : 'text-slate-500'}`}>
                          {PERSONA_CONFIG[pKey].description}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => setActiveCalculator('borrowing')}
              className="gradient-aussie text-white rounded-full px-6 hover:opacity-90 btn-shine"
            >
              Start Planning
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
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeCalculator === calc.id
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
        <Routes>
          <Route path="/suburbs/rankings" element={<SuburbRankings />} />
          <Route path="/suburbs/:state/:name" element={<SuburbDetail />} />
          <Route path="/cost-of-living" element={<CostOfLivingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={
            <>
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

                  {/* Headline Hook - Growth Optimized */}
                  <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 animate-in fade-in slide-in-from-left duration-700">
                    Find the Best Suburb You <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                      Actually Afford
                    </span> in 30 Seconds
                  </h1>

                  {/* Description - Curiosity Trigger */}
                  <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl leading-relaxed whitespace-pre-line">
                    Stop overpaying by $300k. Discover Australia's hidden residential gems 
                    using real-time data on schools, commute, and growth.
                  </p>

                  {/* Hero Search Bar with Smart Prompts */}
                  <div className="relative z-20">
                    <HeroSearch />
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/80 animate-in fade-in slide-in-from-top-2 duration-1000 delay-500">
                      <span className="font-bold text-amber-500/90 tracking-widest uppercase text-[10px] mt-1">Try:</span>
                      <button onClick={() => navigate('/suburbs/rankings')} className="hover:text-amber-400 transition-colors underline decoration-white/20 underline-offset-4">Best suburbs under $1M</button>
                      <button onClick={() => setPersona('family')} className="hover:text-amber-400 transition-colors underline decoration-white/20 underline-offset-4">Family-friendly near Sydney</button>
                      <button onClick={() => setPersona('lifestyle_seeker')} className="hover:text-amber-400 transition-colors underline decoration-white/20 underline-offset-4">High growth NSW</button>
                    </div>
                  </div>

                   {/* PERSONALIZED TRENDING SEEDS & VIRAL LOOPS */}
                  <div className="mt-12 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                      <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest ">
                        {persona === 'balanced' ? 'Trending Decisions' : `Hand-Picked for your Goal: ${currentPersona.label}`} ⚡
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        <Zap className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight">
                          {persona === 'family' ? 'Baulkham Hills is in Top 5% for families' : 
                           persona === 'professional' ? 'Parramatta commute is 23% faster than average' : 
                           'Sydney market updated 2 hours ago'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {(persona === 'family' ? [
                        { name: 'Baulkham Hills', state: 'NSW', score: 57, tag: 'Family Hub', alternative: false },
                        { name: 'Vermont South', state: 'VIC', score: 50, tag: 'Elite Schools', alternative: false },
                        { name: 'Cameron Park', state: 'NSW', score: 70, tag: 'Top Family Pick', alternative: false }
                      ] : persona === 'professional' ? [
                        { name: 'Parramatta', state: 'NSW', score: 62, tag: 'Metropolitan Heart', alternative: false },
                        { name: 'Byron Bay', state: 'NSW', score: 78, tag: 'Lifestyle Hub', alternative: false },
                        { name: 'Cottesloe', state: 'WA', score: 79, tag: 'Premium Coastal', alternative: false }
                      ] : [
                        { name: 'Parramatta', state: 'NSW', score: 62, tag: 'Major Hub', alternative: false },
                        { name: 'Baulkham Hills', state: 'NSW', score: 57, tag: 'Family Pick', alternative: false },
                        { name: 'Byron Bay', state: 'NSW', score: 78, tag: 'Coastal Lifestyle', alternative: false }
                      ]).map((sub) => (
                        <Link 
                          key={sub.name}
                          to={`/suburbs/${sub.state.toLowerCase()}/${sub.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`p-4 rounded-3xl transition-all flex items-center gap-4 group relative overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white bg-gradient-to-br from-emerald-500 to-emerald-700`}>
                            <span className="text-[12px] font-black leading-none">{sub.score}</span>
                            <span className="text-[8px] font-medium opacity-70">SCORE</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight">{sub.name}</div>
                            <div className={`text-[9px] font-medium text-white/50 tracking-wider uppercase`}>{sub.tag}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
 
                   {/* CTA Buttons */}
                   <div className="flex flex-wrap gap-4 mb-12 py-8">
                     <Link to="/suburbs/rankings" className="contents">
                      <Button
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-10 py-7 text-lg font-bold btn-shine shadow-2xl shadow-emerald-400/20 transform hover:scale-105 transition-all"
                      >
                        <MapPin className="h-5 w-5 mr-2" />
                        Find My Best Suburb
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setActiveCalculator('borrowing')}
                      className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 rounded-full px-8 py-7 text-lg font-semibold shadow-xl"
                    >
                      <TrendingUp className="h-6 w-6 mr-2 text-amber-400" />
                      Borrowing Power
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={() => setActiveCalculator('stampduty')}
                      className="text-white hover:bg-white/10 rounded-full px-6 py-7 text-base backdrop-blur-sm"
                    >
                      <Receipt className="h-5 w-5 mr-2 opacity-70" />
                      Stamp Duty Calculator
                    </Button>
                  </div>

                  {/* Trust Indicators */}
                  <div className="flex flex-wrap items-center gap-6 text-white/70">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm">2024-25 Rates</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50 border-white/10 border-l pl-6">
                      <Globe className="h-4 w-4" />
                      <span className="text-xs">Data: ABS, State Property Datasets, Transport Feeds</span>
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

            {/* Popular Tools Section */}
            <section className="py-12 bg-white border-b">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Popular Tools</h2>
                    <p className="text-slate-500">Quickly access our most used financial tools</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'home', name: 'Home Loan', icon: <Home className="h-6 w-6" />, color: 'bg-emerald-50 text-emerald-600' },
                    { id: 'stampduty', name: 'Stamp Duty', icon: <Receipt className="h-6 w-6" />, color: 'bg-amber-50 text-amber-600' },
                    { id: 'borrowing', name: 'Borrowing Power', icon: <TrendingUp className="h-6 w-6" />, color: 'bg-blue-50 text-blue-600' },
                    { id: 'savings', name: 'Savings Planner', icon: <PiggyBank className="h-6 w-6" />, color: 'bg-purple-50 text-purple-600' },
                    { id: 'suburb', name: 'Suburb Compare', icon: <MapPin className="h-6 w-6" />, color: 'bg-cyan-50 text-cyan-600' },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveCalculator(tool.id)}
                      className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all text-center"
                    >
                      <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        {tool.icon}
                      </div>
                      <span className="font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">{tool.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Suburb Discovery Section */}
            <section className="py-20 bg-slate-50">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                  <div className="max-w-2xl">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 mb-4 px-3 py-1">Suburb Intelligence</Badge>
                    <h2 className="text-4xl font-bold text-slate-800 mb-4">Discover Australia's Best Suburbs</h2>
                    <p className="text-lg text-slate-600">
                      We've analysed over 18,500 suburbs across Australia using proprietary scoring 
                      metrics for lifestyle, affordability, and connectivity.
                    </p>
                  </div>
                  <Link to="/suburbs/rankings">
                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-full px-8 py-6 text-lg group">
                      Explore Suburb Rankings
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {[
                    { suburbName: 'Bondi', state: 'NSW', overallScore: 74, scoreBreakdown: { affordability: 45, employment: 85, commute: 80, schools: 82, lifestyle: 95 } },
                    { suburbName: 'Parramatta', state: 'NSW', overallScore: 61, scoreBreakdown: { affordability: 65, employment: 82, commute: 88, schools: 78, lifestyle: 75 } },
                    { suburbName: 'Sydney', state: 'NSW', overallScore: 52, scoreBreakdown: { affordability: 30, employment: 95, commute: 92, schools: 85, lifestyle: 98 } },
                  ].map((suburb, idx) => (
                    <Link key={idx} to={`/suburbs/${suburb.state.toLowerCase()}/${suburb.suburbName.toLowerCase()}`} className="group hover:scale-[1.02] transition-transform duration-300">
                      <SuburbScoreCard
                        suburbName={suburb.suburbName}
                        state={suburb.state}
                        overallScore={suburb.overallScore}
                        scoreBreakdown={suburb.scoreBreakdown}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-50/30 -skew-x-12 transform translate-x-1/2" />
              <div className="container mx-auto px-4 relative">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-4xl font-bold text-slate-800 mb-6">How We Rank Suburbs</h2>
                  <p className="text-xl text-slate-600">
                    Our data-driven approach combines multiple datasets to give you a clear picture of every Australian suburb.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                    {
                      step: 'Step 1',
                      title: 'Data Collection',
                      desc: 'We analyse affordability, employment, commute times, school quality and lifestyle indicators from official sources.',
                      icon: <Globe className="h-8 w-8" />,
                    },
                    {
                      step: 'Step 2',
                      title: 'Weighted Scoring',
                      desc: 'Each suburb receives a weighted score based on proprietary algorithms that balance competing priorities.',
                      icon: <TrendingUp className="h-8 w-8" />,
                    },
                    {
                      step: 'Step 3',
                      title: 'Compare & Decide',
                      desc: 'Use our comparison tools to find the perfect suburb that fits your lifestyle and financial goals.',
                      icon: <FileSearch className="h-8 w-8" />,
                    }
                  ].map((item, i) => (
                    <div key={i} className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-8 relative z-10">
                        {item.icon}
                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-400 text-slate-900 border-4 border-white flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-lg">{item.desc}</p>
                      {i < 2 && <ArrowRight className="hidden lg:block absolute top-8 -right-6 text-slate-200 h-8 w-8" />}
                    </div>
                  ))}
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
             {/* SEO Authority & Regional Rankings Section */}
            <section className="py-24 bg-white border-t border-slate-100">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 mb-6 px-4 py-1.5 font-bold tracking-tight uppercase text-xs">Metropolitan Authority</Badge>
                    <h2 className="text-4xl font-black text-slate-900 mb-8 leading-tight">
                      Explore the Best Suburbs in <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Australia's Major Hubs</span>
                    </h2>
                    <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                      Our 2026 state rankings identify the suburbs with the perfect balance of 
                      growth, lifestyle, and entry-level accessibility.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { title: 'Best Suburbs Sydney 2026', state: 'NSW', icon: '💎' },
                        { title: 'Affordable Melbourne', state: 'VIC', icon: '🏡' },
                        { title: 'Growth Hubs Brisbane', state: 'QLD', icon: '📈' },
                        { title: 'Lifestyle Gems Perth', state: 'WA', icon: '☀️' }
                      ].map((link, idx) => (
                        <Link 
                          key={idx} 
                          to={`/suburbs/rankings?state=${link.state}&sort=score`}
                          className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
                        >
                          <span className="text-2xl group-hover:scale-125 transition-transform">{link.icon}</span>
                          <span className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-tight">{link.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl gradient-aussie flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Data Integrity Protocol</h3>
                          <p className="text-emerald-400 text-sm font-medium uppercase tracking-widest">Updated Weekly</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {[
                          { title: 'Official Source Mapping', desc: 'Real-time synchronization with ABS Census 2021/2024 and SA2 official boundaries.' },
                          { title: 'Hyper-Local Connectivity', desc: 'Direct feeds from TfNSW, PTV, and TransLink for 100% accurate commute modeling.' },
                          { title: 'Economic Risk Overlay', desc: 'Systemic checking for mining-town volatility and growth-corridor price traps.' }
                        ].map((item, id) => (
                          <div key={id} className="flex gap-4">
                            <div className="mt-1 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            <div>
                              <div className="font-bold text-lg mb-1">{item.title}</div>
                              <div className="text-slate-400 text-sm leading-relaxed">{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline" className="mt-10 w-full border-white/20 text-white hover:bg-white/10 rounded-2xl py-6 gap-2">
                        View Ranking Methodology
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

            </>
          } />
        </Routes>
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
              <h4 className="font-semibold text-lg mb-4 text-white">Calculators</h4>
              <ul className="space-y-3">
                {calculators.map((calc) => (
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
              <h4 className="font-semibold text-lg mb-4 text-white">Suburbs</h4>
              <ul className="space-y-3">
                <li><Link to="/suburbs/rankings" className="text-slate-400 hover:text-emerald-400 transition-colors">Suburb Rankings</Link></li>
                <li><button onClick={() => setActiveCalculator('suburb')} className="text-slate-400 hover:text-emerald-400 transition-colors">Compare Suburbs</button></li>
                <li><Link to="/about#accuracy" className="text-slate-400 hover:text-emerald-400 transition-colors">Ranking Methodology</Link></li>
                <li><Link to="/cost-of-living#calculator" className="text-slate-400 hover:text-emerald-400 transition-colors">Cost of Living</Link></li>
                <li><Link to="/about#data-sources" className="text-slate-400 hover:text-emerald-400 transition-colors">Market Reports</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4 text-white">Explore by State</h4>
              <ul className="space-y-3">
                {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(state => (
                  <li key={state}>
                    <Link to={`/suburbs/rankings?state=${state}`} className="text-slate-400 hover:text-emerald-400 transition-colors">
                      {state} Suburbs
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Proof Stats */}
          <div className="border-t border-slate-800 mt-16 pt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center bg-slate-800/50 rounded-3xl py-8 px-4 border border-white/5">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 Australian Life Optimiser. All rights reserved.
            </p>
            <div className="text-slate-600 text-[10px] max-w-4xl leading-relaxed text-center md:text-right italic">
              <span className="font-bold block mb-1">ASIC Compliance & General Advice Warning</span>
              The information provided on this website is for general information purposes only and does not constitute 
              financial, investment, or legal advice. We do not consider your personal circumstances, financial situation, 
              or needs. All data including suburb scores, pricing estimates, and yield indicators are derived from 
              third-party sources (ABS, CoreLogic, etc.) and should be verified independently. 
              Australian Life Optimiser is not a financial services licensee.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <PersonaProvider>
        <InnerApp />
      </PersonaProvider>
    </Router>
  );
}
