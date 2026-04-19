'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'

interface CardProps {
  suit: string // 'H' | 'D' | 'C' | 'S'
  value: string // '2'-'9', 'T', 'J', 'Q', 'K', 'A'
  isFlipped?: boolean
  className?: string
}

const suitSymbols: Record<string, string> = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠',
}

const suitColors: Record<string, string> = {
  H: 'text-red-500',
  D: 'text-blue-500',
  C: 'text-emerald-500',
  S: 'text-white',
}

const PokerCard = memo(({ suit, value, isFlipped = false, className = "" }: CardProps) => {
  const isRed = suit === 'H' || suit === 'D'
  
  return (
    <motion.div
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      className={`relative w-16 h-24 md:w-20 md:h-28 preserve-3d cursor-pointer ${className}`}
      style={{ perspective: '1000px' }}
    >
      {/* Front Side */}
      <div 
        className={`absolute inset-0 backface-hidden bg-white rounded-lg p-2 flex flex-col justify-between border border-black/10 shadow-lg`}
      >
        <div className={`text-lg font-bold leading-none ${suitColors[suit]}`}>
          {value === 'T' ? '10' : value}
          <div className="text-xl -mt-1">{suitSymbols[suit]}</div>
        </div>
        
        <div className={`text-3xl self-center ${suitColors[suit]}`}>
          {suitSymbols[suit]}
        </div>

        <div className={`text-lg font-bold leading-none rotate-180 ${suitColors[suit]}`}>
          {value === 'T' ? '10' : value}
          <div className="text-xl -mt-1">{suitSymbols[suit]}</div>
        </div>
      </div>

      {/* Back Side */}
      <div 
        className="absolute inset-0 backface-hidden bg-[#1a1a1a] rounded-lg border-2 border-white/20 shadow-xl flex items-center justify-center overflow-hidden"
        style={{ transform: 'rotateY(180deg)' }}
      >
        <div className="w-full h-full opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent flex items-center justify-center">
            <div className="grid grid-cols-4 gap-1 opacity-20">
                {Array.from({length: 16}).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-white rounded-full" />
                ))}
            </div>
        </div>
        <div className="absolute font-black italic text-primary scale-150 rotate-[-45deg] opacity-20 whitespace-nowrap">
            POKER
        </div>
      </div>
    </motion.div>
  )
})

PokerCard.displayName = 'PokerCard'

export default PokerCard
