<<<<<<< HEAD
'use client';

import React, { Dispatch, SetStateAction } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

export interface PoolFilterBarProps {
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

export const PoolFilterBar: React.FC<PoolFilterBarProps> = ({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery
}) => {
  const [showFilters, setShowFilters] = React.useState(false);
  const [frequencyFilter, setFrequencyFilter] = React.useState('');
  const [minEntryFee, setMinEntryFee] = React.useState('');
  const [maxEntryFee, setMaxEntryFee] = React.useState('');
  const [currencyFilter, setCurrencyFilter] = React.useState('');
  const [yieldFilter, setYieldFilter] = React.useState('');

  return (
    <div className="bg-[#010200]/50 border-4 border-[#ffdd00] p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#ffdd00]" />
          </div>
          <input
            type="text"
            placeholder="Search games by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00] placeholder-[#ffdd00]/50"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex space-x-3">
          {/* Status Dropdown */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="appearance-none cursor-pointer px-4 py-2 pr-8 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
            style={{ paddingRight: '2.5rem' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="filling">Filling</option>
            <option value="completed">Completed</option>
          </select>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 font-mono text-lg rounded-lg flex items-center ${
              showFilters 
                ? 'bg-[#ffdd00] text-black border-2 border-black' 
                : 'bg-[#010200] text-[#ffdd00] border-2 border-[#ffdd00]'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Collapsible Filter Section */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 mt-6 border-t-2 border-[#ffdd00]/30">
          {/* Entry Fee Range */}
          <div>
            <label className="block text-lg mb-2 font-mono text-[#ffdd00]">Entry Fee Range (USD)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={minEntryFee}
                onChange={(e) => setMinEntryFee(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
              />
              <span className="font-mono text-2xl text-[#ffdd00]">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxEntryFee}
                onChange={(e) => setMaxEntryFee(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
              />
            </div>
          </div>

          {/* More filters as needed */}
        </div>
      )}
    </div>
  );
=======
'use client';

import React, { Dispatch, SetStateAction, useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

export interface PoolFilterBarProps {
  activeFilter: string;
  setActiveFilter: Dispatch<SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

export const PoolFilterBar: React.FC<PoolFilterBarProps> = ({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [poolType, setPoolType] = useState<'all' | 'spl' | 'sol'>('all');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  const [frequencyFilter, setFrequencyFilter] = React.useState('');
  const [minEntryFee, setMinEntryFee] = React.useState('');
  const [maxEntryFee, setMaxEntryFee] = React.useState('');
  const [currencyFilter, setCurrencyFilter] = React.useState('');
  const [yieldFilter, setYieldFilter] = React.useState('');

  // Add new filter handlers
  const handlePoolTypeChange = (type: 'all' | 'spl' | 'sol') => {
    setPoolType(type);
  };

  const handlePrivacyFilterChange = (privacy: 'all' | 'public' | 'private') => {
    setPrivacyFilter(privacy);
  };

  return (
    <div className="bg-[#010200]/50 border-4 border-[#ffdd00] p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#ffdd00]" />
          </div>
          <input
            type="text"
            placeholder="Search games by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00] placeholder-[#ffdd00]/50"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex space-x-3">
          {/* Status Dropdown */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="appearance-none cursor-pointer px-4 py-2 pr-8 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
            style={{ paddingRight: '2.5rem' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="filling">Filling</option>
            <option value="completed">Completed</option>
          </select>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 font-mono text-lg rounded-lg flex items-center ${
              showFilters 
                ? 'bg-[#ffdd00] text-black border-2 border-black' 
                : 'bg-[#010200] text-[#ffdd00] border-2 border-[#ffdd00]'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Collapsible Filter Section */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 mt-6 border-t-2 border-[#ffdd00]/30">
          {/* Entry Fee Range */}
          <div>
            <label className="block text-lg mb-2 font-mono text-[#ffdd00]">Entry Fee Range (USD)</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={minEntryFee}
                onChange={(e) => setMinEntryFee(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
              />
              <span className="font-mono text-2xl text-[#ffdd00]">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxEntryFee}
                onChange={(e) => setMaxEntryFee(e.target.value)}
                className="w-full px-3 py-1.5 font-mono text-lg text-[#ffdd00] bg-[#010200] border-2 border-[#ffdd00]/50 rounded-lg focus:outline-none focus:border-[#ffdd00]"
              />
            </div>
          </div>

          {/* More filters as needed */}
        </div>
      )}
    </div>
  );
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
};