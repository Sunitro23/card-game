import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
    server: {
        host: true,
            port: 5173,
                strictPort: true,
                    allowedHosts: ["owlbear.sunitro.de"],
                        hmr: {
                              protocol: "wss",
                                    host: "owlbear.sunitro.de",
                                          clientPort: 443,
                                              },
                                                },
                                                  preview: {
                                                      host: true,
                                                          allowedHosts: ["owlbear.sunitro.de"],
                                                            },
                                                            });