<?php
namespace GemOffload;

use GemOffload\Admin\Assets;
use GemOffload\Admin\Menu;
use GemOffload\Admin\Notices;
use GemOffload\Api\RestController;
use GemOffload\Backups\Backups;
use GemOffload\Integrations\Integrations;
use GemOffload\Jobs\Queue;
use GemOffload\Media\MediaHooks;
use GemOffload\Media\PrivateDelivery;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Boots every module once WordPress and Action Scheduler are loaded.
 */
final class Plugin {

	private static ?self $instance = null;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'plugins_loaded', [ $this, 'boot' ], 20 );
	}

	public function boot(): void {
		Installer::maybe_upgrade();

		// Context labels are translated, so they wait for init.
		add_action( 'init', [ $this, 'register_contexts' ], 1 );

		Queue::init();
		Integrations::init();
		Backups::init();
		MediaHooks::init();
		PrivateDelivery::init();
		RestController::init();

		// A context switched back on, or a bucket just connected.
		add_action( 'gemoffload/settings_saved', [ Integrations::class, 'schedule_reconcile' ] );

		if ( is_admin() ) {
			( new Menu() )->register();
			( new Assets() )->register();
			Notices::init();
		}

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			\WP_CLI::add_command( 'gemoffload', Cli\Command::class );
			\WP_CLI::add_command( 'gemoffload backup', Cli\BackupCommand::class );
		}
	}

	public function register_contexts(): void {
		Contexts::register_defaults();

		/**
		 * Fires once the storage API is ready (init, priority 1). Products
		 * register their file contexts here with Manager::register_context().
		 */
		do_action( 'gemoffload/loaded', GEMOFFLOAD_VERSION );
	}

}
