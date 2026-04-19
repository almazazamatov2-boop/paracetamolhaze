'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'
import { Trophy } from 'lucide-react'

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
  // Graceful handling of missing/invalid data
  if (!suit || !value || suit === 'X') {
    isFlipped = true;
  }

  return (
    <motion.div
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      className={`relative w-16 h-24 md:w-20 md:h-28 cursor-pointer ${className}`}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      {/* Front Side */}
      <div 
        className={`absolute inset-0 bg-white rounded-lg p-1.5 md:p-2 flex flex-col justify-between border border-black/10 shadow-lg overflow-hidden`}
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <div className={`text-xs md:text-sm font-bold leading-none ${suitColors[suit] || 'text-black'}`}>
          {value === 'T' ? '10' : (value === 'X' ? '' : value)}
          <div className="text-sm md:text-base -mt-0.5">{suitSymbols[suit] || ''}</div>
        </div>
        
        <div className={`text-xl md:text-2xl self-center pointer-events-none ${suitColors[suit] || 'text-black'}`}>
          {suitSymbols[suit] || ''}
        </div>

        <div className={`text-xs md:text-sm font-bold leading-none rotate-180 ${suitColors[suit] || 'text-black'}`}>
          {value === 'T' ? '10' : (value === 'X' ? '' : value)}
          <div className="text-sm md:text-base -mt-0.5">{suitSymbols[suit] || ''}</div>
        </div>
      </div>

      {/* Back Side (The shirt) */}
      <div 
        className="absolute inset-0 bg-[#0f172a] rounded-lg border-2 border-white/20 shadow-xl overflow-hidden"
        style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: '8px 8px'
        }}
      >
        <div className="w-full h-full flex items-center justify-center p-2">
            <div className="w-full h-full rounded border border-white/10 flex flex-col items-center justify-center relative bg-gradient-to-br from-primary/20 to-transparent">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 10px)'
                }} />
                <Trophy className="w-8 h-8 text-primary opacity-40" />
                <span className="text-[8px] font-black italic text-primary opacity-30 mt-1 uppercase tracking-widest">POKER</span>
            </div>
        </div>
      </div>
    </motion.div>
  )
})

PokerCard.displayName = 'PokerCard'

export default PokerCard
