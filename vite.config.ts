import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // По умолчанию импорт стилей подменяется пустышкой, включая `?raw`,
    // которым тест читает исходный CSS. Включаем обработку точечно: на всех
    // файлах сразу jsdom начинает применять стили и прячет узлы от запросов
    // по роли.
    css: { include: [/responsive\.css/] },
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      exclude: ['src/assets/**'],
    },
  },
});
