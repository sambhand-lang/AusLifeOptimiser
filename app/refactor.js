const fs = require('fs');
const path = 'c:/Sameer/Projects/Antigravity/AusLifeOptimiser/AusLifeOptimiser/app/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add router imports
content = content.replace("import { useState, useEffect } from 'react';", 
  "import { useState, useEffect } from 'react';\nimport { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';");

// 2. Add imports for new Suburb components
content = content.replace("import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';",
  "import { SuburbScoreCard } from '@/components/suburbs/SuburbScoreCard';\nimport SuburbDetail from '@/pages/SuburbDetail';\nimport SuburbRankings from '@/pages/SuburbRankings';");

// 3. Keep but adjust activeCalculator usage
// I will create an 'InnerApp' component to host useLocation and useNavigate, and 'App' will wrap it with Router.
content = content.replace(/function App\(\) \{/, 
  "function InnerApp() {\n  const navigate = useNavigate();\n  const location = useLocation();\n  const activeCalculatorPath = location.pathname.startsWith('/calculator/') ? location.pathname.split('/calculator/')[1] : (location.pathname === '/compare' ? 'suburb' : null);\n  const activeCalculator = activeCalculatorPath;");

// Remove the `const [activeCalculator, setActiveCalculator] = useState...`
content = content.replace(/const \[activeCalculator, setActiveCalculator\] = useState<CalculatorType \| null>\(null\);/, "");

// 4. Update click handlers to be route changes:
content = content.replace(/onClick=\{\(\) => setActiveCalculator\(null\)\}/g, "onClick={() => navigate('/')}");
content = content.replace(/onClick=\{\(\) => setActiveCalculator\('(.*?)'\)\}/g, "onClick={() => navigate( $1 === 'suburb' ? '/compare' : `/calculator/${$1}` )}");
content = content.replace(/onClick=\{\(\) => \{\s*setActiveCalculator\((.*?)\);\s*setMobileMenuOpen\(false\);\s*\}\}/g, "onClick={() => { navigate( $1 === 'suburb' || $1.id === 'suburb' ? '/compare' : `/calculator/${$1.id || $1}` ); setMobileMenuOpen(false); }}");

// 5. Replace <main>...</main> content with Routes wrapper
const mainRegex = /<main className="flex-1">([\s\S]*?)<\/main>/;
const match = mainRegex.exec(content);
const oldMainContent = match[0];

const newMainContent = `
      <main className="flex-1">
        <Routes>
          <Route path="/" element={
            /* Home Page */
            ${oldMainContent.match(/\/\* Home Page \*\/([\s\S]*?)<\/main>/)[1]}
          } />
          
          <Route path="/calculator/:calcId" element={
            <div className="pt-28 pb-12 bg-slate-50/50 min-h-screen">
              <div className="container mx-auto px-4">
                <button
                  onClick={() => navigate('/')}
                  className="group flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-6"
                >
                  <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </div>
                  <span className="font-medium">Back to all calculators</span>
                </button>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={\`w-14 h-14 rounded-2xl bg-gradient-to-br \${calculators.find(c => c.id === activeCalculator)?.color} flex items-center justify-center text-white shadow-xl\`}>
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
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {renderCalculator()}
                </div>
              </div>
            </div>
          } />
          
          <Route path="/compare" element={
            <div className="pt-28 pb-12 bg-slate-50/50 min-h-screen">
              <div className="container mx-auto px-4">
                <button
                  onClick={() => navigate('/')}
                  className="group flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-6"
                >
                  <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </div>
                  <span className="font-medium">Back to all calculators</span>
                </button>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={\`w-14 h-14 rounded-2xl bg-gradient-to-br \${calculators.find(c => c.id === 'suburb')?.color} flex items-center justify-center text-white shadow-xl\`}>
                      {calculators.find(c => c.id === 'suburb')?.icon}
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
                        {calculators.find(c => c.id === 'suburb')?.name}
                      </h2>
                    </div>
                  </div>
                  <p className="text-lg text-slate-600 max-w-2xl">
                    {calculators.find(c => c.id === 'suburb')?.description}
                  </p>
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SuburbComparison2 />
                </div>
              </div>
            </div>
          } />

          <Route path="/suburbs/:state/:name" element={<SuburbDetail />} />
          <Route path="/suburbs/rankings" element={<SuburbRankings />} />
        </Routes>
      </main>
`;

content = content.replace(oldMainContent, newMainContent);

// 6. Wrap InnerApp in App
content = content + \n;
content = content.replace('export default App;', 'export default function App() {\n  return (\n    <Router>\n      <InnerApp />\n    </Router>\n  );\n}');

fs.writeFileSync(path, content);
console.log('Done refactoring app to use react-router-dom!');
