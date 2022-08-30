import { ILineConstraintDict } from "../types";

export const roomCodeLength = 4;
export const maxNameChars = 13;

export const FABSpace = 10;
export const FABDiameter = 40;
export const headerHeight = 60;

export const shortDur = 3000;

export const lineSepString = "\n";

export const lineConstraints: ILineConstraintDict = {
    long: {
        minCharsOnLineOne: 30,
        maxCharsOnLineOne: 70,
        minCharsOnLineTwo: 18,
        maxCharsOnLineTwo: 36,
        idealCharsOnLineOne: 60,
        idealCharsOnLineTwo: 30,
    },
    short: {
        minCharsOnLineOne: 20,
        maxCharsOnLineOne: 50,
        minCharsOnLineTwo: 12,
        maxCharsOnLineTwo: 24,
        idealCharsOnLineOne: 40,
        idealCharsOnLineTwo: 20,
    },
};