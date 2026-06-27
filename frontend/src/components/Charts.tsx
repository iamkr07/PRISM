import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'
import GlassCard from './GlassCard'

interface ChartDataItem {
  name: string
  value: number
}

interface ChartProps {
  title: string
  data: ChartDataItem[]
  height?: number
  children?: React.ReactNode
}

export function BarChartCard({ title, data, height: _height = 300 }: ChartProps) {
  return (
    <GlassCard>
      <h3 className="text-lg font-space-grotesk font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={_height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(147, 112, 219, 0.1)" />
          <XAxis stroke="rgba(147, 112, 219, 0.3)" style={{ fontSize: '12px' }} />
          <YAxis stroke="rgba(147, 112, 219, 0.3)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(32, 33, 35, 0.8)',
              border: '1px solid rgba(147, 112, 219, 0.2)',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="value" fill="oklch(0.62 0.21 268)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}

export function PieChartCard({ title, data, height: _height = 300 }: ChartProps) {
  const COLORS = ['oklch(0.62 0.21 268)', 'oklch(0.74 0.16 162)', 'oklch(0.78 0.14 210)', 'oklch(0.82 0.16 78)', 'oklch(0.65 0.22 22)']

  return (
    <GlassCard>
      <h3 className="text-lg font-space-grotesk font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                paddingAngle={4}
                stroke="transparent"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(32, 33, 35, 0.8)',
                  border: '1px solid rgba(147, 112, 219, 0.2)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between gap-3 rounded-3xl bg-surface-elevated/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="block h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

export function AreaChartCard({ title, data, height: _height = 300 }: ChartProps) {
  return (
    <GlassCard>
      <h3 className="text-lg font-space-grotesk font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={_height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.62 0.21 268)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="oklch(0.62 0.21 268)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(147, 112, 219, 0.1)" />
          <XAxis stroke="rgba(147, 112, 219, 0.3)" style={{ fontSize: '12px' }} />
          <YAxis stroke="rgba(147, 112, 219, 0.3)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(32, 33, 35, 0.8)',
              border: '1px solid rgba(147, 112, 219, 0.2)',
              borderRadius: '8px',
            }}
          />
          <Area type="monotone" dataKey="value" stroke="oklch(0.62 0.21 268)" fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}

export function LineChartCard({ title, data, height: _height = 300 }: ChartProps) {
  return (
    <GlassCard>
      <h3 className="text-lg font-space-grotesk font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={_height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(147, 112, 219, 0.1)" />
          <XAxis stroke="rgba(147, 112, 219, 0.3)" style={{ fontSize: '12px' }} />
          <YAxis stroke="rgba(147, 112, 219, 0.3)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(32, 33, 35, 0.8)',
              border: '1px solid rgba(147, 112, 219, 0.2)',
              borderRadius: '8px',
            }}
          />
          <Line type="monotone" dataKey="value" stroke="oklch(0.62 0.21 268)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}

export default { BarChartCard, PieChartCard, AreaChartCard, LineChartCard }
