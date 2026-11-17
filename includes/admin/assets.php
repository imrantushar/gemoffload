<?php
namespace GemOffload\Admin;

use GemOffload\Settings;
use GemOffload\Utils\Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Assets {

	public function register(): void {
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_app_assets' ] );
	}

	public function enqueue_app_assets( $hook ): void {
		if ( false === strpos( (string) $hook, '_page_' . GEMOFFLOAD_PLUGIN_SLUG ) ) {
			return;
		}

		$asset_file = GEMOFFLOAD_ASSETS_DIR_PATH . sprintf( 'build/app.%s.asset.php', GEMOFFLOAD_VERSION );
		if ( ! is_readable( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		wp_enqueue_style( 'gemoffload-app-style', GEMOFFLOAD_ASSETS_URI . 'build/app.css', [], $asset['version'] );
		// The app takes over the screen; other plugins' notices overlap its chrome.
		wp_add_inline_style( 'gemoffload-app-style', '#wpbody-content > *:not(#gemoffload-app):not(#screen-meta):not(#screen-meta-links){display:none !important;}' );
		wp_enqueue_script( 'gemoffload-app-scripts', GEMOFFLOAD_ASSETS_URI . sprintf( 'build/app.%s.js', GEMOFFLOAD_VERSION ), $asset['dependencies'], $asset['version'], true );

		wp_localize_script( 'gemoffload-app-scripts', 'GemOffloadGlobal', [
			'nonce'              => wp_create_nonce( 'wp_rest' ),
			'namespace'          => GEMOFFLOAD_PLUGIN_SLUG . '/v1/',
			'rest_url'           => rest_url(),
			'is_plain_permalink' => '' === (string) get_option( 'permalink_structure' ),
			'site_url'           => site_url(),
			'home_url'           => home_url(),
			'admin_url'          => admin_url(),
			'route_path'         => wp_parse_url( admin_url(), PHP_URL_PATH ),
			'plugin_root_url'    => GEMOFFLOAD_PLUGIN_ROOT_URI,
			'version'            => GEMOFFLOAD_VERSION,
			'menu'               => wp_json_encode( Helper::get_admin_menu_list() ),
			'theme_mode'         => Settings::value( 'theme.default_mode', 'light' ),
		] );

		wp_set_script_translations( 'gemoffload-app-scripts', 'gemoffload', GEMOFFLOAD_ROOT_DIR_PATH . 'languages/' );
	}
}
