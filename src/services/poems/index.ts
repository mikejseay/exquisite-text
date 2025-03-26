import { IPoem } from "../../types";
import { logger } from "../../utils/loggerUtils";

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
const serverPath: URL["pathname"] | URL["href"] = isDevelopment
    ? `http://${window.location.hostname}:3000`
    : window.location.origin;

export async function getPoemById(id: IPoem["id"]) {
    try {
        const response = await fetch(`${serverPath}/poems/${id}`);
        return await response.json();
    } catch (error) {
        logger.debug(`No poem found with id: ${id} (${error})`);
    }
}

export async function getPoems() {
    try {
        const response = await fetch(`${serverPath}/poems/`);
        const json = await response.json();
        return (json);
    } catch (error) {
        logger.debug(`No poems found (${error})`);
    }
}
