import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendResponse } from '../api'
import { getMetric } from '../metrics'
import ShareButtons from './ShareButtons'

interface Props {
  data: TrendResponse | null
  loading: boolean
  onClose: () => void
  shareInfo: { text: string; url: string } | null
}

const YEAR_LABEL: Record<string, string> = {
  R1: 'R1', R2: 'R2', R3: 'R3', R4: 'R4', R5: 'R5', R6: 'R6',
}

const SERIES_LABEL: Record<string, string> = {
  total_waste_t: '合計',
  household_waste_t: '生活系',
  business_waste_t: '事業系',
}

function tonnesTick(v: number) {
  if (Math.abs(v) >= 10000) return `${Math.round(v / 10000)}万t`
  return `${Math.round(v)}t`
}

function yenPerTonTick(v: number) {
  return `${Math.round(v / 1000)}千円`
}

export default function TrendPanel({ data, loading, onClose, shareInfo }: Props) {
  if (!data && !loading) return null

  return (
    <div className="panel trend-panel">
      <div className="panel-header">
        <h2>{data ? `${data.name} の推移` : '推移を表示'}</h2>
        <button type="button" className="close-btn" onClick={onClose} aria-label="閉じる">
          ×
        </button>
      </div>
      {loading && <div className="ranking-empty">読み込み中…</div>}
      {data && shareInfo && <ShareButtons text={shareInfo.text} url={shareInfo.url} />}
      {data && (
        <div className="trend-charts">
          <div className="trend-chart-block">
            <h3>ごみ排出量（区分別）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="fiscal_year"
                  tickFormatter={(v) => YEAR_LABEL[v] ?? v}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={tonnesTick}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${Math.round(Number(value)).toLocaleString('ja-JP')} t`,
                    SERIES_LABEL[String(name)] ?? String(name),
                  ]}
                  labelFormatter={(v) => `${YEAR_LABEL[String(v)] ?? v} 年度`}
                />
                <Legend
                  formatter={(value) => SERIES_LABEL[String(value)] ?? String(value)}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line type="monotone" dataKey="total_waste_t" stroke="var(--series-total)" strokeWidth={2} dot={{ r: 3 }} />
                <Line
                  type="monotone"
                  dataKey="household_waste_t"
                  stroke="var(--series-household)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="business_waste_t"
                  stroke="var(--series-business)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="trend-chart-block">
            <h3>{getMetric('recycling_rate_r_pct').label}</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="fiscal_year"
                  tickFormatter={(v) => YEAR_LABEL[v] ?? v}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'リサイクル率']}
                  labelFormatter={(v) => `${YEAR_LABEL[String(v)] ?? v} 年度`}
                />
                <Line
                  type="monotone"
                  dataKey="recycling_rate_r_pct"
                  stroke="var(--series-total)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="リサイクル率"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {data.level === 'pref' && (
            <div className="trend-chart-block">
              <h3>{getMetric('cost_per_ton_yen').label}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={data.series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="fiscal_year"
                    tickFormatter={(v) => YEAR_LABEL[v] ?? v}
                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={yenPerTonTick}
                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value) => [`${Math.round(Number(value)).toLocaleString('ja-JP')} 円/t`, '処理原価']}
                    labelFormatter={(v) => `${YEAR_LABEL[String(v)] ?? v} 年度`}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost_per_ton_yen"
                    stroke="var(--series-business)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="処理原価"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="trend-note">※ R5はコストデータが未収録のため欠損</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
