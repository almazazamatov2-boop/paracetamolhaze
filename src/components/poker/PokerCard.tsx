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

  // Mapping engine values to file names
  const fileName = `${value === 'T' ? '10' : value}${suit}.svg`;
  const cardSrc = `/poker/cards/${fileName}`;
  const shirtSrc = `/poker/shirts/red-back.png`;

  return (
    <motion.div
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      className={`relative w-16 h-24 md:w-20 md:h-28 cursor-pointer ${className}`}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      {/* Front Side (Face) */}
      <div 
        className="absolute inset-0 rounded-lg border-2 border-black/10 shadow-lg overflow-hidden flex items-center justify-center"
        style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            backgroundColor: 'hsl(49, 63%, 92%)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        {/* SVG Card Face */}
        <img 
            src={cardSrc} 
            alt={`${value}${suit}`} 
            className="w-full h-full object-contain scale-[3.5] translate-y-[2%] translate-x-[1%]"
            onError={(e) => {
                console.error('Card Image Load Error:', cardSrc);
                e.currentTarget.style.display = 'none';
            }}
        />
        {/* Subtle texture/gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)'}} />
      </div>

      {/* Back Side (The shirt / Rubashka) */}
      <div 
        className="absolute inset-0 rounded-lg border-2 border-white/20 shadow-xl overflow-hidden"
        style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: 'hsl(202, 49%, 28%)',
        }}
      >
        <img 
            src={shirtSrc} 
            alt="Shirt" 
            className="w-full h-full object-cover opacity-60"
        />
        {/* Vintage Pattern Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '10px 10px'}} />
      </div>
    </motion.div>
  )
})

PokerCard.displayName = 'PokerCard'

export default PokerCard
