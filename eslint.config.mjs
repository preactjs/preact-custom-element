import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import compat from 'eslint-plugin-compat';

export default defineConfig([
	compat.configs['flat/recommended'],
	{
		files: ['src/index.js'],
		plugins: { js },
		extends: ['js/recommended'],
		languageOptions: {
			globals: globals.browser,
			ecmaVersion: 2020,
			sourceType: 'module',
		},
	},
]);
