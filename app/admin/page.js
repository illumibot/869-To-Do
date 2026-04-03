'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

function parseListingDate(value) {
  if (!value) return null;

  const str = String(value).trim();

  const match = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/
  );

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);

  const d = new Date(year, month - 1, day, hour, minute);

  if (Number.isNaN(d.getTime())) return null;

  return d;
}

function formatDate(value) {
  if (!value) return '—';

  const d = parseListingDate(value);
  if (!d) return value;

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState([]);
  const [liveListings, setLiveListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
    fetchLiveListings();
  }, []);

  async function fetchSubmissions() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('listing_submissions')
      .select('*')
      .eq('approved', false)
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

  async function fetchLiveListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading live listings:', error);
      return;
    }

    setLiveListings(data || []);
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
      is_featured: false,
      price:
        item.price !== '' && item.price !== null && item.price !== undefined
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

    const { error: updateError } = await supabase
      .from('listing_submissions')
      .update({ approved: true })
      .eq('id', item.id);

    if (updateError) {
      console.error('Approved, but could not mark submission approved:', updateError);
      setError(
        `Listing approved, but could not update submission status: ${updateError.message}`
      );
      setProcessingId(null);
      return;
    }

    await fetchLiveListings();
    setSubmissions((prev) => prev.filter((submission) => submission.id !== item.id));
    setProcessingId(null);
  }

  async function toggleFeatured(item) {
    if (!item?.id) return;

    setProcessingId(item.id);
    setError('');

    const nextFeatured = !item.is_featured;

    const { error: updateError } = await supabase
      .from('listings')
      .update({ is_featured: nextFeatured })
      .eq('id', item.id);

    if (updateError) {
      console.error('Error updating featured status:', updateError);
      setError(`Could not update featured status: ${updateError.message}`);
      setProcessingId(null);
      return;
    }

    setLiveListings((prev) =>
      prev
        .map((listing) =>
          listing.id === item.id
            ? { ...listing, is_featured: nextFeatured }
            : listing
        )
        .sort((a, b) => {
          if (!!a.is_featured !== !!b.is_featured) {
            return a.is_featured ? -1 : 1;
          }

          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bCreated - aCreated;
        })
    );

    setProcessingId(null);
  }

  async function deleteLiveListing(id) {
    if (!id) return;

    const confirmed = window.confirm('Delete this live listing?');
    if (!confirmed) return;

    setProcessingId(id);
    setError('');

    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting live listing:', deleteError);
      setError(`Could not delete live listing: ${deleteError.message}`);
      setProcessingId(null);
      return;
    }

    setLiveListings((prev) => prev.filter((item) => item.id !== id));
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

        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            No pending submissions.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((item) => {
              const isProcessing = processingId === item.id;

              return (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h2 className="text-lg font-semibold mb-2">{item.title}</h2>

                  <p>Start: {formatDate(item.start_date)}</p>
                  <p>End: {formatDate(item.end_date)}</p>

                  <button
                    onClick={() => approveSubmission(item)}
                    disabled={isProcessing}
                    className="mt-3 w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium"
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
