'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function getTitle(item) {
  return item.title || item.name || item.event_name || 'Untitled Listing';
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

function getCategory(item) {
  return item.category || item.type || item.event_type || 'General';
}

function getIsland(item) {
  const raw = String(
    item.island || item.location_island || item.region || ''
  ).toLowerCase();

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

function getDescription(item) {
  return item.description || 'No description available.';
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

function ListingCard({ item }) {
  const featured = !!item.is_featured;
  const image = getImage(item);

  return (
    <div
      className={[
        'overflow-hidden rounded-[24px] border bg-[#071224]/88 backdrop-blur-sm',
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

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2 text-xs text-white/75">
          <span className="rounded-full bg-white/10 px-3 py-1">
            {getCategory(item)}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            {getIsland(item)}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            {formatPrice(getPrice(item))}
          </span>
        </div>

        <h3 className="text-2xl font-semibold text-white">{getTitle(item)}</h3>

        <div className="space-y-1 text-sm text-white/75">
          <p>{formatEventDate(getDate(item))}</p>
          <p>{getLocation(item)}</p>
        </div>

        <p className="line-clamp-3 text-sm text-white/70">
          {getDescription(item)}
        </p>

        <Link
          href={`/listing/${item.id}`}
          className="block w-full rounded-2xl bg-cyan-400 py-3 text-center font-semibold text-black"
        >
          Open
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        setListings([]);
        return;
      }

      setListings(data || []);
    }

    loadListings();
  }, []);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(1,10,28,0.58), rgba(1,10,28,0.72)), url('/background3.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#020b18',
      }}
    >
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-6 text-4xl font-bold">869 To Do</h1>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </div>
  );
}
