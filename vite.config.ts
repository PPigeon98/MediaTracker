import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(async ({ command }) => {
  const devHost = process.env.TAURI_DEV_HOST;
  const listenAllInterfaces = command === "serve";

  return {
    plugins: [vue()],

    clearScreen: false,
    server: {
      port: 6969,
      strictPort: true,
      host: listenAllInterfaces ? true : false,
      hmr: devHost
        ? {
            protocol: "ws",
            host: devHost,
            port: 6969,
          }
        : undefined,
      watch: {
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
