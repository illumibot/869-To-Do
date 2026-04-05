'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const categoryOptions = [
  'Events',
  'Food',
  'Bars',
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
  start_time: '',
  end_date: '',
  end_time: '',
  phone: '',
  area_code: '869',
  price: '',
  currency: 'EC',
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

function buildStartDateTime(date, time) {
  if (!date) return null;
  return `${date}T${time || '00:00'}`;
}

function buildEndDateTime(date, time) {
  if (!date) return null;
  return `${date}T${time || '23:59'}`;
}

function showDesktopPicker(e) {
  if (typeof window !== 'undefined' && window.innerWidth > 768) {
    e.currentTarget.showPicker?.();
  }
}

function normalizePriceInput(value) {
  const str = String(value || '').trim();

  if (!str) return null;
  if (str.toLowerCase() === 'free') return 0;

  const num = Number(str);
  if (Number.isNaN(num)) return NaN;

  return num;
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

  function clearStartFields() {
    setForm((prev) => ({
      ...prev,
      start_date: '',
      start_time: '',
    }));
  }

  function clearEndFields() {
    setForm((prev) => ({
      ...prev,
      end_date: '',
      end_time: '',
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

    if (!form.title.trim()) {
      setError('Title is required.');
      setLoading(false);
      return;
    }

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

    if (form.start_time && !form.start_date) {
      setError('Start date is required if you enter a start time.');
      setLoading(false);
      return;
    }

    if (form.end_time && !form.end_date) {
      setError('End date is required if you enter an end time.');
      setLoading(false);
      return;
    }

    const normalizedPrice = normalizePriceInput(form.price);

    if (Number.isNaN(normalizedPrice)) {
      setError('Price must be a number, 0, or free.');
      setLoading(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      island: form.island,
      location: form.location,
      description: form.description,
      image_url: form.image_url || null,
      start_date: buildStartDateTime(form.start_date, form.start_time),
      end_date: buildEndDateTime(form.end_date, form.end_time),
      phone: normalizePhone(form.area_code, form.phone),
      price: normalizedPrice,
      currency: form.currency || 'EC',
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3"
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
          >
            <option value="">Select Category</option>
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
          >
            <option value="">Select Island</option>
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
            <div className="rounded-2xl border border-emerald-400/35 bg-emerald-950/20 px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                  Start
                </h2>

                {(form.start_date || form.start_time) && (
                  <button
                    type="button"
                    onClick={clearStartFields}
                    className="rounded-lg border border-emerald-300/30 bg-black/30 px-3 py-1 text-xs font-medium text-emerald-200 hover:bg-black/50"
                  >
                    Clear Start
                  </button>
                )}
              </div>

              <label className="mb-1 block text-xs text-white/75">
                Start Date (optional)
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                onFocus={showDesktopPicker}
                onClick={showDesktopPicker}
                className="w-full rounded-xl border border-emerald-300/20 bg-black/50 px-3 py-2 text-sm text-white"
              />

              <label className="mb-1 mt-3 block text-xs text-white/75">
                Start Time (optional)
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => updateField('start_time', e.target.value)}
                onFocus={showDesktopPicker}
                onClick={showDesktopPicker}
                className="w-full rounded-xl border border-emerald-300/20 bg-black/50 px-3 py-2 text-sm text-white"
              />

              <p className="mt-3 text-xs text-white/70">
                Leave blank for general listings. If you enter a start time, you
                must also choose a start date.
              </p>
            </div>

            <div className="rounded-2xl border border-red-400/35 bg-red-950/20 px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-red-300">
                  End
                </h2>

                {(form.end_date || form.end_time) && (
                  <button
                    type="button"
                    onClick={clearEndFields}
                    className="rounded-lg border border-red-300/30 bg-black/30 px-3 py-1 text-xs font-medium text-red-200 hover:bg-black/50"
                  >
                    Clear End
                  </button>
                )}
              </div>

              <label className="mb-1 block text-xs text-white/75">
                End Date (optional)
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
                onFocus={showDesktopPicker}
                onClick={showDesktopPicker}
                className="w-full rounded-xl border border-red-300/20 bg-black/50 px-3 py-2 text-sm text-white"
              />

              <label className="mb-1 mt-3 block text-xs text-white/75">
                End Time (optional)
              </label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => updateField('end_time', e.target.value)}
                onFocus={showDesktopPicker}
                onClick={showDesktopPicker}
                className="w-full rounded-xl border border-red-300/20 bg-black/50 px-3 py-2 text-sm text-white"
              />

              <p className="mt-3 text-xs text-white/70">
                Leave the end fields blank if there is no end date or no end
                time.
              </p>
              <p className="mt-2 text-xs font-bold text-white">
                Listings ending soonest may appear higher in the listings.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Price"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              className="flex-1 rounded-xl border border-white/30 bg-black/60 px-4 py-3"
            />

            <div className="flex rounded-xl border border-white/30 bg-black/60 p-1">
              <button
                type="button"
                onClick={() => updateField('currency', 'EC')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  form.currency === 'EC'
                    ? 'bg-[#f0b13c] text-black'
                    : 'text-white/80'
                }`}
              >
                EC
              </button>
              <button
                type="button"
                onClick={() => updateField('currency', 'US')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  form.currency === 'US'
                    ? 'bg-[#f0b13c] text-black'
                    : 'text-white/80'
                }`}
              >
                US
              </button>
            </div>
          </div>

          <p className="text-xs text-white/70">
            Leave price blank for no price. Enter 0 or free for Free.
          </p>

          <p className="rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white/85">
            Want more visibility? Submit a standard listing first, then email{' '}
            <a
              href="mailto:info@869todo.com"
              className="font-semibold text-amber-300 underline underline-offset-2"
            >
              info@869todo.com
            </a>{' '}
            with your listing title to request{' '}
            <span className="font-semibold text-[#f0b13c]">Featured</span>{' '}
            placement.
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
