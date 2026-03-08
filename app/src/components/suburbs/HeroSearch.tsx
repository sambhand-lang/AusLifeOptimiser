import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function HeroSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      setIsOpen(true);
      try {
        const res = await fetch(`/api/dropdowns/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data?.data || data?.results || []);
        setResults(items);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (suburb: any) => {
    const state = suburb.state.toLowerCase();
    const name = suburb.suburb_name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/suburbs/${state}/${name}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="mb-8 max-w-xl relative" ref={wrapperRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search for a suburb (e.g. Sydney, Bondi...)"
          className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white focus:text-slate-900 transition-all shadow-2xl"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length > 0) {
              handleSelect(results[0]);
            }
          }}
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <Badge variant="outline" className="border-white/20 text-white/40 text-[10px] hidden sm:block">Recommend</Badge>
        </div>
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[300px] overflow-y-auto">
            {loading && results.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">Searching...</div>
            ) : results.length > 0 ? (
              results.map((suburb) => (
                <button
                  key={`${suburb.ssc}-${suburb.suburb_name}`}
                  onClick={() => handleSelect(suburb)}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 uppercase text-xs tracking-wider">{suburb.suburb_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{suburb.state} • {suburb.postcode}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-100">Select</Badge>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-sm">No suburbs found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
