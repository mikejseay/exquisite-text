import {
    Poem,
    pgSequelConn,
} from "./entity/poem";
import {
    Line,
} from "./entity/line";
import { ILine, IPoem } from "../src/types";

(async () => {
    try {
        await pgSequelConn.authenticate();
        console.log("Connection has been established successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
})();

async function returnPoems(nPoems: number) {
    try {
        await Poem.sync();  // make sure the table exists
        await Line.sync();  // make sure the table exists
        return await Poem.findAll({
            attributes: [
                "id",
                "createdAt",
                "title",
                "content",
            ],
            limit: nPoems,
            order: [
                [
                    "createdAt",
                    "DESC",
                ],
            ],
        });
    } catch ({ stack }) {
        return stack;
    }
}

async function getPoem(poemID: number) {
    try {
        console.log("getPoem in queries");
        return await Poem.findOne({
            attributes: [
                "id",
                "createdAt",
                "title",
                "content",
            ],
            where: {
                id: poemID,
            },
            order: [
                [
                    "createdAt",
                    "DESC",
                ],
            ],
        });
    } catch ({ stack }) {
        return stack;
    }
}

async function storePoem({ title, content }: IPoem) {
    try {
        await Poem.create({ content, title });
    } catch ({ stack }) {
        console.log(stack);
    }
}

async function storeLine({ poemID, lineIndex, content, authorDevice, passerDevice, editLength, addedAt }: ILine) {
    try {
        await Line.create({ poemID, lineIndex, content, authorDevice, passerDevice, editLength, addedAt });
    } catch ({ stack }) {
        console.log(stack);
    }
}

export {
    getPoem,
    returnPoems,
    storePoem,
    storeLine,
};
