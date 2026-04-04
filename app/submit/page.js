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
  category: '',
  island: '',
  location: '',
  description: '',
  image_url: '',
  start_date: '',
  end_date: '',
  phone: '',
  area_code: '869',
  price: '',
};

function normalizePhone(areaCode, phone) {
  const cleanAreaCode = String(areaCode || '').replace(/\D/g, '');
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  if (!cleanPhone) return null;

  if (cleanPhone.length >= 11 && cleanPhone.startsWith('1')) {
    return `+${cleanPhone}`;
  }

  if (cleanPhone.length === 10) {
    return `+1${cleanPhone}`;
  }

  if (cleanPhone.length === 7 && cleanAreaCode) {
    return `+1${cleanAreaCode}${cleanPhone}`;
  }

  return `+1${cleanAreaCode}${cleanPhone}`;
}

async function compressImage(file) {
  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      URL.revokeObjectURL(url);
      resolve(i);
    };
    i.onerror = reject;
    i.src = url;
  });

  const max = 1400;
  let { width, height } = img;

  const ratio = Math.min(max / width, max / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let blob = await new Promise((res) =>
    canvas.toBlob(res, 'image/jpeg', quality)
  );

  while (blob && blob.size > 200 * 1024 && quality > 0.5) {
    quality -= 0.05;
    blob = await new Promise((res) =>
      canvas.toBlob(res, 'image/jpeg', quality)
    );
  }

  if (!blob) {
    throw new Error('Image compression failed');
  }

  return blob;
}

export default function SubmitPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function clearEndDate() {
    setForm((prev) => ({
      ...prev,
      end_date: '',
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    setMessage('');

    try {
      const blob = await compressImage(file);
      const fileName = `${Date.now()}.jpg`;

      const uploadFile = new File([blob], fileName, {
        type: 'image/jpeg',
      });

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, uploadFile, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      updateField('image_url', data.publicUrl);
    } catch (err) {
      setError(err?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!form.category) {
      setError('Category is required.');
      setLoading(false);
      return;
    }

    if (!form.island) {
      setError('Island is required.');
      setLoading(false);
      return;
    }

    const payload = {
      title: form.title,
      category: form.category,
      island: form.island,
      location: form.location,
      description: form.description,
      image_url: form.image_url || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      phone: normalizePhone(form.area_code, form.phone),
      price: form.price ? Number(form.price) : null,
      status: 'pending',
    };

    const { error: insertError } = await supabase
      .from('listing_submissions')
      .insert([payload]);

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage(
        'Submitted! Your listing is awaiting approval. Want Featured placement later? After approval, email info@869todo.com with your listing title.'
      );
      setForm(initialForm);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-3xl font-bold">Submit a Listing 🇰🇳</h1>

        <Link
          href="/"
          className="mb-4 inline-block text-sm text-amber-300 underline"
        >
          ← Back to listings
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3"
            required
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3"
            rows={4}
          />

          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white"
            required
          >
            <option value="" disabled>
              Select Category
            </option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={form.island}
            onChange={(e) => updateField('island', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white"
            required
          >
            <option value="" disabled>
              Select Island
            </option>
            {islandOptions.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3"
          />

          <div className="flex gap-2">
            <input
              value={form.area_code}
              onChange={(e) => updateField('area_code', e.target.value)}
              className="w-20 rounded-xl border border-white/30 bg-black/60 px-2 py-3"
              inputMode="numeric"
            />
            <input
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="flex-1 rounded-xl border border-white/30 bg-black/60 px-4 py-3"
              inputMode="tel"
            />
          </div>

          <div className="rounded-xl border border-white/15 bg-black/30 px-4 py-3">
            <label className="mb-2 block text-sm font-medium text-white/90">
              Upload an image for your listing
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-white"
            />
            <p className="mt-2 text-xs text-white/65">
              Images are automatically compressed for faster loading.
            </p>
            {uploadingImage && (
              <p className="mt-2 text-sm text-white/70">Uploading image...</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-400/30 bg-blue-950/20 px-4 py-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-200">
                Start
              </h2>
              <label className="mb-1 block text-xs text-white/70">
                Start Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                onClick={(e) => {
                  if (window.innerWidth > 768) {
                    e.target.showPicker?.();
                  }
                }}
                className="w-full rounded-xl border border-blue-300/20 bg-black/50 px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 px-4 py-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200">
                  End
                </h2>
                {form.end_date && (
                  <button
                    type="button"
                    onClick={clearEndDate}
                    className="rounded-lg border border-amber-300/30 bg-black/30 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-black/50"
                  >
                    Clear End Date / Time
                  </button>
                )}
              </div>

              <label className="mb-1 block text-xs text-white/70">
                End Date &amp; Time (optional)
              </label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
                onClick={(e) => {
                  if (window.innerWidth > 768) {
                    e.target.showPicker?.();
                  }
                }}
                className="w-full rounded-xl border border-amber-300/20 bg-black/50 px-3 py-2 text-sm text-white"
              />
              <p className="mt-2 text-xs text-white/70">
                This field is optional. If you do not want an end date or time,
                leave it blank or tap{' '}
                <span className="font-semibold text-amber-200">
                  Clear End Date / Time
                </span>
                .
              </p>
              <p className="mt-2 text-xs text-white/70">
                <span className="font-bold text-white">
                  Listings ending soonest may appear higher in the listings.
                </span>
              </p>
            </div>
          </div>

          <input
            type="number"
            placeholder="Price (EC)"
            value={form.price}
            onChange={(e) => updateField('price', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3"
          />

          <p className="rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white/85">
            Want more visibility? Submit a standard listing first, then email{' '}
            <a
              href="mailto:info@869todo.com"
              className="font-semibold text-amber-300 underline underline-offset-2"
            >
              info@869todo.com
            </a>{' '}
            with your listing title to request Featured placement.
          </p>

          {message && <p className="text-green-400">{message}</p>}
          {error && <p className="text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-70"
          >
            {loading ? 'Submitting...' : 'Submit Listing'}
          </button>
        </form>
      </div>
    </main>
  );
}
