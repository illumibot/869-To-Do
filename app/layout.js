import './globals.css'
import { Home, Search, PlusSquare, Map, Heart } from 'lucide-react'

export const metadata = {
  title: '869 To Do | What\'s Happening in SKN',
  description: 'The pulse of St. Kitts and Nevis events and specials.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="pb-24">
        {/* Top Header */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-869-blue leading-none">869 TO DO</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">St. Kitts & Nevis</span>
          </div>
          <div className="bg-gray-100 p-2 rounded-full">
            <Search size={20} className="text-gray-500" />
          </div>
        </header>

        {children}

        {/* Mobile-First Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center py-4 px-2 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <NavItem icon={<Home size={24}/>} label="Home" active />
          <NavItem icon={<Search size={24}/>} label="Search" />
          <div className="relative -mt-10">
            <div className="bg-869-orange p-4 rounded-2xl shadow-lg shadow-orange-200 text-white">
              <PlusSquare size={28} />
            </div>
          </div>
          <NavItem icon={<Map size={24}/>} label="Map" />
          <NavItem icon={<Heart size={24}/>} label="Saved" />
        </nav>
      </body>
    </html>
  )
}

function NavItem({ icon, label, active = false }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${active ? 'text-869-blue' : 'text-gray-300'}`}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </div>
  )
}
