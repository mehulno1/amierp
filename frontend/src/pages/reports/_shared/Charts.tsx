import type { ReactNode } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import MonoEyebrow from '../../../components/ui/MonoEyebrow'
import { CHART_COLORS, axisStyle, tooltipStyle } from './chartTheme'

const grid = 'rgba(20,15,10,0.08)'

export function ChartCard({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <MonoEyebrow>{title}</MonoEyebrow>
        {right}
      </div>
      {children}
    </div>
  )
}

interface BarCardProps {
  title: string
  data: any[]
  xKey: string
  bars: { key: string; name?: string; color?: string }[]
  height?: number
  horizontal?: boolean
  tickFmt?: (v: any) => string
  valueFmt?: (v: any) => string
}

export function BarCard({ title, data, xKey, bars, height = 260, horizontal, tickFmt, valueFmt }: BarCardProps) {
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 4, right: 12, left: horizontal ? 8 : 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="2 2" stroke={grid} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={axisStyle} tickFormatter={tickFmt} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey={xKey} tick={axisStyle} width={120} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} tickFormatter={tickFmt} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip {...tooltipStyle} formatter={valueFmt as any} />
          {bars.length > 1 && <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} />}
          {bars.map((b, i) => (
            <Bar key={b.key} dataKey={b.key} name={b.name || b.key} fill={b.color || CHART_COLORS[i % CHART_COLORS.length]} radius={horizontal ? [0, 2, 2, 0] : [2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

interface LineCardProps {
  title: string
  data: any[]
  xKey: string
  lines: { key: string; name?: string; color?: string }[]
  height?: number
  tickFmt?: (v: any) => string
  valueFmt?: (v: any) => string
}

export function LineCard({ title, data, xKey, lines, height = 260, tickFmt, valueFmt }: LineCardProps) {
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="2 2" stroke={grid} />
          <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} tickFormatter={tickFmt} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} formatter={valueFmt as any} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} />}
          {lines.map((l, i) => (
            <Line key={l.key} type="monotone" dataKey={l.key} name={l.name || l.key} stroke={l.color || CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

interface DonutCardProps {
  title: string
  data: { name: string; value: number }[]
  height?: number
  colors?: string[]
  colorFor?: (name: string) => string | undefined
  valueFmt?: (v: any) => string
}

export function DonutCard({ title, data, height = 260, colors, colorFor, valueFmt }: DonutCardProps) {
  const palette = colors || CHART_COLORS
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={1}>
            {data.map((d, i) => (
              <Cell key={i} fill={(colorFor && colorFor(d.name)) || palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={valueFmt as any} />
          <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
