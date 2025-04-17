'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import { Search, Filter, ChevronDown, Star, Zap, Trophy } from 'lucide-react';

interface PoolFilterBarProps {
  onFilterChange: (filters: any) => void; // Callback prop
}

export const PoolFilterBar: React.FC<PoolFilterBarProps> = ({ onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  // Add state for individual filter values
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [minEntryFee, setMinEntryFee] = useState('');
  const [maxEntryFee, setMaxEntryFee] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [yieldFilter, setYieldFilter] = useState('');

  // Effect to call onFilterChange when any filter state changes
  useEffect(() => {
    const filters = {
      searchTerm,
      status: statusFilter,
      frequency: frequencyFilter,
      minEntryFee: minEntryFee ? parseFloat(minEntryFee) : undefined,
      maxEntryFee: maxEntryFee ? parseFloat(maxEntryFee) : undefined,
      currency: currencyFilter,
      yield: yieldFilter,
    };
    onFilterChange(filters);
  }, [searchTerm, statusFilter, frequencyFilter, minEntryFee, maxEntryFee, currencyFilter, yieldFilter, onFilterChange]);


  return (
    <div className="bg-[#1a1a18] p-4 rounded-xl shadow-md flex flex-col gap-4 mb-6 border border-[#e6ce04]/20">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#f8e555]/50" />
          </div>
          <input
            type="text"
            placeholder="Search games by name..." // More specific placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-[#e6ce04]/20 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50"
          />
        </div>

        {/* Simplified Dropdowns (Full dropdown logic would require more state/library) */}
        <div className="flex space-x-3">
          {/* Status Dropdown Placeholder */}
          <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="flex items-center justify-center px-4 py-2 border border-[#e6ce04]/20 rounded-lg bg-[#252520] text-[#f8e555] hover:bg-[#353530] hover:border-[#e6ce04]/30 transition-colors appearance-none cursor-pointer"
             style={{ paddingRight: '2.5rem' }} // Add space for icon
           >
             <option value="">All Status</option>
             <option value="active">Active</option>
             <option value="filling">Filling</option>
             <option value="completed">Completed</option>
           </select>

          {/* Frequency Dropdown Placeholder */}
           <select
             value={frequencyFilter}
             onChange={(e) => setFrequencyFilter(e.target.value)}
             className="flex items-center justify-center px-4 py-2 border border-[#e6ce04]/20 rounded-lg bg-[#252520] text-[#f8e555] hover:bg-[#353530] hover:border-[#e6ce04]/30 transition-colors appearance-none cursor-pointer"
             style={{ paddingRight: '2.5rem' }}
           >
             <option value="">All Frequencies</option>
             <option value="daily">Daily</option>
             <option value="weekly">Weekly</option>
             <option value="biweekly">Bi-weekly</option>
             <option value="monthly">Monthly</option>
           </select>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters
                ? 'bg-[#e6ce04]/10 border-[#e6ce04]/50 text-[#e6ce04]'
                : 'bg-[#252520] border-[#e6ce04]/20 text-[#f8e555] hover:bg-[#353530] hover:border-[#e6ce04]/30'
            }`}
          >
            <Filter className="h-4 w-4 mr-2 text-[#e6ce04]" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Collapsible Filter Section */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#e6ce04]/10">
          {/* Entry Fee Range */}
          <div>
            <label className="block text-sm text-[#f8e555]/70 mb-2">Entry Fee Range (USD Estimate)</label> {/* Clarify estimate */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={minEntryFee}
                onChange={(e) => setMinEntryFee(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#e6ce04]/20 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50"
              />
              <span className="text-[#f8e555]/50">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxEntryFee}
                onChange={(e) => setMaxEntryFee(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#e6ce04]/20 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50"
              />
            </div>
          </div>

          {/* Currency Filter */}
          <div>
            <label className="block text-sm text-[#f8e555]/70 mb-2">Currency</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6ce04]/20 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent"
            >
              <option value="">All Currencies</option>
              <option value="USDC">USDC</option>
              <option value="ETH">ETH (Wrapped)</option> {/* Specify wrapped */}
              <option value="SOL">SOL</option>
              {/* Add other relevant SPL tokens */}
            </select>
          </div>

          {/* Yield Filter */}
          <div>
            <label className="block text-sm text-[#f8e555]/70 mb-2">Yield (APY Estimate)</label> {/* Clarify estimate */}
            <select
              value={yieldFilter}
              onChange={(e) => setYieldFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6ce04]/20 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent"
            >
              <option value="">Any Yield</option>
              <option value="high">High Yield (15%+)</option>
              <option value="medium">Medium Yield (10-15%)</option>
              <option value="low">Low Yield (5-10%)</option>
            </select>
          </div>

          {/* Apply/Reset Buttons (Optional - filters apply automatically via useEffect) */}
          {/* <div className="md:col-span-3 flex justify-end space-x-2">
             <button onClick={() => {}} className="px-4 py-2 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center">
               <Zap className="w-4 h-4 mr-2" />
               Apply Filters
             </button>
             <button onClick={() => {}} className="px-4 py-2 bg-[#252520] hover:bg-[#353530] text-[#f8e555] border border-[#e6ce04]/30 rounded-lg transition duration-300">
               Reset
             </button>
           </div> */}
        </div>
      )}
    </div>
  );
};