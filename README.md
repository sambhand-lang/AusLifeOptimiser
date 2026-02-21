# Australian Financial Tools - Free API Integration

This application integrates with **free and publicly available APIs** to provide realistic suburb comparison data without requiring paid API keys.

## Free Data Sources

The suburb comparison tool fetches data from:

1. **MySchool.edu.au** - School ratings and education data (completely free)
2. **OpenRouteService** - Real commute times using open routing data (free tier)
3. **Australian Bureau of Statistics** - Population estimates based on public data patterns
4. **Transport for NSW** - Public transport data (optional, free)

## Optional API Keys (Free Tiers Available)

For enhanced accuracy, you can optionally add free API keys:

### 1. OpenRouteService API Key (Free)
- Visit: https://openrouteservice.org/
- Free tier: 2,000 requests/day
- Add to `backend/.env`: `OPENROUTESERVICE_API_KEY=your_key_here`

### 2. Transport for NSW API Key (Free)
- Visit: https://opendata.transport.nsw.gov.au/
- Free for basic usage
- Add to `backend/.env`: `TRANSPORT_NSW_API_KEY=your_key_here`

## No Paid APIs Required

Unlike the previous version, this implementation uses **only free APIs**:
- ❌ No Google Maps API (paid)
- ❌ No Domain.com.au API (paid)
- ❌ No ABS API registration (simplified)

## Smart Fallback System

- **Primary**: Real data from free APIs
- **Secondary**: Enhanced postcode-based estimates
- **Tertiary**: Basic estimates when APIs unavailable

## Data Features

- Real school ratings from MySchool.edu.au
- Actual driving commute times via OpenRouteService
- Population estimates based on ABS data patterns
- Property price estimates (enhanced algorithms)
- All data includes source attribution

## Running the Application

```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev

# Frontend: http://localhost:5177
# Backend: http://localhost:5001
```

## Data Accuracy

- **School Data**: Real ratings from official government source
- **Commute Times**: Actual driving routes (when API key provided)
- **Population**: Statistical estimates based on real demographic patterns
- **Property Data**: Intelligent estimates using market analysis

## Privacy & Compliance

- All APIs used are free and publicly available
- No user data sent to external services
- Complies with Australian data protection requirements
- Open source and transparent data processing