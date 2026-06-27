import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

interface RecommendationCardProps {
  title: string
  description: string
  type?: 'positive' | 'warning' | 'neutral'
  metrics?: Array<{ label: string; value: string | number }>
}

export function RecommendationCard({
  title,
  description,
  type = 'neutral',
  metrics,
}: RecommendationCardProps) {
  const icons = {
    positive: <CheckCircle className="w-5 h-5 text-emerald" />,
    warning: <AlertCircle className="w-5 h-5 text-amber" />,
    neutral: <TrendingUp className="w-5 h-5 text-primary" />,
  }

  const borderColors = {
    positive: 'border-emerald/20',
    warning: 'border-amber/20',
    neutral: 'border-primary/20',
  }

  const bgColors = {
    positive: 'bg-emerald/5',
    warning: 'bg-amber/5',
    neutral: 'bg-primary/5',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bgColors[type]} border ${borderColors[type]} p-4 rounded-lg`}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm text-muted mb-3">{description}</p>
          {metrics && (
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((metric) => (
                <div key={metric.label} className="text-xs">
                  <span className="text-muted">{metric.label}</span>
                  <p className="font-mono font-semibold">{metric.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default RecommendationCard
