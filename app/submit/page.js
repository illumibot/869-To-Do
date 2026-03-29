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
  address: '',
  description: '',
  image_url: '',
  start_date: '',
  end_date: '',
  price: '',
  business_name: '',
  contact_name: '',
  email: '',
  phone: '',
  website: '',
  instagram: '',
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

    setError('');
    setMessage('');
    setUploadingImage(true);

    const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
    const fileName = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setError(`Image upload failed: ${uploadError.message}`);
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
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      price: form.price === '' ? null : Number(form.price),
      status: 'pending',
    };

    const { error } = await supabase.from('listing_submissions').insert([payload]);

    if (error) {
      console.error('Supabase insert error:', error);
      setError(`Submission failed: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage('Thanks. Your listing was submitted for review.');
    setForm(initialForm);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300/80">869 To Do</p>
            <h1 className="text-3xl font-bold">Submit a Listing</h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Back
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-6 text-sm text-white/65">
            Submit an event, food listing, live music, tour, promotion, or other listing.
            Submissions do not go live automatically.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-white/75">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder="Friday Live Music"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/75">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option} className="bg-slate-900">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/75">Island</label>
                <select
                  value={form.island}
                  onChange={(e) => updateField('island', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                >
                  {islandOptions.map((option) => (
                    <option key={option} value={option} className="bg-slate-900">
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/75">Location / Venue</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder="Frigate Bay Beach Bar"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/75">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder="Street address or directions"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/75">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder="Tell people what is happening"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/75">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
              {uploadingImage && (
                <p className="mt-2 text-sm text-cyan-300/80">Uploading image...</p>
              )}
              {form.image_url && (
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="mt-3 max-h-64 w-full rounded-xl object-cover"
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/75">Start date / time</label>
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/75">End date / time</label>
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => updateField('end_date', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/75">Price (EC$)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder="0 for free, or enter amount in EC dollars"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/75">Business name</label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(e) => updateField('business_name', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/75">Contact name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => updateField('contact_name', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/75">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/75">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/75">Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/75">Instagram</label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => updateField('instagram', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                  placeholder="@yourbusiness"
                />
              </div>
            </div>

            {message && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 disabled:opacity-60"
            >
              {loading ? 'Submitting...' : uploadingImage ? 'Uploading image...' : 'Submit Listing'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
