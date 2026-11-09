import { registerMoorhenWebComponent, type MoorhenWebComponent } from "moorhen/web-component";

type Result = {
    ok: boolean;
    message: string;
    crossOriginIsolated: boolean;
    sharedArrayBuffer: boolean;
};

const status = document.getElementById("status")!;
const coi = window.crossOriginIsolated;
const sab = typeof SharedArrayBuffer !== "undefined";
status.textContent = `crossOriginIsolated=${coi}, SharedArrayBuffer=${sab}. Starting Moorhen…`;

let reported = false;
function report(ok: boolean, message: string) {
    if (reported) return;
    reported = true;
    const result: Result = { ok, message, crossOriginIsolated: coi, sharedArrayBuffer: sab };
    status.textContent = `${ok ? "OK" : "FAILED"}: ${message} (crossOriginIsolated=${coi}, SharedArrayBuffer=${sab})`;
    (window as any).__iframeTestResult = result;
    // "*" because the host may be on the other origin; the payload holds nothing private.
    window.parent.postMessage({ type: "moorhen-iframe-test", result }, "*");
}

const TIMEOUT_MS = 90_000;
setTimeout(() => report(false, `timed out after ${TIMEOUT_MS / 1000}s`), TIMEOUT_MS);
window.addEventListener("error", (e) => report(false, `uncaught error: ${e.message}`));
window.addEventListener("unhandledrejection", (e) => report(false, `unhandled rejection: ${e.reason}`));

registerMoorhenWebComponent();
const element = document.getElementById("moorhen-iframe") as MoorhenWebComponent;

try {
    const moorhen = await element.getMoorhenInstance();
    status.textContent += " Instance ready, loading a structure…";
    // A real round-trip through the Coot worker: parse a structure in WebAssembly.
    const url = new URL("/MoorhenAssets/tutorials/moorhen-tutorial-structure-number-1.ent", location.href).href;
    const loaded = await moorhen.files.loadFiles([url], "iframe test");
    const molecule = loaded.find((item) => item.type === "molecule");
    if (molecule && molecule.molNo >= 0) {
        report(true, `loaded ${molecule.fileName} as molNo ${molecule.molNo}`);
    } else {
        report(false, `loadFiles returned ${JSON.stringify(loaded)}`);
    }
} catch (err) {
    report(false, `error: ${err instanceof Error ? err.message : String(err)}`);
}
