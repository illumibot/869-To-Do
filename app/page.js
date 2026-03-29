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

function matchesIsland(itemIsland, selectedIsland) {
  if (selectedIsland === 'All') return true;
  return normalizeIsland(itemIsland) === normalizeIsland(selectedIsland);
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'Date not listed';

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  if (start && end) {
    return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(
      undefined,
      options
    )}`;
  }

  if (start) return start.toLocaleDateString(undefined, options);
  return end.toLocaleDateString(undefined, options);
}

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return '';
  return `EC$${price}`;
}

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setLoading(true);
    setError('');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'approved')
      .or(`end_date.is.null,end_date.gte.${todayStr}`)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error loading listings:', error);
      setError(`Could not load listings: ${error.message}`);
      setListings([]);
    } else {
      setListings(data || []);
    }

    setLoading(false);
  }

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const islandMatch = matchesIsland(item.island, selectedIsland);

      const haystack = [
        item.title,
        item.description,
        item.category,
        item.location,
        item.island,
        item.venue_name,
      ]
        .join(' ')
        .toLowerCase();

      const searchMatch = haystack.includes(searchTerm.toLowerCase());

      return islandMatch && searchMatch;
    });
  }, [listings, selectedIsland, searchTerm]);

  return (
    <main className="min-h-screen bg-[#020b18] text-white px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">869 To Do</h1>
            <p className="text-white/70 mt-2">
              Events, food, music, and things happening in St. Kitts and Nevis.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/submit"
              className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-4 py-2.5 transition"
            >
              Submit Listing
            </Link>

            <Link
              href="/admin"
              className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2.5 font-medium transition"
            >
              Admin
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 md:p-5 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <input
              type="text"
              placeholder="Search events, venues, food, music..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/45 outline-none focus:border-cyan-400"
            />

            <div className="flex gap-2 overflow-x-auto pb-1">
              {islands.map((island) => (
                <button
                  key={island}
                  onClick={() => setSelectedIsland(island)}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    selectedIsland === island
                      ? 'bg-cyan-500 text-black'
                      : 'bg-white/10 border border-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {island}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mb-4">
          <h2 className="text-xl font-semibold">All Listings</h2>
          <p className="text-white/60 text-sm mt-1">
            {loading
              ? 'Loading listings...'
              : `${filteredListings.length} listing${filteredListings.length === 1 ? '' : 's'} found`}
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            Loading listings...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            No listings found.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredListings.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/6 backdrop-blur-sm overflow-hidden hover:border-cyan-400/40 transition"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title || 'Listing image'}
                    className="w-full h-52 object-cover"
                  />
                ) : null}

                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-xl font-semibold leading-tight">
                        {item.title || 'Untitled Listing'}
                      </h3>
                      <p className="text-sm text-cyan-300 mt-1">
                        {item.category || 'Listing'}
                      </p>
                    </div>

                    {item.price !== null && item.price !== undefined && item.price !== '' ? (
                      <div className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium whitespace-nowrap">
                        {formatPrice(item.price)}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2 text-sm text-white/75 mb-4">
                    <p>
                      <span className="text-white font-medium">Island:</span>{' '}
                      {item.island || '—'}
                    </p>
                    <p>
                      <span className="text-white font-medium">Location:</span>{' '}
                      {item.location || item.venue_name || '—'}
                    </p>
                    <p>
                      <span className="text-white font-medium">Date:</span>{' '}
                      {formatDateRange(item.start_date, item.end_date)}
                    </p>
                    {item.phone ? (
                      <p>
                        <span className="text-white font-medium">Phone:</span> {item.phone}
                      </p>
                    ) : null}
                  </div>

                  {item.description ? (
                    <p className="text-white/85 text-sm leading-6 whitespace-pre-wrap">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
