'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020b18] text-white px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">869 To Do</h1>

        <p className="text-white/70 mb-6">
          Home is working again. We’ll rebuild listings next.
        </p>

        <div className="flex gap-3">
          <Link
            href="/submit"
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2"
          >
            Submit Listing
          </Link>

          <Link
            href="/admin"
            className="rounded-xl bg-white/10 border border-white/10 px-4 py-2"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
