const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const path = require( 'path' );
const fs = require( 'fs' );

// The plugin header's Version is the single source of truth. It must equal
// GEMOFFLOAD_VERSION, since assets.php enqueues `build/[name].{version}.js`.
const GEMOFFLOAD_VERSION = (
	fs
		.readFileSync( path.resolve( __dirname, 'gemoffload.php' ), 'utf8' )
		.match( /^[\s*]*Version:\s*(.+)$/m ) || []
)[ 1 ].trim();

module.exports = {
	...defaultConfig,
	entry: {
		app: path.resolve( __dirname, 'dev_gemoffload/app.js' ),
	},
	output: {
		filename: `[name].${ GEMOFFLOAD_VERSION }.js`,
		path: path.resolve( __dirname, 'assets/build' ),
	},
	plugins: [ ...defaultConfig.plugins, new CleanWebpackPlugin() ],
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve.alias,
			'@GOSComponents': path.resolve( __dirname, 'dev_gemoffload/components/' ),
			'@GOSContainers': path.resolve( __dirname, 'dev_gemoffload/containers/' ),
			'@GOSPages': path.resolve( __dirname, 'dev_gemoffload/containers/BackendDashboard/pages/' ),
			'@GOSRedux': path.resolve( __dirname, 'dev_gemoffload/redux/' ),
			'@GOSUtils': path.resolve( __dirname, 'dev_gemoffload/utils/' ),
		},
	},
};
