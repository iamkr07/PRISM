import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Briefcase, Award } from 'lucide-react'
import { useMemo, useState } from 'react'
import GlassCard from './GlassCard'
import RadarChartComponent from './RadarChart'
import { useCandidate } from '../api/hooks/useCandidate'
import { useAnalytics } from '../api/hooks/useAnalytics'
import { useCandidates } from '../api/hooks/useCandidates'

interface CandidateDrawerProps {
  isOpen: boolean
  onClose: () => void
  candidateId: string
}

function normalizeDna(dna: Record<string, unknown> | Array<{ name: string; value: number }> | undefined): Array<{ name: string; value: number }> {
  if (Array.isArray(dna)) {
    return dna.map((item) => ({
      name: item.name,
      value: typeof item.value === 'number' ? item.value : Number(item.value) || 0,
    }))
  }

  if (dna && typeof dna === 'object') {
    return Object.entries(dna).flatMap(([name, value]) => {
      if (typeof value === 'number') {
        return { name, value }
      }
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).flatMap(([childName, childValue]) =>
          typeof childValue === 'number'
            ? [{ name: `${name}.${childName}`, value: childValue }]
            : [],
        )
      }
      return []
    })
  }

  return []
}

type CandidateDna = Record<string, unknown> | Array<{ name: string; value: number }>

function extractDnaVector(dna: CandidateDna | undefined): Record<string, number> {
  const normalized = normalizeDna(dna)
  return normalized.reduce<Record<string, number>>((acc, item) => {
    acc[item.name] = item.value
    return acc
  }, {})
}

function calculateSimilarity(candidateA: {
  years_of_experience?: number
  recruitability?: number
  risk?: number
  dna_profile?: CandidateDna
}, candidateB: {
  years_of_experience?: number
  recruitability?: number
  risk?: number
  dna_profile?: CandidateDna
}): number {
  const experienceA = candidateA.years_of_experience ?? 0
  const experienceB = candidateB.years_of_experience ?? 0
  const recruitabilityA = candidateA.recruitability ?? 0
  const recruitabilityB = candidateB.recruitability ?? 0
  const riskA = candidateA.risk ?? 100
  const riskB = candidateB.risk ?? 100

  const dnaA = extractDnaVector(candidateA.dna_profile)
  const dnaB = extractDnaVector(candidateB.dna_profile)

  const dnaKeys = Array.from(new Set([...Object.keys(dnaA), ...Object.keys(dnaB)])).filter(
    (key) => key !== 'dna_type' && key !== 'dna_summary',
  )

  const dnaDistance = dnaKeys.length
    ? dnaKeys.reduce((sum, key) => {
        const a = dnaA[key] ?? 0
        const b = dnaB[key] ?? 0
        return sum + Math.abs(a - b)
      }, 0) / dnaKeys.length
    : 1

  const experienceDistance = Math.min(1, Math.abs(experienceA - experienceB) / 20)
  const recruitabilityDistance = Math.abs(recruitabilityA - recruitabilityB) / 100
  const riskDistance = Math.abs(riskA - riskB) / 100

  const overallDistance =
    0.25 * experienceDistance + 0.25 * recruitabilityDistance + 0.25 * riskDistance + 0.25 * dnaDistance

  return Math.max(0, Math.round((1 - overallDistance) * 100))
}

const containerVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
}

export function CandidateDrawer({ isOpen, onClose, candidateId }: CandidateDrawerProps) {
  const [activeTab, setActiveTab] = useState<'dna' | 'decision' | 'skills'>('dna')
  const { data, isLoading, error } = useCandidate(candidateId)
  const { data: analyticsOverview } = useAnalytics()
  const { data: candidateListData, isLoading: candidateListLoading } = useCandidates({ page: 1, limit: 100, sort: 'score' })

  const profile = data?.profile
  const metrics = data?.metrics
  const decision = data?.decision_card

  const candidateName = profile?.profile?.anonymized_name ?? 'Candidate'
  const candidateRank = metrics?.rank ?? 0
  const experience = profile?.profile?.years_of_experience
    ? `${profile.profile.years_of_experience} years`
    : 'N/A'
  const role = profile?.profile?.current_title ?? metrics?.role ?? 'Unknown'
  const location = profile?.profile?.location ?? 'Unknown'
  const industry = profile?.profile?.current_industry ?? 'Unknown'
  const recruitability = typeof profile?.recruitability === 'number' ? profile.recruitability : undefined
  const risk = typeof profile?.risk === 'number' ? profile.risk : undefined
  const confidence = typeof metrics?.score === 'number' ? Math.max(0, Math.min(100, Math.round(metrics.score))) : undefined
  const dnaAxes = normalizeDna(profile?.dna)
  const hasDnaData = dnaAxes.length > 0
  const strengths = decision?.strength_factors ?? []
  const weaknesses = decision?.risk_factors ?? []
  const concerns = decision?.signals ?? []
  const recommendation = decision?.recommendation ?? 'Recommendation not available'

  const candidatePool = candidateListData?.items ?? []

  const twinSuggestions = useMemo(() => {
    if (!profile) return []

    const current = {
      years_of_experience: profile.profile.years_of_experience,
      recruitability: profile.recruitability,
      risk: profile.risk,
      dna_profile: profile.dna,
    }

    return candidatePool
      .filter((candidate) => candidate.candidate_id !== candidateId)
      .map((candidate) => ({
        candidate,
        similarity: calculateSimilarity(current, {
          years_of_experience: candidate.years_of_experience,
          recruitability: candidate.recruitability_score,
          risk: candidate.risk_score,
          dna_profile: candidate.dna_profile,
        }),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
  }, [candidatePool, candidateId, profile])

  const formatPercent = (value?: number) =>
    value === undefined || value === null ? 'Data unavailable' : `${Math.round(value)}%`

  const scoreText = metrics?.score !== undefined && metrics?.score !== null ? metrics.score.toFixed(1) : 'Data unavailable'
  const recruitabilityText = formatPercent(recruitability)
  const riskText = formatPercent(risk)
  const confidenceText = confidence !== undefined ? `${confidence}%` : 'Data unavailable'
  const benchmarkText = analyticsOverview?.recruitability_distribution ? 'Available' : 'Data unavailable'
  const velocityText = analyticsOverview?.dataset_size ? `${Math.round(analyticsOverview.dataset_size / 1000)}k` : 'Data unavailable'

  const percentileBadge = (value?: number) => {
    if (value === undefined || value === null) return 'Data unavailable'
    if (value >= 95) return 'Top 5%'
    if (value >= 90) return 'Top 10%'
    if (value >= 75) return 'Top 25%'
    return 'Top 50%'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[640px] glass-elevated border-l border-border overflow-y-auto z-50"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border bg-surface-elevated/30 backdrop-blur-xl">
              <h2 className="text-xl font-space-grotesk font-bold">{candidateName}</h2>
              <button onClick={onClose} className="p-1 hover:bg-primary/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isLoading ? (
                <div className="space-y-4 text-muted">
                  <div className="h-6 w-40 bg-surface-elevated rounded-lg animate-pulse" />
                  <div className="h-5 w-24 bg-surface-elevated rounded-lg animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-surface-elevated rounded-lg animate-pulse" />
                    <div className="h-24 bg-surface-elevated rounded-lg animate-pulse" />
                    <div className="h-24 bg-surface-elevated rounded-lg animate-pulse" />
                    <div className="h-24 bg-surface-elevated rounded-lg animate-pulse" />
                  </div>
                </div>
              ) : error || !data ? (
                <div className="text-center text-muted">
                  <p className="mb-4">Candidate information is unavailable.</p>
                  {error && <p className="text-crimson">{error.message}</p>}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted text-sm">Rank</span>
                      <span className="font-space-grotesk font-bold text-lg">#{candidateRank}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono bg-primary/10 px-2 py-1 rounded">{candidateId}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-elevated p-4 rounded-lg">
                      <p className="text-xs text-muted mb-2">Recruitability</p>
                      <p className="text-2xl font-bold gradient-text">{recruitabilityText}</p>
                      <p className="text-xs text-muted">{typeof recruitability === 'number' ? percentileBadge(recruitability) : 'Data unavailable'}</p>
                    </div>
                    <div className="glass-elevated p-4 rounded-lg">
                      <p className="text-xs text-muted mb-2">Risk</p>
                      <p className="text-2xl font-bold text-crimson">{riskText}</p>
                    </div>
                    <div className="glass-elevated p-4 rounded-lg">
                      <p className="text-xs text-muted mb-2">Overall Score</p>
                      <p className="text-2xl font-bold text-primary">{scoreText}</p>
                    </div>
                    <div className="glass-elevated p-4 rounded-lg">
                      <p className="text-xs text-muted mb-2">Confidence</p>
                      <p className="text-2xl font-bold text-accent-cyan">{confidenceText}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <GlassCard className="p-4 rounded-lg bg-surface-elevated/80 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-muted">Recruitability Index</p>
                          <p className="text-xl font-bold">{recruitabilityText}</p>
                        </div>
                        <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center text-primary font-bold">
                          {typeof recruitability === 'number' ? `${recruitability}` : 'N/A'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted text-xs">Industry Benchmark</p>
                          <p>{benchmarkText}</p>
                        </div>
                        <div>
                          <p className="text-muted text-xs">Hiring Velocity</p>
                          <p>{velocityText}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Briefcase size={18} className="text-muted" />
                      <div>
                        <p className="text-muted text-xs">Role</p>
                        <p className="font-medium">{role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award size={18} className="text-muted" />
                      <div>
                        <p className="text-muted text-xs">Experience</p>
                        <p className="font-medium">{experience}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-muted" />
                      <div>
                        <p className="text-muted text-xs">Location</p>
                        <p className="font-medium">{location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase size={18} className="text-muted" />
                      <div>
                        <p className="text-muted text-xs">Industry</p>
                        <p className="font-medium">{industry}</p>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-emerald/10 to-accent-cyan/10 border border-emerald/20"
                  >
                    <p className="text-xs text-muted mb-1">Recommendation</p>
                    <p className="font-space-grotesk font-bold text-emerald">{recommendation}</p>
                  </motion.div>

                  <GlassCard className="p-4 rounded-lg bg-surface-elevated/90 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted">Candidate Twin Suggestions</p>
                        <h4 className="font-semibold">Similar candidates to review</h4>
                      </div>
                      <span className="text-xs text-muted">Based on DNA, experience, risk, and recruitability</span>
                    </div>

                    {candidateListLoading ? (
                      <div className="text-sm text-muted">Loading suggestions...</div>
                    ) : twinSuggestions.length > 0 ? (
                      <div className="space-y-3">
                        {twinSuggestions.map(({ candidate, similarity }) => (
                          <div
                            key={candidate.candidate_id}
                            className="rounded-3xl border border-border p-4 bg-surface-elevated/80"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold">{candidate.name}</p>
                                <p className="text-sm text-muted">{candidate.current_title || candidate.role || 'Unknown role'}</p>
                              </div>
                              <span className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
                                {similarity}% match
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted mt-3">
                              <div>
                                <p className="font-medium text-foreground">Experience</p>
                                <p>{candidate.years_of_experience} yrs</p>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">Recruitability</p>
                                <p>{candidate.recruitability_score ? `${Math.round(candidate.recruitability_score)}%` : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">Risk</p>
                                <p>{candidate.risk_score ? `${Math.round(candidate.risk_score)}%` : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">Persona</p>
                                <p>{candidate.persona ?? 'Unknown'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-border bg-surface-elevated/80 p-4 text-center text-sm text-muted">
                        Not enough data is available to calculate similar twins right now.
                      </div>
                    )}
                  </GlassCard>

                  <div className="flex gap-2 border-b border-border">
                    {(['dna', 'decision', 'skills'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === tab
                            ? 'text-primary border-primary'
                            : 'text-muted border-transparent hover:text-foreground'
                        }`}
                      >
                        {tab === 'dna' ? 'Candidate DNA' : tab === 'decision' ? 'Decision' : 'Skills'}
                      </button>
                    ))}
                  </div>

                  <div>
                    {activeTab === 'dna' && (
                      <div className="space-y-4">
                        {hasDnaData ? (
                          <RadarChartComponent data={dnaAxes} />
                        ) : (
                          <div className="rounded-3xl border border-border bg-surface-elevated/80 p-8 text-center text-sm text-muted">
                            Data Unavailable
                            <p className="mt-2 text-xs">Candidate DNA metrics are not available for this profile.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'decision' && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Strengths</h4>
                          <ul className="space-y-2">
                            {strengths.map((strength) => (
                              <li key={strength} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-emerald mt-1">•</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Weaknesses</h4>
                          <ul className="space-y-2">
                            {weaknesses.map((weakness) => (
                              <li key={weakness} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-amber mt-1">•</span>
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Concerns</h4>
                          <ul className="space-y-2">
                            {concerns.map((concern) => (
                              <li key={concern} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-crimson mt-1">•</span>
                                {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTab === 'skills' && (
                      <div className="flex flex-wrap gap-2">
                        {profile?.skills?.map((skill) => (
                          <span
                            key={typeof skill === 'string' ? skill : JSON.stringify(skill)}
                            className="px-3 py-1 rounded-full text-xs border border-primary/30 text-primary bg-primary/5"
                          >
                            {typeof skill === 'string' ? skill : skill.name || ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CandidateDrawer
