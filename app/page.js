'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const islands = ['All', 'St. Kitts', 'Nevis'];

function normalizeIsland(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/saint/g, 'st')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (!error) setListings(data || []);
  }

  const categories = useMemo(() => {
    const set = new Set();
    listings.forEach((l) => l.category && set.add(l.category));
    return ['All', ...Array.from(set)];
  }, [listings]);

  const filtered = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());

      const matchesIsland =
        selectedIsland === 'All' ||
        normalizeIsland(item.island) === normalizeIsland(selectedIsland);

      const matchesCategory =
        selectedCategory === 'All' ||
        item.category === selectedCategory;

      return matchesSearch && matchesIsland && matchesCategory;
    });
  }, [listings, search, selectedIsland, selectedCategory]);

  const featured = filtered.filter((i) => i.is_featured);
  const regular = filtered.filter((i) => !i.is_featured);

  return (
    <main className="min-h-screen bg-[#020b18] text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold mb-4">869 To Do</h1>

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-xl bg-white/10 border border-white/10"
        />

        {/* Island Filter */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {islands.map((island) => (
            <button
              key={island}
              onClick={() => setSelectedIsland(island)}
              className={`px-3 py-1 rounded-lg whitespace-nowrap ${
                selectedIsland === island
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/10'
              }`}
            >
              {island}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FEATURED SECTION */}
        {featured.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-3">
              Featured ({featured.length})
            </h2>

            <div className="space-y-4 mb-8">
              {featured.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white/5 border border-white/10 p-4"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-white/70 text-sm mb-2">
                    {item.category} • {item.island}
                  </p>
                  {item.description && (
                    <p className="text-sm text-white/80">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* MORE TO DO */}
        {regular.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-3">
              More to do
            </h2>

            <div className="space-y-4">
              {regular.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white/5 border border-white/10 p-4"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-white/70 text-sm mb-2">
                    {item.category} • {item.island}
                  </p>
                  {item.description && (
                    <p className="text-sm text-white/80">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <p className="text-white/60 mt-10">No results found</p>
        )}

      </div>
    </main>
  );
}
