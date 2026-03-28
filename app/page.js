'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const islands = ['All', 'St. Kitts', 'Nevis'];

const categoryIcons = {
  Music: '♫',
  Nightlife: '♥',
  Family: '◔',
  Food: '☕',
  Tours: '✦',
  Wellness: '☼',
  Sports: '◆',
};

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
  const day = d.getDate();

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;

  const minuteText = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;

  return `${weekday} · ${month} ${day} · ${hours}${minuteText}${ampm}`;
}

function FilterPill({ active, children, onClick, icon = null }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 backdrop-blur-xl',
        active
          ? 'border-cyan-200/80 bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(103,232,249,0.30)]'
          : 'border-white/14 bg-black/22 text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/10 hover:border-white/22',
      ].join(' ')}
    >
      <span className="flex items-center gap-2">
        {icon ? <span className="text-[0.95rem] leading-none">{icon}</span> : null}
        <span>{children}</span>
      </span>
    </button>
  );
}

function ListingCard({ item, onOpen }) {
  const featured = !!item.is_featured;
  const image = getImage(item);

  return (
    <div
      className={[
        'group overflow-hidden rounded-[28px] border backdrop-blur-xl transition-all duration-300',
        featured
          ? 'border-amber-300/80 bg-[#0e1324]/78 shadow-[0_0_30px_rgba(255,190,70,0.20)]'
          : 'border-white/12 bg-[#0d1220]/68 shadow-[0_10px_35px_rgba(0,0,0,0.32)] hover:-translate-y-[2px] hover:border-white/20',
      ].join(' ')}
    >
      <div className="relative h-56 overflow-hidden bg-slate-900">
        {featured && (
          <div className="absolute left-4 top-4 z-10 rounded-xl bg-yellow-400 px-3 py-1 text-xs font-extrabold text-black shadow-[0_0_16px_rgba(250,204,21,0.35)]">
            FEATURED
          </div>
        )}

        {image ? (
          <img
            src={image}
            alt={getTitle(item)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            No image
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0b1020] via-[#0b1020]/78 to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-white/62">
          <span>{getCategory(item)}</span>
          <span>{getIsland(item)}</span>
        </div>

        <h3 className="line-clamp-2 text-[1.35rem] font-semibold leading-tight text-white">
          {getTitle(item)}
        </h3>

        <p className="line-clamp-1 text-sm text-white/68">{getLocation(item)}</p>

        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="text-white/82">{formatEventDate(getDate(item))}</span>
          <span className="shrink-0 font-semibold text-white">
            {formatPrice(getPrice(item))}
          </span>
        </div>

        <button
          onClick={() => onOpen(item)}
          className="w-full rounded-2xl border border-cyan-100/55 bg-gradient-to-b from-cyan-300 to-cyan-400 py-3 text-base font-semibold text-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.28)] transition hover:brightness-105 active:scale-[0.99]"
        >
          Open
        </button>
      </div>
    </div>
  );
}

function FeaturedCard({ item, onOpen }) {
  const image = getImage(item);

  return (
    <div className="group overflow-hidden rounded-[28px] border border-amber-300/80 bg-[#0e1324]/80 shadow-[0_0_34px_rgba(255,190,70,0.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-[2px]">
      <div className="relative h-52 overflow-hidden bg-slate-900">
        <div className="absolute left-4 top-4 z-10 rounded-xl bg-yellow-400 px-3 py-1 text-xs font-extrabold text-black shadow-[0_0_16px_rgba(250,204,21,0.32)]">
          FEATURED
        </div>

        {image ? (
          <img
            src={image}
            alt={getTitle(item)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            No image
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b1020] via-[#0b1020]/76 to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-[1.15rem] font-semibold leading-tight text-white">
          {getTitle(item)}
        </h3>

        <div className="flex items-center justify-between gap-3 text-sm text-white/80">
          <span className="truncate">{formatEventDate(getDate(item))}</span>
          <span className="shrink-0 font-semibold text-white">
            {formatPrice(getPrice(item))}
          </span>
        </div>

        <button
          onClick={() => onOpen(item)}
          className="w-full rounded-2xl border border-cyan-100/55 bg-gradient-to-b from-cyan-300 to-cyan-400 py-3 text-base font-semibold text-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.28)] transition hover:brightness-105 active:scale-[0.99]"
        >
          Open
        </button>
      </div>
    </div>
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
    <main className="min-h-screen pb-24 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/14 px-4 py-8 shadow-[0_20px_70px_rgba(0,0,0,0.26)] backdrop-blur-[2px] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_top,rgba(255,240,210,0.16),transparent_22%),linear-gradient(180deg,rgba(255,186,109,0.10),rgba(6,10,20,0.06))]" />

          <div className="relative z-10 mx-auto max-w-5xl">
            <header className="space-y-5 text-center">
              <div>
                <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  869 To Do
                </h1>
                <p className="mt-2 text-base text-white/80 sm:text-xl">
                  What&apos;s happening in St. Kitts &amp; Nevis
                </p>
              </div>

              <div>
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center rounded-[24px] border border-amber-100/60 bg-[linear-gradient(180deg,#ffb54d_0%,#ff9c47_40%,#f8b95b_100%)] px-8 py-3.5 text-lg font-semibold text-white shadow-[0_0_28px_rgba(255,170,66,0.42)] transition hover:brightness-105"
                >
                  Submit Listing
                </Link>
              </div>
            </header>

            <div className="mt-8 rounded-[34px] border border-white/25 bg-black/20 p-1 shadow-[0_0_24px_rgba(255,255,255,0.06)] backdrop-blur-md">
              <div className="flex items-center rounded-[30px] bg-[linear-gradient(180deg,rgba(20,22,38,0.52),rgba(10,13,24,0.58))] px-5 py-4">
                <span className="mr-3 text-3xl leading-none text-white/60">⌕</span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/50"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap justify-center gap-2.5">
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

              <div className="flex flex-wrap justify-center gap-2.5">
                {categories.map((category) => (
                  <FilterPill
                    key={category}
                    active={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                    icon={categoryIcons[category] || null}
                  >
                    {category}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        </section>

        {featuredListings.length > 0 && (
          <section className="pt-10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold text-amber-100 sm:text-[2rem]">
                ✨ Featured in St. Kitts &amp; Nevis
              </h2>
              <span className="text-sm text-amber-50/80">
                {featuredListings.length} featured
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featuredListings.map((item) => (
                <FeaturedCard key={item.id} item={item} onOpen={setOpenItem} />
              ))}
            </div>
          </section>
        )}

        <section className="pt-10">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-white sm:text-[2rem]">
              More to Do
            </h2>
            {!loading && (
              <span className="text-sm text-white/58">{regularListings.length} results</span>
            )}
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-[#0d1220]/55 py-10 text-center text-white/65 backdrop-blur-sm">
              Loading...
            </div>
          ) : regularListings.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#0d1220]/55 py-10 text-center text-white/65 backdrop-blur-sm">
              No listings found
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {regularListings.map((item) => (
                <ListingCard key={item.id} item={item} onOpen={setOpenItem} />
              ))}
            </div>
          )}
        </section>
      </div>

      {openItem && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/72 backdrop-blur-sm"
          onClick={() => setOpenItem(null)}
        >
          <div
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-[30px] border border-white/10 bg-[#0d1220]/95 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/20" />

            <div className="mx-auto max-w-3xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{getTitle(openItem)}</h2>
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
                  className="h-60 w-full cursor-pointer rounded-2xl object-cover"
                  onClick={() => setImageView(getImage(openItem))}
                />
              )}

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-white/45">Date</p>
                  <p className="mt-1 text-white">{formatEventDate(getDate(openItem))}</p>
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
                <p className="mt-2 text-sm leading-relaxed text-white/82">
                  {getDescription(openItem)}
                </p>
              </div>

              <button
                className="w-full rounded-2xl border border-cyan-100/55 bg-gradient-to-b from-cyan-300 to-cyan-400 py-3 font-semibold text-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.28)]"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
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
