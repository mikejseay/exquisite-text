module.exports = {
    "root": true,
    "ignorePatterns": [ "llm_utils/langchain_chatbot.ts" ],
    "env": {
        "node": true,
        "es2021": true,
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
    },
    "plugins": [
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
        "semi": [
            "error",
            "always",
        ],
        "@typescript-eslint/no-unused-vars": [ "warn", {
            "argsIgnorePattern": "^_",
            "varsIgnorePattern": "^_",
        } ],
    },
    "overrides": [
        {
            "files": [ "__tests__/**/*.ts" ],
            "rules": {
                "@typescript-eslint/no-explicit-any": "off",
                "@typescript-eslint/no-non-null-assertion": "off",
                "@typescript-eslint/no-empty-function": "off",
            },
        },
    ],
};
