import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const remoteHost = env.VITE_REMOTE_HOST;

  return {
    plugins: [react()],
    server: {
      host: remoteHost ? true : "127.0.0.1",
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
      host: remoteHost ? true : "127.0.0.1",
      allowedHosts: remoteHost ? [remoteHost] : []
    }
  };
});
