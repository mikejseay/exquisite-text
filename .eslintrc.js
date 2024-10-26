module.exports = {
    "ignorePatterns": [ "src/data/multipleDrawings.ts" ],
    "env": {
        "browser": true,
        "es2021": true,
        "node": true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true,
        },
        "ecmaVersion": "latest",
        "sourceType": "module",
    },
    "plugins": [
        "react",
        "@typescript-eslint",
    ],
    "rules": {
        "sort-imports": [ "error", {
            "ignoreCase": false,
            "ignoreDeclarationSort": true,
            "ignoreMemberSort": false,
            "memberSyntaxSortOrder": [ "none", "all", "multiple", "single" ],
            "allowSeparatedGroups": false,
        } ],
        "array-bracket-spacing": [
            "error",
            "always",
        ],
        "object-curly-spacing": [
            "error",
            "always",
        ],
        "comma-dangle": [
            "error",
            "always-multiline",
        ],
        "indent": [
            "error",
            4,
        ],
        "linebreak-style": [
            "error",
            (process.platform === "win32"
                ? "windows"
                : "unix"),
        ],
        "multiline-ternary": [
            "error",
            "always",
        ],
        "quotes": [
            "error",
            "double",
        ],
        "react/jsx-tag-spacing": 2,
        "semi": [
            "error",
            "always",
        ],
    },
};
