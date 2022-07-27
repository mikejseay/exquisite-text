import { Sequelize } from "sequelize";
import { Poem } from "./entity/poem";
import { IPoem } from "../src/types";

const isProduction = process.env.NODE_ENV === "production";
const connectionString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;

const sequelize = new Sequelize(
  isProduction && process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : connectionString
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

async function returnPoems(nPoems: number) {
  try {
    const getAllPoems = await Poem.findall({
      limit: nPoems,
      order: [
        ['time', 'DESC'],
    ],
    });
    console.log(getAllPoems);
    return getAllPoems.rows;
  } catch ({ stack }) {
    return stack;
  }
}

async function storePoem({title, content, time}: IPoem) {
  try {
    const poem = new Poem({ title, content, time });
    console.log(poem.rows[0]);
  } catch ({ stack }) {
    console.log(stack);
  }
}

export { returnPoems, storePoem };
