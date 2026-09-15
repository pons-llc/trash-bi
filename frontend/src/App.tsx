import { useEffect, useMemo, useState } from 'react'
import {
  fetchCityYear,
  fetchMeta,
  fetchPrefYear,
  fetchTrend,
  type Category,
  type CityRankingItem,
  type CityStatRaw,
  type Level,
  type Meta,
  type PrefRankingItem,
  type PrefStatRaw,
  type TrendResponse,
} from './api'
import ControlBar from './components/ControlBar'
import JapanMap, { type MapMetric } from './components/JapanMap'
import MapLegend from './components/MapLegend'
import RankingPanel from './components/RankingPanel'
import TrendPanel from './components/TrendPanel'
import { applyCategory, getMetric, metricsForLevel } from './metrics'
import { rankItems } from './rankings'
import './layout.css'

interface Selected {
  level: Level
  code: string
  name: string
}

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [year, setYear] = useState('R6')
  const [category, setCategory] = useState<Category>('total')
  const [level, setLevel] = useState<Level>('pref')
  const [prefFilter, setPrefFilter] = useState<string | null>(null)
  const [mapMetric, setMapMetric] = useState<MapMetric>('per_capita')

  // 年度ごとの静的JSONをまるごと保持する。区分選択・都道府県絞り込み・
  // ランキングの並び替えは、ここから useMemo で導出するだけでネットワーク
  // 通信は発生しない。
  const [prefDataRaw, setPrefDataRaw] = useState<PrefStatRaw[]>([])
  const [cityDataRaw, setCityDataRaw] = useState<CityStatRaw[]>([])
  const [prefLoading, setPrefLoading] = useState(false)
  const [cityLoading, setCityLoading] = useState(false)
  const [mapBreaks, setMapBreaks] = useState<number[]>([])

  const [rankingMetric, setRankingMetric] = useState('recycling_rate_r_pct')
  const [rankingOrder, setRankingOrder] = useState<'asc' | 'desc'>('desc')

  const [selected, setSelected] = useState<Selected | null>(null)
  const [trendData, setTrendData] = useState<TrendResponse | null>(null)
  const [trendLoading, setTrendLoading] = useState(false)

  useEffect(() => {
    fetchMeta().then(setMeta).catch(console.error)
  }, [])

  useEffect(() => {
    setPrefLoading(true)
    fetchPrefYear(year)
      .then((r) => setPrefDataRaw(r.items))
      .catch(console.error)
      .finally(() => setPrefLoading(false))
  }, [year])

  useEffect(() => {
    if (level !== 'city') return
    setCityLoading(true)
    fetchCityYear(year)
      .then((r) => setCityDataRaw(r.items))
      .catch(console.error)
      .finally(() => setCityLoading(false))
  }, [year, level])

  useEffect(() => {
    if (!metricsForLevel(level).some((m) => m.key === rankingMetric)) {
      setRankingMetric('recycling_rate_r_pct')
    }
    // 処理原価は都道府県単位のデータしかないので、基礎自治体別では地図の指標
    // を人口比表示に戻す。
    if (level === 'city') setMapMetric('per_capita')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  useEffect(() => {
    if (!selected) {
      setTrendData(null)
      return
    }
    setTrendLoading(true)
    fetchTrend(selected.level, selected.code)
      .then(setTrendData)
      .catch(console.error)
      .finally(() => setTrendLoading(false))
  }, [selected])

  const categoryLabel = category === 'total' ? '合計' : category === 'household' ? '生活系' : '事業系'

  const prefData = useMemo(() => prefDataRaw.map((p) => applyCategory(p, category)), [prefDataRaw, category])
  const cityData = useMemo(() => {
    const filtered = prefFilter ? cityDataRaw.filter((c) => c.pref_code === prefFilter) : cityDataRaw
    return filtered.map((c) => applyCategory(c, category))
  }, [cityDataRaw, category, prefFilter])

  const rankingMetricValid = metricsForLevel(level).some((m) => m.key === rankingMetric)
  const rankingItems = useMemo<(PrefRankingItem | CityRankingItem)[]>(() => {
    if (!rankingMetricValid) return []
    if (level === 'pref') {
      return rankItems(prefDataRaw, { metric: rankingMetric, order: rankingOrder, limit: 47 })
    }
    return rankItems(cityDataRaw, {
      metric: rankingMetric,
      order: rankingOrder,
      limit: 60,
      prefCode: prefFilter,
    })
  }, [level, prefDataRaw, cityDataRaw, rankingMetric, rankingOrder, prefFilter, rankingMetricValid])
  const rankingLoading = level === 'pref' ? prefLoading : cityLoading

  function handleSelectPref(code: string, name: string) {
    setSelected({ level: 'pref', code, name })
    setPrefFilter(code)
  }

  function handleSelectCity(code: string, name: string) {
    setSelected({ level: 'city', code, name })
  }

  function handleRankingSelect(rankLevel: Level, code: string, name: string) {
    setSelected({ level: rankLevel, code, name })
    if (rankLevel === 'pref') setPrefFilter(code)
  }

  const metricDef = getMetric(rankingMetric)

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>日本ごみ処理ダッシュボード</h1>
        <p className="app-subtitle">
          環境省「一般廃棄物処理実態調査」市区町村別データ（令和元〜6年度）
        </p>
      </header>

      {meta && (
        <ControlBar
          years={meta.fiscal_years}
          year={year}
          onYearChange={setYear}
          category={category}
          onCategoryChange={setCategory}
          level={level}
          onLevelChange={setLevel}
          prefectures={meta.prefectures}
          prefFilter={prefFilter}
          onPrefFilterChange={setPrefFilter}
          mapMetric={mapMetric}
          onMapMetricChange={setMapMetric}
        />
      )}

      <main className="app-main">
        <section className="map-section">
          <div className="map-container">
            <JapanMap
              level={level}
              prefData={prefData}
              cityData={cityData}
              mapMetric={mapMetric}
              prefFilter={prefFilter}
              onSelectPref={handleSelectPref}
              onSelectCity={handleSelectCity}
              onBreaksChange={setMapBreaks}
            />
            <MapLegend
              breaks={mapBreaks}
              title={mapMetric === 'cost' ? 'ごみ処理原価' : `${categoryLabel} 1人1日排出量`}
              unit={mapMetric === 'cost' ? '円/t' : 'g/人日'}
            />
            {level === 'city' && cityLoading && <div className="map-loading-badge">読み込み中…</div>}
            <div className="gsi-attribution">地図: 国土地理院ベクトルタイル（実験公開）</div>
          </div>
        </section>

        <aside className="side-panel">
          <RankingPanel
            level={level}
            metric={rankingMetric}
            onMetricChange={setRankingMetric}
            order={rankingOrder}
            onOrderChange={setRankingOrder}
            items={rankingItems}
            loading={rankingLoading}
            onSelect={handleRankingSelect}
            selectedCode={selected?.code}
          />
          <TrendPanel data={trendData} loading={trendLoading} onClose={() => setSelected(null)} />
        </aside>
      </main>

      <footer className="app-footer">
        <div className="app-footer-group">
          <span>指標: {metricDef.label}</span>
          <span>データ出典: 環境省一般廃棄物処理実態調査</span>
        </div>
        <div className="app-footer-group">
          <a href="/terms.html">利用規約</a>
          <a href="/privacy.html">プライバシーポリシー</a>
          <a href="https://x.com/ponsllc" target="_blank" rel="noopener noreferrer">
            お問い合わせ (X: @ponsllc)
          </a>
        </div>
      </footer>
    </div>
  )
}
