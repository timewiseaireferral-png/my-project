import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(  )],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['5173-i4l0bz47pmfmf9ikq927r-5bbdf062.manus-asia.computer'], // ADDED: To prevent "Blocked request" error
    hmr: {
      protocol: 'wss',
      clientPort: 443
    },
    proxy: {
      '/auth/v1': {
        target: 'https://rvlotczavccreigdzczo.supabase.co',
        changeOrigin: true,
        secure: true
      },
      '/rest/v1': {
        target: 'https://rvlotczavccreigdzczo.supabase.co',
        changeOrigin: true,
        secure: true
      }
    }
  }
}  );
