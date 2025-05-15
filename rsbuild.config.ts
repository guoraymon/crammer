import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  html: {
    title: '死记硬背1.0',
    favicon: './static/favicon.ico',
  },
  plugins: [pluginReact()],
  source: {
    assetsInclude: /\.csv$/,
  },
});
