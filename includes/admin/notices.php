<?php
namespace GemOffload\Admin;

use GemOffload\Jobs\Queue;
use GemOffload\Security\Credentials;
use GemOffload\Settings;
use GemOffload\Utils\Conflicts;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Notices on other admin screens. Our own screens show these inside the app.
 */
class Notices {

	public static function init(): void {
		add_action( 'admin_notices', [ self::class, 'render' ] );
	}

	public static function render(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$screen = get_current_screen();
		if ( $screen && false !== strpos( (string) $screen->id, GEMOFFLOAD_PLUGIN_SLUG ) ) {
			return;
		}

		$link = admin_url( 'admin.php?page=' . GEMOFFLOAD_PLUGIN_SLUG );
		$name = __( 'GemOffload', 'gemoffload' );

		if ( Settings::value( 'enabled' ) && Queue::is_paused() ) {
			$state = Queue::state();
			printf(
				'<div class="notice notice-error"><p><strong>%1$s:</strong> %2$s %3$s <a href="%4$s">%5$s</a></p></div>',
				esc_html( $name ),
				esc_html( 'clock' === $state['reason'] ? __( 'Uploads are paused because this server\'s clock is wrong.', 'gemoffload' ) : __( 'Uploads are paused after repeated connection errors.', 'gemoffload' ) ),
				esc_html( (string) $state['message'] ),
				esc_url( $link ),
				esc_html__( 'Fix the connection', 'gemoffload' )
			);
		}

		if ( Credentials::needs_reentry() ) {
			printf(
				'<div class="notice notice-warning"><p><strong>%1$s:</strong> %2$s <a href="%3$s">%4$s</a></p></div>',
				esc_html( $name ),
				esc_html__( 'The stored secret key can\'t be read since the WordPress salts changed.', 'gemoffload' ),
				esc_url( admin_url( 'admin.php?page=' . GEMOFFLOAD_PLUGIN_SLUG . '-settings' ) ),
				esc_html__( 'Re-enter your secret key', 'gemoffload' )
			);
		}

		$waiting = \GemOffload\Integrations\Integrations::waiting();
		if ( $waiting && Settings::value( 'enabled' ) ) {
			printf(
				'<div class="notice notice-warning"><p><strong>%1$s:</strong> %2$s <a href="%3$s">%4$s</a></p></div>',
				esc_html( $name ),
				esc_html( sprintf(
					/* translators: %s: product names */
					__( '%s files are not protected yet: add a private bucket.', 'gemoffload' ),
					\GemOffload\Integrations\Integrations::labels( $waiting )
				) ),
				esc_url( admin_url( 'admin.php?page=' . GEMOFFLOAD_PLUGIN_SLUG . '-settings' ) ),
				esc_html__( 'Open settings', 'gemoffload' )
			);
		}

		$conflicts = Conflicts::active();
		if ( $conflicts && Settings::value( 'enabled' ) ) {
			printf(
				'<div class="notice notice-warning"><p><strong>%1$s:</strong> %2$s</p></div>',
				esc_html( $name ),
				esc_html( sprintf(
					/* translators: %s: plugin names */
					__( 'Media library offload is off because %s also rewrites media URLs. Deactivate it to use ours; plugin file contexts keep working.', 'gemoffload' ),
					implode( ', ', $conflicts )
				) )
			);
		}
	}
}
