'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function SubmitPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Other',
    island: 'St. Kitts',
    location: '',
    image_url: '',
    start_date: '',
    price: '',
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('listing_submissions').insert([
      {
        title: form.title,
        description: form.description,
        category: form.category,
        island: form.island,
        location: form.location,
        image_url: form.image_url,
        start_date: form.start_date || null,
        price: form.price ? Number(form.price) : null,
      },
    ]);

    if (error) {
      console.error(error);
      alert('Error submitting listing');
    } else {
      alert('Submitted! Awaiting approval.');
      setForm({
        title: '',
        description: '',
        category: 'Other',
        island: 'St. Kitts',
        location: '',
        image_url: '',
        start_date: '',
        price: '',
      });
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">

        {/* HEADER */}
        <div className="mb-6">
          <p className="text-sm text-cyan-300/80">869 To Do</p>
          <h1 className="text-3xl font-bold">Submit a Listing</h1>
        </div>

        <Link
          href="/"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          Back
        </Link>

        {/* INTRO TEXT */}
        <p className="mt-6 mb-6 text-sm text-white/65">
          Submit an event, food listing, live music, tour, promotion, or other listing.
          Submissions do not go live automatically.
        </p>

        {/* FEATURED NOTICE */}
        <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Want a featured listing? Featured placement is arranged separately. Contact us at{' '}
          <a
            href="mailto:info@869todo.com"
            className="font-medium underline underline-offset-2 hover:text-white"
          >
            info@869todo.com
          </a>
          .
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="mb-1 block text-sm text-white/75">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            >
              <option>Food</option>
              <option>Events</option>
              <option>Activities</option>
              <option>Services</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Island</label>
            <select
              name="island"
              value={form.island}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            >
              <option>St. Kitts</option>
              <option>Nevis</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Image URL</label>
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Date & Time</label>
            <input
              type="datetime-local"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Price (EC)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 px-4 py-3 font-semibold text-black"
          >
            {loading ? 'Submitting...' : 'Submit Listing'}
          </button>

        </form>
      </div>
    </main>
  );
}
