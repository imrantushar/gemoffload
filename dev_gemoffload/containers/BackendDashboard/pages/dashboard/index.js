import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { __, sprintf } from '@wordpress/i18n';
import { CloudUpload, Clock3, AlertOctagon, ShieldCheck, HardDrive } from 'lucide-react';
import PageLayout from '@GOSComponents/PageLayout';
import StatCard from '@GOSComponents/StatCard';
import StatusPill from '@GOSComponents/StatusPill';
import Section from '@GOSComponents/Section';
import GOSAlert from '@GOSComponents/GOSAlert';
import { getStatus, runTool } from '@GOSRedux/Slices/statusSlice/statusSlice';
import { adminPage, formatBytes, formatNumber } from '@GOSUtils/helper';

const PROVIDERS = {
	r2: __( 'Cloudflare R2', 'gemoffload' ),
	aws: __( 'Amazon S3', 'gemoffload' ),
	custom: __( 'S3-compatible', 'gemoffload' ),
};

const LOCAL_FILES = {
	keep: __( 'Keep local copies', 'gemoffload' ),
	remove_sizes: __( 'Remove generated sizes', 'gemoffload' ),
	remove_all: __( 'Remove all local files', 'gemoffload' ),
};

const Row = ( { label, children } ) => (
	<div className="flex items-start justify-between gap-4 py-2.5 text-[13px]">
		<span className="shrink-0 text-[var(--gemoffload-font-secondary-color)]">{ label }</span>
		<span className="min-w-0 text-right font-medium text-[var(--gemoffload-font-color)]" style={ { overflowWrap: 'anywhere' } }>{ children }</span>
	</div>
);

export const usePolling = ( active, ms = 8000 ) => {
	const dispatch = useDispatch();
	useEffect( () => {
		if ( ! active ) {
			return undefined;
		}
		const id = setInterval( () => dispatch( getStatus() ), ms );
		return () => clearInterval( id );
	}, [ active, ms ] );
};

export default function Dashboard() {
	const dispatch = useDispatch();
	const { data, loading } = useSelector( ( state ) => state.status );

	useEffect( () => {
		dispatch( getStatus() );
	}, [ dispatch ] );

	const stats = data?.stats;
	const waiting = ( stats?.by_status?.pending || 0 ) + ( stats?.by_status?.uploading || 0 );
	usePolling( !! data && ( waiting > 0 || data?.migration?.status === 'running' ) );

	const migration = data?.migration;
	const migrationPct = migration?.total ? Math.min( 100, Math.round( ( migration.processed / migration.total ) * 100 ) ) : 0;

	const actions = data?.available ? (
		<button
			type="button"
			className="gemoffload-btn gemoffload-btn--primary"
			disabled={ migration?.status === 'running' }
			onClick={ () => dispatch( runTool( { path: 'migration/start' } ) ) }
		>
			<CloudUpload size={ 16 } />
			{ migration?.status === 'running' ? __( 'Offloading…', 'gemoffload' ) : __( 'Offload existing media', 'gemoffload' ) }
		</button>
	) : (
		<Link className="gemoffload-btn gemoffload-btn--primary" to={ adminPage( 'gemoffload-settings' ) }>
			{ __( 'Connect storage', 'gemoffload' ) }
		</Link>
	);

	return (
		<PageLayout
			title={ __( 'Dashboard', 'gemoffload' ) }
			description={ __( 'Media and protected files offloaded to Amazon S3 or Cloudflare R2.', 'gemoffload' ) }
			actions={ actions }
		>
			<div className="flex flex-col gap-6">
				{ data && ! data.configured && (
					<GOSAlert
						type="info"
						title={ __( 'Connect a bucket to get started', 'gemoffload' ) }
						action={ <Link className="gemoffload-btn gemoffload-btn--soft gemoffload-btn--sm" to={ adminPage( 'gemoffload-settings' ) }>{ __( 'Open settings', 'gemoffload' ) }</Link> }
					>
						{ __( 'Choose Cloudflare R2 or Amazon S3, enter an access key and a bucket, and test the connection. Files keep being served from this server until each upload is confirmed.', 'gemoffload' ) }
					</GOSAlert>
				) }

				{ data?.configured && ! data.enabled && (
					<GOSAlert type="warning" title={ __( 'Cloud storage is switched off', 'gemoffload' ) }>
						{ __( 'The connection is set up but switched off, so nothing uploads and every URL points at this server. Switch it on in Settings → Connection.', 'gemoffload' ) }
					</GOSAlert>
				) }

				{ data?.queue?.paused && (
					<GOSAlert
						type="error"
						title={ data.queue.reason === 'clock' ? __( 'Uploads paused: server clock is wrong', 'gemoffload' ) : __( 'Uploads paused', 'gemoffload' ) }
						action={ <button type="button" className="gemoffload-btn gemoffload-btn--outline gemoffload-btn--sm" onClick={ () => dispatch( runTool( { path: 'queue/resume' } ) ) }>{ __( 'Resume', 'gemoffload' ) }</button> }
					>
						{ data.queue.message || __( 'Uploads stopped after repeated errors. Fix the connection, test it, then resume.', 'gemoffload' ) }
					</GOSAlert>
				) }

				{ data?.needs_reentry && (
					<GOSAlert type="warning" title={ __( 'Re-enter your secret key', 'gemoffload' ) }>
						{ __( 'The stored secret can no longer be decrypted because the WordPress salts changed. Define GEMOFFLOAD_KEY in wp-config.php to avoid this.', 'gemoffload' ) }
					</GOSAlert>
				) }

				{ data?.conflicts?.length > 0 && (
					<GOSAlert type="warning" title={ __( 'Media offload is off', 'gemoffload' ) }>
						{ sprintf(
							/* translators: %s: plugin names */
							__( '%s also rewrites media library URLs, so ours stays off to avoid broken links. Plugin file contexts keep working.', 'gemoffload' ),
							data.conflicts.join( ', ' )
						) }
					</GOSAlert>
				) }

				{ ( data?.warnings || [] ).map( ( w, i ) => (
					<GOSAlert key={ i } type={ w.type }>{ w.message }</GOSAlert>
				) ) }

				<div className="flex flex-wrap gap-6">
					<StatCard
						title={ __( 'In the cloud', 'gemoffload' ) }
						value={ formatNumber( stats?.by_status?.synced ) }
						hint={ formatBytes( stats?.bytes ) }
						icon={ CloudUpload }
						tone="success"
						isLoading={ loading }
					/>
					<StatCard title={ __( 'Waiting', 'gemoffload' ) } value={ formatNumber( waiting ) } icon={ Clock3 } tone="warning" isLoading={ loading } />
					<StatCard title={ __( 'Failed', 'gemoffload' ) } value={ formatNumber( stats?.by_status?.failed ) } icon={ AlertOctagon } tone="danger" isLoading={ loading } />
					<StatCard title={ __( 'Private files', 'gemoffload' ) } value={ formatNumber( stats?.private ) } icon={ ShieldCheck } isLoading={ loading } />
				</div>

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
					<Section
						title={ __( 'Connection', 'gemoffload' ) }
						actions={
							data && (
								<StatusPill
									status={ data.available ? 'ok' : data.configured ? 'warning' : 'off' }
									label={ data.available ? __( 'Active', 'gemoffload' ) : data.configured ? __( 'Switched off', 'gemoffload' ) : __( 'Not connected', 'gemoffload' ) }
								/>
							)
						}
						bodyClassName="px-6 py-3 divide-y divide-[var(--gemoffload-border-color)]"
					>
						<Row label={ __( 'Provider', 'gemoffload' ) }>{ PROVIDERS[ data?.provider ] || '—' }</Row>
						<Row label={ __( 'Public bucket', 'gemoffload' ) }>{ data?.buckets?.public?.name || '—' }</Row>
						<Row label={ __( 'Public URL', 'gemoffload' ) }>{ data?.buckets?.public?.public_url || __( 'Provider default', 'gemoffload' ) }</Row>
						<Row label={ __( 'Private bucket', 'gemoffload' ) }>{ data?.buckets?.private?.name || __( 'Shares the public bucket', 'gemoffload' ) }</Row>
						<Row label={ __( 'New media uploads', 'gemoffload' ) }>{ data?.media?.offload ? __( 'Offloaded', 'gemoffload' ) : __( 'Stay local', 'gemoffload' ) }</Row>
						<Row label={ __( 'Local files', 'gemoffload' ) }>{ LOCAL_FILES[ data?.media?.local_files ] || '—' }</Row>
					</Section>

					<Section
						title={ __( 'Media library', 'gemoffload' ) }
						actions={ migration && <StatusPill status={ migration.status === 'running' ? 'uploading' : migration.status === 'done' ? 'ok' : 'off' } label={ { running: __( 'Running', 'gemoffload' ), done: __( 'Finished', 'gemoffload' ), stopped: __( 'Stopped', 'gemoffload' ), idle: __( 'Not started', 'gemoffload' ) }[ migration.status ] } /> }
					>
						<div className="flex flex-col gap-4">
							<div className="flex items-baseline justify-between text-[13px]">
								<span className="text-[var(--gemoffload-font-secondary-color)]">{ __( 'Existing media checked', 'gemoffload' ) }</span>
								<span className="font-medium">
									{ /* translators: 1: processed, 2: total */ }
									{ sprintf( __( '%1$s of %2$s attachments', 'gemoffload' ), formatNumber( migration?.processed ), formatNumber( migration?.total || data?.attachments ) ) }
								</span>
							</div>
							<div className="gemoffload-progress">
								<div className="gemoffload-progress__bar" style={ { width: `${ migrationPct }%` } } />
							</div>
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
								{ [ 'synced', 'pending', 'uploading', 'failed' ].map( ( s ) => (
									<Link key={ s } to={ adminPage( 'gemoffload-files', { status: s } ) } className="rounded-[6px] border border-[var(--gemoffload-border-color)] p-3 transition-colors hover:bg-[var(--gemoffload-secondary-color)]">
										<StatusPill status={ s } />
										<div className="mt-2 text-[20px] font-semibold">{ formatNumber( stats?.by_status?.[ s ] ) }</div>
									</Link>
								) ) }
							</div>
						</div>
					</Section>
				</div>

				<Section title={ __( 'Storage by context', 'gemoffload' ) } description={ __( 'Each plugin that stores files registers a context: the media library, paid downloads, course materials, chat attachments.', 'gemoffload' ) } bodyClassName="">
					{ stats?.by_context?.filter( ( c ) => ! c.source_type.startsWith( '~' ) ).length ? (
						<table className="gemoffload-table">
							<thead>
								<tr>
									<th>{ __( 'Context', 'gemoffload' ) }</th>
									<th>{ __( 'Objects', 'gemoffload' ) }</th>
									<th>{ __( 'Synced size', 'gemoffload' ) }</th>
								</tr>
							</thead>
							<tbody>
								{ stats.by_context
									.filter( ( c ) => ! c.source_type.startsWith( '~' ) )
									.map( ( c ) => (
										<tr key={ c.source_type }>
											<td>
												<span className="inline-flex items-center gap-2">
													<HardDrive size={ 14 } className="text-[var(--gemoffload-text-muted)]" />
													<code className="gemoffload-code">{ c.source_type === 'attachment' ? 'media' : c.source_type }</code>
												</span>
											</td>
											<td>{ formatNumber( c.objects ) }</td>
											<td>{ formatBytes( c.bytes ) }</td>
										</tr>
									) ) }
							</tbody>
						</table>
					) : (
						<p className="px-6 py-8 text-center text-[13px] text-[var(--gemoffload-font-secondary-color)]">
							{ __( 'Nothing stored yet. New uploads go to the cloud once storage is on; use “Offload existing media” for the files already here.', 'gemoffload' ) }
						</p>
					) }
				</Section>
			</div>
		</PageLayout>
	);
}
