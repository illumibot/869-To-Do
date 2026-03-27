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
    .trim();
}

function getIsland(item) {
  const raw = normalizeIsland(item.island || '');
  if (raw.includes('nevis')) return 'Nevis';
  if (raw.includes('kitts')) return 'St. Kitts';
  return 'Other';
}

function formatPrice(v) {
  const n = Number(v);
  if (!n) return 'Free';
  return `EC$${n}`;
}

export default function Page() {
  const [listings, setListings] = useState([]);
  const [selectedIsland, setSelectedIsland] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState(null);
  const [imageView, setImageView] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('listings').select('*');
      setListings(data || []);
    }
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    listings.forEach((l) => set.add(l.category || 'General'));
    return ['All', ...Array.from(set)];
  }, [listings]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const islandOk =
        selectedIsland === 'All' ||
        normalizeIsland(getIsland(l)).includes(normalizeIsland(selectedIsland));

      const categoryOk =
        selectedCategory === 'All' ||
        (l.category || 'General') === selectedCategory;

      const searchOk =
        !search ||
        (l.title || '').toLowerCase().includes(search.toLowerCase());

      return islandOk && categoryOk && searchOk;
    });
  }, [listings, selectedIsland, selectedCategory, search]);

  const featured = filtered.filter((l) => l.is_featured);
  const regular = filtered.filter((l) => !l.is_featured);

  function Card(item) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div
          className="h-44 bg-black/20 cursor-pointer"
          onClick={() => setImageView(item.image_url)}
        >
          {item.image_url ? (
            <img src={item.image_url} className="w-full h-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-white/30">
              No image
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex justify-between text-xs text-white/60">
            <span>{item.category}</span>
            <span>{getIsland(item)}</span>
          </div>

          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-white/60">{item.location}</p>

          <div className="flex justify-between text-sm">
            <span>{item.start_time}</span>
            <span>{formatPrice(item.price)}</span>
          </div>

          <button
            onClick={() => setOpenItem(item)}
            className="w-full bg-cyan-400 text-black py-2 rounded-lg mt-2"
          >
            Open
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-slate-950 min-h-screen text-white pb-24">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        <h1 className="text-2xl font-bold">869 To Do</h1>

        <Link
          href="/submit"
          className="inline-block bg-cyan-400 text-black px-4 py-2 rounded-lg"
        >
          Submit Listing
        </Link>

        <input
          placeholder="Search..."
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3"
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FILTERS */}
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {islands.map((i) => (
              <button
                key={i}
                onClick={() => setSelectedIsland(i)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedIsland === i
                    ? 'bg-cyan-400 text-black'
                    : 'bg-white/5 text-white/70'
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === c
                    ? 'bg-cyan-400 text-black'
                    : 'bg-white/5 text-white/70'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* FEATURED */}
        {featured.length > 0 && (
          <>
            <h2 className="text-lg font-semibold">Featured</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((item) => (
                <Card key={item.id} {...item} />
              ))}
            </div>
          </>
        )}

        {/* ALL */}
        <h2 className="text-lg font-semibold">All Events</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {regular.map((item) => (
            <Card key={item.id} {...item} />
          ))}
        </div>
      </div>

      {/* BOTTOM SHEET */}
      {openItem && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end"
          onClick={() => setOpenItem(null)}
        >
          <div
            className="bg-slate-900 w-full p-5 rounded-t-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">{openItem.title}</h2>
            <p>{openItem.description}</p>
            <p className="text-sm text-white/60">{openItem.location}</p>
            <button
              className="w-full bg-cyan-400 text-black py-3 rounded-lg"
              onClick={() => setOpenItem(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* IMAGE VIEW */}
      {imageView && (
        <div
          className="fixed inset-0 bg-black flex items-center justify-center"
          onClick={() => setImageView(null)}
        >
          <img src={imageView} className="max-h-full max-w-full" />
        </div>
      )}
    </main>
  );
}
