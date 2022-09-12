import {
    IGameSettingsInfo,
    ILineConstraintDict,
    LineLength,
} from "../types";

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

// server constants

export const nPoemsInLibrary = 100;
export const nPoemsPerPage = 10;
export const maxEditors = 4;
export const defaultGameSettings: IGameSettingsInfo = {
    lineLength: LineLength.short,
    nPoems: 1,
    nRounds: 2,
};
export const maxMemberTimeSpentInactive = 180000; // ms
export const maxRoomTimeSpentEmpty = 300000; // ms
export const checkActivityInterval = 30000; // ms
export const editorColorArr = [
    "#4F71BE",
    "#B86029",
    "#A9D18E",
    "#B89230",
];
