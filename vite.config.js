import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        // CodeEditor.jsx (CodeMirror + per-language packages) is lazy-loaded
        // via React.lazy() in DeliverableViewer and only fetched on demand
        // when a code file is previewed, so its ~1MB chunk never sits on the
        // critical path of any page load. Raise the warning limit so the
        // build doesn't flag that known, intentional chunk as a problem.
        chunkSizeWarningLimit: 1100,
    },
});
