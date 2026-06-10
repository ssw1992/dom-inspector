import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DomInspector',
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
    }),
  ],
})
