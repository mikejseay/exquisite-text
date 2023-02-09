import { DataTypes } from "sequelize";
import { pgSequelConn } from "./poem";

export const Line = pgSequelConn.define(
    "line",
    {
    // Model attributes are defined here
        poemID: {
            allowNull: false,
            type: DataTypes.CHAR(36), // uuidv4 is always 36 chars
        },
        lineIndex: {
            allowNull: false,
            type: DataTypes.SMALLINT,
        },
        content: {
            allowNull: false,
            type: DataTypes.STRING, // same as VARCHAR(255)
        },
        authorDevice: {
            allowNull: false,
            type: DataTypes.CHAR(36),
        },
        passerDevice: {
            allowNull: false,
            type: DataTypes.CHAR(36),
        },
        editLength: {
            allowNull: false,
            type: DataTypes.SMALLINT,
        },
        addedAt: {
            allowNull: false,
            type: DataTypes.DATE,
        },
    },
    {
    // Other model options go here
        timestamps: false,
    },
);
