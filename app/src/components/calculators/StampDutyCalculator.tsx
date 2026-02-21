import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { stampDutyData, firstHomeBuyerGrants, getStates } from '@/data/australianFinancialData';
import { 
  Home, 
  DollarSign, 
  UserCheck, 
  Globe, 
  Info,
  CheckCircle2,
  XCircle,
  Gift
} from 'lucide-react';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';

export function StampDutyCalculator() {
  const [propertyValue, setPropertyValue] = useState<number>(800000);
  const [selectedState, setSelectedState] = useState<string>('nsw');
  const [isFirstHomeBuyer, setIsFirstHomeBuyer] = useState<boolean>(false);
  const [isNewHome, setIsNewHome] = useState<boolean>(false);
  const [isForeignBuyer, setIsForeignBuyer] = useState<boolean>(false);
  const [isInvestment, setIsInvestment] = useState<boolean>(false);

  const states = getStates();
  const stateData = stampDutyData[selectedState];
  const grantInfo = firstHomeBuyerGrants.find(g => g.state === selectedState.toUpperCase());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate stamp duty
  const calculations = useMemo(() => {
    const value = propertyValue;
    let stampDuty = 0;
    let concessionAmount = 0;
    let foreignSurcharge = 0;
    let grantAmount = 0;
    let explanation = '';

    // Find the applicable bracket
    const brackets = stateData.brackets;
    let applicableBracket = brackets[0];
    
    for (let i = brackets.length - 1; i >= 0; i--) {
      if (value >= brackets[i].threshold) {
        applicableBracket = brackets[i];
        break;
      }
    }

    // Calculate base stamp duty
    const taxableAmount = value - applicableBracket.threshold;
    stampDuty = applicableBracket.baseAmount + (taxableAmount * applicableBracket.rate / 100);

    // Apply first home buyer concessions
    if (isFirstHomeBuyer && !isInvestment) {
      const exemption = stateData.firstHomeBuyerExemption;
      if (exemption) {
        const maxValue = isNewHome ? exemption.maxPropertyValueNewHome : exemption.maxPropertyValue;
        
        if (value <= maxValue) {
          if (exemption.concessionRate === 0) {
            concessionAmount = stampDuty;
            explanation = `Full stamp duty exemption for first home buyers up to ${formatCurrency(maxValue)}`;
          } else {
            concessionAmount = stampDuty * exemption.concessionRate;
            explanation = `${(exemption.concessionRate * 100)}% concession for first home buyers`;
          }
        }

        // Check for first home buyer grant
        if (grantInfo && value <= grantInfo.maxPropertyValue && (!grantInfo.newHomeOnly || isNewHome)) {
          grantAmount = grantInfo.grantAmount;
        }
      }
    }

    // Apply foreign buyer surcharge
    if (isForeignBuyer) {
      foreignSurcharge = value * stateData.foreignBuyerSurcharge / 100;
    }

    const finalStampDuty = stampDuty - concessionAmount + foreignSurcharge;

    return {
      baseStampDuty: stampDuty,
      concessionAmount,
      foreignSurcharge,
      finalStampDuty: Math.max(0, finalStampDuty),
      grantAmount,
      explanation,
      effectiveRate: (finalStampDuty / value) * 100,
    };
  }, [propertyValue, stateData, isFirstHomeBuyer, isNewHome, isForeignBuyer, isInvestment, grantInfo]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  Property Details
                </CardTitle>
                <CardDescription>Enter your property information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* State Selection */}
                <div className="space-y-3">
                  <Label className="text-base">State/Territory</Label>
                  <Tabs value={selectedState} onValueChange={setSelectedState}>
                    <TabsList className="grid grid-cols-4 gap-2 h-auto">
                      {states.map((state) => (
                        <TabsTrigger 
                          key={state.code} 
                          value={state.code}
                          className="text-xs sm:text-sm"
                        >
                          {state.code.toUpperCase()}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <p className="text-sm text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{stateData.name}</span>
                  </p>
                </div>

                {/* Property Value */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="propertyValue" className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Property Value
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        id="propertyValue"
                        type="number"
                        value={propertyValue}
                        onChange={(e) => setPropertyValue(Number(e.target.value))}
                        className="w-36 text-right"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[propertyValue]}
                    onValueChange={(value) => setPropertyValue(value[0])}
                    min={100000}
                    max={3000000}
                    step={10000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$100k</span>
                    <span>$3M</span>
                  </div>
                </div>

                {/* Buyer Options */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base">Buyer Details</Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* First Home Buyer */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium">First Home Buyer</div>
                          <div className="text-xs text-muted-foreground">Eligible for concessions</div>
                        </div>
                      </div>
                      <Switch
                        checked={isFirstHomeBuyer}
                        onCheckedChange={setIsFirstHomeBuyer}
                      />
                    </div>

                    {/* New Home */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-sm font-medium">New Home</div>
                          <div className="text-xs text-muted-foreground">Brand new property</div>
                        </div>
                      </div>
                      <Switch
                        checked={isNewHome}
                        onCheckedChange={setIsNewHome}
                      />
                    </div>

                    {/* Foreign Buyer */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="text-sm font-medium">Foreign Buyer</div>
                          <div className="text-xs text-muted-foreground">Additional surcharge applies</div>
                        </div>
                      </div>
                      <Switch
                        checked={isForeignBuyer}
                        onCheckedChange={setIsForeignBuyer}
                      />
                    </div>

                    {/* Investment Property */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-sm font-medium">Investment</div>
                          <div className="text-xs text-muted-foreground">Not primary residence</div>
                        </div>
                      </div>
                      <Switch
                        checked={isInvestment}
                        onCheckedChange={setIsInvestment}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* First Home Buyer Info */}
            {isFirstHomeBuyer && grantInfo && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                    <Gift className="h-5 w-5" />
                    First Home Buyer Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    {calculations.grantAmount > 0 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium text-green-900">
                        First Home Owner Grant: {formatCurrency(calculations.grantAmount)}
                      </div>
                      <div className="text-sm text-green-700">
                        {grantInfo.newHomeOnly ? 'New homes only. ' : ''}
                        Property value must be under {formatCurrency(grantInfo.maxPropertyValue)}
                      </div>
                    </div>
                  </div>
                  
                  {stateData.firstHomeBuyerExemption && (
                    <div className="flex items-start gap-3">
                      {calculations.concessionAmount > 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium text-green-900">
                          Stamp Duty {calculations.concessionAmount === calculations.baseStampDuty ? 'Exemption' : 'Concession'}
                        </div>
                        <div className="text-sm text-green-700">
                          Available for properties up to {formatCurrency(stateData.firstHomeBuyerExemption.maxPropertyValueNewHome)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-green-600 mt-2">
                    {grantInfo.additionalInfo}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Stamp Duty Payable</CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  Total government charges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {formatCurrency(calculations.finalStampDuty)}
                </div>
                <div className="text-sm opacity-90">
                  Effective rate: {calculations.effectiveRate.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Calculation Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Base Stamp Duty</span>
                  <span className="font-medium">{formatCurrency(calculations.baseStampDuty)}</span>
                </div>
                
                {calculations.concessionAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b text-green-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      First Home Buyer Concession
                    </span>
                    <span className="font-medium">-{formatCurrency(calculations.concessionAmount)}</span>
                  </div>
                )}
                
                {calculations.foreignSurcharge > 0 && (
                  <div className="flex justify-between items-center py-2 border-b text-orange-600">
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      Foreign Buyer Surcharge ({stateData.foreignBuyerSurcharge}%)
                    </span>
                    <span className="font-medium">+{formatCurrency(calculations.foreignSurcharge)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 bg-muted rounded-lg px-3 mt-2">
                  <span className="font-semibold">Total Payable</span>
                  <span className="font-bold text-lg">{formatCurrency(calculations.finalStampDuty)}</span>
                </div>
              </CardContent>
            </Card>

            {/* State Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {stateData.name} Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Foreign Surcharge</span>
                    <span className="font-medium">{stateData.foreignBuyerSurcharge}%</span>
                  </div>
                  {stateData.firstHomeBuyerExemption && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FHOG Max Value</span>
                      <span className="font-medium">
                        {formatCurrency(stateData.firstHomeBuyerExemption.maxPropertyValueNewHome)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total Funds Needed */}
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-800">Total Upfront Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700 mb-1">
                  {formatCurrency(calculations.finalStampDuty)}
                </div>
                <div className="text-sm text-orange-600">
                  Stamp duty only. Add legal fees, inspection costs, and moving expenses.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center">
          <Info className="h-3 w-3 inline mr-1" />
          Stamp duty rates are current as of 2024-2025. Rates and concessions change regularly. 
          Verify with your state revenue office before settlement. This calculator is a guide only.
        </div>
      </div>
    </TooltipProvider>
  );
}

// Helper component for the investment icon
function TrendingUp({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
