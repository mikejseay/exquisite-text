const { Sequelize, DataTypes } = require("sequelize");

const isProduction = process.env.NODE_ENV === "production";
const connectionString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;

export const pgSequelConn = new Sequelize(
  isProduction && process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : connectionString
);

export const Poem = pgSequelConn.define(
  "Poem",
  {
    // Model attributes are defined here
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    // Other model options go here
  }
);
