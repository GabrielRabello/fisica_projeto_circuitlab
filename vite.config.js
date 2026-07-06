import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// https://vite.dev/config/
export default defineConfig({
    // Necessário para o GitHub Pages servir os assets sob o subcaminho do repositório.
    base: '/fisica_projeto_circuitlab/',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
