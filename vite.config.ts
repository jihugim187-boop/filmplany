import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 주소: https://<계정>.github.io/filmplany/
// base 경로는 레포 이름과 같아야 한다.
export default defineConfig({
  base: '/filmplany/',
  plugins: [react()],
})
