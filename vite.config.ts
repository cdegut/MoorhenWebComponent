import { defineConfig } from "vite";
// import { copyMoorhenAssetsToPublic } from "moorhen/vite-plugin";

export default defineConfig({
    server: {
        port: 3000,
        open: true,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        },
    },
});
