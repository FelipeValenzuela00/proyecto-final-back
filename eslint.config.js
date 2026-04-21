const js = require("@eslint/js");

module.exports = [
    {
        ignores: ["node_modules/**"],
    },
    js.configs.recommended,
    {
        files: ["src/**/*.js"],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "commonjs",
            globals: {
                console: "readonly",
                module: "readonly",
                process: "readonly",
                require: "readonly",
                __dirname: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
        },
    },
];