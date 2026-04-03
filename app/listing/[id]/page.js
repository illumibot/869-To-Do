'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

function formatDate(value) {
  if (!value) return 'Date TBA';

  const d = parseListingDate(value);
  if (!d) return String(value);

  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Free';

  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (num === 0) return 'Free';

  return `EC$${num.toLocaleString()}`;
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
  return item.location || item.venue || item.venue_name || item.place || item.address || getIsland(item);
}

function getDate(item) {
  return item.start_time || item.date || item.event_date || item.starts_at || item.start_date || item.created_at;
}

function getEndDate(item) {
  return item.end_time || item.end_date || item.ends_at || item.endtime || item.end || '';
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

function getPhone(item) {
  return item.phone || item.phone_number || item.contact_phone || item.whatsapp || '';
}

function cleanPhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

function phoneDigitsOnly(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function formatPhone(phone) {
  const digits = phoneDigitsOnly(phone);

  if (!digits) return '';

  if (digits.length === 11 && digits.startsWith('1')) {
    const country = digits.slice(0, 1);
    const area = digits.slice(1, 4);
    const first = digits.slice(4, 7);
    const last = digits.slice(7, 11);
    return `+${country} (${area}) ${first}-${last}`;
  }

  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const first = digits.slice(3, 6);
    const last = digits.slice(6, 10);
    return `(${area}) ${first}-${last}`;
  }

  if (digits.length === 7) {
    const first = digits.slice(0, 3);
    const last = digits.slice(3, 7);
    return `${first}-${last}`;
  }

  return String(phone);
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListing() {
      if (!id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', String(id))
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
  }, [id]);

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
  const endDate = getEndDate(listing);
  const price = getPrice(listing);
  const description = getDescription(listing);
  const image = getImage(listing);
  const phone = getPhone(listing);
  const formattedPhone = formatPhone(phone);
  const telPhone = cleanPhone(phone);
  const featured = !!listing.is_featured;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = '/';
            }
          }}
          className="mb-4 text-sm text-white/70 hover:text-white"
        >
          ← Back to listings
        </button>

        <div
          className={[
            'mt-6 overflow-hidden rounded-3xl border bg-white/5',
            featured
              ? 'border-[#f0b13c] shadow-[0_0_0_1px_rgba(240,177,60,0.28),0_0_28px_rgba(240,177,60,0.16)]'
              : 'border-white/10',
          ].join(' ')}
        >
          <div className="relative h-72 w-full bg-white/5">
            {featured && (
              <div className="absolute left-4 top-4 z-10 rounded-xl bg-[#f0b13c] px-3 py-1 text-xs font-extrabold text-black shadow-md">
                FEATURED LISTING
              </div>
            )}

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
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium',
                  featured
                    ? 'bg-[#f0b13c]/15 text-[#f7cf77]'
                    : 'bg-cyan-400/15 text-cyan-300',
                ].join(' ')}
              >
                {category}
              </span>

              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                {island}
              </span>

              {featured && (
                <span className="rounded-full bg-[#f0b13c]/15 px-3 py-1 text-xs font-semibold text-[#f7cf77]">
                  Premium placement
                </span>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-2 text-white/70">{location}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">Start</p>
                <p className="mt-1 text-lg font-medium">{formatDate(date)}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">Price</p>
                <p className="mt-1 text-lg font-medium">{formatPrice(price)}</p>
              </div>
            </div>

            {endDate && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">End</p>
                <p className="mt-1 text-lg font-medium">{formatDate(endDate)}</p>
              </div>
            )}

            {phone && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/50">Contact</p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href={`tel:${telPhone}`}
                    className="inline-flex items-center rounded-xl bg-[#4f8ff7] px-4 py-3 font-semibold text-white hover:bg-[#3e7fe8]"
                  >
                    Call {formattedPhone}
                  </a>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/50">
                {featured ? 'About this featured listing' : 'About this listing'}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-white/80">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
