'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvedIds, setApprovedIds] = useState([]);

  async function loadSubmissions() {
    setLoading(true);

    const { data, error } = await supabase
      .from('listing_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load submissions error:', error);
      alert(`Error loading submissions: ${error.message}`);
      setLoading(false);
      return;
    }

    setSubmissions(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function approveListing(item) {
    if (approvedIds.includes(item.id)) return;

    setApprovedIds((prev) => [...prev, item.id]);

    const { error } = await supabase.from('listings').insert([
      {
        title: item.title || '',
        description: item.description || '',
        category: item.category || 'Other',
        island: item.island || 'St. Kitts',
        image_url: item.image_url || '',
        venue_name: item.location || item.title || 'Location TBA',
        start_time: item.start_date || new Date().toISOString(),
        price: item.price ?? null,
      },
    ]);

    if (error) {
      console.error('Approve listing error:', error);
      alert(`Error approving listing: ${error.message}`);
      setApprovedIds((prev) => prev.filter((id) => id !== item.id));
      return;
    }

    const { error: deleteError } = await supabase
      .from('listing_submissions')
      .delete()
      .eq('id', item.id);

    if (deleteError) {
      console.error('Delete submission error:', deleteError);
      alert(`Approved into listings, but failed to remove submission: ${deleteError.message}`);
      return;
    }

    setSubmissions((prev) => prev.filter((submission) => submission.id !== item.id));
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

            {item.location && (
              <p className="mt-1 text-sm text-white/60">{item.location}</p>
            )}

            <p className="mt-2 text-sm text-white/70">
              {item.description || 'No description'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {item.category && (
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-300">
                  {item.category}
                </span>
              )}

              {item.island && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">
                  {item.island}
                </span>
              )}

              {item.price !== null && item.price !== '' && item.price !== undefined && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">
                  EC${Number(item.price).toFixed(0)}
                </span>
              )}
            </div>

            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title || 'Submission image'}
                className="mt-4 max-h-64 w-full rounded-xl object-cover"
              />
            )}

            <button
              onClick={() => approveListing(item)}
              disabled={approvedIds.includes(item.id)}
              className={`mt-4 rounded-lg px-4 py-2 font-medium ${
                approvedIds.includes(item.id)
                  ? 'cursor-not-allowed bg-red-500 text-white'
                  : 'bg-green-500 text-black'
              }`}
            >
              {approvedIds.includes(item.id) ? 'Approved' : 'Approve'}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
