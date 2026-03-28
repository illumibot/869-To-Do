'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const background3 = '/background3.png';

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
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-white">{getTitle(item)}</h3>
        <button
          onClick={() => onOpen(item)}
          className="w-full rounded-2xl bg-cyan-400 py-3 font-semibold text-black"
        >
          Open
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    async function loadListings() {
      const { data } = await supabase.from('listings').select('*');
      setListings(data || []);
    }
    loadListings();
  }, []);

  return (
    <div className="relative min-h-screen text-white">
      {/* ✅ FIXED BACKGROUND */}
      <div className="fixed inset-0 -z-20">
        <img
          src={background3}
          alt=""
          className="h-full w-full object-cover object-top"
        />
      </div>

      <main className="p-6">
        <h1 className="text-4xl font-bold mb-6">869 To Do</h1>

        <div className="grid gap-4">
          {listings.map((item) => (
            <ListingCard key={item.id} item={item} onOpen={() => {}} />
          ))}
        </div>
      </main>
    </div>
  );
}
