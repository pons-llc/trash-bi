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
import ArticleSuggestion from './components/ArticleSuggestion'
import ControlBar from './components/ControlBar'
import JapanMap, { type MapMetric } from './components/JapanMap'
import MapLegend from './components/MapLegend'
import OnboardingTour, { type TourStage } from './components/OnboardingTour'
import RankingPanel from './components/RankingPanel'
import TrendPanel from './components/TrendPanel'
import { applyCategory, getMetric, metricsForLevel } from './metrics'
import { rankItems } from './rankings'
import './layout.css'

const TOUR_SEEN_KEY = 'trash-bi:onboarding-seen'

interface Selected {
  level: Level
  code: string
  name: string
}

// シェアリンク（?level=city&code=13100&year=R6 など）で開いたときに、共有元と
// 同じ表示（都道府県絞り込み・自治体・推移パネル）を再現するための初期状態。
// 読み込みは初回マウント時の1回だけ（URLを継続的に同期はしていない）。
function readShareParams() {
  if (typeof window === 'undefined') return { year: null, level: null, code: null, metric: null, category: null }
  const params = new URLSearchParams(window.location.search)
  const level = params.get('level')
  const category = params.get('category')
  return {
    year: params.get('year'),
    level: level === 'pref' || level === 'city' ? (level as Level) : null,
    code: params.get('code'),
    metric: params.get('metric'),
    category: category === 'total' || category === 'household' || category === 'business' ? (category as Category) : null,
  }
}

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const shareParams = useMemo(readShareParams, [])
  const [year, setYear] = useState(shareParams.year || 'R6')
  const [category, setCategory] = useState<Category>(shareParams.category ?? 'total')
  const [level, setLevel] = useState<Level>(shareParams.level ?? 'pref')
  const [prefFilter, setPrefFilter] = useState<string | null>(() => {
    if (!shareParams.code) return null
    return shareParams.level === 'city' ? shareParams.code.slice(0, 2) : shareParams.code
  })
  const [mapMetric, setMapMetric] = useState<MapMetric>('per_capita')

  // 年度ごとの静的JSONをまるごと保持する。区分選択・都道府県絞り込み・
  // ランキングの並び替えは、ここから useMemo で導出するだけでネットワーク
  // 通信は発生しない。
  const [prefDataRaw, setPrefDataRaw] = useState<PrefStatRaw[]>([])
  const [cityDataRaw, setCityDataRaw] = useState<CityStatRaw[]>([])
  const [prefLoading, setPrefLoading] = useState(false)
  const [cityLoading, setCityLoading] = useState(false)
  const [mapBreaks, setMapBreaks] = useState<number[]>([])

  const [rankingMetric, setRankingMetric] = useState(shareParams.metric || 'recycling_rate_r_pct')
  const [rankingOrder, setRankingOrder] = useState<'asc' | 'desc'>('desc')

  const [selected, setSelected] = useState<Selected | null>(() =>
    shareParams.level && shareParams.code ? { level: shareParams.level, code: shareParams.code, name: '' } : null,
  )
  const [trendData, setTrendData] = useState<TrendResponse | null>(null)
  const [trendLoading, setTrendLoading] = useState(false)

  const [tourStage, setTourStage] = useState<TourStage>('hidden')
  const [tourStep, setTourStep] = useState(0)

  useEffect(() => {
    fetchMeta().then(setMeta).catch(console.error)
  }, [])

  // 初回訪問（localStorageにフラグがない）の場合だけ、ツアー開始の案内を出す。
  // 記事からの深掘りリンクもlevel/codeパラメータを使うため、パラメータの
  // 有無ではなく初回訪問かどうかだけで判定する（スキップは1クリックで可能）。
  useEffect(() => {
    if (!meta) return
    try {
      if (!window.localStorage.getItem(TOUR_SEEN_KEY)) {
        setTourStage('welcome')
      }
    } catch {
      // localStorageが使えない環境（プライベートモード等）では単に案内をスキップする。
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta])

  function markTourSeen() {
    try {
      window.localStorage.setItem(TOUR_SEEN_KEY, '1')
    } catch {
      // 保存できなくても動作に支障はないため無視する。
    }
  }

  function handleTourStart() {
    markTourSeen()
    setTourStep(0)
    setTourStage('running')
  }

  function handleTourSkip() {
    markTourSeen()
    setTourStage('hidden')
  }

  function handleTourRelaunch() {
    setTourStep(0)
    setTourStage('running')
  }

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

  const shareInfo = useMemo(() => {
    if (!selected || !trendData || trendData.series.length === 0) return null
    const latest = trendData.series[trendData.series.length - 1]
    const rate = latest.recycling_rate_r_pct
    const text =
      rate !== null && rate !== undefined
        ? `${trendData.name}のリサイクル率は${rate.toFixed(1)}%（${latest.fiscal_year}年度）`
        : `${trendData.name}のごみ処理データ`
    const url = `https://trash-bi.pons-llc.com/app/?level=${selected.level}&code=${encodeURIComponent(selected.code)}&year=${year}`
    return { text, url }
  }, [selected, trendData, year])

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
        <div className="app-header-row">
          <div>
            <h1>日本ごみ処理ダッシュボード</h1>
            <p className="app-subtitle">
              環境省「一般廃棄物処理実態調査」市区町村別データ（令和元〜6年度）
            </p>
          </div>
          <div className="app-header-links">
            <a href="/articles/">読み物</a>
            <button type="button" className="header-guide-btn" onClick={handleTourRelaunch}>
              使い方ガイド
            </button>
          </div>
        </div>
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
          <div className="map-container" data-tour="map">
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
          <TrendPanel data={trendData} loading={trendLoading} onClose={() => setSelected(null)} shareInfo={shareInfo} />
          <ArticleSuggestion level={selected?.level ?? level} code={selected?.code ?? prefFilter} />
        </aside>
      </main>

      <footer className="app-footer">
        <div className="app-footer-group">
          <span>指標: {metricDef.label}</span>
          <span>データ出典: 環境省一般廃棄物処理実態調査</span>
        </div>
        <div className="app-footer-group">
          <a href="/">トップページ</a>
          <a href="/terms">利用規約</a>
          <a href="/privacy">プライバシーポリシー</a>
          <a href="https://x.com/ponsllc" target="_blank" rel="noopener noreferrer">
            お問い合わせ (X: @ponsllc)
          </a>
        </div>
      </footer>

      <OnboardingTour
        stage={tourStage}
        step={tourStep}
        onStepChange={setTourStep}
        onStart={handleTourStart}
        onSkip={handleTourSkip}
        onClose={() => setTourStage('hidden')}
      />
    </div>
  )
}
