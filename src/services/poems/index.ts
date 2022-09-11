import { IPoem } from "../../types";

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const serverPath: URL["pathname"] | URL["href"] = isDevelopment
    ? `http://${window.location.hostname}:3000`
    : window.location.origin;

export async function getPoemById(id: IPoem["id"]) {
    try {
        const response = await fetch(`${serverPath}/poems/${id}`);
        return await response.json();
    } catch (error) {
        console.log(`No poem found with id: ${id} (${error})`);
    }
}

export async function getPoems(offset = 0) {
    try {
        const response = await fetch(`${serverPath}/poems/${offset === 0
            ? ""
            : offset}`);
        const json = await response.json();
        return (json);
    } catch (error) {
        console.log(`No poems found (${error})`);
    }
}
