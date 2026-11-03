/**
 * An example Moorhen plugin, in plain TypeScript.
 *
 * Its UI is markup in index.html, inside <moorhen-web-component>, with slot="example-plugin". It is
 * built from Moorhen's UI elements (<moorhen-button>, <moorhen-toggle>, …), which look like the rest of
 * Moorhen and read its state. This file adds a "Plugin" entry to Moorhen's menu, opening a modal that
 * shows that slot, and wires the controls with ordinary DOM code.
 */
import type {
    MoorhenChainSelectElement,
    MoorhenInstance,
    MoorhenMoleculeSelectElement,
    MoorhenSliderElement,
    MoorhenToggleElement,
} from "moorhen/web-component";

const byId = <E extends HTMLElement>(id: string) => document.getElementById(id) as E;

/** Adds the plugin to Moorhen. Returns a function that removes it again. */
export function installExamplePlugin(instance: MoorhenInstance): () => void {
    // A modal showing the slot, and a menu entry opening it
    const removeModal = instance.uiExtensions.addModal({
        id: "example-plugin",
        title: "Example plugin",
        slotName: "example-plugin",
        initialWidth: 420,
    });
    const removeMenu = instance.menuSystem?.addMainMenu({ type: "modal", label: "Plugin", icon: "MatSymAdd", modal: "example-plugin" },4);

    const axes = byId<MoorhenToggleElement>("plugin-axes");
    const zoom = byId<MoorhenSliderElement>("plugin-zoom");
    const molecule = byId<MoorhenMoleculeSelectElement>("plugin-molecule");
    const chains = byId<MoorhenChainSelectElement>("plugin-chains");

    // Moorhen → controls: they show its state, also when it is changed elsewhere in Moorhen.
    // Setting a property fires no event, so this does not loop back into Moorhen.
    const state = instance.store.getState().sceneSettings;
    axes.checked = state.drawAxes;
    zoom.value = state.zoom;
    const unsubscribe = [
        instance.subscribeToStore(s => s.sceneSettings.drawAxes, drawAxes => (axes.checked = drawAxes)),
        instance.subscribeToStore(s => s.sceneSettings.zoom, value => (zoom.value = value)),
    ];

    // Controls → Moorhen: `change` once the user made a change, `input` while they are making it
    axes.addEventListener("change", () => instance.sceneSettings.setDrawAxes(axes.checked));
    zoom.addEventListener("input", () => instance.sceneSettings.setZoom(zoom.value));

    byId("plugin-load").addEventListener("click", () => {
        instance.files.loadFiles({ url: "/MoorhenAssets/tutorials/moorhen-tutorial-structure-number-1.ent", filename: "tutorial-1.ent" });
    });

    // The selection is read when needed. The chain list follows the molecule select by itself
    // (for="plugin-molecule" in the markup), also its own first pick.
    byId("plugin-report").addEventListener("click", () => {
        const picked = instance.getMolecule(molecule.value ?? "");
        instance.snackbar.enqueueSnackbar({
            message: picked ? `${picked.name}: chains ${chains.values.join(", ")}` : "Load a structure first",
            variant: "info",
        });
    });

    return () => {
        removeModal();
        removeMenu?.();
        unsubscribe.forEach(stop => stop());
    };
}
