'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the console with no SSR to avoid searchParams hydration issues
const PokerConsole = dynamic(() => import('@/components/poker/PokerConsole'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-primary font-black italic animate-pulse tracking-tighter text-xl">
            PREPARING TABLE...
        </div>
    </div>
  )
})

export default function PokerPage() {
  return (
    <Suspense>
        <PokerConsole />
    </Suspense>
  )
}
