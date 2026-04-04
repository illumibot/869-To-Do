'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';

const islands = ['All', 'St. Kitts', 'Nevis'];

const fixedCategories = [
  'All',
  'Events',
  'Food',
  'Bars',
  'Music',
  'Nightlife',
  'Family',
  'Tours',
  'Wellness',
  'Sports',
  'Other',
];

const categoryIcons = {
  Music: '♫',
  Nightlife: '♥',
  Family: '◔',
  Food: '☕',
  Bars: '🍹',
  Tours: '✦',
  Wellness: '☼',
  Sports: '◆',
  Events: '●',
  Other: '○',
  General: '•',
};

const INITIAL_VISIBLE_REGULAR = 12;
const LOAD_MORE_COUNT = 12;
const ATLANTIC_TIMEZONE = 'America/St_Kitts';

const SKN_WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=17.3026&longitude=-62.7177&current=temperature_2m,wind_speed_10m,weather_code,is_day&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto';

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
  const category = item.category || item.type || item.event_type || 'Other';
  return category === 'Specials' ? 'Other' : category;
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

function parseListingDate(value) {
  if (!value) return null;

  const str = String(value).trim();

  const match = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const second = Number(match[6] || 0);

  const parsed = new Date(year, month - 1, day, hour, minute, second);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function getAtlanticNow() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ATLANTIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const getPart = (type) => parts.find((p) => p.type === type)?.value || '00';

  return new Date(
    Number(getPart('year')),
    Number(getPart('month')) - 1,
    Number(getPart('day')),
    Number(getPart('hour')),
    Number(getPart('minute')),
    Number(getPart('second'))
  );
}

function hasExplicitTime(value) {
  if (!value) return false;

  const str = String(value).trim();
  const match = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (!match || match[4] === undefined || match[5] === undefined) {
    return false;
  }

  const hour = Number(match[4]);
  const minute = Number(match[5]);

  return !(hour === 0 && minute === 0);
}

function formatEventDate(value) {
  if (!value) return '';

  const d = parseListingDate(value);
  if (!d) return value;

  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();

  if (!hasExplicitTime(value)) {
    return `${weekday} ${month} ${day}`;
  }

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;

  const minuteText =
    minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;

  return `${weekday} ${month} ${day} · ${hours}${minuteText}${ampm}`;
}

function cToF(c) {
  return Math.round((c * 9) / 5 + 32);
}

function getWeatherEmoji({ isDay, weatherCode, windSpeed }) {
  if (Number(windSpeed) >= 28) return '🌬';

  const code = Number(weatherCode);

  if (!Number(isDay)) {
    if ([0, 1].includes(code)) return '🌙';
    if ([2, 3, 45, 48].includes(code)) return '☁️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧';
    if ([95, 96, 99].includes(code)) return '⛈';
    return '🌙';
  }

  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤';
  if ([3, 45, 48].includes(code)) return '☁️';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧';
  if ([95, 96, 99].includes(code)) return '⛈';

  return '☀️';
}

function FilterPill({ active, children, onClick, icon = null }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
        active
          ? 'border-[#f7d68a]/70 bg-[#f0b13c] text-black shadow-[0_0_16px_rgba(240,177,60,0.22)]'
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

function WeatherPill({ weather }) {
  if (!weather) return null;

  return (
    <div className="shrink-0 rounded-full border border-white/20 bg-[rgba(8,18,42,0.84)] px-3 py-2.5 text-sm font-medium text-white/92">
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-[0.95rem] leading-none">{weather.emoji}</span>
        <span>{weather.f}°</span>
      </span>
    </div>
  );
}

function TopActionButton({ href, children, primary = false, onClick = null }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'rounded-2xl border px-4 py-2.5 text-sm font-semibold transition',
        primary
          ? 'border-[#f7d68a]/70 bg-[#f0b13c] text-black hover:bg-[#e0a52f]'
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
  const dateText = formatEventDate(getDate(item));
  const href = queryString
    ? `/listing/${item.id}?${queryString}`
    : `/listing/${item.id}`;

  return (
    <div
      className={[
        'overflow-hidden rounded-[24px] border transition duration-300',
        featured
          ? 'border-[#f0b13c] bg-[rgba(7,18,36,0.94)] shadow-[0_0_0_1px_rgba(240,177,60,0.35),0_0_24px_rgba(240,177,60,0.18)] hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(240,177,60,0.45),0_0_34px_rgba(240,177,60,0.28)]'
          : 'border-white/10 bg-[rgba(7,18,36,0.90)] shadow-[0_10px_24px_rgba(0,0,0,0.20)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.28)]',
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
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            No image
          </div>
        )}
      </div>

      <div className="space-y-3 bg-[rgba(7,18,36,0.96)] p-4">
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
          {dateText ? <p>{dateText}</p> : null}
          <p>{getLocation(item)}</p>
        </div>

        <p className={`${compact ? 'line-clamp-2' : 'line-clamp-3'} text-sm text-white/70`}>
          {getDescription(item)}
        </p>

        <Link
          href={href}
          className={[
            'block w-full rounded-2xl py-3 text-center font-semibold transition',
            featured
              ? 'bg-[#f0b13c] text-black hover:bg-[#e0a52f]'
              : 'bg-[#4f8ff7] text-white hover:bg-[#3e7fe8]',
          ].join(' ')}
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
  const [search, setSearch] = useState('');
  const [activeIsland, setActiveIsland] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [visibleRegularCount, setVisibleRegularCount] = useState(INITIAL_VISIBLE_REGULAR);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    async function loadListings() {
      setLoading(true);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading listings:', error);
        setListings([]);
        setLoading(false);
        return;
      }

      setListings(data || []);
      setLoading(false);
    }

    loadListings();

    function handleFocus() {
      loadListings();
    }

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const res = await fetch(SKN_WEATHER_URL);
        const data = await res.json();
        const current = data?.current;

        if (!cancelled && current?.temperature_2m !== undefined) {
          setWeather({
            f: cToF(current.temperature_2m),
            wind: current.wind_speed_10m ?? 0,
            emoji: getWeatherEmoji({
              isDay: current.is_day,
              weatherCode: current.weather_code,
              windSpeed: current.wind_speed_10m,
            }),
          });
        }
      } catch (err) {
        console.error('Error loading weather:', err);
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
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

  function resetToHome() {
    setSearch('');
    setActiveIsland('All');
    setActiveCategory('All');
    setVisibleRegularCount(INITIAL_VISIBLE_REGULAR);
    router.replace('/', { scroll: false });

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const categories = fixedCategories;

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = getAtlanticNow();

    return listings.filter((item) => {
      const title = getTitle(item).toLowerCase();
      const description = getDescription(item).toLowerCase();
      const location = getLocation(item).toLowerCase();
      const category = getCategory(item);
      const island = getIsland(item);

      const rawEnd = item.end_date || '';
      const endDate = rawEnd ? parseListingDate(rawEnd) : null;
      const validEnd = endDate && !Number.isNaN(endDate.getTime());

      const isTimeBasedCategory = ['Events', 'Music', 'Nightlife', 'Sports'].includes(category);

      const notExpired = !isTimeBasedCategory
        ? true
        : validEnd
          ? endDate >= now
          : true;

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

      return notExpired && matchesSearch && matchesIsland && matchesCategory;
    });
  }, [listings, search, activeIsland, activeCategory]);

  const sortedListings = useMemo(() => {
    const now = getAtlanticNow();

    return [...filteredListings].sort((a, b) => {
      if (!!a.is_featured !== !!b.is_featured) {
        return a.is_featured ? -1 : 1;
      }

      const aDateRaw = getDate(a);
      const bDateRaw = getDate(b);

      const aDate = aDateRaw ? parseListingDate(aDateRaw) : null;
      const bDate = bDateRaw ? parseListingDate(bDateRaw) : null;

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

      const aCreated = a.created_at ? parseListingDate(a.created_at) : null;
      const bCreated = b.created_at ? parseListingDate(b.created_at) : null;

      const aCreatedValid = aCreated && !Number.isNaN(aCreated.getTime());
      const bCreatedValid = bCreated && !Number.isNaN(bCreated.getTime());

      if (aCreatedValid && bCreatedValid) {
        return bCreated - aCreated;
      }

      return 0;
    });
  }, [filteredListings]);

  const featuredListings = useMemo(
    () => sortedListings.filter((item) => !!item.is_featured),
    [sortedListings]
  );

  const regularListings = useMemo(
    () => sortedListings.filter((item) => !item.is_featured),
    [sortedListings]
  );

  useEffect(() => {
    setVisibleRegularCount(INITIAL_VISIBLE_REGULAR);
  }, [search, activeIsland, activeCategory]);

  const visibleRegularListings = useMemo(() => {
    return regularListings.slice(0, visibleRegularCount);
  }, [regularListings, visibleRegularCount]);

  const hasMoreRegularListings = visibleRegularCount < regularListings.length;

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
            869 To Do{' '}
            <span className="ml-2 inline-block text-[1.85rem] leading-none md:text-[2.2rem]">
              🇰🇳
            </span>
          </h1>

          <p className="mt-2 max-w-2xl text-white/70">
            Events, live music, food, nightlife, and things happening in St. Kitts and Nevis.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <TopActionButton
              href="/"
              primary
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                resetToHome();
              }}
            >
              Home
            </TopActionButton>
            <TopActionButton href="/submit">Submit Listing</TopActionButton>
          </div>
        </div>

        <div className="mb-6 rounded-[24px] border border-white/10 bg-[rgba(5,16,37,0.72)] px-4 py-4 backdrop-blur-sm">
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

          <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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

            <WeatherPill weather={weather} />
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

            <span className="ml-2 whitespace-nowrap text-sm font-medium text-white/65 lg:hidden">
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
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleRegularListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    item={item}
                    queryString={currentQueryString}
                  />
                ))}
              </div>

              {hasMoreRegularListings && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() =>
                      setVisibleRegularCount((prev) => prev + LOAD_MORE_COUNT)
                    }
                    className="rounded-2xl border border-white/15 bg-[rgba(8,18,42,0.84)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(12,27,58,0.96)]"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="mt-12">
          <div className="rounded-[24px] border border-white/10 bg-[rgba(5,16,37,0.72)] px-5 py-6 text-center backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white">About 869 To Do</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-white/70">
              869 To Do is a simple local guide for events, food, nightlife, music, tours, and places worth checking out in St. Kitts and Nevis.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <TopActionButton
                href="/"
                primary
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  resetToHome();
                }}
              >
                Home
              </TopActionButton>
              <TopActionButton href="/submit">Submit Listing</TopActionButton>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
