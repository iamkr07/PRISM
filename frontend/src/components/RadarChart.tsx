import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import GlassCard from './GlassCard'

interface RadarChartComponentProps {
  data: Array<{
    name: string
    value: number
  }>
  title?: string
}

export function RadarChartComponent({ data, title }: RadarChartComponentProps) {
  if (!data || data.length === 0) {
    return (
      <GlassCard className="w-full">
        {title && <h3 className="text-lg font-space-grotesk font-semibold mb-4">{title}</h3>}
        <div className="text-sm text-muted">No chart data available</div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="w-full">
      {title && <h3 className="text-lg font-space-grotesk font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(147, 112, 219, 0.1)" />
          <PolarAngleAxis dataKey="name" stroke="rgba(147, 112, 219, 0.5)" style={{ fontSize: '12px' }} />
          <PolarRadiusAxis stroke="rgba(147, 112, 219, 0.3)" />
          <Radar name="Score" dataKey="value" stroke="oklch(0.62 0.21 268)" fill="oklch(0.62 0.21 268)" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}

export default RadarChartComponent
