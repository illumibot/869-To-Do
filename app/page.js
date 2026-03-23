'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Zap,
  Music,
  Utensils,
  Calendar,
  MapPin,
  Flame,
  ChevronRight,
  Search,
  Home,
  PlusSquare,
  Heart,
  Map,
} from 'lucide-react'

export default function Page() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIsland, setSelectedIsland] = useState('St. Kitts')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchListings()
  }, [])

  async function fetchListings() {
    setLoading(true)

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching listings:', error)
      setListings([])
    } else {
      setListings(data || [])
    }

    setLoading(false)
  }

  const islandListings = useMemo(() => {
    return listings.filter((item) => item.island === selectedIsland)
  }, [listings, selectedIsland])

  const filteredListings = useMemo(() => {
    if (selectedCategory === 'all') return islandListings

    if (selectedCategory === 'music') {
      return islandListings.filter(
        (item) => (item.category || '').toLowerCase() === 'music'
      )
    }

    if (selectedCategory === 'food') {
      return islandListings.filter((item) => {
        const cat = (item.category || '').toLowerCase()
        return cat === 'food' || cat === 'dining' || cat === 'specials'
      })
    }

    if (selectedCategory === 'weekend') {
      return islandListings.filter((item) => {
        if (!item.start_time) return false
        const day = new Date(item.start_time).getDay()
        return day === 5 || day === 6 || day === 0
      })
    }

    return islandListings
  }, [islandListings, selectedCategory])

  const trending = filteredListings[0]
  const otherListings = filteredListings.slice(1)

  return (
    <main className="p-6 space-y-8 animate-in fade-in duration-500">
      <section>
        <h1 className="text-3xl font-black text-869-dark leading-tight">
          What’s going on <br />
          <span className="text-869-blue underline decoration-869-orange/30 text-4xl italic">
            right now?
          </span>
        </h1>
      </section>

      <div className="flex bg-gray-200/50 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setSelectedIsland('St. Kitts')}
          className={`px-6 py-2 rounded-xl text-sm font-bold ${
            selectedIsland === 'St. Kitts'
              ? 'bg-white shadow-sm text-869-blue'
              : 'text-gray-400'
          }`}
        >
          St. Kitts
        </button>
        <button
          onClick={() => setSelectedIsland('Nevis')}
          className={`px-6 py-2 rounded-xl text-sm font-bold ${
            selectedIsland === 'Nevis'
              ? 'bg-white shadow-sm text-869-blue'
              : 'text-gray-400'
          }`}
        >
          Nevis
        </button>
      </div>

      <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
        <CategoryCard
          icon={<Zap className="text-869-orange" />}
          label="Happening Now"
          active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        />
        <CategoryCard
          icon={<Music className="text-purple-500" />}
          label="Live Music"
          active={selectedCategory === 'music'}
          onClick={() => setSelectedCategory('music')}
        />
        <CategoryCard
          icon={<Utensils className="text-green-500" />}
          label="Food Specials"
          active={selectedCategory === 'food'}
          onClick={() => setSelectedCategory('food')}
        />
        <CategoryCard
          icon={<Calendar className="text-blue-500" />}
          label="This Weekend"
          active={selectedCategory === 'weekend'}
          onClick={() => setSelectedCategory('weekend')}
        />
      </div>

      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Flame size={20} className="text-869-orange fill-869-orange" />
            Trending
          </h2>
          <span className="text-869-blue text-xs font-bold uppercase tracking-widest">
            {selectedIsland}
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
            Loading listings...
          </div>
        ) : trending ? (
          <div className="relative h-72 w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-200 group">
            {trending.image_url ? (
              <img
                src={trending.image_url}
                alt={trending.title}
                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-8 flex flex-col justify-end">
              <div className="flex gap-2 mb-3">
                {trending.is_featured && (
                  <span className="bg-869-blue text-white text-[10px] font-black px-2 py-1 rounded">
                    FEATURED
                  </span>
                )}
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded uppercase">
                  {trending.category || 'Event'}
                </span>
              </div>

              <h3 className="text-white text-3xl font-black mb-1 leading-none">
                {trending.title}
              </h3>

              <p className="text-gray-200 text-sm font-medium mb-1">
                {trending.description || 'No description yet.'}
              </p>

              <p className="text-gray-300 text-sm font-medium flex items-center gap-1">
                <MapPin size={14} />
                {trending.venue_name || 'Venue TBA'} • {formatEventTime(trending.start_time)}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
            No listings found for {selectedIsland}.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black">What’s On</h2>

        {loading ? (
          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            Loading...
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            Nothing found for this filter yet.
          </div>
        ) : (
          filteredListings.map((item) => (
            <EventCard
              key={item.id}
              title={item.title}
              venue={item.venue_name}
              description={item.description}
              time={formatEventTime(item.start_time)}
              tag={item.category || 'Event'}
            />
          ))
        )}
      </section>
    </main>
  )
}

function CategoryCard({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center min-w-[118px] p-4 rounded-3xl border transition active:scale-95 ${
        active
          ? 'bg-white border-869-blue shadow-lg shadow-blue-100'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-[10px] font-black uppercase text-center leading-tight tracking-tighter">
        {label}
      </span>
    </button>
  )
}

function EventCard({ title, venue, description, time, tag }) {
  return (
    <div className="bg-white p-5 rounded-3xl flex items-center gap-4 border border-gray-100 hover:border-869-blue transition group">
      <div className="h-16 w-16 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
      </div>

      <div className="flex-1">
        <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-600">
          {tag}
        </span>
        <h4 className="font-black text-gray-900 text-lg leading-tight mt-1">
          {title}
        </h4>
        <p className="text-gray-500 text-xs font-medium">{venue || 'Venue TBA'}</p>
        {description && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-1 text-869-blue text-xs font-bold mt-1">
          <Calendar size={12} /> {time}
        </div>
      </div>

      <ChevronRight size={20} className="text-gray-300 group-hover:text-869-blue transition" />
    </div>
  )
}

function formatEventTime(dateString) {
  if (!dateString) return 'Time TBA'

  const date = new Date(dateString)

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
