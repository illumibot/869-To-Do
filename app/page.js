'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [listings, setListings] = useState([])

  useEffect(() => {
    fetchListings()
  }, [])

  async function fetchListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching:', error)
    } else {
      console.log('DATA:', data)
      setListings(data)
    }
  }

  return (
    <main style={{ padding: '20px' }}>
      <h1>869 To Do</h1>

      {listings.length === 0 && (
        <p>No listings found (check console)</p>
      )}

      {listings.map((item) => (
        <div
          key={item.id}
          style={{
            border: '1px solid #ddd',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '8px',
          }}
        >
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <small>{item.category}</small>
        </div>
      ))}
    </main>
  )
}
