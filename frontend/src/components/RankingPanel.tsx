import { useMemo } from 'react'
import type { CityRankingItem, Level, PrefRankingItem } from '../api'
import { getMetric, metricsForLevel } from '../metrics'

interface Props {
  level: Level
  metric: string
  onMetricChange: (m: string) => void
  order: 'asc' | 'desc'
  onOrderChange: (o: 'asc' | 'desc') => void
  items: (PrefRankingItem | CityRankingItem)[]
  loading: boolean
  onSelect: (level: Level, code: string, name: string) => void
  selectedCode?: string | null
}

function itemName(level: Level, item: PrefRankingItem | CityRankingItem): string {
  if (level === 'pref') return (item as PrefRankingItem).pref_name
  const c = item as CityRankingItem
  return `${c.pref_name} ${c.city_name}`
}

function itemCode(level: Level, item: PrefRankingItem | CityRankingItem): string {
  return level === 'pref' ? (item as PrefRankingItem).pref_code : (item as CityRankingItem).city_code
}

export default function RankingPanel({
  level,
  metric,
  onMetricChange,
  order,
  onOrderChange,
  items,
  loading,
  onSelect,
  selectedCode,
}: Props) {
  const metricDef = getMetric(metric)
  const options = useMemo(() => metricsForLevel(level), [level])
  const maxAbs = Math.max(1, ...items.map((it) => Math.abs(it.value)))

  return (
    <div className="panel ranking-panel">
      <div className="panel-header">
        <h2>ランキング</h2>
        <div className="ranking-controls">
          <select
            className="control-select"
            value={metric}
            onChange={(e) => onMetricChange(e.target.value)}
            aria-label="ランキング指標"
          >
            {options.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="toggle-btn small"
            onClick={() => onOrderChange(order === 'desc' ? 'asc' : 'desc')}
            title="並び順を反転"
          >
            {order === 'desc' ? '降順' : '昇順'}
          </button>
        </div>
      </div>
      <div className="ranking-list" role="list">
        {loading && <div className="ranking-empty">読み込み中…</div>}
        {!loading && items.length === 0 && <div className="ranking-empty">データがありません</div>}
        {!loading &&
          items.map((item) => {
            const code = itemCode(level, item)
            const name = itemName(level, item)
            const widthPct = Math.max(2, (Math.abs(item.value) / maxAbs) * 100)
            const isSelected = selectedCode === code
            return (
              <button
                key={code}
                className={`ranking-row ${isSelected ? 'is-selected' : ''}`}
                role="listitem"
                onClick={() => onSelect(level, code, name)}
              >
                <span className="ranking-rank">{item.rank}</span>
                <span className="ranking-name">{name}</span>
                <span className="ranking-bar-track">
                  <span className="ranking-bar-fill" style={{ width: `${widthPct}%` }} />
                </span>
                <span className="ranking-value">{metricDef.format(item.value)}</span>
              </button>
            )
          })}
      </div>
    </div>
  )
}
