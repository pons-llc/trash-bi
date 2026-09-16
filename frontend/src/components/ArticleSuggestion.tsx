import { useMemo } from 'react'
import type { Level } from '../api'
import { GENERAL_ARTICLES, getArticleForSelection, type ArticleLink } from '../articleLinks'

interface Props {
  level: Level
  code?: string | null
}

// 選択中の自治体・都道府県に紐づく深掘り記事があればそれを、なければ全国
// 動向を扱った記事をランダムでなく固定ローテーションで1本提示する。
// ダッシュボード単体で終わらせず、/articles/ の読み物へ回遊させるための導線。
export default function ArticleSuggestion({ level, code }: Props) {
  const matched = getArticleForSelection(level, code)
  const fallback = useMemo(() => {
    const idx = code ? code.charCodeAt(0) % GENERAL_ARTICLES.length : 0
    return GENERAL_ARTICLES[idx]
  }, [code])

  const article: ArticleLink = matched ?? fallback
  const isMatched = matched !== null

  return (
    <div className="panel article-suggestion" data-tour="articles">
      <div className="panel-header">
        <h2>読み物</h2>
        <a className="article-suggestion-all" href="/articles/">
          一覧を見る →
        </a>
      </div>
      <a className="article-suggestion-card" href={`/articles/${article.slug}`}>
        <span className="article-suggestion-tag">{isMatched ? 'この自治体を深掘り' : 'おすすめ記事'}</span>
        <p className="article-suggestion-title">{article.title}</p>
        <p className="article-suggestion-hook">{article.hook}</p>
        <span className="article-suggestion-cta">記事を読む →</span>
      </a>
    </div>
  )
}
