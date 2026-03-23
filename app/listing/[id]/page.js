'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

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

  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
  return item.description || item.details || item.summary || 'No description yet.';
}

function getImage(item) {
  return (
    item.image_url ||
    item.image ||
    item.photo_url ||
    item.cover_image ||
    item.thumbnail ||
    ''
  );
}

export default function ListingDetailPage({ params }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error loading listing:', error);
        setListing(null);
      } else {
        setListing(data);
      }

      setLoading(false);
    }

    loadListing();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-white/70">Loading listing...</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Link
            href="/"
            className="inline-block rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Back
          </Link>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-2xl font-bold">Listing not found</h1>
            <p className="mt-2 text-white/70">
              This listing may have been removed or the ID does not match your table.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const title = getTitle(listing);
  const category = getCategory(listing);
  const island = getIsland(listing);
  const location = getLocation(listing);
  const date = getDate(listing);
  const price = getPrice(listing);
  const description = getDescription(listing);
  const image = getImage(listing);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="inline-block rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          Back to listings
        </Link>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="h-72 w-full bg-white/5">
            {image ? (
              <img src={image} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-white/40">
                No image
              </div>
            )}
          </div>

          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-300">
                {category}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                {island}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-2 text-white/70">{location}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">Date</p>
                <p className="mt-1 text-lg font-medium">{formatDate(date)}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">Price</p>
                <p className="mt-1 text-lg font-medium">{formatPrice(price)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/50">About this event</p>
              <p className="mt-2 whitespace-pre-wrap text-white/80">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
