import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, AlertCircle, Activity, Award, Zap } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import KPICard from '../components/KPICard'
import GlassCard from '../components/GlassCard'
import { BarChartCard, PieChartCard, LineChartCard } from '../components/Charts'
import RecommendationCard from '../components/RecommendationCard'
import { useAnalytics } from '../api/hooks/useAnalytics'
import { useSubmission } from '../api/hooks/useSubmission'

function formatNumber(value?: number) {
  return value === undefined || value === null ? '0' : new Intl.NumberFormat('en-US').format(value)
}

function formatPercent(value?: number) {
  return value === undefined || value === null ? '0%' : `${Math.round(value)}%`
}

function objectToArray(source?: Record<string, number>) {
  return source ? Object.entries(source).map(([name, value]) => ({ name, value })) : []
}

function weightedAverage(source: Record<string, number> | undefined, weights: Record<string, number>) {
  if (!source) return 0

  let totalValue = 0
  let totalWeight = 0

  Object.entries(source).forEach(([key, count]) => {
    const weight = weights[key] ?? 0
    totalValue += weight * count
    totalWeight += count
  })

  return totalWeight ? totalValue / totalWeight : 0
}

export function DashboardPage() {
  const { data, isLoading, error } = useAnalytics()
  const overview = data ?? {
    dataset_size: 0,
    most_common_roles: [],
    most_common_skills: [],
    persona_distribution: {},
    risk_distribution: {},
    average_experience_years: 0,
    median_experience_years: 0,
    market_insights: {},
    highest_recruiter_demand_roles: [],
    top_certifications: [],
    top_ranked_candidates: [],
    experience_distribution: undefined,
    recruitability_distribution: undefined,
    hiring_readiness_distribution: undefined,
  }

  const kpis = useMemo(
    () => [
      {
        icon: <Users size={24} />,
        label: 'Total Candidates',
        value: isLoading ? 'Loading...' : formatNumber(overview?.dataset_size),
        trend: 0,
      },
      {
        icon: <Award size={24} />,
        label: 'Top Ranked',
        value: isLoading ? 'Loading...' : formatNumber(overview?.top_ranked_candidates?.length ?? 0),
        trend: 0,
      },
      {
        icon: <Activity size={24} />,
        label: 'Avg Recruitability',
        value: isLoading
          ? 'Loading...'
          : formatPercent(
              weightedAverage(overview?.recruitability_distribution, {
                'Very High': 95,
                High: 85,
                Moderate: 60,
                Low: 30,
              }),
            ),
        trend: 0,
      },
      {
        icon: <AlertCircle size={24} />,
        label: 'Avg Risk',
        value: isLoading
          ? 'Loading...'
          : formatPercent(
              weightedAverage(overview?.risk_distribution, {
                Low: 20,
                Moderate: 50,
                High: 75,
                Critical: 90,
              }),
            ),
        trend: 0,
      },
      {
        icon: <TrendingUp size={24} />,
        label: 'Avg Experience',
        value: isLoading ? 'Loading...' : `${overview?.average_experience_years?.toFixed(1) ?? '0.0'}y`,
        trend: 0,
      },
      {
        icon: <Zap size={24} />,
        label: 'Profiles Analyzed',
        value: isLoading ? 'Loading...' : formatNumber(overview?.dataset_size),
        trend: 0,
      },
    ],
    [overview, isLoading],
  )

  const recruitability = useMemo(
    () => objectToArray(overview.recruitability_distribution),
    [overview.recruitability_distribution],
  )

  const risk = useMemo(
    () => objectToArray(overview.risk_distribution),
    [overview.risk_distribution],
  )

  const personas = useMemo(
    () => objectToArray(overview.persona_distribution),
    [overview.persona_distribution],
  )

  const experienceOrder = ['0-2', '2-5', '5-8', '8-12', '12+']

  const experience = useMemo(
    () =>
      objectToArray(overview.experience_distribution).sort(
        (a, b) => experienceOrder.indexOf(a.name) - experienceOrder.indexOf(b.name),
      ),
    [overview.experience_distribution],
  )

  const { data: submissionData, isLoading: submissionLoading } = useSubmission()

  const topSubmission = submissionData?.[0]

  const candidateGrowth = useMemo(
    () => objectToArray(overview.hiring_readiness_distribution),
    [overview.hiring_readiness_distribution],
  )

  const topSkills = useMemo(
    () => overview?.most_common_skills?.slice(0, 5) ?? [],
    [overview?.most_common_skills],
  )

  const topRoles = useMemo(
    () => overview?.highest_recruiter_demand_roles?.slice(0, 4) ?? overview?.most_common_roles?.slice(0, 4) ?? [],
    [overview?.highest_recruiter_demand_roles, overview?.most_common_roles],
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
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
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-4 sm:p-6 lg:p-8 max-w-7xl"
        >
          {error && (
            <div className="mb-6 rounded-xl border border-crimson/20 bg-crimson/10 px-4 py-3 text-sm text-crimson">
              Unable to load analytics data. Please refresh or try again later.
            </div>
          )}

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GlassCard>
              <h3 className="text-lg font-space-grotesk font-semibold mb-4">Why #1?</h3>
              {submissionLoading ? (
                <p className="text-sm text-muted">Loading top candidate details...</p>
              ) : topSubmission ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-border bg-surface-elevated/80 p-4">
                    <p className="text-xs text-muted">Top Ranked Candidate</p>
                    <p className="font-semibold text-lg">{topSubmission.candidate_id}</p>
                    <p className="text-sm text-muted">Score: {topSubmission.score.toFixed(1)}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Primary rationale</p>
                    <p className="text-muted">{topSubmission.reasoning || 'Strong overall score and alignment with hiring needs.'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted">
                    <div className="rounded-3xl border border-border bg-surface-elevated/80 p-3">
                      <p className="font-semibold text-foreground">Recommendation</p>
                      <p>{topSubmission.recommendation}</p>
                    </div>
                    <div className="rounded-3xl border border-border bg-surface-elevated/80 p-3">
                      <p className="font-semibold text-foreground">Rank position</p>
                      <p>#{topSubmission.rank}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">No submission ranking data is currently available.</p>
              )}
            </GlassCard>
          </motion.div>

          {/* KPI Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {kpis.map((kpi, index) => (
              <motion.div key={index} variants={itemVariants}>
                <KPICard icon={kpi.icon} label={kpi.label} value={kpi.value} trend={kpi.trend} />
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Row 1 */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BarChartCard title="Recruitability Distribution" data={recruitability} />
            <BarChartCard title="Risk Distribution" data={risk} />
          </motion.div>

          {/* Charts Row 2 */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <PieChartCard title="Persona Distribution" data={personas} />
            <BarChartCard title="Experience Distribution" data={experience} />
            <LineChartCard title="Candidate Growth" data={candidateGrowth} />
          </motion.div>

          {/* Skills & Roles */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GlassCard>
              <h3 className="text-lg font-space-grotesk font-semibold mb-6">Top Skills</h3>
              <div className="space-y-4">
                {topSkills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className="font-mono text-xs text-muted">{formatNumber(skill.value)}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(skill.value, 100)}%` }}
                        transition={{ delay: index * 0.1, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-primary to-accent-cyan"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-space-grotesk font-semibold mb-6">Top Roles</h3>
              <div className="space-y-4">
                {topRoles.map((role, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{role.name}</span>
                      <span className="font-mono text-xs text-muted">{formatNumber(role.value)}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(role.value, 100)}%` }}
                        transition={{ delay: index * 0.1, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-emerald to-accent-cyan"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Bottom Panels */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GlassCard>
              <h3 className="text-lg font-space-grotesk font-semibold mb-6">Recent Intelligence</h3>
              <div className="space-y-4">
                <RecommendationCard
                  type="positive"
                  title="Strong Candidate Pool"
                  description="High-quality candidates identified in premium segment"
                  metrics={[
                    { label: 'Premium Tier', value: formatNumber(overview.top_ranked_candidates?.length ?? 0) },
                    { label: 'Dataset Size', value: formatNumber(overview.dataset_size) },
                  ]}
                />
                <RecommendationCard
                  type="warning"
                  title="Talent Market Alert"
                  description="Increased competition for top-tier technical roles"
                  metrics={[
                    { label: 'Risk Categories', value: Object.keys(overview.risk_distribution ?? {}).length.toString() },
                    { label: 'High Risk', value: formatNumber(overview.risk_distribution?.High) },
                  ]}
                />
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-space-grotesk font-semibold mb-6">Top Recommendations</h3>
              <div className="space-y-4">
                <RecommendationCard
                  type="positive"
                  title="Priority Targets"
                  description="5 candidates ready for immediate outreach"
                  metrics={[
                    { label: 'High Recruitability', value: formatNumber(overview.recruitability_distribution?.High) },
                    { label: 'Ready to Hire', value: formatNumber(overview.hiring_readiness_distribution?.Ready) },
                  ]}
                />
                <RecommendationCard
                  type="neutral"
                  title="Emerging Talent"
                  description="Promising candidates with growth potential"
                  metrics={[
                    { label: 'Emerging Talent', value: formatNumber(overview.persona_distribution?.['Emerging Talent']) },
                    { label: 'Ready Now', value: formatNumber(overview.hiring_readiness_distribution?.['Highly Ready']) },
                  ]}
                />
              </div>
            </GlassCard>
          </motion.div>
        </motion.main>
      </div>
    </div>
  )
}

export default DashboardPage
