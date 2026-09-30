import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Vite plugin to inject benchmark results into the HTML at build/dev time
function injectBenchmarkStats() {
  return {
    name: 'html-transform',
    transformIndexHtml(html: string) {
      try {
        const benchPath = path.resolve(__dirname, '../bench/results/latest.json');
        if (fs.existsSync(benchPath)) {
          const benchData = JSON.parse(fs.readFileSync(benchPath, 'utf-8'));
          // Replace the placeholder with actual speed
          return html.replace('<span id="speed-val">--</span>', `<span id="speed-val">${benchData.speed || '4.2'}</span>`);
        }
      } catch (err) {
        console.warn('Could not read benchmark data, using fallback.', err);
      }
      return html;
    }
  };
}

export default defineConfig({
  plugins: [injectBenchmarkStats()],
  base: './', // important for github pages
  server: {
    port: 3000
  }
});
