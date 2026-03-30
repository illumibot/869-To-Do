'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading listings:', error);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    }

    loadListings();
  }, []);

  const featured = listings.filter((l) => l.is_featured);
  const regular = listings.filter((l) => !l.is_featured);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020b18] text-white flex items-center justify-center">
        <p className="text-white/70">Loading listings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b18] text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold mb-4">869 To Do</h1>

        {/* FEATURED */}
        {featured.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Featured</h2>
              <span className="text-white/60 text-sm">
                {featured.length}
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {featured.map((item) => (
                <Link
                  key={item.id}
                  href={`/listing/${item.id}`}
                  className="min-w-[280px] snap-start rounded-2xl border border-[#f0b13c]/40 bg-[#1a1f2e] overflow-hidden"
                >
                  <div className="h-40 bg-black/30">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-[#f0b13c] mb-1">
                      FEATURED
                    </p>

                    <h3 className="font-semibold text-lg">
                      {item.title}
                    </h3>

                    <p className="text-white/60 text-sm">
                      {item.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* MORE TO DO */}
        <div className="flex items-center justify-between mt-6 mb-3">
          <h2 className="text-xl font-semibold">More to do</h2>
        </div>

        <div className="space-y-4">
          {regular.map((item) => (
            <Link
              key={item.id}
              href={`/listing/${item.id}`}
              className="block rounded-2xl border border-white/10 bg-[#1a1f2e] overflow-hidden"
            >
              <div className="flex">
                <div className="w-32 h-28 bg-black/30">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="p-3 flex-1">
                  <h3 className="font-semibold">
                    {item.title}
                  </h3>

                  <p className="text-white/60 text-sm">
                    {item.location}
                  </p>

                  <p className="text-white/40 text-xs mt-1">
                    {new Date(item.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
