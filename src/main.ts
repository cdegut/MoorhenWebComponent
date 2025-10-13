import * as ReactRedux from "react-redux";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import { MoorhenWebComponent, MoorhenMolecule, addMolecule } from "moorhen";

(window as any).ReactRedux = ReactRedux;
(window as any).React = React;
(window as any).ReactDOM = { ...ReactDOM, ...ReactDOMClient };

const baseUrl = "https://www.ebi.ac.uk/pdbe/entry-files";

class MyMoorhen extends MoorhenWebComponent {
    // custom Moorhen functions

    async loadPDB(pdbCode: string) {
        console.log(this.moorhenInstanceRef.current);
        await this.fetchMolecule(`${baseUrl}/download/${pdbCode}.cif`, pdbCode);
        // await fetchMap(${baseUrl}/${pdbCode}_diff.ccp4, ${pdbCode}-FoFc, true)
        // await fetchMap(${baseUrl}/${pdbCode}.ccp4, ${pdbCode}-2FoFc)
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
