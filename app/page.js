'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const islands = ['All', 'St. Kitts', 'Nevis'];

const categories = [
  'All',
  'Food & Drink',
  'Music',
  'Beach',
  'Nightlife',
  'Events',
];

function normalizeIsland(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/saint/g, 'st')
    .replace(/\s+/g, ' ')
    .trim();
}

function FilterPill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm ${
        active
          ? 'bg-white text-black'
          : 'bg-white/10 text-white border border-white/20'
      }`}
    >
      {children}
    </button>
  );
}

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function fetchListings() {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('approved', true)
        .order('date', { ascending: true });

      setListings(data || []);
    }

    fetchListings();
  }, []);

  const filtered = useMemo(() => {
    return listings.filter((item) => {
      const matchSearch =
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());

      const matchIsland =
        selectedIsland === 'All' ||
        normalizeIsland(item.island) === normalizeIsland(selectedIsland);

      const matchCategory =
        selectedCategory === 'All' ||
        item.category === selectedCategory;

      return matchSearch && matchIsland && matchCategory;
    });
  }, [listings, search, selectedIsland, selectedCategory]);

  return (
    <div className="relative min-h-screen text-white">

      {/* BACKGROUND IMAGE */}
      <img
        src="/background3.png"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 z-10" />

      {/* CONTENT */}
      <main className="relative z-20 pb-20">
        <div className="mx-auto max-w-6xl px-4 py-6">

          {/* HEADER */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold">869 To Do</h1>
            <p className="text-white/70">
              What’s happening in St. Kitts & Nevis
            </p>

            <Link
              href="/submit"
              className="inline-block mt-4 px-6 py-2 bg-white text-black rounded-lg font-semibold"
            >
              Submit Listing
            </Link>
          </div>

          {/* SEARCH */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"
            />
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {islands.map((i) => (
              <FilterPill
                key={i}
                active={selectedIsland === i}
                onClick={() => setSelectedIsland(i)}
              >
                {i}
              </FilterPill>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {categories.map((c) => (
              <FilterPill
                key={c}
                active={selectedCategory === c}
                onClick={() => setSelectedCategory(c)}
              >
                {c}
              </FilterPill>
            ))}
          </div>

          {/* LISTINGS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 && (
              <p className="text-white/60">No listings found</p>
            )}

            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white/10 border border-white/20 rounded-xl p-4"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>

                <p className="text-sm text-white/70 mt-1">
                  {item.description}
                </p>

                <p className="text-xs text-white/50 mt-2">
                  {item.island} • {item.category}
                </p>

                {item.date && (
                  <p className="text-xs text-white/50">
                    {new Date(item.date).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
