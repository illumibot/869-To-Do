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
      setError('Could not load submissions.');
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
      start_date: item.start_date || null,
      end_date: item.end_date || null, // stays optional
      phone: item.phone || '',
      price: item.price !== '' && item.price !== null && item.price !== undefined
        ? Number(item.price)
        : null,
    };

    const { error: insertError } = await supabase
      .from('listings')
      .insert([listingPayload]);

   if (insertError) {
  console.error('Error approving submission:', insertError);
  setError(`Could not approve submission: ${insertError.message}`);
  setProcessingId(null);
  return;
}
    const { error: deleteError } = await supabase
      .from('listing_submissions')
      .delete()
      .eq('id', item.id);

    if (deleteError) {
      console.error('Approved, but could not remove submission:', deleteError);
      setError('Listing approved, but the old submission could not be removed from the queue.');
      setProcessingId(null);
      return;
    }

    // Remove it from the admin page immediately
    setSubmissions((prev) => prev.filter((submission) => submission.id !== item.id));
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
      setError('Could not delete submission.');
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
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2">
                        {item.title || 'Untitled Listing'}
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-white/80 mb-3">
                        <p><span className="text-white font-medium">Category:</span> {item.category || '—'}</p>
                        <p><span className="text-white font-medium">Island:</span> {item.island || '—'}</p>
                        <p><span className="text-white font-medium">Location:</span> {item.location || '—'}</p>
                        <p><span className="text-white font-medium">Phone:</span> {item.phone || '—'}</p>
                        <p><span className="text-white font-medium">Price:</span> {item.price ?? '—'}</p>
                        <p><span className="text-white font-medium">Image URL:</span> {item.image_url || '—'}</p>
                        <p>
                          <span className="text-white font-medium">Start Date:</span>{' '}
                          {item.start_date ? new Date(item.start_date).toLocaleString() : '—'}
                        </p>
                        <p>
                          <span className="text-white font-medium">End Date:</span>{' '}
                          {item.end_date ? new Date(item.end_date).toLocaleString() : 'Optional / none'}
                        </p>
                      </div>

                      {item.description ? (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white/85 whitespace-pre-wrap">
                          {item.description}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 md:min-w-[160px]">
                      <button
                        onClick={() => approveSubmission(item)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 font-medium transition"
                      >
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </button>

                      <button
                        onClick={() => deleteSubmission(item.id)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 font-medium transition"
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
