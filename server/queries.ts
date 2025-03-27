import { Poem, pgSequelConn } from "./entity/poem";
import { Line } from "./entity/line";
import { ILine, IPoem } from "../src/types";
import { logger } from "./utilities/loggerUtils";

(async () => {
    try {
        await pgSequelConn.authenticate();
        await Poem.sync(); // make sure the table exists
        await Line.sync(); // make sure the table exists
        logger.debug("Connection has been established successfully.");
    } catch (error) {
        logger.error("Unable to connect to the database:", error);
    }
})();

async function returnPoems(nPoems: number) {
    try {
        return await Poem.findAll({
            attributes: [ "id", "createdAt", "title", "content" ],
            limit: nPoems,
            order: [ [ "createdAt", "DESC" ] ],
        });
    } catch ({ stack }) {
        return stack;
    }
}

async function getPoem(ID: number) {
    try {
        return await Poem.findOne({
            attributes: [ "id", "createdAt", "title", "content" ],
            where: {
                id: ID,
            },
        });
    } catch ({ stack }) {
        return stack;
    }
}

async function storePoem({ title, content }: IPoem) {
    try {
        await Poem.create({ content, title });
    } catch ({ stack }) {
        logger.debug(stack);
    }
}

async function storeLine({
    ID,
    contributionIndex,
    content,
    authorDevice,
    passerDevice,
    editLength,
    addedAt,
}: ILine) {
    try {
        await Line.create({
            ID,
            contributionIndex,
            content,
            authorDevice,
            passerDevice,
            editLength,
            addedAt,
        });
    } catch ({ stack }) {
        logger.debug(stack);
    }
}

export { getPoem, returnPoems, storePoem, storeLine };
