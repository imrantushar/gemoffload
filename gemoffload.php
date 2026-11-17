<?php
/*
 * Plugin Name:		GemOffload
 * Plugin URI:		https://github.com/imrantushar/gemoffload
 * Description:		Offload the media library and protected files to Amazon S3, Cloudflare R2 or any S3-compatible storage — public files from your CDN, private files through short-lived signed URLs.
 * Version:			1.1.0
 * Requires at least:	6.4
 * Requires PHP:		7.4
 * Author:			Kodezen
 * Author URI:		https://kodezen.com/
 * License:			GPL-3.0+
 * License URI:		http://www.gnu.org/licenses/gpl-3.0.txt
 * Text Domain:		gemoffload
 * Domain Path:		/languages/
 */

use GemOffload\Autoload;
use GemOffload\Plugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GEMOFFLOAD_VERSION', '1.1.0' );
define( 'GEMOFFLOAD_DB_VERSION', '1.0.0' );
define( 'GEMOFFLOAD_PLUGIN_SLUG', 'gemoffload' );
define( 'GEMOFFLOAD_PLUGIN_FILE', __FILE__ );
define( 'GEMOFFLOAD_ROOT_DIR_PATH', plugin_dir_path( __FILE__ ) );
define( 'GEMOFFLOAD_PLUGIN_ROOT_URI', plugin_dir_url( __FILE__ ) );
define( 'GEMOFFLOAD_INCLUDES_DIR_PATH', GEMOFFLOAD_ROOT_DIR_PATH . 'includes/' );
define( 'GEMOFFLOAD_ASSETS_DIR_PATH', GEMOFFLOAD_ROOT_DIR_PATH . 'assets/' );
define( 'GEMOFFLOAD_ASSETS_URI', GEMOFFLOAD_PLUGIN_ROOT_URI . 'assets/' );

// Action Scheduler registers itself and the newest bundled copy on the site
// wins, so it must be included before plugins_loaded.
if ( file_exists( GEMOFFLOAD_ROOT_DIR_PATH . 'vendor/woocommerce/action-scheduler/action-scheduler.php' ) ) {
	require_once GEMOFFLOAD_ROOT_DIR_PATH . 'vendor/woocommerce/action-scheduler/action-scheduler.php';
}

require_once GEMOFFLOAD_INCLUDES_DIR_PATH . 'autoload.php';

Autoload::get_instance()->add_namespace_directory( 'GemOffload', GEMOFFLOAD_INCLUDES_DIR_PATH );
Autoload::get_instance()->register();

register_activation_hook( __FILE__, [ \GemOffload\Installer::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ \GemOffload\Installer::class, 'deactivate' ] );

Plugin::instance();
