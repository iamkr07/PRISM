import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import HeroBackground from '../components/HeroBackground'
import PipelineComponent, { PipelineStage } from '../components/Pipeline'
import Button from '../components/Button'

function getPipelineStages(progress: number): PipelineStage[] {
  const thresholds = [20, 40, 60, 80, 90, 99]

  const getStatus = (index: number) => {
    if (progress >= 100) return 'completed'
    if (index === 0) return progress <= 0 ? 'pending' : progress < thresholds[0] ? 'running' : 'completed'
    if (progress < thresholds[index - 1]) return 'pending'
    if (progress < thresholds[index]) return 'running'
    return 'completed'
  }

  return [
    {
      number: 1,
      title: 'Profile Ingestion',
      description: 'Extract and normalize candidate data',
      status: getStatus(0),
    },
    {
      number: 2,
      title: 'Data Validation',
      description: 'Verify data integrity and completeness',
      status: getStatus(1),
    },
    {
      number: 3,
      title: 'Feature Engineering',
      description: 'Calculate 50+ candidate features',
      status: getStatus(2),
    },
    {
      number: 4,
      title: 'Skill Mapping',
      description: 'Match skills to market demand',
      status: getStatus(3),
    },
    {
      number: 5,
      title: 'Risk Assessment',
      description: 'Evaluate retention and performance risks',
      status: getStatus(4),
    },
    {
      number: 6,
      title: 'Ranking',
      description: 'Score and rank all candidates',
      status: getStatus(5),
    },
    {
      number: 7,
      title: 'Report Generation',
      description: 'Create intelligence summaries',
      status: progress >= 100 ? 'completed' : 'pending',
    },
  ]
}

export function AnalyzePage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const displayProgress = Math.min(100, Math.round(progress))
  const stages = getPipelineStages(progress)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + 10 + Math.random() * 10)
        if (next >= 100) {
          setIsRunning(false)
          return 100
        }
        return next
      })
    }, 1400)

    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [progress, navigate])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <HeroBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex items-center justify-center min-h-screen px-4"
      >
        <div className="max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-space-grotesk font-bold gradient-text mb-4">
              Analyzing Candidates
            </h1>
            <p className="text-muted text-lg">Processing through our 7-stage intelligence pipeline</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-elevated p-8 rounded-2xl mb-8"
          >
            <PipelineComponent stages={stages} />
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-mono text-muted">Overall Progress</span>
              <span className="text-sm font-mono font-semibold">{displayProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${displayProgress}%` }}
                className="h-full bg-gradient-to-r from-primary to-accent-cyan shadow-glow"
              />
            </div>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-muted text-sm mb-4">
              {progress < 100
                ? 'Processing profiles through intelligence pipeline...'
                : 'Analysis complete. Navigating to dashboard...'}
            </p>
            {progress >= 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block"
              >
                <Button onClick={() => navigate('/dashboard')} variant="primary" size="lg">
                  View Results
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyzePage
