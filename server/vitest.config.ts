import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    // Tests must never call paid or rate-limited providers or depend on local keys
    env: { LLM_PROVIDER: 'local', LLM_API_KEY: '', SPEECH_TO_TEXT_API_KEY: '', TEXT_TO_SPEECH_API_KEY: '' },
  },
});
