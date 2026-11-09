// Runs every scenario of src/iframe-scenarios.ts in a real browser and prints a table.
//
//   npm start            (in another terminal)
//   node scripts/iframe-test.mjs [chromium|firefox] [scenario-id ...]
//
// Playwright is not a dependency of this project: it is resolved from here first, then
// from ../Moorhen/baby-gru. Set CHROMIUM_PATH to use a specific Chromium build.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function loadPlaywright() {
    for (const base of [import.meta.url, new URL("../../Moorhen/baby-gru/package.json", import.meta.url).href]) {
        try {
            return createRequire(base)("playwright");
        } catch {}
    }
    throw new Error("playwright not found: npm i -D playwright, or check out ../Moorhen/baby-gru");
}

// Read the scenario list from the TypeScript source without a build step.
function loadScenarios() {
    const src = readFileSync(fileURLToPath(new URL("../src/iframe-scenarios.ts", import.meta.url)), "utf8");
    const body = src.slice(src.indexOf("= [") + 2, src.lastIndexOf("];") + 1);
    return Function(`return ${body}`)();
}

const [browserName = "chromium", ...only] = process.argv.slice(2);
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const TIMEOUT_MS = 120_000;

const pw = loadPlaywright();
const scenarios = loadScenarios().filter((s) => only.length === 0 || only.includes(s.id));
const browser = await pw[browserName].launch({
    headless: true,
    executablePath: browserName === "chromium" ? process.env.CHROMIUM_PATH : undefined,
    args: browserName === "chromium" ? ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] : [],
});
console.log(`${browserName} ${browser.version()}\n`);

const rows = [];
for (const s of scenarios) {
    const page = await browser.newPage();
    const logs = [];
    page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
    page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
    page.on("worker", (w) => logs.push(`[worker] ${w.url()}`));

    await page.goto(`${BASE}/iframe-host.html?s=${s.id}&h=${s.parent}`);
    let result;
    try {
        await page.waitForFunction(() => window.__iframeTestResult, null, { timeout: TIMEOUT_MS });
        result = await page.evaluate(() => window.__iframeTestResult);
    } catch {
        result = { ok: false, message: "no result from iframe", crossOriginIsolated: "?", sharedArrayBuffer: "?" };
    }
    const parentCoi = await page.evaluate(() => window.crossOriginIsolated);
    rows.push({
        scenario: s.id,
        parentCOI: parentCoi,
        frameCOI: result.crossOriginIsolated,
        SAB: result.sharedArrayBuffer,
        result: result.ok ? "OK" : "FAIL",
        expected: s.expect,
        detail: result.message,
    });
    if (process.env.VERBOSE || !result.ok) {
        console.log(`--- ${s.id} logs (last 15) ---`);
        for (const l of logs.slice(-15)) console.log("  " + l.slice(0, 300));
    }
    await page.close();
}
await browser.close();
console.table(rows);
