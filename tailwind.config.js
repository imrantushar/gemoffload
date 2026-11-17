/** @type {import('tailwindcss').Config} */
module.exports = {
	corePlugins: {
		preflight: false,
	},
	content: [ './dev_gemoffload/**/*.{js,jsx}', './assets/scss/**/*.scss' ],
	important: '.gemoffload-scope',
	theme: {
		extend: {},
	},
	plugins: [],
};
