# Australian Financial Tools Website - Complete Build Prompt

## 1. Website Concept & Positioning

### Core Value Proposition
Create Australia's most comprehensive, user-friendly financial calculator hub that helps Australians make informed decisions about:
- Home loans & mortgages
- Cost of living across suburbs
- Personal finance management
- Property investment
- Vehicle financing
- Tax planning

### Target Audience
- **Primary**: First-home buyers (25-40 years old)
- **Secondary**: Property investors, refinancers, families relocating
- **Tertiary**: Expatriates moving to Australia, financial advisors

### Brand Positioning
"Australia's Trusted Financial Calculator Hub" - Accurate, unbiased, easy-to-use tools with localized Australian data.

---

## 2. Essential Tools & Calculators to Build

### A. Loan Repayment Calculators
1. **Home Loan Repayment Calculator**
   - Principal & interest vs. interest-only options
   - Variable vs. fixed rate comparisons
   - Extra repayment impact calculator
   - Offset account benefit calculator
   - Lenders Mortgage Insurance (LMI) estimator

2. **Mortgage Comparison Tool**
   - Side-by-side loan comparison (up to 4 loans)
   - Comparison rate calculator
   - Break cost calculator for fixed loans

3. **Refinancing Calculator**
   - Savings from switching lenders
   - Break-even point analysis
   - Exit fees vs. savings analysis

4. **Borrowing Power Calculator**
   - Based on Australian lending criteria
   - Income, expenses, and debt assessment
   - Deposit requirement calculator

5. **Stamp Duty Calculator**
   - State-by-state stamp duty (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)
   - First home buyer concessions
   - Foreign buyer surcharge calculations

### B. Suburb & Cost of Living Calculators
1. **Suburb Cost of Living Calculator**
   - Median house/unit prices by suburb
   - Weekly rent estimates
   - Council rates by LGA
   - Utility costs (electricity, gas, water)
   - Transport costs (public transport, fuel)

2. **Suburb Comparison Tool**
   - Compare up to 3 suburbs side-by-side
   - Affordability score
   - Lifestyle factors (schools, hospitals, crime rates)
   - Commute time calculator

3. **Relocation Cost Estimator**
   - Moving expenses
   - Connection fees
   - Bond/rent in advance calculations

### C. Personal Finance Tools
1. **Budget Planner**
   - Australian expense categories
   - ASIC MoneySmart-style budget template
   - Savings goal tracker

2. **Savings Calculator**
   - Compound interest with Australian tax rates
   - Term deposit comparison
   - High-interest savings account projections

3. **Income Tax Calculator**
   - Current Australian tax brackets (2024-2025)
   - Medicare levy calculations
   - HELP/HECS repayment estimates
   - Tax offsets (LITO, LAMITO)

4. **Superannuation Calculator**
   - Retirement projections
   - Contribution optimiser
   - Co-contribution eligibility

### D. Vehicle & Personal Loans
1. **Car Loan Calculator**
   - Monthly repayment estimates
   - Balloon payment options
   - Comparison with dealer finance

2. **Personal Loan Calculator**
   - Debt consolidation analysis
   - Interest savings from consolidation

### E. Property Investment Tools
1. **Investment Property Calculator**
   - Cash flow analysis (positive/negative gearing)
   - Capital growth projections
   - Rental yield calculator
   - Depreciation schedule estimates

2. **Renovation ROI Calculator**
   - Cost vs. value added analysis
   - Post-renovation valuation estimates

---

## 3. Data Sources & API Integration

### Australian Data to Integrate
| Data Type | Source | Integration Method |
|-----------|--------|-------------------|
| Property Prices | CoreLogic, Domain, REA Group | API or scraped data |
| Interest Rates | RBA, major banks | RSS/API feeds |
| Stamp Duty Rules | State revenue offices | Manual updates annually |
| Cost of Living | ABS, Numbeo | API integration |
| Suburb Demographics | ABS Census | Data downloads |
| School Zones | ACARA, state education departments | API/CSV imports |
| Crime Statistics | State police departments | API feeds |

### Recommended APIs
- **Property Data**: CoreLogic RP Data, Domain API, realestate.com.au API
- **Maps**: Google Maps API (suburb boundaries, commute times)
- **Currency**: Not needed (AUD focus)
- **Geocoding**: Google Geocoding API for address lookups

---

## 4. SEO Strategy for High Traffic

### Keyword Research Priorities

**High-Volume Keywords (Primary)**
- "home loan calculator australia" (40,500/month)
- "mortgage calculator" (90,500/month)
- "stamp duty calculator" (33,100/month)
- "borrowing power calculator" (14,800/month)
- "loan repayment calculator" (22,200/month)

**Long-Tail Keywords (Secondary)**
- "how much can I borrow home loan australia"
- "best suburbs to live in sydney for families"
- "cost of living melbourne vs sydney"
- "first home buyer stamp duty nsw"
- "refinancing calculator compare loans"

**Location-Based Keywords**
- "mortgage calculator [suburb]"
- "cost of living [city]"
- "property prices [suburb]"
- "best suburbs [city] for first home buyers"

### Content Strategy

**1. Calculator Landing Pages**
Each calculator needs its own optimized landing page with:
- Clear H1 with target keyword
- 500-800 words of contextual content
- Step-by-step usage guide
- FAQ section (schema markup for rich snippets)
- Related calculators section

**2. Suburb Guides**
Create dedicated pages for top 100 Australian suburbs:
- Median prices (houses & units)
- Cost of living breakdown
- Local amenities
- Transport connectivity
- School catchments
- Investment potential

**3. Blog Content**
- "Complete Guide to [Calculator Type]"
- "2024 Cost of Living Comparison: [City] vs [City]"
- "First Home Buyer Grants by State 2024"
- "How to Calculate Your Borrowing Power"
- "Understanding Lenders Mortgage Insurance"

**4. State-Specific Content**
- Stamp duty rules by state
- First home buyer schemes by state
- Property market updates by state

### Technical SEO Requirements

**Schema Markup**
- FinancialProduct schema for calculators
- FAQPage schema for FAQ sections
- HowTo schema for guides
- LocalBusiness schema (if applicable)

**Page Speed Optimization**
- Lazy load calculators
- Minimize JavaScript bundles
- CDN for static assets
- Core Web Vitals optimization

**Mobile Optimization**
- All calculators must work seamlessly on mobile
- Touch-friendly inputs
- Responsive design

---

## 5. Website Structure & Navigation

### Sitemap
```
/
├── Calculators/
│   ├── Home Loans/
│   │   ├── Repayment Calculator
│   │   ├── Borrowing Power Calculator
│   │   ├── Comparison Calculator
│   │   ├── Refinancing Calculator
│   │   ├── Stamp Duty Calculator
│   │   ├── LMI Calculator
│   │   └── Offset Calculator
│   ├── Personal Finance/
│   │   ├── Budget Planner
│   │   ├── Savings Calculator
│   │   ├── Tax Calculator
│   │   └── Super Calculator
│   ├── Property/
│   │   ├── Investment Calculator
│   │   ├── Rental Yield Calculator
│   │   └── Renovation ROI Calculator
│   └── Vehicle/
│       ├── Car Loan Calculator
│       └── Personal Loan Calculator
├── Suburb Guides/
│   ├── Sydney/
│   ├── Melbourne/
│   ├── Brisbane/
│   ├── Perth/
│   ├── Adelaide/
│   └── Compare Suburbs
├── Resources/
│   ├── Blog/
│   ├── First Home Buyer Guide
│   ├── State-by-State Guides
│   ├── Interest Rate Updates
│   └── Market Reports
└── About/
```

### Navigation Design
- Sticky header with calculator categories
- Mega-menu for easy calculator discovery
- Breadcrumb navigation for deep pages
- Internal linking between related calculators

---

## 6. User Experience (UX) Design

### Calculator UX Best Practices
1. **Instant Results**: Show results as user types (no submit button needed)
2. **Visual Charts**: Display repayment schedules as interactive charts
3. **Save/Share**: Allow users to save calculations and share via email
4. **Print-Friendly**: Clean print styles for taking to bank meetings
5. **Input Validation**: Clear error messages for invalid inputs
6. **Default Values**: Pre-fill with sensible Australian defaults
7. **Help Tooltips**: Explain each field with hover tooltips

### Trust Signals
- ASIC MoneySmart partnership mention (if applicable)
- Data source citations
- Last updated timestamps
- Disclaimer about seeking professional advice
- Security badges (SSL, privacy policy)

### Conversion Optimization
- Email capture for calculation results
- "Get Pre-Approved" CTAs linking to mortgage brokers
- Downloadable PDF reports
- Calculator result sharing

---

## 7. Technical Implementation

### Tech Stack Recommendations

**Option A: Modern React/Vue SPA**
- Frontend: React/Vue.js with TypeScript
- State Management: Redux/Vuex or React Query
- Charts: Chart.js or D3.js
- Styling: Tailwind CSS or Material-UI
- Build: Next.js (for SEO) or Vite

**Option B: WordPress (Faster Launch)**
- Theme: Custom or Astra/GeneratePress
- Calculator Plugin: Custom development or WP Forms with calculations
- Page Builder: Elementor or Bricks
- SEO: RankMath or Yoast SEO

**Backend (if needed)**
- Node.js/Express or Python/FastAPI
- Database: PostgreSQL for user data
- Cache: Redis for calculator results
- Hosting: AWS, Vercel, or Cloudflare Pages

### Calculator Logic Implementation

**Home Loan Formula (Australian Standard)**
```javascript
// Monthly repayment calculation
function calculateMonthlyRepayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 12 / 100;
  const numPayments = years * 12;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}
```

**Comparison Rate Formula**
- Must comply with National Consumer Credit Protection Act
- Include all fees and charges in the calculation

### Performance Requirements
- Calculator load time: < 1 second
- First Contentful Paint: < 1.5 seconds
- Time to Interactive: < 3 seconds
- Lighthouse Score: > 90

---

## 8. Content & Data Management

### Data Update Schedule
| Data Type | Update Frequency |
|-----------|-----------------|
| Interest Rates | Weekly |
| Property Prices | Monthly |
| Stamp Duty Rules | Annually or when legislation changes |
| Cost of Living | Quarterly |
| Tax Brackets | Annually (July 1) |
| Suburb Demographics | After each Census (5-yearly) |

### Content Calendar
- **Weekly**: Interest rate updates, market commentary
- **Monthly**: Property market reports by city
- **Quarterly**: Cost of living updates, major content pieces
- **Annually**: Tax calculator updates, comprehensive guides refresh

---

## 9. Monetization Strategy

### Revenue Streams

**1. Affiliate Marketing (Primary)**
- Mortgage broker referrals (up to $2,000 per settled loan)
- Bank product referrals
- Comparison site partnerships
- Insurance referrals

**2. Lead Generation**
- Sell qualified leads to mortgage brokers
- Partner with real estate agents
- Financial planner referrals

**3. Display Advertising**
- Google AdSense
- Direct sponsorships from banks/lenders
- Native advertising

**4. Premium Features (Optional)**
- Advanced calculators (subscription)
- Downloadable reports
- API access for businesses

### Affiliate Partners to Consider
- Mortgage brokers (Australian Finance Group, etc.)
- Banks (CBA, Westpac, NAB, ANZ)
- Comparison sites (Canstar, Finder, RateCity)
- Real estate platforms (realestate.com.au, Domain)

---

## 10. Legal & Compliance

### Australian Regulatory Requirements

**ASIC Compliance**
- Australian Credit Licence (ACL) if providing credit advice
- Clear disclaimers: "This calculator is a guide only"
- Recommendation to seek professional advice
- Do not provide specific product recommendations without licence

**Privacy Act Compliance**
- Privacy policy compliant with Australian Privacy Principles
- Secure data handling
- Cookie consent banner
- GDPR compliance for international visitors

**Required Disclaimers**
- "Results are estimates only"
- "Interest rates subject to change"
- "Seek professional financial advice"
- "Does not constitute financial advice"
- Data source attribution

---

## 11. Launch Strategy

### Pre-Launch (4-6 weeks)
- [ ] Build core calculators (home loan, stamp duty, borrowing power)
- [ ] Create 10 suburb guides for major cities
- [ ] Write 5 comprehensive blog posts
- [ ] Set up Google Analytics 4 and Search Console
- [ ] Implement schema markup
- [ ] Performance optimization

### Soft Launch (Week 1-2)
- [ ] Share with friends and family for feedback
- [ ] Post in Australian finance forums (Whirlpool, Reddit r/AusFinance)
- [ ] Reach out to personal finance bloggers for feedback
- [ ] Fix any bugs or usability issues

### Growth Phase (Month 2-6)
- [ ] Publish 2-3 blog posts per week
- [ ] Create suburb guides for top 50 suburbs
- [ ] Build backlinks through guest posting
- [ ] Engage on social media (Facebook, LinkedIn)
- [ ] Partner with mortgage brokers for referrals
- [ ] Run Google Ads for high-intent keywords

### Scale Phase (Month 6+)
- [ ] Expand to all Australian suburbs
- [ ] Add advanced calculators
- [ ] Launch email newsletter
- [ ] Consider native mobile apps
- [ ] Explore B2B partnerships

---

## 12. Success Metrics & KPIs

### Traffic Metrics
- **Monthly Unique Visitors**: Target 100,000 by Month 12
- **Page Views per Session**: Target > 3
- **Average Session Duration**: Target > 2 minutes
- **Bounce Rate**: Target < 40%

### SEO Metrics
- **Organic Keywords Ranking**: Track top 100 keywords
- **Featured Snippets**: Target 10+ by Month 6
- **Domain Authority**: Target 40+ by Month 12
- **Backlinks**: Target 500+ quality backlinks

### Conversion Metrics
- **Calculator Usage Rate**: Target > 60% of visitors
- **Email Capture Rate**: Target > 5%
- **Affiliate Click-Through Rate**: Target > 10%
- **Revenue per 1000 Visitors (RPM)**: Target $50+

### User Engagement
- **Return Visitor Rate**: Target > 30%
- **Calculator Shares**: Track social shares
- **PDF Downloads**: Track report downloads

---

## 13. Competitor Analysis

### Major Competitors
1. **ASIC MoneySmart**
   - Strengths: Government-backed, trusted
   - Weaknesses: Limited suburb data, basic design

2. **Finder.com.au**
   - Strengths: Comprehensive, strong SEO
   - Weaknesses: Heavy ads, can be overwhelming

3. **Canstar.com.au**
   - Strengths: Comparison focus, ratings
   - Weaknesses: Calculator UX could be better

4. **RateCity.com.au**
   - Strengths: Good comparison tools
   - Weaknesses: Limited educational content

5. **NAB/CBA/Westpac Calculators**
   - Strengths: Accurate rates
   - Weaknesses: Only their products, no comparison

### Differentiation Strategy
- Better UX than government sites
- More comprehensive than bank calculators
- Australian-focused data (not generic)
- Suburb-level insights
- Clean, ad-light experience
- Faster, more responsive design

---

## 14. Advanced Features (Phase 2)

### Future Enhancements
1. **User Accounts**
   - Save calculations
   - Track property watchlists
   - Personalized recommendations

2. **Mobile Apps**
   - iOS and Android native apps
   - Offline calculator access
   - Push notifications for rate changes

3. **AI Features**
   - Chatbot for financial questions
   - Personalized advice based on inputs
   - Predictive market analysis

4. **API for Developers**
   - White-label calculator widgets
   - B2B partnerships
   - Revenue stream

5. **Community Features**
   - User reviews of suburbs
   - Q&A forum
   - Expert advice section

---

## 15. Budget Estimate

### Development Costs
| Item | DIY | Freelancer | Agency |
|------|-----|------------|--------|
| Website Design | $0 | $2,000-5,000 | $10,000-25,000 |
| Calculator Development | $0 | $5,000-15,000 | $20,000-50,000 |
| Content Creation | $0 | $3,000-8,000 | $10,000-20,000 |
| SEO Setup | $0 | $1,000-3,000 | $5,000-10,000 |
| **Total Initial** | **$500-1,000** | **$11,000-31,000** | **$45,000-105,000** |

### Ongoing Costs (Monthly)
- Hosting: $50-200/month
- Data/API subscriptions: $200-1,000/month
- Content updates: $500-2,000/month
- SEO/ Marketing: $500-5,000/month
- Tools & Software: $100-500/month

---

## 16. Implementation Checklist

### Phase 1: MVP (Weeks 1-4)
- [ ] Set up development environment
- [ ] Design wireframes and mockups
- [ ] Build home loan repayment calculator
- [ ] Build stamp duty calculator (all states)
- [ ] Build borrowing power calculator
- [ ] Create homepage with calculator directory
- [ ] Implement basic SEO
- [ ] Set up analytics
- [ ] Write legal pages (privacy, terms, disclaimers)
- [ ] Soft launch

### Phase 2: Core Features (Weeks 5-8)
- [ ] Add remaining loan calculators
- [ ] Build suburb cost of living calculator
- [ ] Create 20 suburb guides
- [ ] Write 10 blog posts
- [ ] Implement email capture
- [ ] Set up affiliate links
- [ ] Optimize for speed
- [ ] Launch publicly

### Phase 3: Growth (Weeks 9-16)
- [ ] Expand to 50+ suburb guides
- [ ] Add personal finance calculators
- [ ] Create comparison tools
- [ ] Build backlinks
- [ ] Run paid advertising
- [ ] Email newsletter launch
- [ ] Social media presence

### Phase 4: Scale (Weeks 17+)
- [ ] All Australian suburbs covered
- [ ] Advanced calculators
- [ ] Mobile apps
- [ ] B2B partnerships
- [ ] Premium features

---

## Summary

This prompt provides a complete roadmap for building a high-traffic Australian financial tools website. The key success factors are:

1. **Accuracy**: Use current Australian data and formulas
2. **UX**: Make calculators fast, easy, and mobile-friendly
3. **SEO**: Target high-volume keywords with quality content
4. **Trust**: Be transparent about data sources and limitations
5. **Value**: Provide genuinely useful tools that solve real problems

Start with the core loan calculators, expand to suburb data, and continuously add content to build organic traffic. Monetize through affiliate partnerships while maintaining user trust.

**Estimated Timeline to Profitability**: 6-12 months with consistent effort
**Potential Monthly Revenue**: $5,000-50,000+ at scale

---

*This prompt was generated to help you build a comprehensive Australian financial tools website. Adapt and expand based on your specific resources, skills, and market research.*
