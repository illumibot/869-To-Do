'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSubmissions() {
    const { data, error } = await supabase
      .from('listing_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setSubmissions(data);
    setLoading(false);
  }

  async function approveListing(item) {
    // insert into listings table
    const { error } = await supabase.from('listings').insert([
      {
        title: item.title,
        description: item.description,
        category: item.category,
      },
    ]);

    if (!error) {
      // remove from submissions (optional but cleaner)
      await supabase
        .from('listing_submissions')
        .delete()
        .eq('id', item.id);

      loadSubmissions();
    } else {
      console.error(error);
      alert('Error approving listing');
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl mb-6">Admin – Approve Listings</h1>

      {submissions.length === 0 && <p>No submissions</p>}

      {submissions.map((item) => (
        <div
          key={item.id}
          className="mb-4 rounded-xl border border-white/10 p-4"
        >
          <h2 className="text-lg font-bold">{item.title}</h2>
          <p className="text-sm opacity-70">{item.description}</p>
          <p className="text-xs mt-2">{item.category}</p>

          <button
            onClick={() => approveListing(item)}
            className="mt-3 rounded-lg bg-green-500 px-4 py-2 text-black"
          >
            Approve
          </button>
        </div>
      ))}
    </div>
  );
}
