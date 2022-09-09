import { IPoem } from "../../types";

export async function getPoemById(id: IPoem["id"]) {
    try {
        const response = await fetch(`http://localhost:3000/poems/${id}`);
        const json = await response.json();
        return json;
    } catch (error) {
        console.log(`No poem found with id: ${id} (${error})`);
    }
}

export async function getPoems() {
    try {
        const response = await fetch("http://localhost:3000/poems/");
        const json = await response.json();
        return (json);
    } catch (error) {
        console.log(`No poems found (${error})`);
    }
}
