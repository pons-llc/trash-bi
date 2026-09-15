import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// データは frontend/public/data (+ /geo) 以下の静的JSONとして配信するので、
// バックエンドへのプロキシは不要（backend/export_static.py が生成したものを
// そのまま Vite の public ディレクトリ経由で返す）。
export default defineConfig({
  plugins: [react()],
})
