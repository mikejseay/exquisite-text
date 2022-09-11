import * as React from "react";

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

// this function allows us to get the most current value of a state variable
// with the third output argument "ref"
// https://stackoverflow.com/questions/53845595/wrong-react-hooks-behaviour-with-event-listener
export function useStateRef(initialValue: boolean) {
    const [ value, setValue ] = React.useState(initialValue);
    const ref = React.useRef(value);

    React.useEffect(() => {
        ref.current = value;
    }, [ value ]);

    return [ value, setValue, ref ] as const;
}