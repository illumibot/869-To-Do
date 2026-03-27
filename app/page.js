'use client';

import Link from 'next/link';
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

function normalizeIsland(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/saint/g, 'st')
    .replace(/\s+/g, ' ')
    .trim();
}

function getIsland(item) {
  const raw = normalizeIsland(
    item.island || item.location_island || item.region || ''
  );

  if (raw.includes('nevis')) return 'Nevis';
  if (raw.includes('kitts')) return 'St. Kitts';

  return item.island || item.location_island || item.region || 'Other';
}

function getLocation(item) {
  return (
    item.location ||
    item.venue_name ||
    item.venue ||
    item.place ||
    item.address ||
    'Location TBA'
  );
}

function getDate(item) {
  return (
    item.start_time ||
    item.date ||
    item.event_date ||
    item.starts_at ||
    item.start_date ||
    ''
  );
}

function getPrice(item) {
  return item.price ?? item.cost ?? item.ticket_price ?? 0;
}

function getImage(item) {
  return item.image_url || item.image || item.photo_url || item.cover_image || '';
}

function getDescription(item) {
  return item.description || 'No description available.';
}

function getWebsite(item) {
  return item.website_url || item.website || item.instagram || '';
}

function getPhone(item) {
  return item.contact_phone || item.phone || item.whatsapp_link || '';
}

function formatDate(value) {
  if (!value) return 'Date TBA';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPrice(value) {
  const n = Number(value);
  if (!n) return 'Free';
  return `EC$${n.toFixed(0)}`;
}

export default function Page() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('Home');
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [openIds, setOpenIds] = useState([]);

  useEffect(() => {
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
    listings.forEach((i) => set.add(getCategory(i)));
    return ['All', ...Array.from(set)];
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const island = getIsland(item);
      const category = getCategory(item);
      const q = search.toLowerCase();

      const islandOk =
        selectedIsland === 'All' ||
        normalizeIsland(island).includes(normalizeIsland(selectedIsland));

      const categoryOk =
        selectedCategory === 'All' || category === selectedCategory;

      const searchOk =
        !q ||
        getTitle(item).toLowerCase().includes(q) ||
        getLocation(item).toLowerCase().includes(q) ||
        getDescription(item).toLowerCase().includes(q);

      return islandOk && categoryOk && searchOk;
    });
  }, [listings, selectedIsland, selectedCategory, search]);

  function toggleSaved(id) {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleOpen(id) {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function renderCards(items) {
    if (loading) return <div className="text-center py-10 text-white/60">Loading...</div>;
    if (!items.length) return <div className="text-center py-10 text-white/60">No listings</div>;

    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const isOpen = openIds.includes(item.id);

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
            >
              {/* IMAGE */}
              <div className="h-44 bg-black/20">
                {getImage(item) ? (
                  <img
                    src={getImage(item)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/30">
                    No image
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-xs text-white/60">
                  <span>{getCategory(item)}</span>
                  <span>{getIsland(item)}</span>
                </div>

                <h3 className="text-lg font-semibold leading-tight">
                  {getTitle(item)}
                </h3>

                <p className="text-sm text-white/60">
                  {getLocation(item)}
                </p>

                <div className="flex justify-between text-sm">
                  <span>{formatDate(getDate(item))}</span>
                  <span className="font-semibold">
                    {formatPrice(getPrice(item))}
                  </span>
                </div>

                {isOpen && (
                  <div className="text-sm text-white/70 pt-2 border-t border-white/10">
                    {getDescription(item)}
                  </div>
                )}

                {/* BUTTONS */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => toggleOpen(item.id)}
                    className="flex-1 rounded-lg bg-cyan-400 text-black py-2 text-sm font-medium active:scale-95 transition"
                  >
                    {isOpen ? 'Close' : 'Open'}
                  </button>

                  <button
                    onClick={() => toggleSaved(item.id)}
                    className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-white/80 active:scale-95 transition"
                  >
                    Save
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
    <main className="min-h-screen bg-slate-950 text-white pb-24">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        <div>
          <h1 className="text-2xl font-bold">869 To Do</h1>

          <Link
            href="/submit"
            className="inline-block mt-3 bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm"
          >
            Submit Listing
          </Link>
        </div>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm"
        />

      <div className="space-y-3">
  <div className="flex gap-2 flex-wrap">
    {islands.map((i) => (
      <button
        key={i}
        onClick={() => setSelectedIsland(i)}
        className={`px-3 py-1 rounded-full text-sm ${
          selectedIsland === i
            ? 'bg-cyan-400 text-black'
            : 'bg-white/5 text-white/70'
        }`}
      >
        {i}
      </button>
    ))}
  </div>

  <div className="flex gap-2 flex-wrap">
    {categories.map((c) => (
      <button
        key={c}
        onClick={() => setSelectedCategory(c)}
        className={`px-3 py-1 rounded-full text-sm ${
          selectedCategory === c
            ? 'bg-cyan-400 text-black'
            : 'bg-white/5 text-white/70'
        }`}
      >
        {c}
      </button>
    ))}
  </div>
</div>
        {renderCards(filteredListings)}
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-white/10 flex justify-around py-3 text-sm">
        {views.map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={activeView === v ? 'text-cyan-400' : 'text-white/50'}
          >
            {v}
          </button>
        ))}
      </nav>
    </main>
  );
}
