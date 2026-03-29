'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
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
  end_date: '',
  phone: '',
  price: '',
};

function normalizePhoneNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) return '';

  // User enters just 7-digit local number
  if (digits.length === 7) return `1869${digits}`;

  // User enters 869 + 7 digits
  if (digits.length === 10 && digits.startsWith('869')) return `1${digits}`;

  // User enters full 1 + 869 + 7 digits
  if (digits.length === 11 && digits.startsWith('1869')) return digits;

  // User enters full international with other format
  if (digits.length >= 11) return digits;

  // fallback
  return digits;
}

export default function SubmitPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openNativePicker(ref) {
    const input = ref.current;
    if (!input) return;

    input.focus();

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {}
    }
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
      phone: form.phone ? normalizePhoneNumber(form.phone) : null,
      price: form.price === '' ? null : Number(form.price),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
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
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <p className="text-sm text-cyan-300/80">869 To Do</p>
          <h1 className="text-3xl font-bold">🇰🇳 Submit a Listing</h1>
        </div>

        <Link
          href="/"
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
        >
          Back
        </Link>

        <p className="mb-6 mt-6 text-sm text-white/75">
          Submit an event, food listing, live music, tour, promotion, or other listing.
          Submissions do not go live automatically.
        </p>

        <div className="mb-6 rounded-xl border border-amber-400/30 bg-black/40 px-4 py-3 text-sm text-amber-200 backdrop-blur-md">
          Want a featured listing? Featured placement is arranged separately. Contact us at{' '}
          <a
            href="mailto:info@869todo.com"
            className="underline hover:text-white"
          >
            info@869todo.com
          </a>
          .
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white placeholder-white/60 backdrop-blur-md focus:border-cyan-400 focus:outline-none"
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white placeholder-white/60 backdrop-blur-md focus:border-cyan-400 focus:outline-none"
          />

          <select
            name="category"
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
          >
            {categoryOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          <select
            name="island"
            value={form.island}
            onChange={(e) => updateField('island', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
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
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white placeholder-white/60 backdrop-blur-md focus:border-cyan-400 focus:outline-none"
          />

          <div>
            <label className="mb-1 block text-sm text-white/70">Phone Number</label>
            <div className="flex overflow-hidden rounded-xl border border-white/30 bg-black/60 backdrop-blur-md focus-within:border-cyan-400">
              <div className="flex items-center border-r border-white/20 px-4 text-white/70">
                +1 869
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="555 1234"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full bg-transparent px-4 py-3 text-white placeholder-white/50 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-white/50">
              Users can enter just the local 7-digit number. The 869 area code will be added automatically.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full text-sm"
            />
            {uploadingImage && (
              <p className="mt-2 text-sm text-cyan-300">Uploading...</p>
            )}
            {form.image_url && (
              <img
                src={form.image_url}
                alt="Preview"
                className="mt-3 max-h-60 rounded-xl object-cover"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">Start Date & Time</label>
            <input
              ref={startDateRef}
              type="datetime-local"
              name="start_date"
              value={form.start_date}
              onChange={(e) => updateField('start_date', e.target.value)}
              onFocus={() => openNativePicker(startDateRef)}
              onClick={() => openNativePicker(startDateRef)}
              className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">End Date & Time</label>
            <input
              ref={endDateRef}
              type="datetime-local"
              name="end_date"
              value={form.end_date}
              onChange={(e) => updateField('end_date', e.target.value)}
              onFocus={() => openNativePicker(endDateRef)}
              onClick={() => openNativePicker(endDateRef)}
              className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <input
            type="number"
            name="price"
            placeholder="Price (EC)"
            value={form.price}
            onChange={(e) => updateField('price', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white placeholder-white/60 focus:border-cyan-400 focus:outline-none"
          />

          {message && (
            <div className="text-sm text-green-400">{message}</div>
          )}
          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-black hover:bg-cyan-500"
          >
            {loading ? 'Submitting...' : 'Submit Listing'}
          </button>
        </form>
      </div>
    </main>
  );
}
