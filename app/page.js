'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

const islandOptions = ['All', 'St. Kitts', 'Nevis'];
const viewOptions = ['Home', 'Search', 'Map', 'Saved'];

function normalizeIsland(value) {
  if (!value) return 'Other';
  const str = String(value).trim().toLowerCase();

  if (
    str.includes('st. kitts') ||
    str.includes('st kitts') ||
    str.includes('saint kitts') ||
    str.includes('kitts')
  ) {
    return 'St. Kitts';
  }

  if (str.includes('nevis')) {
    return 'Nevis';
  }

  return String(value).trim();
}

function formatDate(value) {
  if (!value) return 'Date TBA';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Free';

  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (num === 0) return 'Free';

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

function getTitle(item) {
  return item.title || item.name || item.event_name || 'Untitled Event';
}

function getCategory(item) {
  return item.category || item.type || item.event_type || 'General';
}

function getIsland(item) {
  return normalizeIsland(item.island || item.location_island || item.region || item.area);
}

function getLocation(item) {
  return item.location || item.venue || item.place || item.address || getIsland(item);
}

function getDate(item) {
  return item.date || item.event_date || item.starts_at || item.start_date || item.created_at;
}

function getPrice(item) {
  return item.price ?? item.cost ?? item.ticket_price ?? 0;
}

function getDescription(item) {
  return item.description || item.details || item.summary || '';
}

function getImage(item) {
  const raw =
    item.image_url ||
    item.image ||
    item.photo_url ||
    item.cover_image ||
    item.thumbnail ||
    '';

  if (!raw) return '';

  if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://'))) {
    return raw;
  }

  if (typeof raw === 'string' && raw.startsWith('/')) {
    return raw;
  }

  return raw;
}

export default function Page() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeView, setActiveView] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    async function loadListings() {
      setLoading(true);

      const { data, error } = await supabase.from('listings').select('*');

      if (error) {
        console.error('Error loading listings:', error);
        setListings([]);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    }

    loadListings();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    listings.forEach((item) => set.add(getCategory(item)));
    return ['All', ...Array.from(set)];
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const island = getIsland(item);
      const category = getCategory(item);
      const title = getTitle(item).toLowerCase();
      const location = getLocation(item).toLowerCase();
      const description = getDescription(item).toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchesIsland = selectedIsland === 'All' || island === selectedIsland;
      const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
      const matchesSearch =
        !query ||
        title.includes(query) ||
        location.includes(query) ||
        description.includes(query) ||
        category.toLowerCase().includes(query) ||
        island.toLowerCase().includes(query);

      return matchesIsland && matchesCategory && matchesSearch;
    });
  }, [listings, selectedIsland, selectedCategory, searchQuery]);

  const savedListings = useMemo(() => {
    return filteredListings.filter((item) => savedIds.includes(item.id));
  }, [filteredListings, savedIds]);

  function toggleSaved(id) {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function ListingCard({ item }) {
    const image = getImage(item);
    const title = getTitle(item);
    const category = getCategory(item);
    const island = getIsland(item);
    const location = getLocation(item);
    const date = getDate(item);
    const price = getPrice(item);
    const isSaved = savedIds.includes(item.id);

    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10">
        <Link href={`/listing/${item.id}`} className="block">
          <div className="h-44 w-full bg-white/5">
            {image ? (
              <img
                src={image}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/40">
                No image
              </div>
            )}
          </div>
        </Link>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-300">
              {category}
            </span>
            <span className="text-sm text-white/60">{island}</span>
          </div>

          <Link href={`/listing/${item.id}`} className="block">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/65">{location}</p>
          </Link>

          <div className="flex items-center justify-between text-sm text-white/75">
            <span>{formatDate(date)}</span>
            <span className="font-medium text-white">{formatPrice(price)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/listing/${item.id}`}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950"
            >
              View listing
            </Link>

            <button
              onClick={() => toggleSaved(item.id)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderGrid(items) {
    if (loading) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          Loading listings...
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          No listings found.
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-28 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300/80">Live event app</p>
            <h1 className="text-2xl font-bold tracking-tight">869 To Do</h1>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            {loading ? 'Syncing...' : `${filteredListings.length} results`}
          </div>
        </div>

        {activeView === 'Home' && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-indigo-500/10 p-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">
                  869 To Do
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Find what’s happening in St. Kitts and Nevis
                </h2>
                <p className="max-w-2xl text-sm text-white/70 sm:text-base">
                  Live event listings with working filters, saved items, and clickable listings.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search events, venues, islands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-white/70">Island</p>
                  <div className="flex flex-wrap gap-2">
                    {islandOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedIsland(option)}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          selectedIsland === option
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-white/70">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedCategory(option)}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          selectedCategory === option
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {renderGrid(filteredListings)}
          </div>
        )}

        {activeView === 'Search' && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <input
                type="text"
                placeholder="Search all listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-cyan-400/50"
              />
            </section>

            {renderGrid(filteredListings)}
          </div>
        )}

        {activeView === 'Map' && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-semibold text-white">Map view</h2>
            <p className="mt-2 text-white/65">
              Placeholder for now. The button works, but the real map can come next.
            </p>
          </section>
        )}

        {activeView === 'Saved' && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">Saved listings</p>
            </section>
            {renderGrid(savedListings)}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-3">
          {viewOptions.map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                activeView === view
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
