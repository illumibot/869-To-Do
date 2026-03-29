'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const categoryOptions = [
  'Events',
  'Food',
  'Music',
  'Tours',
  'Nightlife',
  'Wellness',
  'Family',
  'Sports',
  'Other',
];

const islandOptions = ['St. Kitts', 'Nevis'];

const initialForm = {
  title: '',
  category: 'Events',
  island: 'St. Kitts',
  location: '',
  description: '',
  image_url: '',
  start_date: '',
  price: '',
};

export default function SubmitPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
    const fileName = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploadingImage(false);
      return;
    }

    const { data } = supabase.storage
      .from('listing-images')
      .getPublicUrl(fileName);

    updateField('image_url', data.publicUrl);
    setUploadingImage(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const payload = {
      ...form,
      price: form.price === '' ? null : Number(form.price),
      start_date: form.start_date || null,
      status: 'pending',
    };

    const { error } = await supabase.from('listing_submissions').insert([payload]);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage('Submitted! Awaiting approval.');
    setForm(initialForm);
    setLoading(false);
  }

  return (
    <main className="min-h-screen text-white px-4 py-10">
      <div className="mx-auto max-w-xl">

        {/* HEADER */}
        <div className="mb-6">
          <p className="text-sm text-cyan-300/80">869 To Do</p>
          <h1 className="text-3xl font-bold">Submit a Listing</h1>
        </div>

        <Link
          href="/"
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
        >
          Back
        </Link>

        {/* INTRO */}
        <p className="mt-6 mb-6 text-sm text-white/75">
          Submit an event, food listing, live music, tour, promotion, or other listing.
          Submissions do not go live automatically.
        </p>

        {/* FEATURED */}
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-black/40 backdrop-blur-md px-4 py-3 text-sm text-amber-200">
          Want a featured listing? Featured placement is arranged separately. Contact us at{' '}
          <a
            href="mailto:info@869todo.com"
            className="underline hover:text-white"
          >
            info@869todo.com
          </a>
          .
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
            className="w-full rounded-xl bg-black/60 border border-white/30 px-4 py-3 text-white placeholder-white/60 backdrop-blur-md focus:border-cyan-400"
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-black/60 border border-white/30 px-4 py-3 text-white placeholder-white/60 backdrop-blur-md focus:border-cyan-400"
          />

          <select
            name="category"
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-white/30 px-4 py-3 text-white focus:border-cyan-400"
          >
            {categoryOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          <select
            name="island"
            value={form.island}
            onChange={(e) => updateField('island', e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-white/30 px-4 py-3 text-white focus:border-cyan-400"
          >
            {islandOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          <input
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-white/30 px-4 py-3 text-white placeholder-white/60 backdrop-blur-md focus:border-cyan-400"
          />

          {/* IMAGE UPLOAD */}
          <div>
            <label className="text-sm text-white/70 mb-1 block">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-sm"
            />
            {uploadingImage && (
              <p className="text-sm text-cyan-300 mt-2">Uploading...</p>
            )}
            {form.image_url && (
              <img
                src={form.image_url}
                className="mt-3 rounded-xl max-h-60 object-cover"
              />
            )}
          </div>

          <input
            type="datetime-local"
            name="start_date"
            value={form.start_date}
            onChange={(e) => updateField('start_date', e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-white/30 px-4 py-3 text-white focus:border-cyan-400"
          />

          <input
            type="number"
            name="price"
            placeholder="Price (EC)"
            value={form.price}
            onChange={(e) => updateField('price', e.target.value)}
            className="w-full rounded-xl bg-black/60 border border-white/30 px-4 py-3 text-white placeholder-white/60 focus:border-cyan-400"
          />

          {message && (
            <div className="text-green-400 text-sm">{message}</div>
          )}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full rounded-xl bg-cyan-400 hover:bg-cyan-500 px-4 py-3 font-semibold text-black"
          >
            {loading ? 'Submitting...' : 'Submit Listing'}
          </button>

        </form>
      </div>
    </main>
  );
}
