import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, X } from 'lucide-react';

type SuburbData = {
  id?: number;
  suburb_name: string;
  postcode: string;
  state: string;
};

type SearchableSuburbSelectorProps = {
  selectedSuburb: string;
  onSuburbChange: (suburb: string) => void;
  label: string;
};

export function SearchableSuburbSelector({ selectedSuburb, onSuburbChange, label }: SearchableSuburbSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suburbs, setSuburbs] = useState<SuburbData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuburbData, setSelectedSuburbData] = useState<SuburbData | null>(null);

  useEffect(() => {
    if (!selectedSuburb) {
      setSelectedSuburbData(null);
      return;
    }
    const parts = selectedSuburb.split('|');
    setSelectedSuburbData({
      id: 0,
      suburb_name: parts[0]?.trim() || '',
      postcode: parts[1]?.trim() || '',
      state: '',
    });
  }, [selectedSuburb]);

  useEffect(() => {
    if (!searchQuery) {
      setSuburbs([]);
      return;
    }
    setLoading(true);
    fetch(`/api/dropdowns/search?q=${encodeURIComponent(searchQuery)}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        // Handle both old direct array and new {results: []} format
        const items = Array.isArray(data) ? data : (data?.results || []);
        setSuburbs(items);
      })
      .catch(() => setSuburbs([]))
      .finally(() => setLoading(false));
  }, [searchQuery]);

  const handleSelect = (suburb: SuburbData) => {
    onSuburbChange(`${suburb.suburb_name}|${suburb.postcode}`);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex justify-between items-center border border-emerald-300 rounded px-3 py-2 bg-white hover:border-emerald-500 focus:outline-none"
            onClick={() => setOpen(!open)}>
            {selectedSuburbData && selectedSuburbData.suburb_name ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{selectedSuburbData.suburb_name} ({selectedSuburbData.postcode})</span>
                <span
                  onClick={e => { e.stopPropagation(); onSuburbChange(''); }}
                  className="ml-2 text-gray-400 hover:text-red-500 cursor-pointer"
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </span>
              </div>
            ) : (
              <span className="text-gray-500 flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Search suburb...</span>
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3 py-2 bg-emerald-50">
              <Search className="h-4 w-4 text-emerald-600 mr-2" />
              <Input
                placeholder="Type suburb name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="border-0 focus:ring-0 bg-transparent"
              />
            </div>
            <CommandList>
              {loading && <CommandEmpty>Loading...</CommandEmpty>}
              {searchQuery && !loading && suburbs.length === 0 && <CommandEmpty>No suburbs found</CommandEmpty>}
              {!searchQuery && <CommandEmpty className="text-xs text-gray-500 py-4">Start typing...</CommandEmpty>}
              {suburbs.map(suburb => (
                <div
                  key={suburb.suburb_name + suburb.postcode}
                  className="px-3 py-2 cursor-pointer hover:bg-emerald-100 border-b transition-colors"
                  onClick={() => handleSelect(suburb)}
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
