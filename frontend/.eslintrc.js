module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
	},
	extends: ['eslint:recommended', 'plugin:react/recommended'],
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {
		indent: ['warn', 'tab'],
		'linebreak-style': ['warn', 'windows'],
		quotes: ['warn', 'single'],
		semi: ['warn', 'always'],
		'react/react-in-jsx-scope': 'off',
		'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
		'react/prop-types': 'off',
		'no-unused-vars': 'warn',
	},
};
