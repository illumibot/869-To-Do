import { Zap, Music, Utensils, Calendar, MapPin, Flame, ChevronRight } from 'lucide-react'

export default function Page() {
  return (
    <main className="p-6 space-y-8 animate-in fade-in duration-500">
      <section>
        <h1 className="text-3xl font-black text-869-dark leading-tight">
          What’s going on <br/><span className="text-869-blue underline decoration-869-orange/30 text-4xl italic">right now?</span>
        </h1>
      </section>

      <div className="flex bg-gray-200/50 p-1 rounded-2xl w-fit">
        <button className="px-6 py-2 bg-white rounded-xl shadow-sm text-sm font-bold text-869-blue">St. Kitts</button>
        <button className="px-6 py-2 rounded-xl text-sm font-bold text-gray-400">Nevis</button>
      </div>

      <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
        <CategoryCard icon={<Zap className="text-869-orange"/>} label="Happening Now" active />
        <CategoryCard icon={<Music className="text-purple-500"/>} label="Live Music" />
        <CategoryCard icon={<Utensils className="text-green-500"/>} label="Food Specials" />
        <CategoryCard icon={<Calendar className="text-blue-500"/>} label="This Weekend" />
      </div>

      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Flame size={20} className="text-869-orange fill-869-orange"/> Trending
          </h2>
          <span className="text-869-blue text-xs font-bold uppercase tracking-widest">See all</span>
        </div>

        <div className="relative h-72 w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-200 group">
          <img
            src="https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=800&q=80"
            className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
            alt="Event"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-8 flex flex-col justify-end">
            <div className="flex gap-2 mb-3">
              <span className="bg-869-blue text-white text-[10px] font-black px-2 py-1 rounded">FEATURED</span>
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded">MUSIC</span>
            </div>
            <h3 className="text-white text-3xl font-black mb-1 leading-none">Salt Plage Sunsets</h3>
            <p className="text-gray-300 text-sm font-medium flex items-center gap-1">
              <MapPin size={14}/> Christophe Harbour • 5:00 PM
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black">Happening Tonight</h2>

        <EventCard
          title="Lobster & Champagne"
          venue="Spice Mill Restaurant"
          time="7:00 PM - 10:00 PM"
          tag="Dining"
          color="bg-green-100 text-green-600"
        />

        <EventCard
          title="Late Night Vibes"
          venue="The Strip (Shiggidy Shack)"
          time="Starts at 10:00 PM"
          tag="Party"
          color="bg-purple-100 text-purple-600"
        />

        <EventCard
          title="Nevis Ferry Excursion"
          venue="Basseterre Ferry Terminal"
          time="Tomorrow 9:00 AM"
          tag="Tours"
          color="bg-blue-100 text-blue-600"
        />
      </section>
    </main>
  )
}

function CategoryCard({ icon, label, active = false }) {
  return (
    <div className={`flex flex-col items-center justify-center min-w-[100px] p-4 rounded-3xl border ${active ? 'bg-white border-869-blue shadow-lg shadow-blue-100' : 'bg-white border-gray-100'} transition active:scale-95`}>
      <div className="mb-2">{icon}</div>
      <span className="text-[10px] font-black uppercase text-center leading-tight tracking-tighter">{label}</span>
    </div>
  )
}

function EventCard({ title, venue, time, tag, color }) {
  return (
    <div className="bg-white p-5 rounded-3xl flex items-center gap-4 border border-gray-100 hover:border-869-blue transition group">
      <div className="h-16 w-16 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
      </div>
      <div className="flex-1">
        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${color}`}>{tag}</span>
        <h4 className="font-black text-gray-900 text-lg leading-tight mt-1">{title}</h4>
        <p className="text-gray-500 text-xs font-medium">{venue}</p>
        <div className="flex items-center gap-1 text-869-blue text-xs font-bold mt-1">
          <Calendar size={12}/> {time}
        </div>
      </div>
      <ChevronRight size={20} className="text-gray-300 group-hover:text-869-blue transition" />
    </div>
  )
}
