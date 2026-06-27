import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import GlassCard from '../components/GlassCard'
import { AreaChartCard, LineChartCard, PieChartCard } from '../components/Charts'
import RecommendationCard from '../components/RecommendationCard'
import { TrendingUp, BarChart3, Users, Zap } from 'lucide-react'
import { useAnalytics } from '../api/hooks/useAnalytics'

function objectToArray(source?: Record<string, number>) {
  return source ? Object.entries(source).map(([name, value]) => ({ name, value })) : []
}

function formatPercent(value?: number) {
  return value === undefined || value === null ? '0%' : `${Math.round(value)}%`
}

export function InsightsPage() {
  const { data: overview, isLoading, error } = useAnalytics()

  const marketReadiness = useMemo(
    () => objectToArray(overview?.hiring_readiness_distribution),
    [overview?.hiring_readiness_distribution],
  )

  const competitiveness = useMemo(
    () => objectToArray(overview?.risk_distribution),
    [overview?.risk_distribution],
  )

  const geographicDistribution = useMemo(
    () => objectToArray(overview?.persona_distribution).slice(0, 4),
    [overview?.persona_distribution],
  )

  const industryTrends = useMemo(
    () =>
      (overview?.highest_recruiter_demand_roles ?? overview?.most_common_roles ?? [])
        .slice(0, 6)
        .map((item) => ({ name: item.name, value: item.value })),
    [overview?.highest_recruiter_demand_roles, overview?.most_common_roles],
  )

  const keyMetrics = useMemo(() => {
    const datasetSize = overview?.dataset_size ?? 0
    const readinessTotal = Object.values(overview?.hiring_readiness_distribution ?? {}).reduce((sum, value) => sum + value, 0)
    const readyValue = overview?.hiring_readiness_distribution?.Ready ?? 0
    const riskLow = overview?.risk_distribution?.Low ?? 0
    const highRecruitability = (overview?.recruitability_distribution?.High ?? 0) + (overview?.recruitability_distribution?.['Very High'] ?? 0)
    const highDemandValue = overview?.highest_recruiter_demand_roles?.[0]?.value ?? 0

    return [
      {
        label: 'Market Readiness',
        value: isLoading ? 'Loading...' : formatPercent(readinessTotal ? (readyValue / readinessTotal) * 100 : 0),
        icon: <TrendingUp />,
      },
      {
        label: 'Competitiveness',
        value: isLoading ? 'Loading...' : formatPercent(riskLow ? (riskLow / (overview?.risk_distribution ? Object.values(overview.risk_distribution).reduce((a, b) => a + b, 0) : 1)) * 100 : 0),
        icon: <BarChart3 />,
      },
      {
        label: 'Talent Availability',
        value: isLoading ? 'Loading...' : formatPercent(datasetSize ? (highRecruitability / datasetSize) * 100 : 0),
        icon: <Users />,
      },
      {
        label: 'Growth Momentum',
        value: isLoading ? 'Loading...' : `+${Math.round(highDemandValue / 100)}%`,
        icon: <Zap />,
      },
    ]
  }, [overview, isLoading])

  const topAiEngineers = overview?.persona_distribution?.['AI Engineer'] ?? 0
  const leadershipReady = overview?.persona_distribution?.['Leadership Ready'] ?? 0
  const emergingTalent = overview?.persona_distribution?.['Emerging Talent'] ?? 0

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
              Unable to load market insights. Please refresh or try again later.
            </div>
          )}

          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-space-grotesk font-bold mb-2">Market Insights</h1>
            <p className="text-muted">Executive analytics and talent market intelligence</p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {keyMetrics.map((metric, idx) => (
              <GlassCard key={idx}>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">{metric.icon}</div>
                </div>
                <p className="text-muted text-sm mb-1">{metric.label}</p>
                <p className="text-2xl font-space-grotesk font-bold">{metric.value}</p>
              </GlassCard>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AreaChartCard title="Market Readiness Trend" data={marketReadiness} />
            <LineChartCard title="Competitiveness Index" data={competitiveness} />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <PieChartCard title="Geographic Distribution" data={geographicDistribution} />
            <div className="lg:col-span-2">
              <AreaChartCard title="Industry Candidate Growth" data={industryTrends} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="text-lg font-space-grotesk font-semibold mb-6">AI Observations</h3>
              <div className="space-y-4">
                <RecommendationCard
                  type="positive"
                  title="Strong Technical Talent Pool"
                  description={`AI Engineer persona count is ${topAiEngineers.toLocaleString()}.`}
                />
                <RecommendationCard
                  type="warning"
                  title="Leadership Gap"
                  description={`Leadership Ready persona count is ${leadershipReady.toLocaleString()} compared to broader talent pool.`}
                />
                <RecommendationCard
                  type="neutral"
                  title="Emerging Markets"
                  description={`Emerging Talent population is ${emergingTalent.toLocaleString()} across the dataset.`}
                />
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-space-grotesk font-semibold mb-6">Recommendations</h3>
              <div className="space-y-4">
                <RecommendationCard
                  type="positive"
                  title="Expand to Europe"
                  description="A broad diversity of candidate personas indicates growth opportunity across regions."
                  metrics={[
                    { label: 'Persona segments', value: Object.keys(overview?.persona_distribution ?? {}).length.toString() },
                    { label: 'Top role demand', value: overview?.highest_recruiter_demand_roles?.[0]?.name ?? 'N/A' },
                  ]}
                />
                <RecommendationCard
                  type="neutral"
                  title="Upskilling Initiative"
                  description="Strong mid-career candidate volume makes upskilling an efficient route to leadership roles."
                  metrics={[
                    { label: 'Average experience', value: `${overview?.average_experience_years?.toFixed(1) ?? '0.0'}y` },
                    { label: 'Top certification', value: overview?.top_certifications?.[0]?.name ?? 'N/A' },
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

export default InsightsPage
