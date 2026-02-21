import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, X, Car, Users, Info, TreePine, Bus } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
// charts removed — only display verified metrics

type Metric = {
  value: number;
  source: string;
  datasetYear: number;
  type: 'official_dataset' | 'derived_metric';
};

type SuburbData = {
  id?: number;
  suburb_name: string;
  postcode: string;
  state: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  realTimeData?: {
    population?: Metric | null;
    medianAge?: Metric | null;
    householdSize?: Metric | null;
    employmentRate?: Metric | null;
    medianIncome?: Metric | null;
    commute?: { drivingTimeMinutes?: Metric | null } | null;
    schools?: { count?: Metric | null } | null;
    publicTransportStops?: Metric | null;
    parks?: Metric | null;
  } | null;
  dataSource?: string | null;
  lastUpdated?: string | null;
};

type SearchableSuburbSelectorProps = {
  selectedSuburb: string;
  onSuburbChange: (suburb: string) => void;
  label: string;
};

function SearchableSuburbSelector({ selectedSuburb, onSuburbChange, label }: SearchableSuburbSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suburbs, setSuburbs] = useState<SuburbData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuburbData, setSelectedSuburbData] = useState<SuburbData | null>(null);

  useEffect(() => {
    if (selectedSuburb) {
      setLoading(true);
      const parts = selectedSuburb.includes('|') ? selectedSuburb.split('|') : [selectedSuburb];
      const suburbanName = parts[0]?.trim() || '';
      const postcode = parts[1]?.trim() || null;
      
      if (!suburbanName) {
        setSelectedSuburbData(null);
        setLoading(false);
        return;
      }
      
      fetch(`/api/suburbs/search?query=${encodeURIComponent(suburbanName)}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (data.data?.length > 0) {
            const chosen = postcode 
              ? data.data.find((s: SuburbData) => String(s.postcode) === String(postcode)) || data.data[0]
              : data.data[0];
            setSelectedSuburbData(chosen);
          } else {
            setSelectedSuburbData(null);
          }
        })
        .catch(() => setSelectedSuburbData(null))
        .finally(() => setLoading(false));
    } else {
      setSelectedSuburbData(null);
    }
  }, [selectedSuburb]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuburbs([]);
      return;
    }
    setLoading(true);
    fetch(`/api/suburbs/search?query=${encodeURIComponent(searchQuery)}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const unique = Array.from(new Map(((data.data || []) as SuburbData[]).map((s) => [s.suburb_name, s])).values());
        const sorted = unique.sort((a, b) => {
          const aExact = a.suburb_name === searchQuery.toUpperCase() ? 0 : 1;
          const bExact = b.suburb_name === searchQuery.toUpperCase() ? 0 : 1;
          return aExact !== bExact ? aExact - bExact : a.suburb_name.localeCompare(b.suburb_name);
        });
        setSuburbs(sorted);
      })
      .catch(() => setSuburbs([]))
      .finally(() => setLoading(false));
  }, [searchQuery]);

  const handleSelect = (suburb: string, postcode?: string) => {
    onSuburbChange(postcode ? `${suburb}|${postcode}` : suburb);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between border-emerald-300 hover:border-emerald-500">
            {selectedSuburbData ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{selectedSuburbData.suburb_name} ({selectedSuburbData.postcode})</span>
              </div>
            ) : (
              <span className="text-gray-500 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search suburb...
              </span>
            )}
            {selectedSuburbData && <X className="h-4 w-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); onSuburbChange(''); }} />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3 py-2 bg-emerald-50">
              <Search className="h-4 w-4 text-emerald-600 mr-2" />
              <Input
                placeholder="Type suburb name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus:ring-0 bg-transparent"
              />
            </div>
            <CommandList>
              {loading && <CommandEmpty>Loading...</CommandEmpty>}
              {searchQuery && !loading && suburbs.length === 0 && <CommandEmpty>No suburbs found</CommandEmpty>}
              {!searchQuery && <CommandEmpty className="text-xs text-gray-500 py-4">Start typing...</CommandEmpty>}
              {suburbs.map((suburb) => (
                <div
                  key={suburb.suburb_name + suburb.postcode}
                  className="px-3 py-2 cursor-pointer hover:bg-emerald-100 border-b transition-colors"
                  onClick={() => handleSelect(suburb.suburb_name, suburb.postcode)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{suburb.suburb_name}</span>
                    <Badge className="text-xs bg-emerald-600">{suburb.postcode}</Badge>
                  </div>
                </div>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function SuburbComparison() {
  const [suburb1, setSuburb1] = useState('');
  const [suburb2, setSuburb2] = useState('');
  const [suburb3, setSuburb3] = useState('');
  const [s1, setS1] = useState<SuburbData | null>(null);
  const [s2, setS2] = useState<SuburbData | null>(null);
  const [s3, setS3] = useState<SuburbData | null>(null);

  const fetchSuburb = (name: string, setState: (data: SuburbData | null) => void) => {
    if (!name) {
      setState(null);
      return;
    }
    const parts = name.split('|');
    const suburbanName = parts[0]?.trim() || '';
    const postcode = parts[1]?.trim() || null;

    fetch(`/api/suburbs/search?query=${encodeURIComponent(suburbanName)}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.data?.length > 0) {
          const chosen = postcode 
            ? data.data.find((s: SuburbData) => String(s.postcode) === String(postcode)) || data.data[0]
            : data.data[0];
          return fetch(`/api/suburbs/${chosen.id}/details`);
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

  // Accept both the new strict metric objects and legacy numeric shapes from the running backend.
  const formatMetric = (metric?: any | null, metricType?: string) => {
    if (metric == null) return { display: 'Data not available', meta: null, badge: null };
    // legacy numeric
    if (typeof metric === 'number') {
      // Handle employment rate in decimal format (convert to percentage)
      const displayValue = metricType === 'employmentRate' && metric < 1 
        ? (metric * 100).toFixed(1) 
        : typeof metric === 'number' && metric % 1 === 0 
          ? metric.toLocaleString() 
          : metric.toFixed(1);
      return { display: displayValue, meta: null, badge: null };
    }
    // strict metric object
    if (typeof metric === 'object' && metric.value != null) {
      let displayValue = metric.value;
      // Handle employment rate in decimal format (defensive)
      if (metricType === 'employmentRate' && displayValue < 1) {
        displayValue = displayValue * 100;
      }
      const display = typeof displayValue === 'number' 
        ? (displayValue % 1 !== 0 ? displayValue.toFixed(1) : displayValue.toLocaleString())
        : Number(displayValue).toLocaleString();
      
      const meta = metric.source ? `${metric.source}${metric.datasetYear ? ` (${metric.datasetYear})` : ''}` : null;
      const isOfficial = metric.source?.includes('ABS Census');
      const badge = isOfficial ? 'official' : metric.source?.includes('Estimate') || !metric.source ? 'estimate' : 'derived';
      return { display, meta, badge };
    }
    return { display: 'Data not available', meta: null, badge: null };
  };

  const renderMetricCell = (metric: any, metricType?: string) => {
    const formatted = formatMetric(metric, metricType);
    const badgeStyles: Record<string, string> = {
      official: 'bg-green-100 text-green-800 border-green-300',
      estimate: 'bg-amber-100 text-amber-800 border-amber-300',
      derived: 'bg-blue-100 text-blue-800 border-blue-300',
      lowConfidence: 'bg-red-100 text-red-800 border-red-300'
    };
    const badgeLabels: Record<string, string> = {
      official: '✓ Census',
      estimate: '⚠ Est.',
      derived: 'ⓘ Derived',
      lowConfidence: '⚠ Low Confidence'
    };
    
    // Check for low data quality confidence
    const hasLowConfidence = metric?.dataQualityConfidence && metric.dataQualityConfidence < 50;
    
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-lg font-bold text-emerald-700">{formatted.display}</div>
        {hasLowConfidence && (
          <div className={`text-xs px-2 py-1 rounded border ${badgeStyles['lowConfidence']}`} title={metric.dataQualityNote || 'Low confidence estimate'}>
            {badgeLabels['lowConfidence']}
          </div>
        )}
        {formatted.badge && (
          <div className={`text-xs px-2 py-1 rounded border ${badgeStyles[formatted.badge]}`}>
            {badgeLabels[formatted.badge]}
          </div>
        )}
        {formatted.meta && (
          <div className="text-xs text-gray-500">{formatted.meta}</div>
        )}
      </div>
    );
  };

  const getPopulationMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    return s.realTimeData.population ?? (s.realTimeData as any).population ?? null;
  };

  const getMedianAgeMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    return (s.realTimeData as any).medianAge ?? null;
  };

  const getHouseholdSizeMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    return (s.realTimeData as any).householdSize ?? null;
  };

  const getEmploymentRateMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    return (s.realTimeData as any).employmentRate ?? null;
  };

  const getMedianIncomeMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    return (s.realTimeData as any).medianIncome ?? null;
  };

  const getCommuteMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    // prefer nested drivingTimeMinutes, fallback to legacy commuteTime or numeric
    return s.realTimeData?.commute?.drivingTimeMinutes ?? (s.realTimeData as any).commuteTime ?? (s.realTimeData as any).commuteMinutes ?? null;
  };

  const getSchoolCountMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    return s.realTimeData?.schools?.count ?? (s.realTimeData as any).schoolCount ?? null;
  };

  const getPublicTransportStopsMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    return (s.realTimeData as any).publicTransportStops ?? null;
  };

  const getParksMetric = (s: SuburbData | null) => {
    if (!s || !s.realTimeData) return null;
    return (s.realTimeData as any).parks ?? null;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 bg-gradient-to-b from-emerald-50 to-white p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Suburb Comparison</h1>
          </div>
          <p className="text-emerald-100">Compare Australian suburbs with verified data</p>
        </div>

        {/* Selection */}
        <Card className="border-emerald-200">
          <CardHeader className="bg-emerald-50 border-b-2 border-emerald-200">
            <CardTitle>Select Suburbs to Compare</CardTitle>
            <CardDescription>Choose 2-3 suburbs to view side-by-side metrics</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchableSuburbSelector label="Suburb 1" selectedSuburb={suburb1} onSuburbChange={setSuburb1} />
              <SearchableSuburbSelector label="Suburb 2" selectedSuburb={suburb2} onSuburbChange={setSuburb2} />
              <SearchableSuburbSelector label="Suburb 3 (Optional)" selectedSuburb={suburb3} onSuburbChange={setSuburb3} />
            </div>
          </CardContent>
        </Card>

        {!suburb1 && !suburb2 && !suburb3 && (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Select suburbs to begin comparison</p>
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
                          <div className="font-bold">{s1.suburb_name}</div>
                          <div className="text-xs text-emerald-100">{s1.postcode}, {s1.state}</div>
                        </th>
                        <th className="px-6 py-4 text-center font-bold text-emerald-50">
                          <div className="font-bold">{s2.suburb_name}</div>
                          <div className="text-xs text-emerald-100">{s2.postcode}, {s2.state}</div>
                        </th>
                        {s3 && (
                          <th className="px-6 py-4 text-center font-bold text-emerald-50">
                            <div className="font-bold">{s3.suburb_name}</div>
                            <div className="text-xs text-emerald-100">{s3.postcode}, {s3.state}</div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-600" />
                          Population
                        </td>
                        {(() => {
                          const a = getPopulationMetric(s1);
                          const b = getPopulationMetric(s2);
                          const c = s3 ? getPopulationMetric(s3) : null;
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
                          <Users className="h-4 w-4 text-amber-600" />
                          Employment Rate (%)
                        </td>
                        {(() => {
                          const a = getEmploymentRateMetric(s1);
                          const b = getEmploymentRateMetric(s2);
                          const c = s3 ? getEmploymentRateMetric(s3) : null;
                          return (
                            <>
                              <td className="px-6 py-4 text-center">{renderMetricCell(a, 'employmentRate')}</td>
                              <td className="px-6 py-4 text-center">{renderMetricCell(b, 'employmentRate')}</td>
                              {s3 && <td className="px-6 py-4 text-center">{renderMetricCell(c, 'employmentRate')}</td>}
                            </>
                          );
                        })()}
                      </tr>

                      <tr className="border-b hover:bg-emerald-50">
                        <td className="px-6 py-4 font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          Median Income (AUD)
                        </td>
                        {(() => {
                          const a = getMedianIncomeMetric(s1);
                          const b = getMedianIncomeMetric(s2);
                          const c = s3 ? getMedianIncomeMetric(s3) : null;
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
                          <Car className="h-4 w-4 text-blue-600" />
                          Commute (driving minutes)
                        </td>
                        {(() => {
                          const a = getCommuteMetric(s1);
                          const b = getCommuteMetric(s2);
                          const c = s3 ? getCommuteMetric(s3) : null;
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
                          <Users className="h-4 w-4 text-indigo-600" />
                          School Count
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
                          <Bus className="h-4 w-4 text-purple-600" />
                          Public Transport Stops
                        </td>
                        {(() => {
                          const a = getPublicTransportStopsMetric(s1);
                          const b = getPublicTransportStopsMetric(s2);
                          const c = s3 ? getPublicTransportStopsMetric(s3) : null;
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
                          Parks
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
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Charts removed — only show verified metrics in table */}

            {/* Info */}
            <div className="bg-emerald-50 border-l-4 border-emerald-600 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                <div className="text-sm text-gray-700">
                  <strong className="text-emerald-900">Data Sources & Accuracy (9 Metrics):</strong>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded border border-green-300 bg-green-100"></span>
                      <span><strong>✓ Census:</strong> ABS Census 2021 official data (population, median age, household size, employment, income)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded border border-amber-300 bg-amber-100"></span>
                      <span><strong>⚠ Estimates:</strong> Postcode-based demographic estimates where official data unavailable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded border border-blue-300 bg-blue-100"></span>
                      <span><strong>ⓘ Derived:</strong> Calculated metrics (routes, transport density, parks, schools)</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-600 italic">9 metrics: Population, Age, Household Size, Employment, Income, Commute, Schools, Transport Stops, Parks</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
