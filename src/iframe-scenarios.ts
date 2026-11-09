// Parent/iframe header combinations exercised by iframe-host.html and scripts/iframe-test.mjs.

export type Scenario = {
    id: string;
    title: string;
    /** headers of the parent document (see vite.config.ts) */
    parent: string;
    /** headers of the iframe document */
    frame: string;
    /** load the iframe from the other origin (localhost <-> 127.0.0.1) */
    crossOrigin: boolean;
    /** value of the iframe `allow` attribute */
    allow?: string;
    /** what we expect if the browser behaves per spec */
    expect: string;
};

export const SCENARIOS: Scenario[] = [
    {
        id: "isolated-same",
        title: "Isolated parent, same-origin iframe",
        parent: "coop,coep",
        frame: "coep",
        crossOrigin: false,
        expect: "works",
    },
    {
        id: "plain-same",
        title: "Plain parent, same-origin iframe with COOP+COEP",
        parent: "none",
        frame: "coop,coep",
        crossOrigin: false,
        expect: "fails: COOP is ignored in iframes, the parent is not isolated",
    },
    {
        id: "plain-same-dip",
        title: "Plain parent, same-origin iframe with Document-Isolation-Policy",
        parent: "none",
        frame: "dip",
        crossOrigin: false,
        expect: "works in Chromium 137+, fails elsewhere",
    },
    {
        id: "isolated-cross-noallow",
        title: "Isolated parent, cross-origin iframe, no allow attribute",
        parent: "coop,coep",
        frame: "coep,corp",
        crossOrigin: true,
        expect: "fails: cross-origin-isolated permission not delegated",
    },
    {
        id: "isolated-cross-allow",
        title: "Isolated parent, cross-origin iframe, allow=\"cross-origin-isolated\"",
        parent: "coop,coep",
        frame: "coep,corp",
        crossOrigin: true,
        allow: "cross-origin-isolated",
        expect: "works",
    },
    {
        id: "plain-cross-dip",
        title: "Plain parent, cross-origin iframe with Document-Isolation-Policy",
        parent: "none",
        frame: "dip",
        crossOrigin: true,
        expect: "works in Chromium 137+, fails elsewhere",
    },
];
