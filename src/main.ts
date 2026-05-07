import { registerMoorhenWebComponent } from "moorhen/web-component";
import  { MainMenuEntrySubMenu, MoorhenWebComponent, SubMenuMap } from "moorhen/web-component";

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

// Subscribe to molecule modification events and update the modified molecule text accordingly
moorhenInstance.newMoleculeChangedCallback((moleculeID) => {
    const modifiedMoleculeText = document.getElementById("modified-molecule");
    const molName = moorhenInstance.getMolecule(moleculeID)?.name || moleculeID;
    if (modifiedMoleculeText) {
        modifiedMoleculeText.textContent = `Modified molecule: ${molName}`;
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
    const loadingData = await moorhenInstance?.files.loadFiles([`${baseUrl}/${entryId}.cif`]);
    moorhenInstance?.files.loadFiles([`${baseUrl}/${entryId}.ccp4`, `${baseUrl}/${entryId}_diff.ccp4`]);
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
    icon: "MatSymDownload",
    menu: "extra-menu",
    align: 5,
};

moorhenInstance.menuSystem.addMainMenu(extraMainMenu, 2);

const extraMenu: SubMenuMap = {
    "extra-menu": {
        label: "Extra",
        items: [
            {
                id: "extra-menu-1",
                type: "item",
                label: "Load 1BXN",
                onClick: () => {
                    moorhenInstance.files.loadFiles(`https://www.ebi.ac.uk/pdbe/entry-files/1bxn.cif`);
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

moorhenInstance.menuSystem.addSubmenu(extraMenu);
