import type { Category, Level } from './api'

// backend/app.py の CATEGORY_COLUMNS をクライアント側に移した版。静的JSON化に
// 伴い、区分（合計/生活系/事業系）の選択はサーバーではなくここで行う。
const CATEGORY_COLUMNS: Record<Category, { waste_t: string; per_capita_g: string }> = {
  total: { waste_t: 'total_waste_t', per_capita_g: 'per_capita_total_g' },
  household: { waste_t: 'household_waste_t', per_capita_g: 'per_capita_household_g' },
  business: { waste_t: 'business_waste_t', per_capita_g: 'per_capita_business_g' },
}

export function applyCategory<T extends Record<string, unknown>>(
  item: T,
  category: Category,
): T & { waste_t: number | null; per_capita_g: number | null } {
  const cols = CATEGORY_COLUMNS[category]
  return {
    ...item,
    waste_t: (item[cols.waste_t] as number | null) ?? null,
    per_capita_g: (item[cols.per_capita_g] as number | null) ?? null,
  }
}

export interface MetricDef {
  key: string
  label: string
  shortLabel: string
  unit: string
  betterDirection: 'asc' | 'desc'
  levels: Level[]
  format: (v: number | null | undefined) => string
}

import {
  formatGramsPerDay,
  formatPercent,
  formatPopulation,
  formatThousandYen,
  formatTonnes,
  formatYenPerTon,
} from './format'

export const METRICS: MetricDef[] = [
  {
    key: 'recycling_rate_r_pct',
    label: 'リサイクル率（R）',
    shortLabel: 'リサイクル率',
    unit: '%',
    betterDirection: 'desc',
    levels: ['pref', 'city'],
    format: formatPercent,
  },
  {
    key: 'recycling_rate_r2_pct',
    label: "リサイクル率（R'・厳格指標）",
    shortLabel: "リサイクル率(R')",
    unit: '%',
    betterDirection: 'desc',
    // R' は市区町村単位のみ公表されており、都道府県別の値は存在しない。
    levels: ['city'],
    format: formatPercent,
  },
  {
    key: 'per_capita_total_g',
    label: '1人1日あたりごみ排出量（合計）',
    shortLabel: '1人1日排出量',
    unit: 'g/人日',
    betterDirection: 'asc',
    levels: ['pref', 'city'],
    format: formatGramsPerDay,
  },
  {
    key: 'per_capita_household_g',
    label: '1人1日あたりごみ排出量（生活系）',
    shortLabel: '1人1日排出量（生活系）',
    unit: 'g/人日',
    betterDirection: 'asc',
    levels: ['pref', 'city'],
    format: formatGramsPerDay,
  },
  {
    key: 'per_capita_business_g',
    label: '1人1日あたりごみ排出量（事業系）',
    shortLabel: '1人1日排出量（事業系）',
    unit: 'g/人日',
    betterDirection: 'asc',
    levels: ['pref', 'city'],
    format: formatGramsPerDay,
  },
  {
    key: 'total_waste_t',
    label: 'ごみ総排出量',
    shortLabel: '総排出量',
    unit: 't',
    betterDirection: 'desc',
    levels: ['pref', 'city'],
    format: formatTonnes,
  },
  {
    key: 'treated_amount_t',
    label: 'ごみ処理量',
    shortLabel: '処理量',
    unit: 't',
    betterDirection: 'desc',
    levels: ['pref', 'city'],
    format: formatTonnes,
  },
  {
    key: 'final_disposal_t',
    label: '最終処分量',
    shortLabel: '最終処分量',
    unit: 't',
    betterDirection: 'asc',
    levels: ['pref', 'city'],
    format: formatTonnes,
  },
  {
    key: 'reduction_rate_pct',
    label: '減量処理率',
    shortLabel: '減量処理率',
    unit: '%',
    betterDirection: 'desc',
    levels: ['city'],
    format: formatPercent,
  },
  {
    key: 'final_disposal_rate_pct',
    label: '最終処分率',
    shortLabel: '最終処分率',
    unit: '%',
    betterDirection: 'asc',
    levels: ['pref'],
    format: formatPercent,
  },
  {
    key: 'population',
    label: '総人口',
    shortLabel: '人口',
    unit: '人',
    betterDirection: 'desc',
    levels: ['pref', 'city'],
    format: formatPopulation,
  },
  {
    key: 'cost_per_ton_yen',
    label: 'ごみ処理原価（t当たり事業費）',
    shortLabel: '処理原価',
    unit: '円/t',
    betterDirection: 'asc',
    levels: ['pref'],
    format: formatYenPerTon,
  },
  {
    key: 'waste_expenditure_thousand_yen',
    label: 'ごみ処理事業費',
    shortLabel: '事業費',
    unit: '千円',
    betterDirection: 'asc',
    levels: ['pref'],
    format: formatThousandYen,
  },
]

export function metricsForLevel(level: Level): MetricDef[] {
  return METRICS.filter((m) => m.levels.includes(level))
}

export function getMetric(key: string): MetricDef {
  return METRICS.find((m) => m.key === key) ?? METRICS[0]
}
