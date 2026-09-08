import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { resolveApiPort } from "./shared/env.ts"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "PORT")
  const port = resolveApiPort({ PORT: process.env.PORT ?? env.PORT })
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        "@shared": path.resolve(import.meta.dirname, "./shared"),
      },
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${port}`,
          changeOrigin: true,
        },
      },
    },
  }
})
