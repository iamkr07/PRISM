import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import GlassCard from './GlassCard'

export interface PipelineStage {
  number: number
  title: string
  description: string
  status: 'pending' | 'running' | 'completed'
}

interface PipelineComponentProps {
  stages?: PipelineStage[]
}

const defaultStages: PipelineStage[] = [
  {
    number: 1,
    title: 'Profile Ingestion',
    description: 'Extract and normalize candidate data',
    status: 'completed',
  },
  {
    number: 2,
    title: 'Data Validation',
    description: 'Verify data integrity and completeness',
    status: 'completed',
  },
  {
    number: 3,
    title: 'Feature Engineering',
    description: 'Calculate 50+ candidate features',
    status: 'completed',
  },
  {
    number: 4,
    title: 'Skill Mapping',
    description: 'Match skills to market demand',
    status: 'running',
  },
  {
    number: 5,
    title: 'Risk Assessment',
    description: 'Evaluate retention and performance risks',
    status: 'pending',
  },
  {
    number: 6,
    title: 'Ranking',
    description: 'Score and rank all candidates',
    status: 'pending',
  },
  {
    number: 7,
    title: 'Report Generation',
    description: 'Create intelligence summaries',
    status: 'pending',
  },
]

export function PipelineComponent({ stages = defaultStages }: PipelineComponentProps) {
  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <motion.div
          key={stage.number}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <GlassCard
            className={`${
              stage.status === 'running'
                ? 'ring-2 ring-primary shadow-glow'
                : stage.status === 'completed'
                  ? 'border-emerald/30'
                  : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={
                    stage.status === 'running'
                      ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }
                      : {}
                  }
                  transition={
                    stage.status === 'running'
                      ? { duration: 1.4, repeat: Infinity }
                      : {}
                  }
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-space-grotesk font-bold text-sm ${
                    stage.status === 'completed'
                      ? 'bg-emerald/20 text-emerald'
                      : stage.status === 'running'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-surface-elevated text-muted'
                  }`}
                >
                  {stage.status === 'completed' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <span>{stage.number}</span>
                  )}
                </motion.div>
                {index < stages.length - 1 && (
                  <div
                    className={`w-1 h-12 mt-2 ${
                      stage.status === 'completed' ? 'bg-emerald/30' : 'bg-surface-elevated'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-space-grotesk font-semibold text-lg">{stage.title}</h3>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      stage.status === 'completed'
                        ? 'bg-emerald/10 text-emerald'
                        : stage.status === 'running'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/10 text-muted'
                    }`}
                  >
                    {stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-muted">{stage.description}</p>
                {stage.status === 'running' && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="h-1 bg-gradient-to-r from-primary to-accent-cyan rounded-full mt-2 origin-left"
                  />
                )}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}

export default PipelineComponent
