module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
	},
	'extends': [
		'eslint:recommended',
		'plugin:react/recommended'
	],
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
		'sourceType': 'module',
	},
	rules: {
		indent: ['error', 'tab'],
		'linebreak-style': ['error', 'windows'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		// suppress errors for missing 'import React' in files
		'react/react-in-jsx-scope': 'off',
		// allow jsx syntax in js files (for next.js project)
		'react/jsx-filename-extension': [1, { 'extensions': ['.js', '.jsx'] }], //should add ".ts" if typescript project
	},
};
