import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import GlassCard from '../components/GlassCard'
import ErrorBoundary from '../components/ErrorBoundary'
import { usePipeline } from '../api/hooks/usePipeline'
import { apiFetch } from '../api/client'

export function PipelinePage() {
  const { data, isLoading, error } = usePipeline()
  const [expandedStage, setExpandedStage] = useState<number | null>(null)

  const stages = data?.phases ?? []
  const totalPhases = data?.total_phases ?? 7
  const overallProgress = data?.overall_progress ?? '0%'
  const completedPhaseCount = stages.filter((stage) => stage.status === 'completed').length

  const [artifactContents, setArtifactContents] = useState<Record<string, any>>({})
  const [artifactOpen, setArtifactOpen] = useState<Record<string, boolean>>({})
  const [loadingArtifacts, setLoadingArtifacts] = useState<Record<string, boolean>>({})
  const [overrideComplete, setOverrideComplete] = useState(false)

  const displayedOverallProgress = overrideComplete ? '100%' : overallProgress
  const displayedPipelineStatus = overrideComplete ? 'completed' : data?.pipeline_status ?? 'unknown'

  const fetchArtifact = async (name: string) => {
    if (!name || artifactContents[name]) return
    setLoadingArtifacts((s) => ({ ...s, [name]: true }))
    try {
      const res = await apiFetch<any>('/api/pipeline/artifact', { name })
      setArtifactContents((s) => ({ ...s, [name]: res.content }))
    } catch (e: any) {
      setArtifactContents((s) => ({ ...s, [name]: { error: e?.message ?? String(e) } }))
    } finally {
      setLoadingArtifacts((s) => ({ ...s, [name]: false }))
    }
  }

  const fetchStageArtifacts = async (stageIndex: number) => {
    const stage = stages[stageIndex]
    if (!stage?.artifacts?.length) return
    await Promise.all(stage.artifacts.map((a: string) => fetchArtifact(a)))
  }

  const fetchAllArtifactsAndMarkComplete = async () => {
    const all = stages.flatMap((s) => s.artifacts ?? [])
    await Promise.all(all.map((a) => fetchArtifact(a)))
    setOverrideComplete(true)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-80">
        <Topbar />
        <ErrorBoundary>
          <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 lg:p-8 max-w-4xl"
          >
          <motion.div variants={itemVariants} className="mb-12">
            <h1 className="text-3xl font-space-grotesk font-bold mb-2">Processing Pipeline</h1>
            <p className="text-muted">7-stage intelligence pipeline for candidate analysis</p>
          </motion.div>

          {error && (
            <div className="mb-6 rounded-xl border border-crimson/20 bg-crimson/10 px-4 py-3 text-sm text-crimson">
              Unable to load pipeline status. Please refresh or try again.
            </div>
          )}

          <motion.div variants={itemVariants} className="space-y-4">
            {isLoading && (
              <div className="text-sm text-muted">Loading pipeline phases...</div>
            )}
            {stages.map((stage, index) => (
              <motion.div key={stage.phase} variants={itemVariants} className="relative">
                {index < stages.length - 1 && (
                  <div className="absolute left-5 top-16 w-1 h-12 bg-gradient-to-b from-primary/50 to-primary/10" />
                )}

                <GlassCard
                  className="cursor-pointer transition-all"
                  onClick={() => setExpandedStage(expandedStage === index ? null : index)}
                  hover={true}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-space-grotesk font-bold text-primary mt-0">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-space-grotesk font-semibold">{stage.name}</h3>
                          <p className="text-muted text-sm mt-1">{stage.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              stage.status === 'completed'
                                ? 'bg-emerald/10 text-emerald'
                                : stage.status === 'running'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted/10 text-muted'
                            }`}
                          >
                            {stage.status ?? 'Unknown'}
                          </span>
                          <motion.div
                            animate={{ rotate: expandedStage === index ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                          >
                            <ChevronDown size={20} />
                          </motion.div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedStage === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="mt-4 pt-4 border-t border-border/50"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="mb-3">
                                <h4 className="text-sm font-semibold text-primary mb-2">Progress</h4>
                                <div className="w-full bg-surface-elevated/40 rounded-full h-3 overflow-hidden">
                                  <div
                                    style={{ width: stage.status === 'completed' ? '100%' : stage.status === 'running' ? '60%' : '0%' }}
                                    className={`h-full ${stage.status === 'completed' ? 'bg-emerald' : stage.status === 'running' ? 'bg-primary' : 'bg-muted/40'}`}
                                  />
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-primary mb-2">Status</h4>
                                <p className="text-sm text-foreground">{stage.status || 'Unknown'}</p>
                              </div>
                              <div>
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-accent-cyan mb-2">Artifacts</h4>
                                  <div className="text-xs">
                                    <button
                                      onClick={() => fetchStageArtifacts(index)}
                                      className="px-2 py-1 rounded bg-primary/10 text-primary text-sm"
                                    >
                                      Load artifacts
                                    </button>
                                  </div>
                                </div>

                                <ul className="space-y-2 text-sm text-foreground">
                                  {stage.artifacts?.map((artifact) => (
                                    <li key={artifact} className="font-mono bg-surface-elevated/10 p-3 rounded">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                          {stage.status === 'completed' ? (
                                            <CheckCircle size={16} className="text-emerald mt-1" />
                                          ) : (
                                            <span className="w-2 h-2 rounded-full bg-muted/40 inline-block mt-2" />
                                          )}
                                          <div>
                                            <div className="text-sm font-medium">{artifact}</div>
                                            <div className="text-xs text-muted">{loadingArtifacts[artifact] ? 'Loading…' : artifactContents[artifact] ? 'Loaded' : 'Not loaded'}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => {
                                              setArtifactOpen((s) => ({ ...s, [artifact]: !s[artifact] }))
                                              if (!artifactContents[artifact]) fetchArtifact(artifact)
                                            }}
                                            className="px-2 py-1 rounded bg-surface-elevated/20 text-xs"
                                          >
                                            {artifactOpen[artifact] ? 'Hide' : 'View'}
                                          </button>
                                        </div>
                                      </div>

                                      {artifactOpen[artifact] && (
                                        <div className="mt-3 bg-surface-elevated/5 p-3 rounded text-xs overflow-auto max-h-96">
                                          {loadingArtifacts[artifact] ? (
                                            <div className="text-sm text-muted">Loading artifact content…</div>
                                          ) : artifactContents[artifact] ? (
                                            <pre className="whitespace-pre-wrap text-xs">{typeof artifactContents[artifact] === 'string' ? artifactContents[artifact] : JSON.stringify(artifactContents[artifact], null, 2)}</pre>
                                          ) : (
                                            <div className="text-sm text-muted">No content available</div>
                                          )}
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="mt-12 p-6 glass rounded-xl">
            <h3 className="font-space-grotesk font-semibold mb-3">Pipeline Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted mb-1">Total Stages</p>
                <p className="font-bold text-lg">{totalPhases}</p>
              </div>
              <div>
                <p className="text-muted mb-1">Completed</p>
                <p className="font-bold text-lg">{completedPhaseCount}/{stages.length}</p>
              </div>
              <div>
                <p className="text-muted mb-1">Overall Progress</p>
                <p className="font-bold text-lg">{displayedOverallProgress}</p>
              </div>
              <div>
                <p className="text-muted mb-1">Pipeline Status</p>
                <p className="font-bold text-lg">{displayedPipelineStatus}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => fetchAllArtifactsAndMarkComplete()}
                className="px-3 py-2 rounded bg-primary/10 text-primary text-sm"
              >
                Load all artifacts & mark complete
              </button>
            </div>
          </motion.div>
          </motion.main>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default PipelinePage
