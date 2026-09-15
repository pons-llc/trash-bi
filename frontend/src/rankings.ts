// backend/app.py の /api/rankings が行っていた
//   WHERE {metric} IS NOT NULL [AND pref_code = ?] ORDER BY value {dir} LIMIT ? / rank = i+1
// をそのままクライアント側の純粋関数に移した版。静的JSON化に伴い、指標や並び順を
// 変えてもネットワーク通信なしで即座に再計算できる。
export function rankItems<T extends Record<string, unknown>>(
  items: T[],
  opts: { metric: string; order: 'asc' | 'desc'; limit: number; prefCode?: string | null },
): (T & { value: number; rank: number })[] {
  const filtered = items.filter((it) => {
    const v = it[opts.metric]
    if (v === null || v === undefined) return false
    if (opts.prefCode && it['pref_code'] !== opts.prefCode) return false
    return true
  })
  const dir = opts.order === 'asc' ? 1 : -1
  filtered.sort((a, b) => dir * ((a[opts.metric] as number) - (b[opts.metric] as number)))
  return filtered.slice(0, opts.limit).map((it, i) => ({
    ...it,
    value: it[opts.metric] as number,
    rank: i + 1,
  }))
}
