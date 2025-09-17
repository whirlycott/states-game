import { defineConfig } from 'vite'
import { execSync } from 'child_process'

function getBuildInfo() {
  try {
    const gitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    const timestamp = new Date().toISOString()
    return { gitHash, timestamp }
  } catch (error) {
    console.warn('Could not get git info:', error)
    return { gitHash: 'unknown', timestamp: new Date().toISOString() }
  }
}

export default defineConfig({
  server: {
    port: 8000,
    headers: {
      // Security headers for development server
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  assetsInclude: ['**/*.svg'],
  plugins: [
    {
      name: 'inject-build-info',
      transformIndexHtml(html) {
        const { gitHash, timestamp } = getBuildInfo()
        const buildComment = `<!-- Build Info: Git Hash ${gitHash}, Deployed ${timestamp} -->`
        return html.replace('<head>', `<head>\n    ${buildComment}`)
      }
    }
  ]
})