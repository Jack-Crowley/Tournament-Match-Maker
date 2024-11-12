'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { NumberList } from '@/components/NumberList'
import { Controls } from '@/components/Controls'
import { Database } from '@/lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [numbers, setNumbers] = useState<Array<{ id: number; value: number; created_at: string }>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNumbers()
    const subscription = supabase
      .channel('public:numbers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'numbers' }, 
        payload => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setNumbers((current) => [...current, payload.new as any])
          console.log("setNumbers ran")
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchNumbers = async () => {
    const { data, error } = await supabase
      .from('numbers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Failed to fetch numbers')
      return
    }

    setNumbers(data)
  }

  const addRandomNumber = async () => {
    const randomNumber = Math.floor(Math.random() * 100)
    const { error } = await supabase
      .from('numbers')
      .insert([{ value: randomNumber }])

    if (error) {
      setError('Failed to add number')
    }
    else {
      console.log("added random number", randomNumber);
    }
  }

  const clearNumbers = async () => {
    const { error } = await supabase
      .from('numbers')
      .delete()
      .neq('id', 0)

    if (error) {
      setError('Failed to clear numbers')
      return
    }
    
    setNumbers([])
  }

  return (
    <main className="container">
      <h1 className="title">Simple Plumbing Project</h1>
      <Controls onAdd={addRandomNumber} onClear={clearNumbers} />
      {error && <div className="error">{error}</div>}
      <NumberList numbers={numbers} />
    </main>
  )
}