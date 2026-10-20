import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve('./resources/js'),
        },
    },
    // тяжёлые библиотеки импорта PDF грузятся лениво — без явного списка Vite находит их
    // уже в работе, пере-оптимизирует и перезагружает страницу посреди импорта
    optimizeDeps: {
        include: [
            'pdfjs-dist/legacy/build/pdf.mjs',
            'pdfjs-dist/legacy/build/pdf.worker.mjs',
            'tesseract.js',
            'proj4',
        ],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-router': ['react-router-dom'],
                    'vendor-redux': ['@reduxjs/toolkit', 'react-redux', 'redux'],
                    'vendor-motion': ['framer-motion'],
                    'vendor-ui': ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-slot'],
                    'vendor-http': ['axios'],
                },
            },
        },
    },
})
