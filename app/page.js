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

function getTitle(item) {
  return item.title || item.name || item.event_name || 'Untitled Listing';
}

function getCategory(item) {
  return item.category || item.type || item.event_type || 'General';
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

function getDescription(item) {
  return item.description || 'No description available.';
}

function getImage(item) {
  return item.image_url || item.image || item.photo_url || item.cover_image || '';
}

function getPrice(item) {
  return item.price ?? item.cost ?? item.ticket_price ?? 0;
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

function formatPrice(value) {
  const n = Number(value);
  if (!n) return 'Free';
  return `EC$${n.toFixed(0)}`;
}

function formatEventDate(value) {
  if (!value) return 'Date TBA';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');

  let hours = d.getHours();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;

  return `${weekday} ${month} ${day} ${hours}${ampm}`;
}

function ListingCard({ item, onOpen }) {
  const featured = !!item.is_featured;
  const image = getImage(item);

  return (
    <div
      className={`overflow-hidden rounded-3xl border ${
        featured
          ? 'border-yellow-400 bg-slate-900 shadow-lg'
          : 'border-white/10 bg-slate-900/90'
      }`}
    >
      <div className="relative h-48 bg-slate-800">
        {featured && (
          <div className="absolute left-3 top-3 z-10 rounded-xl bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
            FEATURED
          </div>
        )}

        {image ? (
          <img
            src={image}
            alt={getTitle(item)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            No image
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-white/60">
          <span>{getCategory(item)}</span>
          <span>{getIsland(item)}</span>
        </div>

        <h3 className="text-xl font-semibold leading-tight text-white">
          {getTitle(item)}
        </h3>

        <p className="text-sm text-white/65">{getLocation(item)}</p>

        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="text-white/80">{formatEventDate(getDate(item))}</span>
          <span className="shrink-0 font-semibold text-white">
            {formatPrice(getPrice(item))}
          </span>
        </div>

        <button
          onClick={() => onOpen(item)}
          className="w-full rounded-2xl bg-cyan-300 py-3 text-base font-semibold text-slate-950 transition active:scale-95"
        >
          Open
        </button>
      </div>
    </div>
  );
}

function FeaturedMiniCard({ item, onOpen }) {
  const image = getImage(item);

  return (
    <div className="w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl border border-yellow-400 bg-slate-900 shadow-lg">
      <div className="relative h-40 bg-slate-800">
        <div className="absolute left-3 top-3 z-10 rounded-xl bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
          FEATURED
        </div>

        {image ? (
          <img
            src={image}
            alt={getTitle(item)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            No image
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-1 text-lg font-semibold text-white">
          {getTitle(item)}
        </h3>

        <div className="flex items-center justify-between gap-3 text-sm text-white/75">
          <span className="truncate">{formatEventDate(getDate(item))}</span>
          <span className="shrink-0 font-semibold text-white">
            {formatPrice(getPrice(item))}
          </span>
        </div>

        <button
          onClick={() => onOpen(item)}
          className="w-full rounded-2xl bg-cyan-300 py-3 text-base font-semibold text-slate-950 transition active:scale-95"
        >
          Open
        </button>
      </div>
    </div>
  );
}

function FilterPill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active
          ? 'bg-cyan-300 text-slate-950'
          : 'bg-slate-800 text-white/80'
      }`}
    >
      {children}
    </button>
  );
}

export default function Page() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState(null);
  const [imageView, setImageView] = useState(null);

  useEffect(() => {
    async function loadListings() {
      setLoading(true);

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .or(`end_time.is.null,end_time.gte.${now}`)
        .order('is_featured', { ascending: false })
        .order('start_time', { ascending: true });

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

    listings.forEach((item) => {
      const category = getCategory(item);
      if (String(category).trim().toLowerCase() !== 'specials') {
        set.add(category);
      }
    });

    return ['All', ...Array.from(set)];
  }, [listings]);

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();

    return listings.filter((item) => {
      const itemCategory = getCategory(item);

      if (String(itemCategory).trim().toLowerCase() === 'specials') {
        return false;
      }

      const islandOk =
        selectedIsland === 'All' ||
        normalizeIsland(getIsland(item)).includes(normalizeIsland(selectedIsland));

      const categoryOk =
        selectedCategory === 'All' || itemCategory === selectedCategory;

      const searchOk =
        !q ||
        getTitle(item).toLowerCase().includes(q) ||
        getLocation(item).toLowerCase().includes(q) ||
        getDescription(item).toLowerCase().includes(q) ||
        itemCategory.toLowerCase().includes(q) ||
        getIsland(item).toLowerCase().includes(q);

      return islandOk && categoryOk && searchOk;
    });
  }, [listings, selectedIsland, selectedCategory, search]);

  const featuredListings = filteredListings.filter((item) => item.is_featured);
  const regularListings = filteredListings.filter((item) => !item.is_featured);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 pb-24 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="space-y-4 text-center">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
              869 To Do
            </h1>
            <p className="mt-2 text-sm text-white/70 sm:text-base">
              What&apos;s happening in St. Kitts &amp; Nevis
            </p>
          </div>

          <div>
            <Link
              href="/submit"
              className="inline-block rounded-2xl bg-amber-300 px-6 py-3 text-base font-semibold text-slate-950"
            >
              Submit Listing
            </Link>
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-5 py-4 text-base text-white outline-none placeholder:text-white/40"
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {islands.map((island) => (
              <FilterPill
                key={island}
                active={selectedIsland === island}
                onClick={() => setSelectedIsland(island)}
              >
                {island}
              </FilterPill>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <FilterPill
                key={category}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </FilterPill>
            ))}
          </div>
        </div>

        {featuredListings.length > 0 && (
          <section className="space-y-3 pt-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold text-amber-200">
                🔥 Tonight in St. Kitts &amp; Nevis
              </h2>
              <span className="text-sm text-amber-100/75">
                {featuredListings.length} featured
              </span>
            </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
              {featuredListings.map((item) => (
                <FeaturedMiniCard
                  key={item.id}
                  item={item}
                  onOpen={setOpenItem}
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-white">More to Do</h2>
            {!loading && (
              <span className="text-sm text-white/55">
                {regularListings.length} results
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-10 text-center text-white/60">Loading...</div>
          ) : regularListings.length === 0 ? (
            <div className="py-10 text-center text-white/60">No listings found</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {regularListings.map((item) => (
                <ListingCard
                  key={item.id}
                  item={item}
                  onOpen={setOpenItem}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {openItem && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70"
          onClick={() => setOpenItem(null)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-slate-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/20" />

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{getTitle(openItem)}</h2>
                  <p className="mt-1 text-sm text-white/60">
                    {getCategory(openItem)} • {getIsland(openItem)}
                  </p>
                </div>

                {openItem.is_featured && (
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                    FEATURED
                  </span>
                )}
              </div>

              {getImage(openItem) && (
                <img
                  src={getImage(openItem)}
                  alt={getTitle(openItem)}
                  className="h-56 w-full cursor-pointer rounded-2xl object-cover"
                  onClick={() => setImageView(getImage(openItem))}
                />
              )}

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-white/45">Date</p>
                  <p className="mt-1 text-white">
                    {formatEventDate(getDate(openItem))}
                  </p>
                </div>
                <div>
                  <p className="text-white/45">Price</p>
                  <p className="mt-1 text-white">{formatPrice(getPrice(openItem))}</p>
                </div>
                <div>
                  <p className="text-white/45">Location</p>
                  <p className="mt-1 text-white">{getLocation(openItem)}</p>
                </div>
                <div>
                  <p className="text-white/45">Category</p>
                  <p className="mt-1 text-white">{getCategory(openItem)}</p>
                </div>
              </div>

              <div>
                <p className="text-white/45">Description</p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {getDescription(openItem)}
                </p>
              </div>

              <button
                className="w-full rounded-2xl bg-cyan-300 py-3 font-semibold text-slate-950"
                onClick={() => setOpenItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {imageView && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black p-4"
          onClick={() => setImageView(null)}
        >
          <img
            src={imageView}
            alt="Listing"
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </main>
  );
}
