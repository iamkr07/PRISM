import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import RadarChartComponent from '../components/RadarChart'
import ErrorBoundary from '../components/ErrorBoundary'
import GlassCard from '../components/GlassCard'
import { useCandidates } from '../api/hooks/useCandidates'
import { useCompare } from '../api/hooks/useCompare'

function mapRadarData(values?: Array<{ axis: string; value: number }>) {
  return values ? values.map((entry) => ({ name: entry.axis, value: entry.value })) : []
}

export function ComparePage() {
  const { data: candidatesData, isLoading: candidatesLoading, error: candidatesError } = useCandidates({ page: 1, limit: 20 })
  const candidates = candidatesData?.items ?? []

  const [candidate1, setCandidate1] = useState('')
  const [candidate2, setCandidate2] = useState('')

  useEffect(() => {
    if (!candidate1 && !candidate2 && candidates.length >= 2) {
      setCandidate1(candidates[0].candidate_id)
      setCandidate2(candidates[1].candidate_id)
    }
  }, [candidates, candidate1, candidate2])

  const compareQuery = useCompare(candidate1, candidate2)
  const compareData = compareQuery.data

  const candidateMap = useMemo(
    () => new Map(candidates.map((item) => [item.candidate_id, item])),
    [candidates],
  )

  const c1 = candidateMap.get(candidate1) ?? {
    candidate_id: candidate1,
    name: candidate1 || 'Candidate 1',
    current_title: 'Candidate',
    score: 0,
  }

  const c2 = candidateMap.get(candidate2) ?? {
    candidate_id: candidate2,
    name: candidate2 || 'Candidate 2',
    current_title: 'Candidate',
    score: 0,
  }

  const normalizePersona = (persona: unknown) => {
    if (!persona) return 'Unknown'
    if (typeof persona === 'string') return persona
    if (typeof persona === 'object' && persona !== null) {
      const data = persona as { primary_persona?: string; persona_tags?: string[] }
      if (data.primary_persona) return data.primary_persona
      if (Array.isArray(data.persona_tags)) return data.persona_tags.join(', ')
    }
    return 'Unknown'
  }

  const c1Score = compareData?.comparison_metrics?.score_1 ?? 0
  const c2Score = compareData?.comparison_metrics?.score_2 ?? 0
  const scoreDiff = compareData?.comparison_metrics?.score_diff ?? Math.abs(c1Score - c2Score)

  const c1Persona = normalizePersona(compareData?.comparison_metrics?.persona_1)
  const c2Persona = normalizePersona(compareData?.comparison_metrics?.persona_2)
  const c1Role = typeof compareData?.comparison_metrics?.role_1 === 'string' ? compareData?.comparison_metrics?.role_1 : c1.current_title
  const c2Role = typeof compareData?.comparison_metrics?.role_2 === 'string' ? compareData?.comparison_metrics?.role_2 : c2.current_title
  const winnerName = compareData?.winner === c1.candidate_id ? c1.name : compareData?.winner === c2.candidate_id ? c2.name : 'Pending'
  const recommendation = compareData?.recommendation ?? 'Data unavailable'
  const c1Recruitability = compareData?.comparison_metrics?.recruitability_1
  const c2Recruitability = compareData?.comparison_metrics?.recruitability_2
  const c1Reliability = compareData?.comparison_metrics?.reliability_1
  const c2Reliability = compareData?.comparison_metrics?.reliability_2
  const c1Leadership = compareData?.comparison_metrics?.leadership_1
  const c2Leadership = compareData?.comparison_metrics?.leadership_2
  const c1Strengths = compareData?.comparison_metrics?.strengths_1 ?? []
  const c2Strengths = compareData?.comparison_metrics?.strengths_2 ?? []
  const c1Concerns = compareData?.comparison_metrics?.concerns_1 ?? []
  const c2Concerns = compareData?.comparison_metrics?.concerns_2 ?? []

  const highlightWinner = (value1?: number, value2?: number) => {
    if (value1 === undefined || value2 === undefined) return ''
    return value1 >= value2 ? 'text-emerald' : 'text-crimson'
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-80">
        <Topbar />
        <ErrorBoundary>
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 sm:p-6 lg:p-8"
          >
          <div className="mb-8">
            <h1 className="text-3xl font-space-grotesk font-bold mb-2">Compare Candidates</h1>
            <p className="text-muted">Side-by-side analysis of candidate profiles</p>
          </div>

          {candidatesError && (
            <div className="mb-6 rounded-xl border border-crimson/20 bg-crimson/10 px-4 py-3 text-sm text-crimson">
              Unable to load candidate list. Please refresh or try again later.
            </div>
          )}

          {candidate1 && candidate2 && candidate1 === candidate2 && (
            <div className="mb-6 rounded-xl border border-muted/20 bg-muted/8 px-4 py-3 text-sm text-muted">
              Please select two different candidates to compare.
            </div>
          )}

          {compareQuery.isError && (
            <div className="mb-6 rounded-xl border border-crimson/20 bg-crimson/10 px-4 py-3 text-sm text-crimson">
              {compareQuery.error?.message ?? 'Comparison failed. Please try again.'}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            <GlassCard>
              <label className="block text-sm font-medium mb-3">Candidate 1</label>
              <select
                value={candidate1}
                onChange={(e) => setCandidate1(e.target.value)}
                disabled={candidatesLoading}
                className="w-full px-4 py-2 rounded-lg glass-elevated outline-none focus:ring-2 ring-primary/30"
              >
                {candidates.length ? (
                  candidates.map((candidate) => (
                    <option key={candidate.candidate_id} value={candidate.candidate_id} className="bg-surface text-foreground">
                      {candidate.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {candidatesLoading ? 'Loading candidates...' : 'No candidates available'}
                  </option>
                )}
              </select>
            </GlassCard>

            <GlassCard>
              <label className="block text-sm font-medium mb-3">Candidate 2</label>
              <select
                value={candidate2}
                onChange={(e) => setCandidate2(e.target.value)}
                disabled={candidatesLoading}
                className="w-full px-4 py-2 rounded-lg glass-elevated outline-none focus:ring-2 ring-primary/30"
              >
                {candidates.length ? (
                  candidates.map((candidate) => (
                    <option key={candidate.candidate_id} value={candidate.candidate_id} className="bg-surface text-foreground">
                      {candidate.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {candidatesLoading ? 'Loading candidates...' : 'No candidates available'}
                  </option>
                )}
              </select>
            </GlassCard>
          </motion.div>

          <ErrorBoundary>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                >
                  <RadarChartComponent data={mapRadarData(compareData?.radar_values_1)} title={c1.name} />
                  <RadarChartComponent data={mapRadarData(compareData?.radar_values_2)} title={c2.name} />
                </motion.div>
              </ErrorBoundary>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <GlassCard>
              <h3 className="font-space-grotesk font-semibold mb-4 text-center">{c1.name}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted text-xs mb-1">Overall Score</p>
                  <p className="text-2xl font-bold text-primary">{c1Score}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Role</p>
                  <p className="font-medium">{c1Role}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Persona</p>
                  <p className="font-medium">{c1Persona}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="md:col-span-1 flex flex-col justify-center items-center text-center">
              <Zap size={32} className="text-primary mb-2" />
              <p className="text-sm text-muted font-mono">COMPARISON</p>
              {candidate1 && candidate2 ? (
                <>
                  <p className={`text-sm font-semibold mt-2 ${compareData?.winner === candidate1 ? 'text-emerald' : 'text-crimson'}`}>
                    {compareData?.winner
                      ? `${winnerName} leads by ${scoreDiff} pts`
                      : 'Comparison data available'}</p>
                  <p className="text-xs text-muted mt-1">{recommendation}</p>
                </>
              ) : (
                <p className="text-sm font-semibold mt-2 text-muted">Select both candidates to compare</p>
              )}
            </GlassCard>

            <GlassCard>
              <h3 className="font-space-grotesk font-semibold mb-4 text-center">{c2.name}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted text-xs mb-1">Overall Score</p>
                  <p className="text-2xl font-bold text-primary">{c2Score}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Role</p>
                  <p className="font-medium">{c2Role}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Persona</p>
                  <p className="font-medium">{c2Persona}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <GlassCard>
              <h3 className="font-space-grotesk font-semibold mb-4">Candidate Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted text-xs mb-1">Recruitability</p>
                  <p className={`font-bold ${highlightWinner(c1Recruitability, c2Recruitability)}`}>{c1Recruitability ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Leadership</p>
                  <p className={`font-bold ${highlightWinner(c1Leadership, c2Leadership)}`}>{c1Leadership ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Reliability</p>
                  <p className={`font-bold ${highlightWinner(c1Reliability, c2Reliability)}`}>{c1Reliability ?? 'N/A'}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-space-grotesk font-semibold mb-4">Candidate Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted text-xs mb-1">Recruitability</p>
                  <p className={`font-bold ${highlightWinner(c2Recruitability, c1Recruitability)}`}>{c2Recruitability ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Leadership</p>
                  <p className={`font-bold ${highlightWinner(c2Leadership, c1Leadership)}`}>{c2Leadership ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Reliability</p>
                  <p className={`font-bold ${highlightWinner(c2Reliability, c1Reliability)}`}>{c2Reliability ?? 'N/A'}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-space-grotesk font-semibold mb-4">Comparison Summary</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted text-xs mb-1">Winner</p>
                  <p className="font-bold">{winnerName}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Score gap</p>
                  <p className="font-bold">{scoreDiff}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-1">Recommendation</p>
                  <p>{recommendation}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <GlassCard>
              <h3 className="font-space-grotesk font-semibold mb-4">Strengths & Concerns - {c1.name}</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted text-xs mb-2">Strengths</p>
                  <ul className="space-y-2">
                    {(c1Strengths.length ? c1Strengths : ['No strengths data available']).map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-emerald mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-muted text-xs mb-2">Concerns</p>
                  <ul className="space-y-2">
                    {(c1Concerns.length ? c1Concerns : ['No concerns data available']).map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-crimson mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-space-grotesk font-semibold mb-4">Strengths & Concerns - {c2.name}</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted text-xs mb-2">Strengths</p>
                  <ul className="space-y-2">
                    {(c2Strengths.length ? c2Strengths : ['No strengths data available']).map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-emerald mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-muted text-xs mb-2">Concerns</p>
                  <ul className="space-y-2">
                    {(c2Concerns.length ? c2Concerns : ['No concerns data available']).map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-crimson mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          </motion.main>
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default ComparePage
