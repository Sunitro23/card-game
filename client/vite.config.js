import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const remoteHost = process.env.VITE_REMOTE_HOST;

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: remoteHost ? [remoteHost] : [],
    hmr: remoteHost
      ? {
          protocol: "wss",
          host: remoteHost,
          clientPort: 443
        }
      : undefined
  },
  preview: {
    host: "127.0.0.1",
    allowedHosts: remoteHost ? [remoteHost] : []
  }
});
