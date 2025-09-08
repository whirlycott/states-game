// ABOUTME: Vitest configuration for testing TypeScript modules  
// ABOUTME: Configured for ESM with DOM environment for speech synthesis testing

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})