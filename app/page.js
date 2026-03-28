'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import background3 from '../public/background3.png';

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
        'rounded-full border px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
        active
          ? 'border-cyan-100/70 bg-[#63dff5] text-black shadow-[0_0_16px_rgba(99,223,245,0.22)]'
          : 'border-white/20 bg-[rgba(8,18,42,0.74)] text-white/92 hover:bg-[rgba(12,27,58,0.88)]',
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
        'overflow-hidden rounded-[24px] border bg-[#071224]',
        featured
          ? 'border-[#f0b13c] shadow-[0_0_0_1px_rgba(240,177,60,0.22),0_0_22px_rgba(240,177,60,0.14)]'
          : 'border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.20)]',
      ].join(' ')}
    >
      <div className="relative h-52 bg-slate-900">
        {featured && (
          <div className="absolute left-4 top-4 z-10 rounded-xl bg-yellow-400 px-3 py-1 text-xs font-extrabold text-black">
            FEATURED
          </div>
        )}

        {image ? (
          <img src={image} alt={getTitle(item)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            No image
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#071224] via-[#071224]/78 to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3 text-xs text-white/60">
          <span>{getCategory(item)}</span>
          <span>{getIsland(item)}</span>
        </div>

        <h3 className="line-clamp-2 text-[1.18rem] font-semibold leading-tight text-white">
          {getTitle(item)}
        </h3>

        <p className="line-clamp-1 text-sm text-white/70">{getLocation(item)}</p>

        <div className="flex items-start justify-between gap-3 text-sm">
          <span className="text-white/82">{formatEventDate(getDate(item))}</span>
          <span className="shrink-0 font-semibold text-white">
            {formatPrice(getPrice(item))}
          </span>
        </div>

        <button
          onClick={() => onOpen(item)}
          className="w-full rounded-2xl border border-cyan-100/45 bg-gradient-to-b from-[#71ebf7] to-[#4ddff1] py-3 text-base font-semibold text-slate-950 shadow-[0_0_14px_rgba(103,232,249,0.18)] transition hover:brightness-105 active:scale-[0.99]"
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
    <div className="w-[285px] shrink-0 snap-start overflow-hidden rounded-[24px] border border-[#f0b13c] bg-[#071224] shadow-[0_0_0_1px_rgba(240,177,60,0.22),0_0_24px_rgba(240,177,60,0.16)] sm:w-[310px]">
      <div className="relative h-44 bg-slate-900">
        <div className="absolute left-4 top-4 z-10 rounded-xl bg-yellow-400 px-3 py-1 text-xs font-extrabold text-black">
          FEATURED
        </div>

        {image ? (
          <img src={image} alt={getTitle(item)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            No image
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#071224] via-[#071224]/78 to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-[1.08rem] font-semibold leading-tight text-white">
          {getTitle(item)}
        </h3>

        <div className="flex items-center justify-between gap-3 text-sm text-white/82">
          <span className="truncate">{formatEventDate(getDate(item))}</span>
          <span className="shrink-0 font-semibold text-white">
            {formatPrice(getPrice(item))}
          </span>
        </div>

        <button
          onClick={() => onOpen(item)}
          className="w-full rounded-2xl border border-cyan-100/45 bg-gradient-to-b from-[#71ebf7] to-[#4ddff1] py-3 text-base font-semibold text-slate-950 shadow-[0_0_14px_rgba(103,232,249,0.18)] transition hover:brightness-105 active:scale-[0.99]"
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
      if (String(category).trim().toLowerCase() === 'specials') return;
      set.add(category);
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
    <div className="relative min-h-screen text-white">
      <div className="fixed inset-0 -z-20">
        <Image
          src={background3}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      </div>

      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(8,20,39,0.14)_0%,rgba(8,20,39,0.36)_24%,rgba(8,20,39,0.62)_48%,rgba(8,20,39,0.82)_68%,#081427_100%)]" />

      <main className="min-h-screen pb-20 text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <section className="hero-shell rounded-[28px] px-4 py-6 sm:px-8 sm:py-9">
            <div className="mx-auto max-w-5xl">
              <header className="text-center">
                <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  869 To Do
                </h1>

                <p className="mt-3 text-base text-white/84 sm:text-xl">
                  What&apos;s happening in St. Kitts &amp; Nevis
                </p>

                <div className="mt-5">
                  <Link
                    href="/submit"
                    className="submit-btn inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white"
                  >
                    Submit Listing
                  </Link>
                </div>
              </header>

              <div className="mx-auto mt-7 max-w-4xl rounded-[28px] border border-white/22 bg-[rgba(6,15,34,0.74)] p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.18)]">
                <div className="flex items-center rounded-[24px] px-5 py-3.5 sm:py-4">
                  <span className="mr-3 text-3xl leading-none text-white/58">⌕</span>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/42"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
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
            <section className="pt-8 sm:pt-10">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="max-w-[75%] text-2xl font-semibold leading-tight text-[#f4ebbf] sm:max-w-none sm:text-[2rem]">
                  ✨ Featured in St. Kitts &amp; Nevis
                </h2>
                <span className="pt-1 text-right text-sm text-[#efe3ba]/85">
                  {featuredListings.length} featured
                </span>
              </div>

              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 no-scrollbar">
                {featuredListings.map((item) => (
                  <FeaturedMiniCard key={item.id} item={item} onOpen={setOpenItem} />
                ))}
              </div>
            </section>
          )}

          <section className="pt-8 sm:pt-10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold text-white sm:text-[2rem]">
                More to Do
              </h2>
              {!loading && (
                <span className="text-sm text-white/58">{regularListings.length} results</span>
              )}
            </div>

            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-[#071224] py-10 text-center text-white/65">
                Loading...
              </div>
            ) : regularListings.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#071224] py-10 text-center text-white/65">
                No listings found
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {regularListings.map((item) => (
                  <ListingCard key={item.id} item={item} onOpen={setOpenItem} />
                ))}
              </div>
            )}
          </section>
        </div>

        {openItem && (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/72"
            onClick={() => setOpenItem(null)}
          >
            <div
              className="max-h-[88vh] w-full overflow-y-auto rounded-t-[30px] border border-white/10 bg-[#0c1222] p-5 shadow-2xl"
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
                  className="w-full rounded-2xl border border-cyan-100/45 bg-gradient-to-b from-[#71ebf7] to-[#4ddff1] py-3 font-semibold text-slate-950 shadow-[0_0_14px_rgba(103,232,249,0.18)]"
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
    </div>
  );
}
