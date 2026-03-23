'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const islands = ['All', 'St. Kitts', 'Nevis'];
const views = ['Home', 'Search', 'Map', 'Saved'];

function getTitle(item) {
  return item.title || item.name || item.event_name || 'Untitled Event';
}

function getCategory(item) {
  return item.category || item.type || item.event_type || 'General';
}

function getIsland(item) {
  const raw = String(item.island || item.location_island || item.region || '').toLowerCase();
  if (raw.includes('nevis')) return 'Nevis';
  if (raw.includes('kitts')) return 'St. Kitts';
  return item.island || item.location_island || 'Other';
}

function getLocation(item) {
  return item.location || item.venue || item.place || item.address || 'Location TBA';
}

function getDate(item) {
  return item.date || item.event_date || item.starts_at || item.start_date || '';
}

function getPrice(item) {
  return item.price ?? item.cost ?? item.ticket_price ?? 0;
}

function getImage(item) {
  return item.image_url || item.image || item.photo_url || item.cover_image || '';
}

function formatDate(value) {
  if (!value) return 'Date TBA';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(value) {
  const n = Number(value);
  if (!value || Number.isNaN(n) || n === 0) return 'Free';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Page() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('Home');
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    async function loadListings() {
      setLoading(true);
      const { data, error } = await supabase.from('listings').select('*');
      if (error) {
        console.error(error);
        setListings([]);
      } else {
        setListings(data || []);
      }
      setLoading(false);
    }
    loadListings();
  }, []);

const categories = useMemo(() => {
  const set = new Set(['Music', 'Tours', 'Food']); // force these

  listings.forEach((item) => set.add(getCategory(item)));

  return ['All', ...Array.from(set)];
}, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const island = getIsland(item);
      const category = getCategory(item);
      const title = getTitle(item).toLowerCase();
      const location = getLocation(item).toLowerCase();
      const q = search.trim().toLowerCase();

      const islandOk = selectedIsland === 'All' || island === selectedIsland;
      const categoryOk = selectedCategory === 'All' || category === selectedCategory;
      const searchOk =
        !q ||
        title.includes(q) ||
        location.includes(q) ||
        island.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q);

      return islandOk && categoryOk && searchOk;
    });
  }, [listings, selectedIsland, selectedCategory, search]);

  const savedListings = useMemo(() => {
    return listings.filter((item) => savedIds.includes(item.id));
  }, [listings, savedIds]);

  function toggleSaved(id) {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function renderCards(items) {
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
        {items.map((item) => {
          const image = getImage(item);
          const title = getTitle(item);
          const category = getCategory(item);
          const island = getIsland(item);
          const location = getLocation(item);
          const date = getDate(item);
          const price = getPrice(item);
          const saved = savedIds.includes(item.id);

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <div className="h-48 bg-black/20">
                {image ? (
                  <img src={image} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/40">
                    No image
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-300">
                    {category}
                  </span>
                  <span className="text-sm text-white/60">{island}</span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-white/65">{location}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-white/75">
                  <span>{formatDate(date)}</span>
                  <span className="font-medium text-white">{formatPrice(price)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950"
                    onClick={() => alert(`Clicked listing: ${title}`)}
                  >
                    Open
                  </button>
                  <button
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80"
                    onClick={() => toggleSaved(item.id)}
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
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-300/80">869 To Do</p>
            <h1 className="text-3xl font-bold">What’s on</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            {loading ? 'Loading...' : `${filteredListings.length} results`}
          </div>
        </div>

        {activeView === 'Home' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 outline-none"
              />

              <div className="mb-4">
                <p className="mb-2 text-sm text-white/70">Island</p>
                <div className="flex flex-wrap gap-2">
                  {islands.map((island) => (
                    <button
                      key={island}
                      onClick={() => setSelectedIsland(island)}
                      className={`rounded-full px-4 py-2 text-sm ${
                        selectedIsland === island
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-white/5 text-white'
                      }`}
                    >
                      {island}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-white/70">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-2 text-sm ${
                        selectedCategory === category
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-white/5 text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {renderCards(filteredListings)}
          </div>
        )}

        {activeView === 'Search' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-2xl font-bold">Search</h2>
              <p className="mt-2 text-white/65">This view is working.</p>
            </div>
            {renderCards(filteredListings)}
          </div>
        )}

        {activeView === 'Map' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Map</h2>
            <p className="mt-2 text-white/65">This button works too.</p>
          </div>
        )}

        {activeView === 'Saved' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-2xl font-bold">Saved</h2>
              <p className="mt-2 text-white/65">Saved items appear here.</p>
            </div>
            {renderCards(savedListings)}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-3">
          {views.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              className={`rounded-xl px-4 py-2 text-sm ${
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
