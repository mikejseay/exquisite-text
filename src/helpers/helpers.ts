import * as React from "react";

import { IPoem } from "types/types";

export function isNil(value: unknown): value is null | undefined {
    return value == null;
}

export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    wait: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const debounced = (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
    };
    debounced.cancel = () => clearTimeout(timeoutId);
    return debounced;
}

const allPossibleLetters = "abcdefghijklmnopqrstuvwxyz";
const quantityAllPossibleLetters = allPossibleLetters.length;

function generateAlphaCharacter() {
    return allPossibleLetters.charAt(Math.floor(Math.random() * quantityAllPossibleLetters));
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

export function getItemsOnCurrentPage(items: IPoem[], page: number, itemsPerPage: number): IPoem[] {
    const { length } = items;
    const firstIndex = (page - 1) * itemsPerPage;
    const lastIndex = Math.min(firstIndex + itemsPerPage, length);

    const itemsOnCurrentPage: IPoem[] = [];
    for (let i = firstIndex; i < lastIndex; i++) {
        itemsOnCurrentPage.push(items[i]);
    }
    return itemsOnCurrentPage;
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
