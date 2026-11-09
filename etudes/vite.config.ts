import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Base44 preview proxy reaches this dev server as `3000-<sandbox-id>.<sandbox
// host domain>`; Vite's host allowlist needs that suffix while previewing.
// Unset BASE44_PREVIEW_MODE leaves Vite's default localhost-only allowlist.
const previewMode = process.env.BASE44_PREVIEW_MODE === "1";
const sandboxHost = process.env.BASE44_SANDBOX_HOST_DOMAIN;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: previewMode && sandboxHost ? [`.${sandboxHost}`] : undefined,
  },
});
