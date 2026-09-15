// 7 段階の連続（単色・明度単調減少、白→赤）スケール。dataviz スキルの
// validate_palette.js --ordinal で検証済み（単色性・明度差・単調性は PASS）。
// 最淡色は白に近いため背景とのコントラストは基準未達（意図的な逸脱）——
// 各ポリゴンには常に境界線を引き、淡色域も枠線で識別できるようにしている。
export const SEQUENTIAL_SCALE = [
  '#fdeeee', // red-50 (低)
  '#ffbbbb', // red-200
  '#ff7171', // red-400
  '#fe3939', // red-600
  '#ce0000', // red-900
  '#850000', // red-1100
  '#620000', // red-1200 (高)
]

export const NO_DATA_COLOR = '#e6e6e6'

// ごみ排出量のような指標は、観光地・温泉地など少数の自治体が住民1人あたり
// 排出量で突出することが多い（例: 箱根町）。均等分位だと外れ値が上位20%の
// 塊に埋もれて見分けがつかなくなるため、上位ほど区切りを細かくした分位点を
// 使い、極端な外れ値だけが最も濃い色に分離されるようにする。
const TAIL_WEIGHTED_PERCENTILES = [40, 65, 82, 92, 97, 99.3]

function percentileBreaks(values: number[], percentiles: number[]): number[] {
  const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (sorted.length === 0) return []
  return percentiles.map((p) => {
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))))
    return sorted[idx]
  })
}

/** 外れ値（上位テール）を強調するためのしきい値。SEQUENTIAL_SCALE の段数に対応。 */
export function tailWeightedBreaks(values: number[]): number[] {
  return percentileBreaks(values, TAIL_WEIGHTED_PERCENTILES)
}

export function colorForValue(value: number | null | undefined, breaks: number[]): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NO_DATA_COLOR
  let bucket = 0
  for (const b of breaks) {
    if (value > b) bucket++
  }
  return SEQUENTIAL_SCALE[Math.min(bucket, SEQUENTIAL_SCALE.length - 1)]
}
