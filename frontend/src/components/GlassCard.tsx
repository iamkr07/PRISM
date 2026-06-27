import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  onClick?: () => void
  hover?: boolean
}

export function GlassCard({
  children,
  className = '',
  elevated = false,
  onClick,
  hover = true,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' } : {}}
      className={`${
        elevated ? 'glass-elevated' : 'glass'
      } p-6 transition-all cursor-${onClick ? 'pointer' : 'default'} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export default GlassCard
