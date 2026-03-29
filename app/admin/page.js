'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('listing_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading submissions:', error);
      setError(`Could not load submissions: ${error.message}`);
      setSubmissions([]);
    } else {
      setSubmissions(data || []);
    }

    setLoading(false);
  }

  async function approveSubmission(item) {
    if (!item?.id) return;

    setProcessingId(item.id);
    setError('');

    const listingPayload = {
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      island: item.island || '',
      image_url: item.image_url || '',
      location: item.location || '',
      venue_name: item.location || item.venue_name || '',
      start_date: item.start_date || null,
      end_date: item.end_date || null,
      start_time: item.start_time || item.start_date || null,
      end_time: item.end_time || item.end_date || null,
      phone: item.phone || '',
      price:
        item.price !== '' && item.price !== null && item.price !== undefined
          ? Number(item.price)
          : null,
      status: 'approved',
      created_at: new Date().toISOString(),
    };

    // 1. INSERT into listings
    const { error: insertError } = await supabase
      .from('listings')
      .insert([listingPayload]);

    if (insertError) {
      console.error('Insert error:', insertError);
      setError(`Insert failed: ${insertError.message}`);
      setProcessingId(null);
      return;
    }

    // 2. DELETE submission (THIS FIXES YOUR PROBLEM)
    const { error: deleteError } = await supabase
      .from('listing_submissions')
      .delete()
      .eq('id', item.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      setError(`Delete failed: ${deleteError.message}`);
      setProcessingId(null);
      return;
    }

    // 3. Remove from UI
    setSubmissions((prev) => prev.filter((s) => s.id !== item.id));
    setProcessingId(null);
  }

  async function deleteSubmission(id) {
    if (!id) return;

    const confirmed = window.confirm('Delete this submission?');
    if (!confirmed) return;

    setProcessingId(id);
    setError('');

    const { error } = await supabase
      .from('listing_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting submission:', error);
      setError(`Could not delete submission: ${error.message}`);
      setProcessingId(null);
      return;
    }

    setSubmissions((prev) => prev.filter((submission) => submission.id !== id));
    setProcessingId(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020b18] text-white px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Admin Approvals</h1>
          <p className="text-white/70">Loading submissions...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b18] text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Admin Approvals</h1>
        <p className="text-white/70 mb-6">
          Approve submissions to move them into your live listings table.
        </p>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        ) : null}

        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            No pending submissions.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((item) => {
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/6 backdrop-blur-sm p-4 md:p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-3">
                        {item.title || 'Untitled Listing'}
                      </h2>

                      <div className="text-sm text-white/80 mb-4">
                        {item.description || 'No description'}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => approveSubmission(item)}
                        disabled={isProcessing}
                        className="rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2"
                      >
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </button>

                      <button
                        onClick={() => deleteSubmission(item.id)}
                        disabled={isProcessing}
                        className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
