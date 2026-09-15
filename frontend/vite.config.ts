import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = import.meta.dirname

// データは frontend/public/data (+ /geo) 以下の静的JSONとして配信するので、
// バックエンドへのプロキシは不要（backend/export_static.py が生成したものを
// そのまま Vite の public ディレクトリ経由で返す）。
//
// マルチページ構成: `/` は静的なランディングページ（index.html）、
// `/app/` がこの React ダッシュボード本体（app/index.html）。
// 本番ビルドでは Vite に両方の入力を明示しないと /app/ 側が処理されない。
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        app: resolve(root, 'app/index.html'),
      },
    },
  },
})
