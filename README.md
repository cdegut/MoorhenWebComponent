# Moorhen WebComponent in a plain TypeScript page

A minimal, runnable example of embedding [Moorhen](https://github.com/moorhen-coot/Moorhen) in a
plain TypeScript page (Vite, no framework). The whole Moorhen user interface is bundled inside a
single custom element, which you then drive from your own JavaScript:

```html
<moorhen-web-component id="moorhen-1" width="1000" height="800"></moorhen-web-component>
```

## What the demo shows

`src/main.ts` walks through the steps of a typical integration:

| Step | Call |
| --- | --- |
| Register the custom element | `registerMoorhenWebComponent()` |
| Wait until Moorhen is ready | `await element.getMoorhenInstance()` |
| Load a structure and its maps from PDBe | `moorhenInstance.files.loadFiles([...])` |
| Centre the view on a residue | `moorhenInstance.centerOnResidue("A", 1231, uid)` |
| React to store changes | `moorhenInstance.subscribeToStore(selector, callback)` |
| React to atom hover | `moorhenInstance.newAtomHoveredCallback(callback)` |
| React to molecule changes | `moorhenInstance.newMoleculeChangedCallback(callback)` |
| React to file loading | `moorhenInstance.files.newFilesLoadedCallback(callback)` |
| Add your own menu | `moorhenInstance.menuSystem.addMainMenu(...)` / `addSubmenu(...)` |
| Follow the page theme | `moorhenInstance.sceneSettings.setBackgroundColor(...)` |
| Size to a container | no `width`/`height` attributes: the element fills the box it is placed in |
| Put your own UI in the menu | an `HTMLslot` menu item, plus markup inside the element with a matching `slot` attribute |
| Add a plugin: a modal of your own | `moorhenInstance.uiExtensions.addModal({ slotName })`, a `modal` main menu entry, and markup in that slot (`src/plugin.ts`) |
| Use Moorhen's own controls | `<moorhen-toggle>`, `<moorhen-slider>`, `<moorhen-molecule-select>`, `<moorhen-chain-select for="…">`… in the slot, wired with `addEventListener` and `subscribeToStore` |

The page has two buttons (**Load 7AVK**, **Center on Residue 1231**) and four readouts that the
callbacks keep up to date: loading status, hovered atom, last load (with its `origin` label) and last
modified molecule. The dark/light toggle also repaints the 3D viewport background to match the page.

## Requirements

Moorhen's Coot/CCP4 code is compiled with WebAssembly threads, which need `SharedArrayBuffer`.
Browsers only expose that to **cross-origin isolated** pages, so the server must send both headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

`vite.config.ts` already sets them for the dev server. Keep them if you copy this setup: without
them the component never starts. You can check the result in the browser console with
`window.crossOriginIsolated`, which must be `true`.

## Getting started

```bash
npm install
cp -r node_modules/moorhen/public/MoorhenAssets public/
npm start
```

The copy is not optional. At runtime the element loads `moorhen.css` and the WebAssembly binaries
from `/MoorhenAssets/...`, and `public/*` is git-ignored. **Repeat the copy after every Moorhen
update**, because the wasm binaries can change in any version. `npm run rebuild` does a clean
install plus the copy in one step.

`npm run build` produces a production build in `dist/`.

## Importing Moorhen

There is no bare `import ... from "moorhen"`. The package is consumed through sub-path exports:

```ts
import {
    MoorhenWebComponent,
    registerMoorhenWebComponent,
    type MainMenuEntrySubMenu,
    type SubMenuMap,
} from "moorhen/web-component";
```

React hosts additionally have `moorhen/web-component/utils` for the two helper hooks. See the
[React example](https://github.com/cdegut/MoorhenWebComponentReact).

## Project layout

```
index.html            host page: the element (plus the markup for its menu slot), the two buttons, the four status readouts
src/main.ts           register the element, await the instance, wire up callbacks and the extra menu
src/theme-toggle.ts   light/dark state for the page, which main.ts also reads for the viewport
src/styles.css        design tokens copied from the Moorhen docs site
vite.config.ts        dev server, including the cross-origin isolation headers
```

## Documentation

- [Developer guide](https://moorhen.hosted.york.ac.uk/docs/guides/developer/index.html)
  - [The Moorhen WebComponent](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-intro.html):
    how it works and how the `moorhen` package is organised
  - [Setting up the WebComponent](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-setup.html):
    this example, step by step
  - [Loading data and the MoorhenInstance API](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-instance-api.html)
  - [Adding custom menus](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-menu.html)
  - [Callbacks and subscriptions](https://moorhen.hosted.york.ac.uk/docs/guides/developer/webcomponent-events.html)
- [API reference](https://moorhen.hosted.york.ac.uk/docs/api/index.html)

## Embedding in an iframe

Moorhen's Coot worker always loads a pthreads WebAssembly build (`moorhen.js` / `moorhen64.js`).
It has no single-threaded fallback, so the document that holds `<moorhen-web-component>` must be
cross-origin isolated (`window.crossOriginIsolated === true`) even when it sits in an iframe. Without
isolation, Moorhen does not throw an error: it hangs, and the console repeats
`still waiting on run dependencies: loading-workers`.

`iframe-host.html` and `iframe-embed.html` test this. Open `http://localhost:3000/iframe-host.html`,
or run every scenario headless with `node scripts/iframe-test.mjs [chromium|firefox]` while
`npm start` is running. Results with Chromium 156 and Firefox 153:

| Parent page | Iframe | Chromium | Firefox |
| --- | --- | --- | --- |
| COOP + COEP | same-origin, COEP | works | works |
| COOP + COEP | cross-origin, COEP + CORP, `allow="cross-origin-isolated"` | works | works |
| COOP + COEP | cross-origin, COEP + CORP, no `allow` | **fails** | works |
| no headers | COOP + COEP | **fails** | **fails** |
| no headers | `Document-Isolation-Policy: isolate-and-require-corp` | works | **fails** |

What to do:

- **You control the parent page:** send COOP + COEP on it, send COEP (+ CORP if cross-origin) on the
  iframe document, and set `allow="cross-origin-isolated"` on a cross-origin iframe. This works in
  every browser.
- **You don't control the parent page:** send `Document-Isolation-Policy: isolate-and-require-corp`
  on the iframe document. Only Chromium 137+ supports it. In Firefox and Safari, open Moorhen in its
  own tab or window instead.
