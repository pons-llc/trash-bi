import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// Vite needs the worker routed through its worker pipeline (`?worker&url`, not
// plain `?url`) so the emitted chunk is self-contained; see MapLibre's v5->v6
// migration guide. Without this, Map init succeeds but GeoJSON sources hang
// forever with zero errors (no 'error' event, no console output).
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { feature } from 'topojson-client'
import type { CityStat, PrefStat } from '../api'
import { colorForValue, tailWeightedBreaks } from '../colorScale'

maplibregl.setWorkerUrl(maplibreWorkerUrl)

const FIXED_BUBBLE_RADIUS = 7

export type MapMetric = 'per_capita' | 'cost'

interface Props {
  level: 'pref' | 'city'
  prefData: PrefStat[]
  cityData: CityStat[]
  mapMetric: MapMetric
  prefFilter: string | null
  onSelectPref: (code: string, name: string) => void
  onSelectCity: (code: string, name: string) => void
  onBreaksChange?: (breaks: number[]) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prefGeoCache: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPrefGeo(): Promise<any> {
  if (prefGeoCache) return prefGeoCache
  const res = await fetch('/geo/japan_prefectures.topojson')
  const topo = await res.json()
  const objName = Object.keys(topo.objects)[0]
  const geo = feature(topo, topo.objects[objName])
  prefGeoCache = geo
  return geo
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCoords(geom: any, out: [number, number][]) {
  if (!geom) return
  if (typeof geom[0] === 'number') {
    out.push(geom as [number, number])
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const child of geom) extractCoords(child, out)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function boundsOfFeature(f: any): maplibregl.LngLatBoundsLike | null {
  const coords: [number, number][] = []
  extractCoords(f?.geometry?.coordinates, coords)
  if (coords.length === 0) return null
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

export default function JapanMap({
  level,
  prefData,
  cityData,
  mapMetric,
  prefFilter,
  onSelectPref,
  onSelectCity,
  onBreaksChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {},
          // 淡い赤（低い値のバブル）が背景に溶け込まないよう、濃いめのグレー
          // ブルーにしている。dataviz スキルの validate_palette.js で、最淡色
          // (#fdeeee) がこの背景に対して 2:1 以上のコントラストを確保できる
          // ことを確認済み。
          layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#96a5b3' } }],
        },
        center: [138.2, 38.2],
        zoom: 4.1,
        minZoom: 3,
        maxZoom: 16,
        attributionControl: false,
      })
    } catch (err) {
      setInitError(err instanceof Error ? err.message : String(err))
      return
    }
    mapRef.current = map
    map.on('error', (e) => setInitError(e.error?.message ?? '地図の読み込みに失敗しました'))
    // 市区町村界（GSIベクトルタイル）はズーム11あたりから描画されるが、既定の
    // ホイール感度だと全国表示（zoom≈4）からそこまで30回以上スクロールが要る。
    // 感度を上げて少ないスクロールで到達できるようにする。
    map.scrollZoom.setWheelZoomRate(1 / 150)
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })
    map.on('load', () => {
      // 国土地理院ベクトルタイル（実験公開）の行政界レイヤー。
      // ftCode: 1211=都道府県界, 1212=市区町村界, 6101=街区（地番）界。
      // 6101 は縮尺が細かすぎて全国表示では潰れるだけなので除外する。
      map.addSource('gsi-boundary', {
        type: 'vector',
        tiles: ['https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf'],
        minzoom: 4,
        maxzoom: 16,
      })
      map.addLayer({
        id: 'admin-boundary-line',
        type: 'line',
        source: 'gsi-boundary',
        'source-layer': 'boundary',
        filter: ['in', ['get', 'ftCode'], ['literal', [1211, 1212]]],
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#6b7280',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1, 11, 1.4],
          'line-opacity': 1,
        },
      })
      setReady(true)
    })
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  if (initError) {
    return (
      <div className="map-fallback">
        <p>地図を表示できませんでした（{initError}）。</p>
        <p>ランキング・推移パネルは引き続きご利用いただけます。</p>
      </div>
    )
  }

  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current
    let cancelled = false
    loadPrefGeo().then((geo) => {
      if (cancelled) return
      const metricOf = (p: PrefStat) => (mapMetric === 'cost' ? p.cost_per_ton_yen : p.per_capita_g)
      const valueByCode = new Map(prefData.map((p) => [String(Number(p.pref_code)), metricOf(p)]))
      const nameByCode = new Map(prefData.map((p) => [String(Number(p.pref_code)), p.pref_name]))
      const values = prefData.map(metricOf).filter((v): v is number => v !== null && v !== undefined)
      const breaks = tailWeightedBreaks(values)
      onBreaksChange?.(breaks)

      const unitLabel = mapMetric === 'cost' ? '円/t' : 'g/人日'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const withValue = {
        ...geo,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        features: geo.features.map((f: any) => {
          const id = String(f.properties?.id)
          const val = valueByCode.get(id) ?? null
          return {
            ...f,
            properties: {
              ...f.properties,
              value: val,
              color: colorForValue(val, breaks),
              display_name: nameByCode.get(id) ?? f.properties?.nam_ja,
              unit: unitLabel,
            },
          }
        }),
      }

      const src = map.getSource('prefectures') as maplibregl.GeoJSONSource | undefined
      if (src) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        src.setData(withValue as any)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.addSource('prefectures', { type: 'geojson', data: withValue as any })
        map.addLayer({
          id: 'pref-fill',
          type: 'fill',
          source: 'prefectures',
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.88 },
        })
        map.addLayer({
          id: 'pref-line',
          type: 'line',
          source: 'prefectures',
          paint: { 'line-color': '#ffffff', 'line-width': 1 },
        })
        map.on('click', 'pref-fill', (e: maplibregl.MapLayerMouseEvent) => {
          const f = e.features?.[0]
          if (!f) return
          const code = String(f.properties?.id).padStart(2, '0')
          onSelectPref(code, String(f.properties?.display_name ?? ''))
        })
        map.on('mousemove', 'pref-fill', (e: maplibregl.MapLayerMouseEvent) => {
          map.getCanvas().style.cursor = 'pointer'
          const f = e.features?.[0]
          if (!f || !popupRef.current) return
          const name = f.properties?.display_name
          const val = f.properties?.value
          const unit = f.properties?.unit ?? ''
          const html = `<strong>${name}</strong><br/>${val != null ? Number(val).toLocaleString('ja-JP', { maximumFractionDigits: 1 }) + ' ' + unit : 'データなし'}`
          popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map)
        })
        map.on('mouseleave', 'pref-fill', () => {
          map.getCanvas().style.cursor = ''
          popupRef.current?.remove()
        })
      }
      // 都道府県の輪郭線は表示単位を切り替えても常に出す（基礎自治体表示でも
      // 地図の土台として残す）。色と太さだけ切り替えて、塗り分けの境界線
      // （都道府県別）か背景の目安線（基礎自治体別）かを区別する。
      map.setLayoutProperty('pref-fill', 'visibility', level === 'pref' ? 'visible' : 'none')
      map.setLayoutProperty('pref-line', 'visibility', 'visible')
      map.setPaintProperty('pref-line', 'line-color', level === 'pref' ? '#ffffff' : '#6b7280')
      map.setPaintProperty('pref-line', 'line-width', level === 'pref' ? 1 : 1.2)
      if (map.getLayer('admin-boundary-line')) {
        map.setLayoutProperty('admin-boundary-line', 'visibility', level === 'city' ? 'visible' : 'none')
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, prefData, level, mapMetric])

  // 都道府県で絞り込んだら、その県が画面いっぱいに収まるようにズームする。
  useEffect(() => {
    if (!ready || !mapRef.current || !prefFilter) return
    const map = mapRef.current
    let cancelled = false
    loadPrefGeo().then((geo) => {
      if (cancelled) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = geo.features.find((ft: any) => String(Number(ft.properties?.id)).padStart(2, '0') === prefFilter)
      const bounds = boundsOfFeature(f)
      if (bounds) {
        map.fitBounds(bounds, { padding: 48, duration: 800, maxZoom: 12 })
      }
    })
    return () => {
      cancelled = true
    }
  }, [ready, prefFilter])

  // 都道府県を絞り込んでいない状態で基礎自治体別に切り替えたときは、今見ている
  // 場所を中心にズームインする（全国表示のままだと市区町村界が出ないため）。
  const prevLevelRef = useRef<'pref' | 'city'>(level)
  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current
    if (prevLevelRef.current !== 'city' && level === 'city' && !prefFilter) {
      const targetZoom = Math.max(map.getZoom(), 8)
      map.easeTo({ zoom: targetZoom, duration: 800 })
    }
    prevLevelRef.current = level
  }, [ready, level, prefFilter])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current
    const values = cityData.map((c) => c.per_capita_g).filter((v): v is number => v !== null && v !== undefined)
    const breaks = tailWeightedBreaks(values)
    if (level === 'city') onBreaksChange?.(breaks)
    const features = cityData
      .filter((c) => c.lat !== null && c.lng !== null)
      .map((c) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [c.lng as number, c.lat as number] },
        properties: {
          city_code: c.city_code,
          name: `${c.pref_name} ${c.city_name}`,
          value: c.per_capita_g,
          color: colorForValue(c.per_capita_g, breaks),
          radius: FIXED_BUBBLE_RADIUS,
        },
      }))
    const fc = { type: 'FeatureCollection' as const, features }
    const src = map.getSource('municipalities') as maplibregl.GeoJSONSource | undefined
    if (src) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      src.setData(fc as any)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addSource('municipalities', { type: 'geojson', data: fc as any })
      map.addLayer({
        id: 'city-circle',
        type: 'circle',
        source: 'municipalities',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      })
      map.on('click', 'city-circle', (e: maplibregl.MapLayerMouseEvent) => {
        const f = e.features?.[0]
        if (!f) return
        onSelectCity(String(f.properties?.city_code), String(f.properties?.name))
      })
      map.on('mousemove', 'city-circle', (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0]
        if (!f || !popupRef.current) return
        const name = f.properties?.name
        const val = f.properties?.value
        const html = `<strong>${name}</strong><br/>${val != null ? Number(val).toFixed(1) + ' g/人日' : 'データなし'}`
        popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map)
      })
      map.on('mouseleave', 'city-circle', () => {
        map.getCanvas().style.cursor = ''
        popupRef.current?.remove()
      })
    }
    map.setLayoutProperty('city-circle', 'visibility', level === 'city' ? 'visible' : 'none')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cityData, level])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
