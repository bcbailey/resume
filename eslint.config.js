import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';

export default defineConfig([
	{
        files: ['**/*.js'],
        plugins: { js },
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.node
        },
        extends: ['js/recommended'],
        rules: {
            "no-unused-vars": [
                "error",
                {
                    "caughtErrors": "all",
                    "caughtErrorsIgnorePattern": "^ignore"
                }
            ]
        }
    },
]);
