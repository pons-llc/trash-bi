import type { Category, FiscalYear, Level, PrefMeta } from '../api'
import type { MapMetric } from './JapanMap'

interface Props {
  years: FiscalYear[]
  year: string
  onYearChange: (y: string) => void
  category: Category
  onCategoryChange: (c: Category) => void
  level: Level
  onLevelChange: (l: Level) => void
  prefectures: PrefMeta[]
  prefFilter: string | null
  onPrefFilterChange: (code: string | null) => void
  mapMetric: MapMetric
  onMapMetricChange: (m: MapMetric) => void
}

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'total', label: '合計' },
  { value: 'household', label: '生活系（一般）' },
  { value: 'business', label: '事業系' },
]

export default function ControlBar({
  years,
  year,
  onYearChange,
  category,
  onCategoryChange,
  level,
  onLevelChange,
  prefectures,
  prefFilter,
  onPrefFilterChange,
  mapMetric,
  onMapMetricChange,
}: Props) {
  return (
    <div className="control-bar">
      <div className="control-group">
        <label className="control-label" htmlFor="year-select">
          対象年度
        </label>
        <select id="year-select" value={year} onChange={(e) => onYearChange(e.target.value)} className="control-select">
          {years.map((y) => (
            <option key={y.fiscal_year} value={y.fiscal_year}>
              {y.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <span className="control-label">区分</span>
        <div className="radio-group" role="radiogroup" aria-label="ごみの区分">
          {CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className={`radio-pill ${category === opt.value ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="category"
                value={opt.value}
                checked={category === opt.value}
                onChange={() => onCategoryChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="control-group">
        <span className="control-label">表示単位</span>
        <div className="toggle-group" role="group" aria-label="表示単位の切り替え">
          <button
            type="button"
            className={`toggle-btn ${level === 'pref' ? 'is-active' : ''}`}
            onClick={() => onLevelChange('pref')}
          >
            都道府県別
          </button>
          <button
            type="button"
            className={`toggle-btn ${level === 'city' ? 'is-active' : ''}`}
            onClick={() => onLevelChange('city')}
          >
            基礎自治体別
          </button>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label" htmlFor="pref-filter">
          都道府県で絞り込み・ズーム
        </label>
        <select
          id="pref-filter"
          value={prefFilter ?? ''}
          onChange={(e) => onPrefFilterChange(e.target.value || null)}
          className="control-select"
        >
          <option value="">全国</option>
          {prefectures.map((p) => (
            <option key={p.pref_code} value={p.pref_code}>
              {p.pref_name}
            </option>
          ))}
        </select>
      </div>

      {level === 'pref' && (
        <div className="control-group">
          <span className="control-label">地図の指標</span>
          <div className="toggle-group" role="group" aria-label="地図の指標の切り替え">
            <button
              type="button"
              className={`toggle-btn ${mapMetric === 'per_capita' ? 'is-active' : ''}`}
              onClick={() => onMapMetricChange('per_capita')}
            >
              排出量/人口比
            </button>
            <button
              type="button"
              className={`toggle-btn ${mapMetric === 'cost' ? 'is-active' : ''}`}
              onClick={() => onMapMetricChange('cost')}
            >
              ごみ処理原価
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
