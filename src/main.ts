import { registerMoorhenWebComponent } from "moorhen/web-component";
import  { MainMenuEntrySubMenu, MoorhenWebComponent, SubMenuMap } from "moorhen/web-component";
import type { MoorhenMoleculeSelectElement, MoorhenToggleElement } from "moorhen/web-component";
import { THEME_BACKGROUNDS, currentTheme, onThemeChange, toggleTheme, type Theme } from "./theme-toggle";
import { installExamplePlugin } from "./plugin";

// Register the Moorhen web component so it can be used in the HTML
registerMoorhenWebComponent();

// Get a reference to the Moorhen web component and wait for it to be ready before using it
const moorhen = document.getElementById("moorhen-1") as MoorhenWebComponent;
// getMoorhenInstance returns a promise that resolves to the instance of the component once it's ready
const moorhenInstance = await moorhen.getMoorhenInstance();

// Subscribe to changes in the molecule list and update the loading status text accordingly
moorhenInstance?.subscribeToStore(
    (state) => state.molecules.moleculeList.length,
    (molecules) => {
        const loadingText = document.getElementById("loading-text");
        if (loadingText) {
            loadingText.textContent = `Loading status: ${molecules} molecule(s) loaded.`;
        }
    },
);

// Subscribe to atom hover events and update the hovered atom text accordingly
moorhenInstance.newAtomHoveredCallback((moleculeID, residueNumber, atomName) => {
    const hoveredAtomText = document.getElementById("hovered-atom");
    const molName = moorhenInstance.getMolecule(moleculeID)?.name || moleculeID;
    if (hoveredAtomText) {
        hoveredAtomText.textContent = `Hovered atom: ${atomName} in residue ${residueNumber} of molecule ${molName}`;
    }
});

// Subscribe to molecule modification events and update the modified molecule text accordingly.
// The action is optional: some internal paths report a change without one, and the
// callback can arrive before the molecule is listed, so the name may not resolve yet.
moorhenInstance.newMoleculeChangedCallback((moleculeID, action) => {
    const modifiedMoleculeText = document.getElementById("modified-molecule");
    const molName = moorhenInstance.getMolecule(moleculeID)?.name || `molecule ${moleculeID.slice(0, 8)}`;
    if (modifiedMoleculeText) {
        modifiedMoleculeText.textContent = `Modified molecule: ${molName}${action ? ` (${action})` : ""}`;
    }
});

// Subscribe to file loading events and update the last load text accordingly. The
// second argument is the optional "origin" label passed to loadFiles().
moorhenInstance.files.newFilesLoadedCallback((files, origin) => {
    const lastLoadText = document.getElementById("last-load");
    if (lastLoadText) {
        const names = files.map((file) => file.fileName).join(", ");
        lastLoadText.textContent = `Last load: ${names} (from "${origin}")`;
    }
});

// wrapper function to fetch files from PDBe and load them into the component
async function fetchFromPDBe(entryId: string): Promise<
    {
        type: "molecule" | "map";
        uniqueID: string;
        molNo: number;
        fileName: string;
    }[]
> {
    const baseUrl = "https://www.ebi.ac.uk/pdbe/entry-files";
    // The loadFiles method can take an array of file URLs and will return an array of objects containing information about the loaded files, including a uniqueID that can be used to reference the molecule or map in other methods
    const loadingData = await moorhenInstance?.files.loadFiles([`${baseUrl}/${entryId}.cif`], "PDBe structure");
    moorhenInstance?.files.loadFiles([`${baseUrl}/${entryId}.ccp4`, `${baseUrl}/${entryId}_diff.ccp4`], "PDBe maps");
    return loadingData;
}

let proteinUID: string | null = null;

// Example of using the wrapper function to load a structure from PDBe
async function load7avk(): Promise<void> {
    const data = await fetchFromPDBe("7avk");
    proteinUID = data.find((item) => item.type === "molecule" && item.fileName.endsWith(".cif"))?.uniqueID || null;
}

const loadButton = document.getElementById("load-7avk");
loadButton?.addEventListener("click", load7avk);

// Example of using the uniqueID returned by loadFiles to center on a specific residue in the loaded structure
const centerButton = document.getElementById("center-residue-1231");
centerButton?.addEventListener("click", () => {
    moorhenInstance?.centerOnResidue("A", 1231, proteinUID as string);
});

// ======================================================================================
// Example of adding an extra menu entry to the main menu and populating it with a submenu

const extraMainMenu: MainMenuEntrySubMenu = {
    type: "sub-menu",
    label: "Extra Menu",
    icon: "MatSymExperiment",
    menu: "extra-menu",
    align: 5,
};


moorhenInstance?.menuSystem?.addMainMenu(extraMainMenu, 2);

const extraMenu: SubMenuMap = {
    "extra-menu": {
        label: "Extra",
        items: [
            {
                id: "extra-menu-1",
                type: "item",
                label: "Load 1BXN",
                onClick: () => {
                    moorhenInstance.files.loadFiles(
                        `https://www.ebi.ac.uk/pdbe/entry-files/1bxn.cif`,
                        "Extra menu",
                    );
                },
            },
            {
                id: "extra-menu-2",
                type: "item",
                label: "Do something...",
                onClick: () => {},
            },
            {
                id: "extra-menu-3",
                type: "item",
                label: "Do something...",
                onClick: () => {},
            },
        ],
    },
};

moorhenInstance?.menuSystem?.addSubmenu(extraMenu);

// =============================================================================
// Example of a second main menu whose only item is an HTML slot. The slot is
// filled by markup in index.html, placed inside the <moorhen-web-component>
// element: those elements stay in the page DOM, so the page stylesheet applies
// to them and they are wired up like any other button.

const slotMainMenu: MainMenuEntrySubMenu = {
    type: "sub-menu",
    label: "Page controls",
    ariaLabel: "Page controls",
    icon: "MatSymTune",
    menu: "page-controls-menu",
    align: 5,
};

moorhenInstance?.menuSystem?.addMainMenu(slotMainMenu, 3);

const slotMenu: SubMenuMap = {
    "page-controls-menu": {
        label: "Page controls",
        items: [
            {
                id: "page-controls-slot",
                type: "HTMLslot",
                label: "Page controls",
                slotName: "page-controls",
            },
        ],
    },
};

moorhenInstance?.menuSystem?.addSubmenu(slotMenu);

// Both of these buttons live in the slot, in the page markup.
document.getElementById("slot-load-1bxn")?.addEventListener("click", () => {
    moorhenInstance.files.loadFiles("https://www.ebi.ac.uk/pdbe/entry-files/1bxn.cif", "Slot menu");
});

document.getElementById("slot-toggle-theme")?.addEventListener("click", toggleTheme);

// =============================================================================
// Example of tying the 3D viewport to the page theme. The palette lives in
// theme-toggle.ts, together with the light/dark state itself, so all we do
// here is apply the current value and then follow every later change.

const applyThemeBackground = (theme: Theme): void => {
    moorhenInstance.sceneSettings.setBackgroundColor(THEME_BACKGROUNDS[theme]);
};

applyThemeBackground(currentTheme());
onThemeChange(applyThemeBackground);

// =============================================================================
// Example of a plugin: a "Plugin" menu entry opening a modal of its own, whose content is the
// markup in index.html with slot="example-plugin", built from Moorhen's UI elements. See plugin.ts.

installExamplePlugin(moorhenInstance);

// One of Moorhen's UI elements outside the web component, in the page's own controls
const spin = document.getElementById("page-spin") as MoorhenToggleElement;
spin.checked = moorhenInstance.store.getState().sceneSettings.doSpin;
moorhenInstance.subscribeToStore(s => s.sceneSettings.doSpin, doSpin => (spin.checked = doSpin));
spin.addEventListener("change", () => moorhenInstance.sceneSettings.setDoSpin(spin.checked));

// Another one: the molecules loaded in Moorhen; picking one centres the view on it
const centreOn = document.getElementById("page-molecule") as MoorhenMoleculeSelectElement;
centreOn.addEventListener("change", () => moorhenInstance.getMolecule(centreOn.value ?? "")?.centreOn());
