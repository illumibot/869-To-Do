'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [liveListings, setLiveListings] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
    fetchLiveListings();
  }, []);

  async function fetchSubmissions() {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setSubmissions(data || []);
  }

  async function fetchLiveListings() {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    setLiveListings(data || []);
  }

  async function approveSubmission(item) {
    setProcessingId(item.id);
    setError('');

    const { error } = await supabase.from('listings').insert({
      title: item.title,
      description: item.description,
      category: item.category,
      island: item.island,
      location: item.location,
      start_date: item.start_date,
      end_date: item.end_date,
      image_url: item.image_url,
      whatsapp: item.whatsapp,
      is_featured: false,
    });

    if (error) {
      setError(error.message);
      setProcessingId(null);
      return;
    }

    await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', item.id);

    fetchSubmissions();
    fetchLiveListings();
    setProcessingId(null);
  }

  async function toggleFeatured(item) {
    if (!item?.id) return;

    setProcessingId(item.id);

    await supabase
      .from('listings')
      .update({ is_featured: !item.is_featured })
      .eq('id', item.id);

    fetchLiveListings();
    setProcessingId(null);
  }

  function formatDate(dateString) {
    if (!dateString) return '';

    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/St_Kitts',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <main className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {error && <p className="text-red-500">{error}</p>}

      {/* Pending Submissions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Pending Submissions</h2>

        <div className="space-y-4">
          {submissions.map((item) => {
            const isProcessing = processingId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <h3 className="font-semibold">{item.title}</h3>

                <p>Start: {formatDate(item.start_date)}</p>
                <p>End: {formatDate(item.end_date)}</p>

                <button
                  onClick={() => approveSubmission(item)}
                  disabled={isProcessing}
                  className="mt-3 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2"
                >
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Listings */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Live Listings</h2>

        <div className="space-y-4">
          {liveListings.map((item) => {
            const isProcessing = processingId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <h3 className="font-semibold">
                  {item.title} {item.is_featured && '⭐'}
                </h3>

                <p>Start: {formatDate(item.start_date)}</p>
                <p>End: {formatDate(item.end_date)}</p>

                <button
                  onClick={() => toggleFeatured(item)}
                  disabled={isProcessing}
                  className="mt-3 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2"
                >
                  {isProcessing
                    ? 'Processing...'
                    : item.is_featured
                      ? 'Unfeature'
                      : 'Feature'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
