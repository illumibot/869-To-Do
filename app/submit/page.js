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

  if (cleanAreaCode) {
    return `+1${cleanAreaCode}${cleanPhone}`;
  }

  return cleanPhone;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image file.'));
    };

    img.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not create compressed image.'));
      },
      type,
      quality
    );
  });
}

async function compressImage(file) {
  const img = await loadImageFromFile(file);

  const maxWidth = 1400;
  const maxHeight = 1400;

  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not compress image.');
  }

  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);

  const maxBytes = 200 * 1024;

  while (blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }

  return blob;
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
    setMessage('');

    try {
      const compressedBlob = await compressImage(file);

      const originalBase = file.name.replace(/\.[^/.]+$/, '');
      const safeBase = originalBase.replace(/\s+/g, '-').toLowerCase();
      const fileName = `${Date.now()}-${safeBase}.jpg`;

      const uploadFile = new File([compressedBlob], fileName, {
        type: 'image/jpeg',
      });

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, uploadFile, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploadingImage(false);
        return;
      }

      const { data } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      updateField('image_url', data.publicUrl);
    } catch (err) {
      setError(err?.message || 'Image compression/upload failed.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const payload = {
      title: form.title,
      category: form.category,
      island: form.island,
      location: form.location,
      description: form.description,
      image_url: form.image_url,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      phone: normalizePhone(form.area_code, form.phone),
      price: form.price === '' ? null : Number(form.price),
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
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <span>Submit a Listing</span>
            <span>🇰🇳</span>
          </h1>
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
            <div className="flex gap-2">
              <div className="w-28 rounded-xl border border-white/30 bg-black/60 px-3 py-3 text-white backdrop-blur-md">
                <div className="flex items-center gap-1">
                  <span className="text-white/70">+1</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={form.area_code}
                    onChange={(e) =>
                      updateField('area_code', e.target.value.replace(/\D/g, '').slice(0, 3))
                    }
                    className="w-full bg-transparent text-white focus:outline-none"
                  />
                </div>
              </div>

              <input
                type="tel"
                name="phone"
                placeholder="123 4567"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="flex-1 rounded-xl border border-white/30 bg-black/60 px-4 py-3 text-white placeholder-white/50 backdrop-blur-md focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <p className="mt-1 text-xs text-white/50">
              Enter the 7-digit local number. Change the area code if needed.
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
              <p className="mt-2 text-sm text-cyan-300">Compressing and uploading...</p>
            )}
            {form.image_url && (
              <img
                src={form.image_url}
                alt="Preview"
                className="mt-3 max-h-60 rounded-xl object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/70">
                Start Date & Time
              </label>
              <input
                ref={startDateRef}
                type="datetime-local"
                name="start_date"
                value={form.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                onFocus={() => openNativePicker(startDateRef)}
                onClick={() => openNativePicker(startDateRef)}
               className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none appearance-none"
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/70">
                End Date & Time (optional)
              </label>
              <input
                ref={endDateRef}
                type="datetime-local"
                name="end_date"
                value={form.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
                onFocus={() => openNativePicker(endDateRef)}
                onClick={() => openNativePicker(endDateRef)}
               className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none appearance-none"
            </div>
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
            className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-black hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Submitting...' : uploadingImage ? 'Uploading image...' : 'Submit Listing'}
          </button>
        </form>
      </div>
    </main>
  );
}
