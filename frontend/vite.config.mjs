import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 👇 Пробуем загрузить из разных мест
  const env = {
    ...process.env,  // сначала из process.env
    ...loadEnv(mode, path.resolve(__dirname, '..'), ''), // потом из файла
    ...loadEnv(mode, path.resolve(__dirname), '') // и из текущей директории
  }

  
  console.log('🔄 Загружены env переменные для билда:', {
    VITE_API_BASE: env.VITE_API_BASE,
    mode: mode,
    envKeys: Object.keys(env).filter(key => key.includes('VITE'))
  })

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE),
    },
    build: {
      outDir: 'dist',
    }
  }
})