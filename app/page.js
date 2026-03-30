'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  Events: '●',
  Other: '○',
  General: '•',
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
  return item.category || item.type || item.event_type || 'Other';
}

function getIsland(item) {
  const raw = normalizeIsland(
    item.island || item.location_island || item.region || item.location || ''
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
  return (
    item.image_url ||
    item.image ||
    item.photo_url ||
    item.cover_image ||
    item.flyer_url ||
    ''
  );
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

  const minuteText =
    minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;

  return `${weekday} ${month} ${day} · ${hours}${minuteText}${ampm}`;
}

function FilterPill({ active, children, onClick, icon = null }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
        active
          ? 'border-cyan-100/70 bg-[#63dff5] text-black shadow-[0_0_16px_rgba(99,223,245,0.22)]'
          : 'border-white/20 bg-[rgba(8,18,42,0.84)] text-white/92 hover:bg-[rgba(12,27,58,0.96)]',
      ].join(' ')}
    >
      <span className="flex items-center gap-2">
        {icon ? <span className="text-[0.95rem] leading-none">{icon}</span> : null}
        <span>{children}</span>
      </span>
    </button>
  );
}

function TopActionButton({ href, children, primary = false }) {
  return (
    <Link
      href={href}
      className={[
        'rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
        primary
          ? 'border-cyan-200/60 bg-cyan-400 text-black hover:brightness-110'
          : 'border-white/15 bg-[rgba(8,18,42,0.84)] text-white hover:bg-[rgba(12,27,58,0.96)]',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function ListingCard({ item, compact = false, queryString = '' }) {
  const featured = !!item.is_featured;
  const image = getImage(item);
  const category = getCategory(item);
  const href = queryString
    ? `/listing/${item.id}?${queryString}`
    : `/listing/${item.id}`;

  return (
    <div
      className={[
        'overflow-hidden rounded-[24px] border bg-[#071224] backdrop-blur-md',
        featured
          ? 'border-[#f0b13c] shadow-[0_0_0_1px_rgba(240,177,60,0.35),0_0_30px_rgba(240,177,60,0.25)]'
          : 'border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.20)]',
      ].join(' ')}
    >
      <div className={`relative ${compact ? 'h-40' : 'h-52'} bg-slate-900`}>
        {featured && (
          <div className="absolute left-4 top-4 z-10 rounded-xl bg-yellow-400 px-3 py-1 text-xs font-extrabold text-black">
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
      </div>

      <div className="space-y-3 bg-[#071224] p-4">
        <div className="flex flex-wrap gap-2 text-xs text-white/75">
          <span className="rounded-full bg-white/10 px-3 py-1">
            {category}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            {getIsland(item)}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            {formatPrice(getPrice(item))}
          </span>
        </div>

        <h3 className={`${compact ? 'text-xl' : 'text-2xl'} font-semibold text-white`}>
          {getTitle(item)}
        </h3>

        <div className="space-y-1 text-sm text-white/75">
          <p>{formatEventDate(getDate(item))}</p>
          <p>{getLocation(item)}</p>
        </div>

        <p className={`${compact ? 'line-clamp-2' : 'line-clamp-3'} text-sm text-white/70`}>
          {getDescription(item)}
        </p>

        <Link
          href={href}
          className="block w-full rounded-2xl bg-cyan-400 py-3 text-center font-semibold text-black transition hover:brightness-110"
        >
          Open
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeIsland, setActiveIsland] = useState(searchParams.get('island') || 'All');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListings() {
      setLoading(true);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading listings:', error);
        setListings([]);
        setLoading(false);
        return;
      }

      const approved = (data || []).filter((item) => {
        if (item.is_approved === false) return false;
        if (item.approved === false) return false;
        if (String(item.status || '').toLowerCase() === 'pending') return false;
        return true;
      });

      setListings(approved);
      setLoading(false);
    }

    loadListings();
  }, []);

  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';
    const nextIsland = searchParams.get('island') || 'All';
    const nextCategory = searchParams.get('category') || 'All';

    setSearch(nextSearch);
    setActiveIsland(nextIsland);
    setActiveCategory(nextCategory);
  }, [searchParams]);

  function updateUrl(nextSearch, nextIsland, nextCategory) {
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextIsland !== 'All') params.set('island', nextIsland);
    if (nextCategory !== 'All') params.set('category', nextCategory);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const categories = useMemo(() => {
    const categoryOrder = [
      'Events',
      'Food',
      'Music',
      'Nightlife',
      'Family',
      'Tours',
      'Wellness',
      'Sports',
      'Other',
    ];

    const found = Array.from(
      new Set(listings.map((item) => getCategory(item)).filter(Boolean))
    ).filter((c) => c !== 'Specials');

    const sorted = found.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);

      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });

    return ['All', ...sorted];
  }, [listings]);

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();

    return listings.filter((item) => {
      const title = getTitle(item).toLowerCase();
      const description = getDescription(item).toLowerCase();
      const location = getLocation(item).toLowerCase();
      const category = getCategory(item);
      const island = getIsland(item);

      const matchesSearch =
        !q ||
        title.includes(q) ||
        description.includes(q) ||
        location.includes(q) ||
        category.toLowerCase().includes(q);

      const matchesIsland =
        activeIsland === 'All' || island === activeIsland;

      const matchesCategory =
        activeCategory === 'All' || category === activeCategory;

      return matchesSearch && matchesIsland && matchesCategory;
    });
  }, [listings, search, activeIsland, activeCategory]);

  const sortedListings = useMemo(() => {
    const now = new Date();

    return [...filteredListings].sort((a, b) => {
      if (!!a.is_featured !== !!b.is_featured) {
        return a.is_featured ? -1 : 1;
      }

      const aDateRaw = getDate(a);
      const bDateRaw = getDate(b);

      const aDate = aDateRaw ? new Date(aDateRaw) : null;
      const bDate = bDateRaw ? new Date(bDateRaw) : null;

      const aValid = aDate && !Number.isNaN(aDate.getTime());
      const bValid = bDate && !Number.isNaN(bDate.getTime());

      const aUpcoming = aValid && aDate >= now;
      const bUpcoming = bValid && bDate >= now;

      if (aUpcoming !== bUpcoming) {
        return aUpcoming ? -1 : 1;
      }

      if (aValid && bValid) {
        return aDate - bDate;
      }

      if (aValid && !bValid) return -1;
      if (!aValid && bValid) return 1;

      const aCreated = a.created_at ? new Date(a.created_at) : null;
      const bCreated = b.created_at ? new Date(b.created_at) : null;

      const aCreatedValid = aCreated && !Number.isNaN(aCreated.getTime());
      const bCreatedValid = bCreated && !Number.isNaN(bCreated.getTime());

      if (aCreatedValid && bCreatedValid) {
        return bCreated - aCreated;
      }

      return 0;
    });
  }, [filteredListings]);

  const featuredListings = sortedListings.filter((item) => !!item.is_featured);
  const regularListings = sortedListings.filter((item) => !item.is_featured);

  const currentQueryString = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) params.set('search', search.trim());
    if (activeIsland !== 'All') params.set('island', activeIsland);
    if (activeCategory !== 'All') params.set('category', activeCategory);

    return params.toString();
  }, [search, activeIsland, activeCategory]);

  return (
    <div className="min-h-screen text-white">
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md md:text-4xl">
            869 To Do <span className="ml-2 text-2xl md:text-3xl">🇰🇳</span>
          </h1>

          <p className="mt-2 max-w-2xl text-white/70">
            Events, live music, food, nightlife, and things happening in St. Kitts and Nevis.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <TopActionButton href="/" primary>Home</TopActionButton>
            <TopActionButton href="/submit">Submit Listing</TopActionButton>
          </div>
        </div>

        <div className="mb-6 rounded-[24px] border border-white/10 bg-[rgba(5,16,37,0.78)] px-4 py-4 backdrop-blur-md">
          <input
            type="text"
            placeholder="Search events, venues, food, music..."
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              updateUrl(value, activeIsland, activeCategory);
            }}
            className="mb-4 w-full rounded-2xl border border-white/15 bg-[#08142b] px-5 py-3 text-white outline-none placeholder:text-white/40"
          />

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {islands.map((island) => (
              <FilterPill
                key={island}
                active={activeIsland === island}
                onClick={() => {
                  setActiveIsland(island);
                  updateUrl(search, island, activeCategory);
                }}
              >
                {island}
              </FilterPill>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((category) => (
                <FilterPill
                  key={category}
                  active={activeCategory === category}
                  onClick={() => {
                    setActiveCategory(category);
                    updateUrl(search, activeIsland, category);
                  }}
                  icon={category === 'All' ? null : categoryIcons[category] || categoryIcons.General}
                >
                  {category}
                </FilterPill>
              ))}
            </div>

            <span className="ml-2 whitespace-nowrap text-[11px] text-white/45">
              swipe →
            </span>
          </div>
        </div>

        {featuredListings.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Featured ({featuredListings.length})
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.map((item) => (
                <ListingCard
                  key={item.id}
                  item={item}
                  queryString={currentQueryString}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">More to do</h2>
            <span className="text-sm text-white/60">{regularListings.length} found</span>
          </div>

          {loading ? (
            <div className="rounded-[24px] border border-white/10 bg-[rgba(5,16,37,0.78)] p-6 text-white/70">
              Loading listings...
            </div>
          ) : regularListings.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-[rgba(5,16,37,0.78)] p-6 text-white/70">
              No results found{search ? ` for "${search}"` : ''}.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {regularListings.map((item) => (
                <ListingCard key={item.id} item={item} queryString={currentQueryString} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
