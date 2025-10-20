import { MoorhenWebComponentNoReact, MoorhenMolecule, addMolecule } from "moorhen";

const baseUrl = "https://www.ebi.ac.uk/pdbe/entry-files";
class MyMoorhen extends MoorhenWebComponentNoReact {
    // custom Moorhen functions

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
        //newMolecule.setBackgroundColour(this.backgroundColor);
        //newMolecule.defaultBondOptions.smoothness = this.defaultBondSmoothness;
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
const moorhenInstance = moorhen1.moorhenInstanceRef.current;

function load7avk(): void {
    moorhen1.loadPDB("7avk");
}
const loadButton = document.getElementById("load-7avk");
loadButton?.addEventListener("click", load7avk);
