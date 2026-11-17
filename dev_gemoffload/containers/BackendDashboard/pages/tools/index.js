import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { CloudUpload, Download, Pause, Play, RotateCcw, Square, Globe, Terminal, Code2 } from 'lucide-react';
import PageLayout from '@GOSComponents/PageLayout';
import Section from '@GOSComponents/Section';
import StatusPill from '@GOSComponents/StatusPill';
import GOSAlert from '@GOSComponents/GOSAlert';
import ConfirmModal from '@GOSComponents/ConfirmModal';
import { getStatus, runTool } from '@GOSRedux/Slices/statusSlice/statusSlice';
import { API, namespace, errorMessage, formatNumber, notify } from '@GOSUtils/helper';
import { usePolling } from '../dashboard';
import CodeBlock from '@GOSComponents/CodeBlock';

const RUN_LABELS = {
	running: __( 'Running', 'gemoffload' ),
	done: __( 'Finished', 'gemoffload' ),
	stopped: __( 'Stopped', 'gemoffload' ),
	idle: __( 'Not started', 'gemoffload' ),
};

const runPill = ( state ) => (
	<StatusPill status={ state === 'running' ? 'uploading' : state === 'done' ? 'ok' : 'off' } label={ RUN_LABELS[ state ] || state } />
);

const Progress = ( { done, total } ) => {
	const pct = total ? Math.min( 100, Math.round( ( done / total ) * 100 ) ) : 0;
	return (
		<div className="flex flex-col gap-2">
			<div className="flex justify-between text-[13px] text-[var(--gemoffload-font-secondary-color)]">
				{ /* translators: 1: done, 2: total */ }
				<span>{ sprintf( __( '%1$s of %2$s', 'gemoffload' ), formatNumber( done ), formatNumber( total ) ) }</span>
				<span>{ pct }%</span>
			</div>
			<div className="gemoffload-progress">
				<div className="gemoffload-progress__bar" style={ { width: `${ pct }%` } } />
			</div>
		</div>
	);
};

const CLI = [
	[ 'wp gemoffload status', __( 'Connection, queue and per-status counts.', 'gemoffload' ) ],
	[ 'wp gemoffload test', __( 'Put, head and delete a probe object in each bucket.', 'gemoffload' ) ],
	[ 'wp gemoffload migrate --sync', __( 'Offload existing media inside the command, without cron.', 'gemoffload' ) ],
	[ 'wp gemoffload run', __( 'Run waiting uploads now.', 'gemoffload' ) ],
	[ 'wp gemoffload retry --failed', __( 'Queue every failed upload again.', 'gemoffload' ) ],
	[ 'wp gemoffload verify --fix', __( 'HEAD every synced object; re-upload missing or wrong-sized ones.', 'gemoffload' ) ],
	[ 'wp gemoffload download-back', __( 'Download every removed local file back to this server.', 'gemoffload' ) ],
];

const API_SNIPPET = `add_action( 'gemoffload/loaded', function () {
	GemOffload\\Manager::register_context( 'storeengine.download', [
		'label'      => 'StoreEngine downloadable files',
		'visibility' => 'private',
		'path'       => 'private/storeengine/{Y}/{m}/{uuid}/{filename}',
		'max_size'   => 5 * GB_IN_BYTES,
	] );
} );

// After your own upload:
GemOffload\\Manager::upload( $path, GemOffload\\Ref::of( 'storeengine.download', $file_id ) );

// At the moment of the click, after your access checks:
$url = GemOffload\\Manager::temporary_url(
	GemOffload\\Ref::of( 'storeengine.download', $file_id ),
	[ 'filename' => 'Course-Guide.pdf', 'ttl' => 300 ]
);
if ( ! is_wp_error( $url ) ) {
	nocache_headers();
	wp_redirect( $url );
	exit;
}`;

export default function Tools() {
	const dispatch = useDispatch();
	const { data, busy } = useSelector( ( state ) => state.status );
	const [ confirm, setConfirm ] = useState( null );
	const [ cors, setCors ] = useState( null );
	const [ corsBusy, setCorsBusy ] = useState( false );

	useEffect( () => {
		dispatch( getStatus() );
	}, [ dispatch ] );

	const migration = data?.migration || {};
	const back = data?.download_back || {};
	const queue = data?.queue || {};
	usePolling( migration.status === 'running' || back.status === 'running', 5000 );

	const run = ( path, body = {} ) => dispatch( runTool( { path, body } ) );
	const unavailable = data && ! data.available;

	const configureCors = async () => {
		setCorsBusy( true );
		try {
			const res = await API.post( `${ namespace }connection/cors`, { bucket: 'both' } );
			setCors( res.data );
			notify( dispatch, __( 'CORS rules written.', 'gemoffload' ) );
		} catch ( e ) {
			notify( dispatch, errorMessage( e ), 'error' );
		} finally {
			setCorsBusy( false );
		}
	};

	return (
		<PageLayout title={ __( 'Tools', 'gemoffload' ) } description={ __( 'Bulk jobs run in the background through Action Scheduler; you can leave this page.', 'gemoffload' ) }>
			<div className="flex flex-col gap-6">
				{ unavailable && (
					<GOSAlert type="info">{ __( 'Connect a bucket and switch cloud storage on in Settings before running these tools.', 'gemoffload' ) }</GOSAlert>
				) }

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
					<Section
						title={ __( 'Offload existing media', 'gemoffload' ) }
						description={ __( 'Walks the media library 50 attachments at a time and queues every file and image size. Safe to stop and resume.', 'gemoffload' ) }
						actions={ runPill( migration.status ) }
					>
						<div className="flex flex-col gap-5">
							<Progress done={ migration.processed || 0 } total={ migration.total || data?.attachments || 0 } />
							<div className="flex flex-wrap gap-2">
								{ migration.status === 'running' ? (
									<button type="button" className="gemoffload-btn gemoffload-btn--outline" disabled={ !! busy } onClick={ () => run( 'migration/stop' ) }>
										<Square size={ 14 } />
										{ __( 'Stop', 'gemoffload' ) }
									</button>
								) : (
									<button type="button" className="gemoffload-btn gemoffload-btn--primary" disabled={ unavailable || !! busy } onClick={ () => run( 'migration/start' ) }>
										<CloudUpload size={ 15 } />
										{ migration.status === 'stopped' ? __( 'Resume', 'gemoffload' ) : __( 'Start offloading', 'gemoffload' ) }
									</button>
								) }
								{ ( migration.status === 'done' || migration.status === 'stopped' ) && (
									<button type="button" className="gemoffload-btn gemoffload-btn--outline" disabled={ unavailable || !! busy } onClick={ () => run( 'migration/start', { restart: true } ) }>
										<RotateCcw size={ 14 } />
										{ __( 'Start over', 'gemoffload' ) }
									</button>
								) }
							</div>
						</div>
					</Section>

					<Section
						title={ __( 'Upload queue', 'gemoffload' ) }
						description={ __( 'Temporary errors retry after 1 min, 5 min, 30 min, 2 h and 6 h. Five connection errors in a row pause the queue.', 'gemoffload' ) }
						actions={ <StatusPill status={ queue.paused ? 'error' : 'ok' } label={ queue.paused ? __( 'Paused', 'gemoffload' ) : __( 'Running', 'gemoffload' ) } /> }
					>
						<div className="flex flex-col gap-5">
							<div className="grid grid-cols-3 gap-3">
								{ [
									[ __( 'Waiting jobs', 'gemoffload' ), queue.pending ],
									[ __( 'Running', 'gemoffload' ), queue.running ],
									[ __( 'Failed jobs', 'gemoffload' ), queue.failed ],
								].map( ( [ label, value ] ) => (
									<div key={ label } className="rounded-[6px] border border-[var(--gemoffload-border-color)] p-3">
										<div className="text-[12px] text-[var(--gemoffload-font-secondary-color)]">{ label }</div>
										<div className="mt-1 text-[20px] font-semibold">{ value === null || value === undefined ? '—' : formatNumber( value ) }</div>
									</div>
								) ) }
							</div>
							{ queue.paused && queue.message && <GOSAlert type="error">{ queue.message }</GOSAlert> }
							<div className="flex flex-wrap gap-2">
								{ queue.paused ? (
									<button type="button" className="gemoffload-btn gemoffload-btn--primary" disabled={ !! busy } onClick={ () => run( 'queue/resume' ) }>
										<Play size={ 14 } />
										{ __( 'Resume uploads', 'gemoffload' ) }
									</button>
								) : (
									<button type="button" className="gemoffload-btn gemoffload-btn--outline" disabled={ !! busy } onClick={ () => run( 'queue/pause' ) }>
										<Pause size={ 14 } />
										{ __( 'Pause uploads', 'gemoffload' ) }
									</button>
								) }
								<span className="self-center text-[12px] text-[var(--gemoffload-text-muted)]">
									{ /* translators: %s: queue engine name */ }
									{ sprintf( __( 'Engine: %s', 'gemoffload' ), queue.engine === 'action-scheduler' ? 'Action Scheduler' : 'WP-Cron' ) }
								</span>
							</div>
						</div>
					</Section>

					<Section
						title={ __( 'Bring files back', 'gemoffload' ) }
						description={ __( 'Downloads every file Offload mode removed from this server. Use it before leaving the cloud or after switching local files back to "Keep".', 'gemoffload' ) }
						actions={ runPill( back.status ) }
					>
						<div className="flex flex-col gap-5">
							<div className="text-[13px] text-[var(--gemoffload-font-secondary-color)]">
								{ /* translators: %s: number of files */ }
								{ sprintf( __( '%s files are only in the cloud right now.', 'gemoffload' ), formatNumber( data?.stats?.local_removed ) ) }
							</div>
							{ back.status !== 'idle' && back.total > 0 && <Progress done={ back.processed + back.failed } total={ back.total } /> }
							<div className="flex flex-wrap gap-2">
								{ back.status === 'running' ? (
									<button type="button" className="gemoffload-btn gemoffload-btn--outline" disabled={ !! busy } onClick={ () => run( 'download-back/stop' ) }>
										<Square size={ 14 } />
										{ __( 'Stop', 'gemoffload' ) }
									</button>
								) : (
									<button
										type="button"
										className="gemoffload-btn gemoffload-btn--outline"
										disabled={ unavailable || !! busy || ! data?.stats?.local_removed }
										onClick={ () => setConfirm( 'download-back' ) }
									>
										<Download size={ 15 } />
										{ __( 'Download files back', 'gemoffload' ) }
									</button>
								) }
							</div>
						</div>
					</Section>

					<Section
						title={ __( 'Bucket CORS', 'gemoffload' ) }
						description={ __( 'Lets this site read files across origins: video subtitles, web fonts and direct browser uploads need it. Writes one rule allowing GET, HEAD and PUT from this site.', 'gemoffload' ) }
					>
						<div className="flex flex-col gap-4">
							<button type="button" className="gemoffload-btn gemoffload-btn--outline self-start" disabled={ unavailable || corsBusy } onClick={ configureCors }>
								<Globe size={ 15 } />
								{ corsBusy ? __( 'Writing…', 'gemoffload' ) : __( 'Configure CORS', 'gemoffload' ) }
							</button>
							{ cors && (
								<GOSAlert type="success">
									{ /* translators: 1: bucket names, 2: origins */ }
									{ sprintf( __( 'Rule written to %1$s for %2$s.', 'gemoffload' ), cors.buckets.join( ', ' ), cors.origins.join( ', ' ) ) }
								</GOSAlert>
							) }
						</div>
					</Section>
				</div>

				<Section title={ __( 'WP-CLI', 'gemoffload' ) } description={ __( 'For large libraries, or hosts where WP-Cron is disabled.', 'gemoffload' ) } actions={ <Terminal size={ 18 } className="text-[var(--gemoffload-text-muted)]" /> } bodyClassName="">
					<table className="gemoffload-table">
						<tbody>
							{ CLI.map( ( [ cmd, desc ] ) => (
								<tr key={ cmd }>
									<td className="w-[340px]"><code className="gemoffload-code">{ cmd }</code></td>
									<td className="text-[var(--gemoffload-font-secondary-color)]">{ desc }</td>
								</tr>
							) ) }
						</tbody>
					</table>
				</Section>

				<Section
					title={ __( 'Developer API', 'gemoffload' ) }
					description={ __( 'Academy LMS, StoreEngine, ZenCommunity or any plugin registers a context, hands files over, and asks for URLs. Every call falls back to local behaviour when storage is off.', 'gemoffload' ) }
					actions={ <Code2 size={ 18 } className="text-[var(--gemoffload-text-muted)]" /> }
				>
					<CodeBlock title="PHP" code={ API_SNIPPET } />
				</Section>
			</div>

			<ConfirmModal
				open={ confirm === 'download-back' }
				title={ __( 'Download files back?', 'gemoffload' ) }
				confirmLabel={ __( 'Start downloading', 'gemoffload' ) }
				onConfirm={ () => run( 'download-back/start' ) }
				onClose={ () => setConfirm( null ) }
			>
				{ __( 'Every file that is only in the cloud is downloaded to this server again. Check there is enough free disk space first. Cloud copies stay where they are.', 'gemoffload' ) }
			</ConfirmModal>
		</PageLayout>
	);
}
