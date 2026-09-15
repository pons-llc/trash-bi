import { useState } from 'react'

interface Props {
  text: string
  url: string
}

export default function ShareButtons({ text, url }: Props) {
  const [copied, setCopied] = useState(false)
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(`${text}\n${url}`)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // クリップボードAPIが使えない環境では何もしない（ボタン自体は残る）
    }
  }

  return (
    <div className="share-buttons">
      <span className="share-label">この結果をシェア</span>
      <a href={xUrl} target="_blank" rel="noopener noreferrer" className="share-btn share-x" aria-label="Xでシェア">
        X
      </a>
      <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="share-btn share-line" aria-label="LINEでシェア">
        LINE
      </a>
      <button type="button" className="share-btn share-copy" onClick={handleCopy}>
        {copied ? 'コピーしました' : 'リンクをコピー'}
      </button>
    </div>
  )
}
