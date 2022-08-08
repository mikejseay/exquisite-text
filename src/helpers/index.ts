const allPossibleLetters = "abcdefghijklmnopqrstuvwxyz";
const quantityAllPossibleLetters = allPossibleLetters.length;

function generateAlphaCharacter() {
    return allPossibleLetters.charAt(Math.floor(Math.random() * quantityAllPossibleLetters));
}

export function generateAlphaString(stringLength: number) {
    let result = "";
    for (let i = 0; i < stringLength; i++) {
        result += generateAlphaCharacter().toUpperCase();
    }
    return result;
}

export function alphaCharacterRotate(text: string) {
    const a = text.split("");
    for (let i = 0; i < a.length; i++){
        if (allPossibleLetters.includes(a[i])) {
            a[i] = generateAlphaCharacter();
        }
    }

    return a.join("");
}
