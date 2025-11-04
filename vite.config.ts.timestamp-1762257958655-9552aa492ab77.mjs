// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["5173-i4l0bz47pmfmf9ikq927r-5bbdf062.manus-asia.computer"],
    // ADDED: To prevent "Blocked request" error
    hmr: {
      protocol: "wss",
      clientPort: 443
    },
    proxy: {
      "/auth/v1": {
        target: "https://rvlotczavccreigdzczo.supabase.co",
        changeOrigin: true,
        secure: true
      },
      "/rest/v1": {
        target: "https://rvlotczavccreigdzczo.supabase.co",
        changeOrigin: true,
        secure: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoICApXSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIGFsbG93ZWRIb3N0czogWyc1MTczLWk0bDBiejQ3cG1mbWY5aWtxOTI3ci01YmJkZjA2Mi5tYW51cy1hc2lhLmNvbXB1dGVyJ10sIC8vIEFEREVEOiBUbyBwcmV2ZW50IFwiQmxvY2tlZCByZXF1ZXN0XCIgZXJyb3JcbiAgICBobXI6IHtcbiAgICAgIHByb3RvY29sOiAnd3NzJyxcbiAgICAgIGNsaWVudFBvcnQ6IDQ0M1xuICAgIH0sXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXV0aC92MSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9ydmxvdGN6YXZjY3JlaWdkemN6by5zdXBhYmFzZS5jbycsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiB0cnVlXG4gICAgICB9LFxuICAgICAgJy9yZXN0L3YxJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL3J2bG90Y3phdmNjcmVpZ2R6Y3pvLnN1cGFiYXNlLmNvJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0gICk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBUSxDQUFDO0FBQUEsRUFDbkIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sY0FBYyxDQUFDLHlEQUF5RDtBQUFBO0FBQUEsSUFDeEUsS0FBSztBQUFBLE1BQ0gsVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2Q7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBRzsiLAogICJuYW1lcyI6IFtdCn0K
