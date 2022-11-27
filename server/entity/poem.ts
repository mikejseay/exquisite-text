import {
    DataTypes,
    Sequelize,
} from "sequelize";

const isProduction = process.env.NODE_ENV === "production";
const connectionString = `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;

export const pgSequelConn = new Sequelize(
    isProduction && process.env.DATABASE_URL
        ? process.env.DATABASE_URL
        : connectionString,
    isProduction && process.env.DATABASE_URL
        ? {
            dialectOptions: {
                ssl: {
                    rejectUnauthorized: false,
                    require: true,
                },
            },
        }
        : {},
);

export const Poem = pgSequelConn.define(
    "poem",
    {
        // Model attributes are defined here
        content: {
            allowNull: false,
            type: DataTypes.TEXT,
        },
        title: {
            allowNull: false,
            type: DataTypes.TEXT,
        },
    },
    {
        // Other model options go here
    },
);
