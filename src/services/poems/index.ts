import { IPoem } from "../../types";
import { serverPath } from "../../components/App";

export async function getPoemById(id: IPoem["id"]) {
    console.log(window.location);
    try {
        const response = await fetch(`${serverPath}/poems/${id}`);
        const json = await response.json();
        return json;
    } catch (error) {
        console.log(`No poem found with id: ${id} (${error})`);
    }
}

export async function getPoems() {
    console.log(window.location);
    try {
        const response = await fetch(`${serverPath}/poems/`);
        const json = await response.json();
        return (json);
    } catch (error) {
        console.log(`No poems found (${error})`);
    }
}
