import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";
// import { copyMoorhenAssetsToPublic } from "moorhen/vite-plugin";

/**
 * Sets the cross-origin isolation headers per request, so the iframe test pages
 * (iframe-host.html / iframe-embed.html) can try different header combinations.
 *
 * Documents (.html): the `h` query parameter lists the headers to send, e.g.
 *   ?h=coop,coep   Cross-Origin-Opener-Policy + Cross-Origin-Embedder-Policy
 *   ?h=dip         Document-Isolation-Policy (Chromium 137+)
 *   ?h=coep,corp   COEP + Cross-Origin-Resource-Policy (cross-origin iframe)
 *   ?h=none        nothing
 * Without `h`, a document gets COOP + COEP, as the main demo needs.
 *
 * Everything else (scripts, workers, wasm, data) always gets COEP, CORP and DIP,
 * so it can be loaded from any of the documents above, including cross-origin ones.
 */
function isolationHeaders(): Plugin {
    const DOC_HEADERS: Record<string, [string, string]> = {
        coop: ["Cross-Origin-Opener-Policy", "same-origin"],
        coep: ["Cross-Origin-Embedder-Policy", "require-corp"],
        corp: ["Cross-Origin-Resource-Policy", "cross-origin"],
        dip: ["Document-Isolation-Policy", "isolate-and-require-corp"],
    };
    return {
        name: "isolation-headers",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = new URL(req.url ?? "/", "http://x");
                const isDocument = url.pathname === "/" || url.pathname.endsWith(".html");
                if (isDocument) {
                    const wanted = (url.searchParams.get("h") ?? "coop,coep").split(",");
                    for (const key of wanted) {
                        const header = DOC_HEADERS[key.trim()];
                        if (header) res.setHeader(...header);
                    }
                } else {
                    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
                    res.setHeader("Document-Isolation-Policy", "isolate-and-require-corp");
                }
                next();
            });
        },
    };
}

export default defineConfig({
    plugins: [isolationHeaders()],
    server: {
        port: 3000,
        // 127.0.0.1 and localhost are two different origins (and sites), which the
        // iframe test uses to embed the viewer cross-origin without a second server.
        host: "127.0.0.1",
        allowedHosts: ["localhost", "127.0.0.1"],
        open: true,
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                iframeHost: resolve(__dirname, "iframe-host.html"),
                iframeEmbed: resolve(__dirname, "iframe-embed.html"),
            },
        },
    },
});
