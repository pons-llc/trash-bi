export type Category = 'total' | 'household' | 'business'
export type Level = 'pref' | 'city'

export interface FiscalYear {
  fiscal_year: string
  label: string
  sort_order: number
}

export interface PrefMeta {
  pref_code: string
  pref_name: string
}

export interface Meta {
  fiscal_years: FiscalYear[]
  prefectures: PrefMeta[]
}

// pref/city 静的JSON 1件分の生データ（区分ごとのフィールドを全部持つ）。
// waste_t / per_capita_g は含まれない — metrics.ts の applyCategory() で
// 選択した区分に応じて付与する。
export interface PrefStatRaw {
  [key: string]: unknown
  pref_code: string
  pref_name: string
  population: number | null
  total_waste_t: number | null
  household_waste_t: number | null
  business_waste_t: number | null
  treated_amount_t: number | null
  final_disposal_t: number | null
  per_capita_total_g: number | null
  per_capita_household_g: number | null
  per_capita_business_g: number | null
  recycling_rate_r_pct: number | null
  final_disposal_rate_pct: number | null
  cost_per_ton_yen: number | null
  waste_expenditure_thousand_yen: number | null
}

export interface CityStatRaw {
  [key: string]: unknown
  city_code: string
  pref_code: string
  pref_name: string
  city_name: string
  population: number | null
  total_waste_t: number | null
  household_waste_t: number | null
  business_waste_t: number | null
  treated_amount_t: number | null
  final_disposal_t: number | null
  per_capita_total_g: number | null
  per_capita_household_g: number | null
  per_capita_business_g: number | null
  reduction_rate_pct: number | null
  recycling_rate_r_pct: number | null
  recycling_rate_r2_pct: number | null
  lat: number | null
  lng: number | null
}

// applyCategory() を通した後の形（waste_t/per_capita_g が付与される）。
// JapanMap / MapLegend など既存コンポーネントはこの形をそのまま受け取る。
export type PrefStat = PrefStatRaw & { waste_t: number | null; per_capita_g: number | null }
export type CityStat = CityStatRaw & { waste_t: number | null; per_capita_g: number | null }

// rankItems()（rankings.ts）が PrefStatRaw/CityStatRaw に value/rank を足して
// 返す形。全フィールドを持つ（RankingPanel が使うのは一部だけ）。
export type PrefRankingItem = PrefStatRaw & { value: number; rank: number }
export type CityRankingItem = CityStatRaw & { value: number; rank: number }

export interface TrendSeriesPoint {
  fiscal_year: string
  population: number | null
  total_waste_t: number | null
  household_waste_t: number | null
  business_waste_t: number | null
  treated_amount_t: number | null
  final_disposal_t: number | null
  per_capita_total_g: number | null
  per_capita_household_g: number | null
  per_capita_business_g: number | null
  recycling_rate_r_pct: number | null
  reduction_rate_pct?: number | null
  recycling_rate_r2_pct?: number | null
  final_disposal_rate_pct?: number | null
  cost_per_ton_yen?: number | null
  waste_expenditure_thousand_yen?: number | null
}

export interface TrendResponse {
  level: Level
  code: string
  name: string
  series: TrendSeriesPoint[]
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

// すべて静的JSON（backend/export_static.py が生成し frontend/public/data/ に
// 置かれたもの）を読むだけ。フィルタ・区分選択・ランキング計算はクライアント側
// （metrics.ts の applyCategory / rankings.ts の rankItems）で行う。

export function fetchMeta(): Promise<Meta> {
  return getJSON('/data/meta.json')
}

export function fetchPrefYear(year: string): Promise<{ year: string; items: PrefStatRaw[] }> {
  return getJSON(`/data/pref/${encodeURIComponent(year)}.json`)
}

export function fetchCityYear(year: string): Promise<{ year: string; items: CityStatRaw[] }> {
  return getJSON(`/data/city/${encodeURIComponent(year)}.json`)
}

export function fetchTrend(level: Level, code: string): Promise<TrendResponse> {
  return getJSON(`/data/trend/${level}/${encodeURIComponent(code)}.json`)
}
