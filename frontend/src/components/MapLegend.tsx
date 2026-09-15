import { SEQUENTIAL_SCALE, NO_DATA_COLOR } from '../colorScale'

interface Props {
  breaks: number[]
  title: string
  unit: string
}

function fmt(v: number) {
  return v >= 1000 ? `${Math.round(v).toLocaleString('ja-JP')}` : v.toFixed(0)
}

export default function MapLegend({ breaks, title, unit }: Props) {
  if (breaks.length === 0) {
    return (
      <div className="map-legend">
        <div className="map-legend-title">データ集計中…</div>
      </div>
    )
  }

  const bounds: [string, string][] = SEQUENTIAL_SCALE.map((color, i) => {
    const lo: number | null = i === 0 ? null : breaks[i - 1]
    const hi: number | null = i === breaks.length ? null : breaks[i]
    let label: string
    if (lo === null) label = `〜 ${fmt(hi as number)}`
    else if (hi === null) label = `${fmt(lo)} 〜`
    else label = `${fmt(lo)} 〜 ${fmt(hi)}`
    return [color, label]
  })

  return (
    <div className="map-legend">
      <div className="map-legend-title">
        {title} <span className="map-legend-unit">({unit})</span>
      </div>
      <div className="map-legend-scale">
        {bounds.map(([color, label]) => (
          <div className="map-legend-item" key={label}>
            <span className="map-legend-swatch" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
        <div className="map-legend-item">
          <span className="map-legend-swatch" style={{ background: NO_DATA_COLOR }} />
          <span>データなし</span>
        </div>
      </div>
    </div>
  )
}
