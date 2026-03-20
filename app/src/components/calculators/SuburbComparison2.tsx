"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, ArrowRight, ExternalLink, Users, Car, TreePine, Home, TrendingUp, Wallet, Percent, Info } from 'lucide-react';
import { SearchableSuburbSelector } from './SearchableSuburbSelector';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';

export type SuburbComparison2Props = {
  initialSuburb1?: string;
  initialSuburb2?: string;
  initialSuburb3?: string;
  suburbs?: unknown;
};

export function SuburbComparison2({
  initialSuburb1 = '',
  initialSuburb2 = '',
  initialSuburb3 = '',
}: SuburbComparison2Props) {
  const [params, setParams] = useSearchParams();
  
  const suburb1 = params.get('sub1') || initialSuburb1;
  const suburb2 = params.get('sub2') || initialSuburb2;
  const suburb3 = params.get('sub3') || initialSuburb3;

  const setSuburb1 = (val: string) => setParams(prev => { const p = new URLSearchParams(prev); if (val) p.set('sub1', val); else p.delete('sub1'); return p; }, {replace: true});
  const setSuburb2 = (val: string) => setParams(prev => { const p = new URLSearchParams(prev); if (val) p.set('sub2', val); else p.delete('sub2'); return p; }, {replace: true});
  const setSuburb3 = (val: string) => setParams(prev => { const p = new URLSearchParams(prev); if (val) p.set('sub3', val); else p.delete('sub3'); return p; }, {replace: true});

  const hasSelection = !!(suburb1 || suburb2 || suburb3);

  const [s1, setS1] = useState<any | null>(null);
  const [s2, setS2] = useState<any | null>(null);
  const [s3, setS3] = useState<any | null>(null);

  const fetchSuburb = (name: string, setState: (data: any | null) => void) => {
    if (!name) {
      setState(null);
      return;
    }
    const parts = name.split('|');
    const suburbanName = parts[0]?.trim() || '';
    const postcode = parts[1]?.trim() || null;

    fetch(`/api/dropdowns/search?q=${encodeURIComponent(suburbanName)}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const results = data.results || (Array.isArray(data) ? data : []);
        if (results.length > 0) {
          const chosen = postcode
            ? results.find((s: any) => String(s.postcode) === String(postcode)) || results[0]
            : results[0];
          return fetch(`/api/suburbs/${chosen.ssc || chosen.id}/details`);
        }
        return Promise.reject();
      })
      .then(res => res.json())
      .then(data => setState(data))
      .catch(() => setState(null));
  };

  useEffect(() => { fetchSuburb(suburb1, setS1); }, [suburb1]);
  useEffect(() => { fetchSuburb(suburb2, setS2); }, [suburb2]);
  useEffect(() => { fetchSuburb(suburb3, setS3); }, [suburb3]);

  const formatMetric = (metric?: any | null, metricType?: string) => {
    if (metric == null) return { display: 'Data not available', meta: null, badge: null };

    let value: number;
    let meta: string | null = null;
    let badge: string | null = null;

    if (typeof metric === 'number') {
      value = metric;
    } else if (typeof metric === 'object' && metric.value != null) {
      value = metric.value;
      meta = metric.source ? `${metric.source}${metric.datasetYear ? ` (${metric.datasetYear})` : ''}` : null;
      const isOfficial = metric.source?.includes('ABS Census');
      badge = isOfficial ? 'official' : metric.source?.includes('Estimate') || !metric.source ? 'estimate' : 'derived';
    } else {
      return { display: 'Data not available', meta: null, badge: null };
    }

    let display: string;
    if (metricType === 'employmentRate') {
      const percentValue = value < 1 ? value * 100 : value;
      display = `~${percentValue.toFixed(1)}%`;
    } else if (metricType === 'housePrice' || metricType === 'rent' || metricType === 'medianIncome') {
      display = `~$${Math.round(value).toLocaleString()}`;
    } else if (metricType === 'growth' || metricType === 'yield') {
      display = `~${value.toFixed(1)}%`;
    } else if (metricType === 'commute') {
      display = `~${Math.round(value)} min`;
    } else if (metricType === 'population') {
      display = `~${Math.round(value).toLocaleString()}`;
    } else if (value % 1 === 0) {
      display = value.toLocaleString();
    } else {
      display = value.toFixed(1);
    }

    return { display, meta, badge };
  };

  const renderMetricCell = (metric: any, metricType?: string) => {
    const formatted = formatMetric(metric, metricType);
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-lg font-bold text-emerald-700">{formatted.display}</div>
      </div>
    );
  };

  const getPopulationMetric = (s: any | null) => s?.realTimeData?.population ?? s?.population ?? null;
  const getMedianAgeMetric = (s: any | null) => s?.realTimeData?.medianAge ?? s?.median_age ?? null;
  const getHouseholdSizeMetric = (s: any | null) => s?.realTimeData?.householdSize ?? s?.hh_size ?? null;
  const getMedianIncomeMetric = (s: any | null) => s?.realTimeData?.medianIncome ?? s?.median_income ?? null;
  const getCommuteMetric = (s: any | null) => s?.realTimeData?.commute?.drivingTimeMinutes ?? s?.commute_time ?? null;
  const getSchoolCountMetric = (s: any | null) => s?.realTimeData?.schools?.count ?? s?.school_count ?? null;
  const getParksMetric = (s: any | null) => s?.realTimeData?.parks ?? s?.parks_count ?? null;
  const getCafesMetric = (s: any | null) => s?.realTimeData?.cafes ?? null;
  const getRestaurantsMetric = (s: any | null) => s?.realTimeData?.restaurants ?? null;
  const getGymsMetric = (s: any | null) => s?.realTimeData?.gyms ?? null;

  const getMedianHousePriceMetric = (s: any | null) => s?.median_house_price ?? null;
  const getOneYearGrowthMetric = (s: any | null) => s?.one_year_growth ?? null;
  const getMedianRentMetric = (s: any | null) => s?.house_rent_weekly ?? s?.median_rent ?? null;
  const getRentalYieldMetric = (s: any | null) => {
      if (s) {
          const price = getMedianHousePriceMetric(s)?.value || getMedianHousePriceMetric(s) || 0;
          const rent = getMedianRentMetric(s)?.value || getMedianRentMetric(s) || 0;
          if (price > 0 && rent > 0) {
              return Number(((rent * 52) / price * 100).toFixed(1));
          }
      }
      return s?.rental_yield ?? null;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 bg-gradient-to-b from-emerald-50 to-white p-6 rounded-xl">
        <Card className="border-emerald-200">
          <CardHeader className="bg-emerald-50 border-b-2 border-emerald-200">
            <CardTitle>Suburb Comparison</CardTitle>
            <CardDescription>
              Select 2-3 suburbs to compare key metrics side by side.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchableSuburbSelector
                label="Suburb 1"
                selectedSuburb={suburb1}
                onSuburbChange={setSuburb1}
              />
              <SearchableSuburbSelector
                label="Suburb 2"
                selectedSuburb={suburb2}
                onSuburbChange={setSuburb2}
              />
              <SearchableSuburbSelector
                label="Suburb 3 (optional)"
                selectedSuburb={suburb3}
                onSuburbChange={setSuburb3}
              />
            </div>
          </CardContent>
        </Card>

        {!hasSelection && (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Select suburbs above to begin comparison.</p>
          </div>
        )}

        {(suburb1 || suburb2 || suburb3) && (!s1 || !s2) && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-gray-600 mt-3">Loading suburb data...</p>
          </div>
        )}

        {s1 && s2 && (
          <>
            <Card className="border-dashed border-emerald-300 bg-emerald-50/50">
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
                <CardDescription>
                  Select 'View Full Report' for detailed demographic, lifestyle and borrowing information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm font-semibold text-emerald-800">
                  Selected Suburbs:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[suburb1, suburb2, suburb3].filter(Boolean).map((sub, i) => {
                    const parts = sub.split('|');
                    const name = parts[0]?.trim() || '';
                    const post = parts[1]?.trim() || '';
                    const state = parts[2]?.trim() || 'NSW'; // Fallback
                    return (
                      <div key={i} className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col items-center text-center transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                            <MapPin className="h-6 w-6 text-emerald-600" />
                        </div>
                        <Link to={`/suburbs/${state.toLowerCase()}/${name.toLowerCase()}`} className="font-extrabold text-xl text-slate-800 mb-1 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 group/name">
                          {name} <ExternalLink className="h-4 w-4 opacity-50 group-hover/name:opacity-100 transition-opacity" />
                        </Link>
                        <div className="text-sm font-medium text-slate-500 mb-6">{post} • {state}</div>
                        <Link to={`/suburbs/${state.toLowerCase()}/${name.toLowerCase()}`} className="mt-auto w-full">
                          <Button variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm transition-all group">
                            View Full Report 
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Comparison Table */}
            <Card className="border-emerald-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-amber-50 border-b-2 border-emerald-200">
                <CardTitle className="text-emerald-900">Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                        <th className="px-6 py-4 text-left font-bold">Metric</th>
                        <th className="px-6 py-4 text-center font-bold text-emerald-50">
                          <div className="font-bold flex items-center justify-center gap-1">
                              <Link
                                to={`/suburbs/${s1.state?.toLowerCase() || 'nsw'}/${encodeURIComponent(s1.suburb_name.toLowerCase())}`}
                                className="hover:underline text-white flex items-center gap-1"
                                title="View suburb profile"
                              >
                                {s1.suburb_name}
                                <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
                              </Link>
                            </div>
                          <div className="text-xs text-emerald-100">{s1.postcode}, {s1.state}</div>
                        </th>
                        <th className="px-6 py-4 text-center font-bold text-emerald-50">
                          <div className="font-bold flex items-center justify-center gap-1">
                              <Link
                                to={`/suburbs/${s2.state?.toLowerCase() || 'nsw'}/${encodeURIComponent(s2.suburb_name.toLowerCase())}`}
                                className="hover:underline text-white flex items-center gap-1"
                                title="View suburb profile"
                              >
                                {s2.suburb_name}
                                <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
                              </Link>
                            </div>
                          <div className="text-xs text-emerald-100">{s2.postcode}, {s2.state}</div>
                        </th>
                        {s3 && (
                          <th className="px-6 py-4 text-center font-bold text-emerald-50">
                            <div className="font-bold flex items-center justify-center gap-1">
                              <Link
                                to={`/suburbs/${s3.state?.toLowerCase() || 'nsw'}/${encodeURIComponent(s3.suburb_name.toLowerCase())}`}
                                className="hover:underline text-white flex items-center gap-1"
                                title="View suburb profile"
                              >
                                {s3.suburb_name}
                                <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
                              </Link>
                            </div>
                            <div className="text-xs text-emerald-100">{s3.postcode}, {s3.state}</div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-600" />
                          Population (ABS Census 2021)
                        </td>
                        {(() => {
                          const a = getPopulationMetric(s1);
                          const b = getPopulationMetric(s2);
                          const c = s3 ? getPopulationMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a, 'population')}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b, 'population')}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c, 'population')}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          Median Age (years)
                        </td>
                        {(() => {
                          const a = getMedianAgeMetric(s1);
                          const b = getMedianAgeMetric(s2);
                          const c = s3 ? getMedianAgeMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a)}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b)}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c)}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-rose-600" />
                          Avg Household Size
                        </td>
                        {(() => {
                          const a = getHouseholdSizeMetric(s1);
                          const b = getHouseholdSizeMetric(s2);
                          const c = s3 ? getHouseholdSizeMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a)}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b)}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c)}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          Median Weekly Income
                        </td>
                        {(() => {
                          const a = getMedianIncomeMetric(s1);
                          const b = getMedianIncomeMetric(s2);
                          const c = s3 ? getMedianIncomeMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a, 'medianIncome')}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b, 'medianIncome')}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c, 'medianIncome')}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-600" />
                          Commute to nearest major CBD (est.)
                        </td>
                        {(() => {
                          const a = getCommuteMetric(s1);
                          const b = getCommuteMetric(s2);
                          const c = s3 ? getCommuteMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a, 'commute')}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b, 'commute')}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c, 'commute')}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-600" />
                          Schools (within ~5km radius)
                        </td>
                        {(() => {
                          const a = getSchoolCountMetric(s1);
                          const b = getSchoolCountMetric(s2);
                          const c = s3 ? getSchoolCountMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a)}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b)}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c)}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <TreePine className="h-4 w-4 text-green-600" />
                          Public parks & reserves
                        </td>
                        {(() => {
                          const a = getParksMetric(s1);
                          const b = getParksMetric(s2);
                          const c = s3 ? getParksMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a)}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b)}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c)}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Home className="h-4 w-4 text-orange-600" />
                          Median House Price
                        </td>
                        {(() => {
                          const a = getMedianHousePriceMetric(s1);
                          const b = getMedianHousePriceMetric(s2);
                          const c = s3 ? getMedianHousePriceMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a, 'housePrice')}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b, 'housePrice')}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c, 'housePrice')}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-cyan-600" />
                          Estimated recent annual price change
                        </td>
                        {(() => {
                          const a = getOneYearGrowthMetric(s1);
                          const b = getOneYearGrowthMetric(s2);
                          const c = s3 ? getOneYearGrowthMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a, 'growth')}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b, 'growth')}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c, 'growth')}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-pink-600" />
                          Median Rent
                        </td>
                        {(() => {
                          const a = getMedianRentMetric(s1);
                          const b = getMedianRentMetric(s2);
                          const c = s3 ? getMedianRentMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a, 'rent')}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b, 'rent')}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c, 'rent')}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Percent className="h-4 w-4 text-teal-600" />
                          Rental Yield
                        </td>
                        {(() => {
                          const a = getRentalYieldMetric(s1);
                          const b = getRentalYieldMetric(s2);
                          const c = s3 ? getRentalYieldMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a, 'yield')}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b, 'yield')}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c, 'yield')}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      {/* New Amenity Metrics */}
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <span>☕</span>
                          Cafes (within suburb)
                        </td>
                        {(() => {
                          const a = getCafesMetric(s1);
                          const b = getCafesMetric(s2);
                          const c = s3 ? getCafesMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a)}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b)}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c)}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <span>🍽️</span>
                          Restaurants (within suburb)
                        </td>
                        {(() => {
                          const a = getRestaurantsMetric(s1);
                          const b = getRestaurantsMetric(s2);
                          const c = s3 ? getRestaurantsMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a)}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b)}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c)}</td>}
                            </>
                          );
                        })()}
                      </tr>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <span>🏋️</span>
                          Gyms (within suburb)
                        </td>
                        {(() => {
                          const a = getGymsMetric(s1);
                          const b = getGymsMetric(s2);
                          const c = s3 ? getGymsMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a)}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b)}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c)}</td>}
                            </>
                          );
                        })()}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <div className="bg-emerald-50 border-l-4 border-emerald-600 rounded-lg p-5 mt-6">
              <div className="flex items-start gap-4">
                <Info className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                <div className="text-sm text-gray-700 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 tracking-wide uppercase">
                     Data Sources & Compliance Disclaimers
                  </div>
                  <p className="font-semibold text-slate-800">
                      This information is general in nature and does not constitute financial or investment advice. It does not consider your personal circumstances. Comparisons across different cities should be interpreted with caution due to differing market conditions.
                  </p>
                  <p className="text-xs text-slate-700 font-medium">
                      Metrics are derived from public data sources including ABS and aggregated location datasets. Some figures are estimates and may vary.  
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                     <li className="flex items-start gap-2">
                         <span className="inline-block w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                         <span><strong>ABS Census 2021:</strong> Population, Age, Household Size, Income (approximate suburb-level aggregation).</span>
                     </li>
                     <li className="flex items-start gap-2">
                         <span className="inline-block w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0"></span>
                         <span><strong>Real Estate Data:</strong> Prices, Rent, Growth and Yields are approximate modeled estimates based on recent periods. Not a valuation.</span>
                     </li>
                     <li className="flex items-start gap-2">
                         <span className="inline-block w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></span>
                         <span><strong>Amenities:</strong> Commute to nearest major CBD, Parks, and Schools are modeled. Cafe/Restaurant/Gym counts are strictly within suburb boundaries and may vary.</span>
                     </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export default SuburbComparison2;
