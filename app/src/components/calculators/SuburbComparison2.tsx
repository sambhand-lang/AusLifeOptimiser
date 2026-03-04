"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { SearchableSuburbSelector } from './SearchableSuburbSelector';

export type SuburbComparison2Props = {
  initialSuburb1?: string;
  initialSuburb2?: string;
  initialSuburb3?: string;
  // optional data from the Next.js suburbs compare page – currently unused on the SPA side
  suburbs?: unknown;
};

export function SuburbComparison2({
  initialSuburb1 = '',
  initialSuburb2 = '',
  initialSuburb3 = '',
}: SuburbComparison2Props) {
  const [suburb1, setSuburb1] = useState(initialSuburb1);
  const [suburb2, setSuburb2] = useState(initialSuburb2);
  const [suburb3, setSuburb3] = useState(initialSuburb3);

  const hasSelection = !!(suburb1 || suburb2 || suburb3);

  return (
    <div className="space-y-6 bg-gradient-to-b from-emerald-50 to-white p-6 rounded-xl">
      <Card className="border-emerald-200">
        <CardHeader className="bg-emerald-50 border-b-2 border-emerald-200">
          <CardTitle>Suburb Comparison</CardTitle>
          <CardDescription>
            Select 2–3 suburbs to compare key metrics side by side.
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

      {hasSelection && (
        <Card className="border-dashed border-emerald-300 bg-white/70">
          <CardHeader>
            <CardTitle>Comparison coming soon</CardTitle>
            <CardDescription>
              The visual side-by-side metric table will be rendered here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              You have selected:
            </p>
            <ul className="mt-2 text-sm text-emerald-800 list-disc list-inside space-y-1">
              {suburb1 && <li>{suburb1}</li>}
              {suburb2 && <li>{suburb2}</li>}
              {suburb3 && <li>{suburb3}</li>}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SuburbComparison2;
