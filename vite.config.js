import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // 部署到 GitHub Pages 子路径 https://zhumenglonge.github.io/react-lab/
  // 只在 build 时加前缀，dev 保持 / 方便本地开发
  base: command === 'build' ? '/react-lab/' : '/',
}))
