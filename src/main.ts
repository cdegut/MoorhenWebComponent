import { MoorhenWebComponentNoReact, MoorhenMolecule, addMolecule } from "moorhen";
import type { MainMenuEntrySubMenu, SubMenuMap } from "moorhen";

const baseUrl = "https://www.ebi.ac.uk/pdbe/entry-files";
const extraMainMenu: MainMenuEntrySubMenu = {
    type: "sub-menu",
    label: "Extra Menu",
    icon: "MUISymbolDownload",
    menu: "extra-menu",
    align: 5,
};

const extraMenu: SubMenuMap = {
    "extra-menu": {
        label: "Extra",
        items: [
            {
                id: "extra-menu-1",
                type: "item",
                label: "Load 1BXN",
                onClick: () => {
                    moorhen1.loadPDB("1bxn");
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

class MyMoorhen extends MoorhenWebComponentNoReact {
    constructor() {
        super();
        this.urlPrefix = "baby-gru";
    }

    public onInnit = () => {
        const menuSystem = this.moorhenMenuSystemRef.current!;
        menuSystem.addMainMenu(extraMainMenu, 2);
        menuSystem.addSubmenu(extraMenu);
    };

    async loadPDB(pdbCode: string) {
        console.log(this.moorhenInstanceRef.current);
        await this.fetchMolecule(`${baseUrl}/download/${pdbCode}.cif`, pdbCode);
    }

    async fetchMolecule(url: string, molName: string) {
        const dispatch = this.moorhenInstanceRef!.current!.getDispatch();
        const store = this.moorhenInstanceRef!.current!.getStore();
        const monomerLibraryPath = this.moorhenInstanceRef!.current!.paths.monomerLibraryPath;
        const commandCentre = this.moorhenInstanceRef!.current!.getCommandCentreRef();
        const newMolecule = new MoorhenMolecule(commandCentre, store, monomerLibraryPath);

        try {
            await newMolecule.loadToCootFromURL(url, molName);
            if (newMolecule.molNo === -1) {
                throw new Error("Cannot read the fetched molecule...");
            }
            await newMolecule.fetchIfDirtyAndDraw("CBs");
            await newMolecule.addRepresentation("ligands", "/*/*/*/*");
            await newMolecule.centreOn("/*/*/*/*", true, true);

            dispatch(addMolecule(newMolecule));
        } catch (err) {
            console.warn(err);
            console.warn(`Cannot fetch PDB entry from ${url}, doing nothing...`);
        }
    }
}

customElements.define("my-moorhen", MyMoorhen);

const moorhen1 = document.getElementById("moorhen-1") as MyMoorhen;

function load7avk(): void {
    moorhen1.loadPDB("7avk");
}
const loadButton = document.getElementById("load-7avk");
loadButton?.addEventListener("click", load7avk);
