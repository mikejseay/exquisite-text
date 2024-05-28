export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function isAcceptableShape(lineOne: string,
    lineTwo: string,
    idealCharsOnLineOne: number,
    idealCharsOnLineTwo: number,
    forceIncomplete: boolean,
): boolean {
    // Determine whether the two poetry lines have an acceptable shape based on
    // the ideal number of characters in each line.
    // If we are "forcing an incomplete response" by lengthening line two,
    // we relax one of the conditions for an acceptable shape.
    const minLengthLineOne = 0.6 * idealCharsOnLineOne;
    const maxLengthLineOne = 1.4 * idealCharsOnLineOne;
    const minLengthLineTwo = 0.6 * idealCharsOnLineTwo;
    const maxLengthLineTwo = 1.4 * idealCharsOnLineTwo;

    const lengthLineOne = lineOne.length;
    const lengthLineTwo = lineTwo.length;

    if (forceIncomplete) {
        return !(lengthLineOne < minLengthLineOne || lengthLineOne > maxLengthLineOne || lengthLineTwo < minLengthLineTwo);
    } else {
        return !(lengthLineOne < minLengthLineOne || lengthLineOne > maxLengthLineOne || lengthLineTwo < minLengthLineTwo || lengthLineTwo > maxLengthLineTwo);
    }

}

export function canBeFixedByShifting(lineOne: string,
    lineTwo: string,
    idealCharsOnLineOne: number,
    idealCharsOnLineTwo: number,
): boolean {
    // A pair of poem lines can be fixed by shifting
    // if the shape is not acceptable and line two is longer than line one.
    const minLengthLineOne = 0.6 * idealCharsOnLineOne;
    const maxLengthLineOne = 1.4 * idealCharsOnLineOne;
    const minLengthLineTwo = 0.6 * idealCharsOnLineTwo;
    const maxLengthLineTwo = 1.4 * idealCharsOnLineTwo;

    const lengthLineOne = lineOne.length;
    const lengthLineTwo = lineTwo.length;

    if (
        (lengthLineOne < minLengthLineOne || lengthLineOne > maxLengthLineOne) ||
        (lengthLineTwo < minLengthLineTwo || lengthLineTwo > maxLengthLineTwo)
    ) {
        if (lengthLineTwo > lengthLineOne) {
            return true;
        }
    }
    return false;
}

export function processPoetryLines(
    lineOne: string,
    lineTwo: string,
): [string, string] {
    // Shift words from the beginning of line two back to the end of line one
    // until line one is about twice as long as line two.

    const wordsLineTwo = lineTwo.split(" ");
    const wordsToMove: string[] = [];

    while (lineOne.length < 2 * lineTwo.length && wordsLineTwo.length > 0) {
        const wordToMove = wordsLineTwo.shift();
        if (!wordToMove) {
            break;
        }
        wordsToMove.push(wordToMove);
        lineOne += " " + wordsToMove[wordsToMove.length - 1];
        lineTwo = wordsLineTwo.join(" ");
    }

    return [ lineOne, lineTwo ];
}

function main() {
    // Example usage:
    const lineOne = "A quick brown fox";
    const lineTwo = "jumps over the lazy dog who is lying in the sun";
    const idealCharsOnLineOne = 20;
    const idealCharsOnLineTwo = 30;

    if (canBeFixedByShifting(lineOne, lineTwo, idealCharsOnLineOne, idealCharsOnLineTwo)) {
        const [ lineOneModified, lineTwoModified ] = processPoetryLines(lineOne, lineTwo);
        console.log("Line One Modified:", lineOneModified);
        console.log("Line Two Modified:", lineTwoModified);
    }
}
