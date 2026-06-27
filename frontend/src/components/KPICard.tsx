import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import GlassCard from './GlassCard'

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: number
  unit?: string
}

export function KPICard({ icon, label, value, trend, unit }: KPICardProps) {
  const isPositive = trend && trend >= 0

  return (
    <GlassCard>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary/10">
          {icon}
        </div>
        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1 text-sm font-mono ${
              isPositive ? 'text-emerald' : 'text-crimson'
            }`}
          >
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(trend)}%
          </motion.div>
        )}
      </div>
      <p className="text-muted text-sm mb-2">{label}</p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-3xl font-space-grotesk font-bold mb-1"
      >
        {value}
        {unit && <span className="text-lg ml-2 text-muted">{unit}</span>}
      </motion.div>
    </GlassCard>
  )
}

export default KPICard
