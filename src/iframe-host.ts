import { SCENARIOS } from "./iframe-scenarios";

const params = new URLSearchParams(location.search);
const scenario = SCENARIOS.find((s) => s.id === params.get("s")) ?? SCENARIOS[0];

// Links to every scenario, each with its own parent headers.
const list = document.getElementById("scenarios")!;
for (const s of SCENARIOS) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `/iframe-host.html?s=${s.id}&h=${s.parent}`;
    a.textContent = s.title;
    if (s === scenario) li.className = "current";
    li.append(a);
    list.append(li);
}

const set = (id: string, text: string) => (document.getElementById(id)!.textContent = text);
set("scenario", `${scenario.id}: ${scenario.title} (parent h=${scenario.parent}, frame h=${scenario.frame})`);
set("expected", scenario.expect);
set("parent-coi", String(window.crossOriginIsolated));

// 127.0.0.1 and localhost are different origins on the same dev server.
const otherHost = location.hostname === "localhost" ? "127.0.0.1" : "localhost";
const frameOrigin = scenario.crossOrigin ? `${location.protocol}//${otherHost}:${location.port}` : location.origin;
const src = `${frameOrigin}/iframe-embed.html?h=${scenario.frame}`;
set("frame-src", src + (scenario.allow ? `  [allow="${scenario.allow}"]` : ""));

const iframe = document.createElement("iframe");
if (scenario.allow) iframe.allow = scenario.allow;
iframe.src = src;
document.getElementById("frame-container")!.append(iframe);

// The embedded page reports its result with postMessage.
window.addEventListener("message", (event) => {
    if (event.data?.type !== "moorhen-iframe-test") return;
    const result = event.data.result;
    (window as any).__iframeTestResult = result;
    const el = document.getElementById("result")!;
    el.className = result.ok ? "ok" : "fail";
    el.textContent = `${result.ok ? "OK" : "FAILED"}: ${result.message} (frame crossOriginIsolated=${result.crossOriginIsolated}, SharedArrayBuffer=${result.sharedArrayBuffer})`;
});
