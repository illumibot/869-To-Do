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
  const { error } = await supabase.from('listings').insert([
    {
      title: item.title,
      description: item.description,
      category: item.category,

      // ✅ ADD THESE (this fixes your app)
      island: item.island,
      location: item.location,
      event_date: item.event_date,
      image_url: item.image_url,
      contact_name: item.contact_name,
      contact_phone: item.contact_phone,
      website_url: item.website_url,

      // keep these
      venue_name: item.location || item.title,
      start_time: item.event_date || new Date().toISOString(),
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

  setApprovedIds((prev) => [...prev, item.id]);
  loadSubmissions();
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
  disabled={approvedIds.includes(item.id)}
  className={`mt-4 rounded-lg px-4 py-2 font-medium ${
    approvedIds.includes(item.id)
      ? 'bg-red-500 text-white cursor-not-allowed'
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
