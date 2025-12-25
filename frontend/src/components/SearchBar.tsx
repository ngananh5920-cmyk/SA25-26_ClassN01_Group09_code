import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Users, Calendar, DollarSign, Building2 } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'employee' | 'department' | 'leave' | 'salary';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  path: string;
}

interface SearchBarProps {
  onResultClick?: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    // Simulate search - trong thực tế sẽ gọi API
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'employee',
          title: `Nhân viên: ${searchQuery}`,
          subtitle: 'Phòng IT',
          icon: <Users size={16} />,
          path: '/employees',
        },
      ];
      setResults(mockResults);
      setIsLoading(false);
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Tìm kiếm nhân viên, phòng ban, đơn nghỉ phép..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-sm">Đang tìm kiếm...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-gray-400">{result.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Không tìm thấy kết quả</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

