<?php
namespace GemOffload\Utils;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Helper {

	/**
	 * The admin pages. The React app renders the matching page for ?page=.
	 */
	public static function get_admin_menu_list(): array {
		$menu = [
			GEMOFFLOAD_PLUGIN_SLUG               => [
				'parent_slug' => GEMOFFLOAD_PLUGIN_SLUG,
				'title'       => __( 'Dashboard', 'gemoffload' ),
				'capability'  => 'manage_options',
			],
			GEMOFFLOAD_PLUGIN_SLUG . '-files'    => [
				'parent_slug' => GEMOFFLOAD_PLUGIN_SLUG,
				'title'       => __( 'Files', 'gemoffload' ),
				'capability'  => 'manage_options',
			],
			GEMOFFLOAD_PLUGIN_SLUG . '-tools'    => [
				'parent_slug' => GEMOFFLOAD_PLUGIN_SLUG,
				'title'       => __( 'Tools', 'gemoffload' ),
				'capability'  => 'manage_options',
			],
			GEMOFFLOAD_PLUGIN_SLUG . '-settings' => [
				'parent_slug' => GEMOFFLOAD_PLUGIN_SLUG,
				'title'       => __( 'Settings', 'gemoffload' ),
				'capability'  => 'manage_options',
			],
		];

		return apply_filters( 'gemoffload/admin/menu_list', $menu );
	}

	public static function format_bytes( int $bytes ): string {
		return size_format( $bytes, 1 );
	}
}
