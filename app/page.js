'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

const islandOptions = ['All', 'St. Kitts', 'Nevis'];
const viewOptions = ['Home', 'Search', 'Map', 'Saved'];

function normalizeIsland(value) {
  if (!value) return 'Other';
  const str = String(value).trim().toLowerCase();

  if (str.includes('kitts') || str.includes('saint kitts') || str.includes('st kitts')) {
    return 'St. Kitts';
  }
  if (str.includes('nevis')) {
    return 'Nevis';
  }
  return String(value).trim();
}

function formatDate(value) {
  if (!value) return 'Date TBA';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(undefined, {
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

function getListingTitle(item) {
  return (
    item.title ||
    item.name ||
    item.event_name ||
    item.listing_title ||
    'Untitled Event'
  );
}

function getListingCategory(item) {
  return (
    item.category ||
    item.type ||
    item.event_type ||
    item.tag ||
    'General'
  );
}

function getListingIsland(item) {
  return normalizeIsland(item.island || item.location_island || item.region || item.area);
}

function getListingLocation(item) {
  return (
    item.location ||
    item.venue ||
    item.place ||
    item.address ||
    getListingIsland(item)
  );
}

function getListingDate(item) {
  return item.date || item.event_date || item.starts_at || item.start_date || item.created_at;
}

function getListingPrice(item) {
  return item.price ?? item.cost ?? item.ticket_price ?? 0;
}

function getListingImage(item) {
  return (
    item.image_url ||
    item.image ||
    item.photo_url ||
    item.cover_image ||
    ''
  );
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
    const loadListings = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('date', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Supabase load error:', error);
        setListings([]);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    };

    loadListings();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();

    listings.forEach((item) => {
      const category = getListingCategory(item);
      if (category) set.add(category);
    });

    return ['All', ...Array.from(set)];
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const island = getListingIsland(item);
      const category = getListingCategory(item);
      const title = getListingTitle(item).toLowerCase();
      const location = getListingLocation(item).toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchesIsland =
        selectedIsland === 'All' || island === selectedIsland;

      const matchesCategory =
        selectedCategory === 'All' || category === selectedCategory;

      const matchesSearch =
        !query ||
        title.includes(query) ||
        location.includes(query) ||
        category.toLowerCase().includes(query) ||
        island.toLowerCase().includes(query);

      return matchesIsland && matchesCategory && matchesSearch;
    });
  }, [listings, selectedIsland, selectedCategory, searchQuery]);

  const savedListings = useMemo(() => {
    return filteredListings.filter((item) => savedIds.includes(item.id));
  }, [filteredListings, savedIds]);

  const featuredListings = useMemo(() => {
    return filteredListings.slice(0, 12);
  }, [filteredListings]);

  const toggleSaved = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const renderCard = (item) => {
    const image = getListingImage(item);
    const title = getListingTitle(item);
    const category = getListingCategory(item);
    const island = getListingIsland(item);
    const location = getListingLocation(item);
    const date = getListingDate(item);
    const price = getListingPrice(item);
    const isSaved = savedIds.includes(item.id);

    return (
      <article
        key={item.id}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition hover:bg-white/10"
      >
        <div className="relative h-44 w-full bg-white/5">
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

          <button
            onClick={() => toggleSaved(item.id)}
            className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur"
            aria-label={isSaved ? 'Remove from saved' : 'Save event'}
          >
            {isSaved ? '★ Saved' : '☆ Save'}
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-300">
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
        </div>
      </article>
    );
  };

  const renderHome = () => (
    <>
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-indigo-500/10 p-6 shadow-2xl shadow-cyan-900/20">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">
            869 To Do
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Find what’s happening in St. Kitts and Nevis
          </h1>
          <p className="max-w-2xl text-sm text-white/70 sm:text-base">
            Live event listings, island filters, category filters, and a cleaner
            mobile-friendly layout connected to Supabase.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-2xl font-bold text-white">{listings.length}</div>
            <div className="text-sm text-white/60">Total listings</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-2xl font-bold text-white">{featuredListings.length}</div>
            <div className="text-sm text-white/60">Showing now</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-2xl font-bold text-white">{savedIds.length}</div>
            <div className="text-sm text-white/60">Saved events</div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search events, venues, islands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 outline-none ring-0 transition focus:border-cyan-400/50"
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
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            Loading listings...
          </div>
        ) : featuredListings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No listings match those filters yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featuredListings.map(renderCard)}
          </div>
        )}
      </section>
    </>
  );

  const renderSearch = () => (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <input
          type="text"
          placeholder="Search all listings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 outline-none focus:border-cyan-400/50"
        />
      </div>

      {filteredListings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          No results found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map(renderCard)}
        </div>
      )}
    </section>
  );

  const renderMap = () => (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
      <h2 className="text-2xl font-semibold text-white">Map view</h2>
      <p className="mt-2 text-white/65">
        Placeholder for the next step. Once the homepage is working, this can become
        a real map page or a dedicated route.
      </p>
    </section>
  );

  const renderSaved = () => (
    <section className="space-y-4">
      {savedListings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          You have no saved events yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {savedListings.map(renderCard)}
        </div>
      )}
    </section>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300/80">Live event app</p>
            <h1 className="text-2xl font-bold tracking-tight">869 To Do</h1>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            {loading ? 'Syncing...' : `${filteredListings.length} results`}
          </div>
        </div>

        {activeView === 'Home' && renderHome()}
        {activeView === 'Search' && renderSearch()}
        {activeView === 'Map' && renderMap()}
        {activeView === 'Saved' && renderSaved()}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/90 backdrop-blur">
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
