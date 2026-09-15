export function formatInt(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '―'
  return Math.round(v).toLocaleString('ja-JP')
}

export function formatTonnes(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '―'
  return `${v.toLocaleString('ja-JP', { maximumFractionDigits: 0 })} t`
}

export function formatPercent(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '―'
  return `${v.toFixed(digits)}%`
}

export function formatGramsPerDay(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '―'
  return `${v.toLocaleString('ja-JP', { maximumFractionDigits: 1 })} g/人日`
}

export function formatPopulation(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '―'
  return `${Math.round(v).toLocaleString('ja-JP')} 人`
}

export function formatYenPerTon(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '―'
  return `${Math.round(v).toLocaleString('ja-JP')} 円/t`
}

export function formatThousandYen(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '―'
  const yen = v * 1000
  if (yen >= 100_000_000) return `${(yen / 100_000_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })} 億円`
  return `${Math.round(yen).toLocaleString('ja-JP')} 円`
}
