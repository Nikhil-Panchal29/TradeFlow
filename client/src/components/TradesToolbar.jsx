import { useEffect, useRef, useState } from 'react';
import { exportTradesCsv, getSymbols } from '../api.js';

export default function TradesToolbar({
  search,
  onSearchChange,
  selectedSymbol,
  onSymbolChange,
  sortBy,
  order,
  symbols,
}) {
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleExport = async () => {
    try {
      const response = await exportTradesCsv({
        search,
        symbol: selectedSymbol,
        sortBy,
        order,
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trades.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export CSV. Please try again.');
    }
  };

  return (
    <div className="trades-toolbar">
      <input
        type="text"
        className="toolbar-search"
        placeholder="Search trade ID, client or symbol…"
        value={localSearch}
        onChange={handleSearchChange}
      />
      <select
        className="toolbar-select"
        value={selectedSymbol ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          onSymbolChange(value === '' ? null : value);
        }}
      >
        <option value="">All symbols</option>
        {symbols.map((symbol) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-export"
        onClick={handleExport}
      >
        Export CSV
      </button>
    </div>
  );
}
