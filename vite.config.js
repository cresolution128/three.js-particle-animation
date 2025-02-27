import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), glsl()]
});
