import {
  pgSequelConn,
  Poem,
} from "./entity/poem";
import { IPoem } from "../src/types";

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
    return await Poem.findAll({
      attributes: ['id', 'createdAt', 'title', 'content'],
      limit: nPoems,
      order: [
        ['createdAt', 'DESC'],
      ],
    });
  } catch ({ stack }) {
    return stack;
  }
}

async function storePoem({title, content }: IPoem) {
  try {
    await Poem.create({ title, content });
  } catch ({ stack }) {
    console.log(stack);
  }
}

export {
  returnPoems,
  storePoem,
};
