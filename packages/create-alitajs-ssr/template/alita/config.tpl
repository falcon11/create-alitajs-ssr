import { defineConfig } from 'alita';

export default defineConfig({
  ssr: {
    // dev 模式 服务端渲染交给 eggjs 处理
    devServerRender: false,
  },
  hash: true,
  outputPath: '../public',
  manifest: {
    fileName: '../../config/manifest.json',
  },
  proxy: {
    '/api': {
      target: 'http://localhost:7001',
    },
  },
  dynamicImport: {},
  publicPath: process.env.NODE_ENV === 'development' ? process.env.PUBLIC_PATH : '/public/',
});
