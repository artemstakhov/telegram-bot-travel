module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: ['eslint:recommended', 'plugin:react/recommended'],
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 2021,
		sourceType: 'module',
	},
	plugins: ['react'],
	rules: {
		indent: ['error', 'tab'],
		'linebreak-style': ['error', 'windows'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		'react/prop-types': 'off', // Опционально: отключить предупреждения о propTypes
	},
	globals: {
		React: 'writable',
		module: 'readonly',
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
};
