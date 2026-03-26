'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function Page() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeView, setActiveView] = useState('Home');
  const [openIds, setOpenIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    setLoading(true);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .gte('end_time', now)
      .order('is_featured', { ascending: false })
      .order('start_time', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setListings(data || []);
    }

    setLoading(false);
  }

  function toggleOpen(id) {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleSaved(id) {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function getCategory(item) {
    return item.category || 'Other';
  }

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  function formatPrice(price) {
    if (!price) return '';
    return `$${price}`;
  }

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());

      const matchesIsland =
        selectedIsland === 'All' || item.island === selectedIsland;

      const matchesCategory =
        selectedCategory === 'All' ||
        getCategory(item) === selectedCategory;

      return matchesSearch && matchesIsland && matchesCategory;
    });
  }, [listings, search, selectedIsland, selectedCategory]);

  const categories = useMemo(() => {
    const defaultCategories = ['Events', 'Food', 'Music'];
    const found = new Set();

    listings.forEach((item) => {
      const c = getCategory(item);
      if (c) found.add(c);
    });

    const extras = Array.from(found).filter(
      (c) => !defaultCategories.includes(c)
    );

    return ['All', ...defaultCategories, ...extras];
  }, [listings]);

  const islands = ['All', 'St Kitts', 'Nevis'];

  const featured = filteredListings.filter((l) => l.is_featured);
  const regular = filteredListings.filter((l) => !l.is_featured);

  function renderCards(items) {
    if (!items.length) {
      return <p className="text-white/60">No listings found</p>;
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isOpen = openIds.includes(item.id);
          const saved = savedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-2xl border bg-white/5 ${
                item.is_featured
                  ? 'border-yellow-400/70 ring-1 ring-yellow-300/40 sm:col-span-2'
                  : 'border-white/10'
              }`}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt=""
                  className="h-40 w-full object-cover"
                />
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-cyan-300">
                      {getCategory(item)}
                    </span>

                    {item.is_featured && (
                      <span className="text-xs text-yellow-300">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  <span className="text-sm text-white/60">
                    {item.island}
                  </span>
                </div>

                <h3 className="text-lg font-semibold">
                  {item.title}
                </h3>

                <p className="text-sm text-white/60">
                  {item.location}
                </p>

                <p className="text-sm text-white/60">
                  {formatDate(item.start_time)}
                </p>

                {isOpen && (
                  <div className="text-sm text-white/70">
                    {item.description}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleOpen(item.id)}
                    className="bg-cyan-400 text-black px-3 py-1 rounded"
                  >
                    {isOpen ? 'Close' : 'Open'}
                  </button>

                  <button
                    onClick={() => toggleSaved(item.id)}
                    className="border px-3 py-1 rounded"
                  >
                    {saved ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">869 To Do</h1>

      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full p-2 rounded bg-black/30"
      />

      <div className="flex gap-2 mb-4">
        {islands.map((i) => (
          <button
            key={i}
            onClick={() => setSelectedIsland(i)}
            className="px-3 py-1 border rounded"
          >
            {i}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className="px-3 py-1 border rounded"
          >
            {c}
          </button>
        ))}
      </div>

      {featured.length > 0 && (
        <>
          <h2 className="text-xl mb-2">Featured</h2>
          {renderCards(featured)}
        </>
      )}

      <h2 className="text-xl mt-6 mb-2">All Events</h2>
      {renderCards(regular)}
    </main>
  );
}
