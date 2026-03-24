'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSubmissions() {
    const { data, error } = await supabase
      .from('listing_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setSubmissions(data || []);
    setLoading(false);
  }

  async function approveListing(item) {
  const { error } = await supabase.from('listings').insert([
  {
    title: item.title,
    description: item.description,
    category: item.category,
    venue_name: item.title,
    start_time: item.start_date || new Date().toISOString(),
  },
]);

  if (error) {
  console.error('Approve listing error:', error);
  alert(`Error approving listing: ${error.message}`);
  return;
}

   const { error: deleteError } = await supabase
  .from('listing_submissions')
  .delete()
  .eq('id', item.id);

if (deleteError) {
  console.error('Delete submission error:', deleteError);
  alert(`Approved into listings, but failed to remove submission: ${deleteError.message}`);
}


  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Admin – Approve Listings</h1>

      {loading && <p>Loading...</p>}

      {!loading && submissions.length === 0 && <p>No submissions</p>}

      <div className="space-y-4">
        {submissions.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <h2 className="text-lg font-bold">{item.title}</h2>
            <p className="mt-2 text-sm text-white/70">{item.description}</p>
            <p className="mt-2 text-xs text-cyan-300">{item.category}</p>

            <button
              onClick={() => approveListing(item)}
              className="mt-4 rounded-lg bg-green-500 px-4 py-2 font-medium text-black"
            >
              Approve
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
