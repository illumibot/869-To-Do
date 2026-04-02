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
  if (!ctx) throw new Error('Could not compress image.');

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
    setForm((prev) => ({ ...prev, [name]: value }));
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

      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;

      const uploadFile = new File([compressedBlob], fileName, {
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
      setError(err.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const payload = {
      ...form,
      phone: normalizePhone(form.area_code, form.phone),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      price: form.price ? Number(form.price) : null,
      status: 'pending',
    };

    const { error } = await supabase.from('listing_submissions').insert([payload]);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Submitted! Awaiting approval.');
      setForm(initialForm);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold mb-6">Submit a Listing 🇰🇳</h1>

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
          />

          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3"
          />

          <input type="file" onChange={handleImageUpload} />

          <div className="flex flex-col gap-3">
            <input
              ref={startDateRef}
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => updateField('start_date', e.target.value)}
              onFocus={() => openNativePicker(startDateRef)}
              className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-sm"
            />

            <input
              ref={endDateRef}
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => updateField('end_date', e.target.value)}
              onFocus={() => openNativePicker(endDateRef)}
              className="w-full rounded-xl border border-white/20 bg-black/50 px-3 py-2 text-sm"
            />
          </div>

          <input
            type="number"
            placeholder="Price (EC)"
            value={form.price}
            onChange={(e) => updateField('price', e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-black/60 px-4 py-3"
          />

          {message && <p className="text-green-400">{message}</p>}
          {error && <p className="text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-black hover:bg-amber-500"
          >
            {loading ? 'Submitting...' : 'Submit Listing'}
          </button>
        </form>
      </div>
    </main>
  );
}
