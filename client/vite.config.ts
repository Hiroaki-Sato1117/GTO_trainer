import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // 設定ファイルの変更監視を無効化
      ignored: ['**/vite.config.ts', '**/tsconfig*.json'],
    },
  },
  optimizeDeps: {
    // 依存関係の事前バンドル
    include: ['react', 'react-dom', 'zustand'],
  },
})
