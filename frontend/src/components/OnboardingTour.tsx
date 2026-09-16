import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type TourStage = 'hidden' | 'welcome' | 'running'

interface Step {
  target: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    target: '[data-tour="map"]',
    title: '① 地図で全国を一望',
    body: '都道府県ごとのごみ排出量やリサイクル率を、色の濃淡でひと目で確認できます。都道府県をクリックすると、その地域にズームします。',
  },
  {
    target: '[data-tour="year"]',
    title: '② 年度を切り替える',
    body: '令和元〜6年度のデータを年度別に切り替えたり、全期間の合計を見たりできます。',
  },
  {
    target: '[data-tour="category"]',
    title: '③ 区分を切り替える',
    body: '家庭から出る「生活系」、お店やオフィスから出る「事業系」、その合計を切り替えて比較できます。',
  },
  {
    target: '[data-tour="level"]',
    title: '④ 都道府県別・市区町村別を切り替える',
    body: 'より細かい市区町村単位のデータも見ることができます。',
  },
  {
    target: '[data-tour="ranking"]',
    title: '⑤ ランキングで比較する',
    body: '指標を選んで全国のランキングを確認できます。気になる自治体をクリックすると、経年の推移グラフが開きます。',
  },
  {
    target: '[data-tour="articles"]',
    title: '⑥ 深掘り記事もあわせてチェック',
    body: '気になる数字が見つかったら、その背景を解説する「読み物」記事も読んでみてください。選んだ自治体に関連する記事が表示されます。',
  },
]

interface Props {
  stage: TourStage
  step: number
  onStepChange: (step: number) => void
  onStart: () => void
  onSkip: () => void
  onClose: () => void
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 8
const VIEWPORT_MARGIN = 16

export default function OnboardingTour({ stage, step, onStepChange, onStart, onSkip, onClose }: Props) {
  const [rect, setRect] = useState<Rect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (stage !== 'running') return
    const current = STEPS[step]
    if (!current) return

    function measure() {
      const el = document.querySelector(current.target)
      if (!el) {
        setRect(null)
        return
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // scrollIntoView はアニメーション中なので、少し待ってから測る。
      window.setTimeout(() => {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }, 220)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [stage, step])

  // 実際のツールチップのサイズを測ってから、ビューポート内に収まる位置を
  // 計算する。useLayoutEffectなのでペイント前に確定し、古い位置がちらつく
  // ことはない。これをしないと、ハイライト対象が画面上部に近い小さい
  // ウィンドウなどで、ツールチップが画面外にはみ出してしまう。
  useLayoutEffect(() => {
    if (stage !== 'running') return
    const el = tooltipRef.current
    if (!el) return
    const w = el.offsetWidth
    const h = el.offsetHeight

    if (!rect) {
      // ハイライト対象が見つからないときは画面中央に表示する。
      setTooltipPos({
        top: Math.max(VIEWPORT_MARGIN, (window.innerHeight - h) / 2),
        left: Math.max(VIEWPORT_MARGIN, (window.innerWidth - w) / 2),
      })
      return
    }

    const gap = 12
    let top = rect.top + rect.height + PADDING + gap // まずは対象の下に置く
    if (top + h > window.innerHeight - VIEWPORT_MARGIN) {
      const above = rect.top - PADDING - gap - h // 入らなければ上に置く
      if (above >= VIEWPORT_MARGIN) top = above
    }
    // 上下どちらにも収まらない場合でも、最終的に必ずビューポート内に
    // クランプする（対象と多少重なっても、画面外に消えるよりまし）。
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - h - VIEWPORT_MARGIN))
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, window.innerWidth - w - VIEWPORT_MARGIN))

    setTooltipPos({ top, left })
  }, [rect, step, stage])

  if (stage === 'hidden') return null

  if (stage === 'welcome') {
    return (
      <div className="tour-backdrop" role="dialog" aria-modal="true" aria-label="はじめての方へ">
        <div className="tour-welcome">
          <h2>はじめての方へ</h2>
          <p>
            このダッシュボードの使い方を、1分ほどのツアーでご案内します。地図・ランキング・推移グラフの見方をひと通り確認できます。
          </p>
          <div className="tour-welcome-actions">
            <button type="button" className="toggle-btn" onClick={onSkip}>
              スキップしてすぐに使う
            </button>
            <button type="button" className="tour-btn-primary" onClick={onStart}>
              ツアーを始める
            </button>
          </div>
        </div>
      </div>
    )
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="tour-backdrop" onClick={onClose}>
      {rect && (
        <div
          className="tour-spotlight"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
          }}
        />
      )}
      <div
        ref={tooltipRef}
        className="tour-tooltip"
        style={{
          top: tooltipPos?.top ?? 0,
          left: tooltipPos?.left ?? 0,
          visibility: tooltipPos ? 'visible' : 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="tour-progress">
          {step + 1} / {STEPS.length}
        </p>
        <h3>{current.title}</h3>
        <p>{current.body}</p>
        <div className="tour-tooltip-actions">
          <button type="button" className="tour-btn-text" onClick={onClose}>
            スキップ
          </button>
          <div className="tour-tooltip-nav">
            {step > 0 && (
              <button type="button" className="toggle-btn small" onClick={() => onStepChange(step - 1)}>
                戻る
              </button>
            )}
            {!isLast && (
              <button type="button" className="tour-btn-primary small" onClick={() => onStepChange(step + 1)}>
                次へ
              </button>
            )}
            {isLast && (
              <button type="button" className="tour-btn-primary small" onClick={onClose}>
                完了
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
