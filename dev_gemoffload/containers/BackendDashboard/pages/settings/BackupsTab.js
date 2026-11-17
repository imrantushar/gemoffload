import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { DatabaseBackup, Download, Loader2, Trash2 } from 'lucide-react';
import GOSToggle from '@GOSComponents/GOSToggle';
import GOSAlert from '@GOSComponents/GOSAlert';
import StatusPill from '@GOSComponents/StatusPill';
import ConfirmModal from '@GOSComponents/ConfirmModal';
import { API, namespace, errorMessage, formatBytes, formatDateTime, formatNumber, notify } from '@GOSUtils/helper';
import { ChoiceCard, SectionTitle } from './common';
import CodeBlock from '@GOSComponents/CodeBlock';

const KEEP_DAYS = [ 7, 14, 30, 90 ];

const ITEM_STATUS = {
	synced: [ 'ok', __( 'Stored', 'gemoffload' ) ],
	pending: [ 'pending', __( 'Waiting', 'gemoffload' ) ],
	uploading: [ 'pending', __( 'Uploading', 'gemoffload' ) ],
	failed: [ 'failed', __( 'Failed', 'gemoffload' ) ],
	deleting: [ 'warning', __( 'Deleting', 'gemoffload' ) ],
};

/**
 * Database backups: schedule (saved with the form) and the stored backups
 * (live, from the backups endpoint).
 */
const BackupsTab = ( { form, setSetting } ) => {
	const dispatch = useDispatch();
	const b = form.settings.backups || { enabled: false, frequency: 'daily', keep_days: 30 };
	const [ data, setData ] = useState( null );
	const [ busy, setBusy ] = useState( '' );
	const [ confirm, setConfirm ] = useState( null );

	const load = useCallback( async () => {
		try {
			const res = await API.get( `${ namespace }backups` );
			setData( res.data );
		} catch ( e ) {
			notify( dispatch, errorMessage( e ), 'error' );
		}
	}, [ dispatch ] );

	useEffect( () => {
		load();
	}, [ load ] );

	// Follow a running backup until it is stored.
	const running = data?.running;
	useEffect( () => {
		if ( ! running ) {
			return undefined;
		}
		const id = setInterval( load, 3000 );
		return () => clearInterval( id );
	}, [ running, load ] );

	const call = async ( key, path, body, then ) => {
		setBusy( key );
		try {
			const res = await API.post( `${ namespace }${ path }`, body );
			then( res.data );
		} catch ( e ) {
			notify( dispatch, errorMessage( e ), 'error' );
		} finally {
			setBusy( '' );
		}
	};

	const backUpNow = () =>
		call( 'run', 'backups/run', {}, ( d ) => {
			setData( d );
			notify( dispatch, __( 'Backup started. You can leave this page.', 'gemoffload' ) );
		} );

	const download = ( id ) =>
		call( `dl-${ id }`, 'backups/download', { id }, ( d ) => {
			window.location.href = d.url;
		} );

	const remove = ( id ) =>
		call( `rm-${ id }`, 'backups/delete', { id }, ( d ) => {
			setData( d );
			setConfirm( null );
			notify( dispatch, __( 'Backup deleted.', 'gemoffload' ) );
		} );

	const set = ( key, value ) => setSetting( [ 'backups', key ], value );
	const blocker = data?.blocker;

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-4">
				<SectionTitle
					title={ __( 'Database backups', 'gemoffload' ) }
					description={ __( 'A compressed copy of this site\'s database: orders, products, license keys, customers and purchase history, posts and settings. Kept only in the private bucket, never on a public address.', 'gemoffload' ) }
				/>

				{ blocker && <GOSAlert type="warning">{ blocker }</GOSAlert> }

				<div className="flex items-start justify-between gap-6 rounded-[8px] border border-[var(--gemoffload-border-color)] p-4">
					<div>
						<div className="text-[14px] font-semibold">{ __( 'Back up automatically', 'gemoffload' ) }</div>
						<p className="mt-1 text-[13px] text-[var(--gemoffload-font-secondary-color)]">
							{ __( 'Runs in the background. Large databases are written a slice at a time, so the site stays fast.', 'gemoffload' ) }
						</p>
					</div>
					<GOSToggle checked={ !! b.enabled } onChange={ ( v ) => set( 'enabled', v ) } label={ __( 'Back up automatically', 'gemoffload' ) } />
				</div>

				<div className={ `flex flex-col gap-6 ${ b.enabled ? '' : 'pointer-events-none opacity-50' }` }>
					<div>
						<div className="gemoffload-label mb-2">{ __( 'How often', 'gemoffload' ) }</div>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							<ChoiceCard
								name="backup_frequency"
								value="daily"
								checked={ b.frequency === 'daily' }
								onChange={ ( v ) => set( 'frequency', v ) }
								title={ __( 'Every day', 'gemoffload' ) }
								badge={ __( 'Recommended', 'gemoffload' ) }
								description={ __( 'For shops and course sites: at most a day of orders can be lost.', 'gemoffload' ) }
							/>
							<ChoiceCard
								name="backup_frequency"
								value="weekly"
								checked={ b.frequency === 'weekly' }
								onChange={ ( v ) => set( 'frequency', v ) }
								title={ __( 'Every week', 'gemoffload' ) }
								description={ __( 'For sites that rarely change.', 'gemoffload' ) }
							/>
						</div>
					</div>

					<div>
						<div className="gemoffload-label mb-2">{ __( 'Keep backups for', 'gemoffload' ) }</div>
						<div className="flex flex-wrap gap-2">
							{ KEEP_DAYS.map( ( days ) => (
								<button
									key={ days }
									type="button"
									className={ `gemoffload-btn gemoffload-btn--sm ${ Number( b.keep_days ) === days ? 'gemoffload-btn--soft' : 'gemoffload-btn--outline' }` }
									onClick={ () => set( 'keep_days', days ) }
								>
									{ sprintf( /* translators: %d: number of days */ __( '%d days', 'gemoffload' ), days ) }
								</button>
							) ) }
						</div>
						<p className="gemoffload-help mt-2">{ __( 'Older backups are deleted from the bucket. The newest one is always kept.', 'gemoffload' ) }</p>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<SectionTitle
						title={ __( 'Stored backups', 'gemoffload' ) }
						description={
							data?.next_due && b.enabled
								? sprintf( /* translators: %s: date and time */ __( 'Next automatic backup: around %s.', 'gemoffload' ), formatDateTime( data.next_due ) )
								: __( 'Back up before updating plugins, importing data or making big changes.', 'gemoffload' )
						}
					/>
					<button type="button" className="gemoffload-btn gemoffload-btn--primary mb-4" onClick={ backUpNow } disabled={ !! blocker || !! running || 'run' === busy }>
						{ 'run' === busy ? <Loader2 size={ 16 } className="gemoffload-spin" /> : <DatabaseBackup size={ 16 } /> }
						{ __( 'Back up now', 'gemoffload' ) }
					</button>
				</div>

				{ running && (
					<GOSAlert type="info" title={ 'exporting' === running.status ? __( 'Writing the backup…', 'gemoffload' ) : __( 'Uploading the backup…', 'gemoffload' ) }>
						{ 'exporting' === running.status
							? sprintf(
								/* translators: 1: table number, 2: table count, 3: table name, 4: rows written */
								__( 'Table %1$d of %2$d (%3$s), %4$s rows so far.', 'gemoffload' ),
								running.table_index,
								running.tables,
								running.table,
								formatNumber( running.rows )
							)
							: __( 'Every table is written. Sending the file to the private bucket and checking it arrived intact.', 'gemoffload' ) }
					</GOSAlert>
				) }

				{ ! running && 'failed' === data?.last?.status && (
					<GOSAlert type="error" title={ __( 'The last backup failed', 'gemoffload' ) }>
						{ data.last.message }
					</GOSAlert>
				) }

				<div className="overflow-x-auto rounded-[8px] border border-[var(--gemoffload-border-color)]">
					<table className="gemoffload-table">
						<thead>
							<tr>
								<th>{ __( 'Created', 'gemoffload' ) }</th>
								<th>{ __( 'Size', 'gemoffload' ) }</th>
								<th>{ __( 'Status', 'gemoffload' ) }</th>
								<th className="text-right">{ __( 'Actions', 'gemoffload' ) }</th>
							</tr>
						</thead>
						<tbody>
							{ ! data && (
								<tr>
									<td colSpan="4" className="text-[var(--gemoffload-text-muted)]">
										{ __( 'Loading…', 'gemoffload' ) }
									</td>
								</tr>
							) }
							{ data && data.backups.length === 0 && (
								<tr>
									<td colSpan="4" className="text-[var(--gemoffload-text-muted)]">
										{ __( 'No backups yet.', 'gemoffload' ) }
									</td>
								</tr>
							) }
							{ data?.backups.map( ( row ) => {
								const [ tone, label ] = ITEM_STATUS[ row.status ] || [ 'pending', row.status ];
								return (
									<tr key={ row.id }>
										<td>
											<div className="font-medium">{ formatDateTime( row.created_at ) }</div>
											<div className="text-[12px] text-[var(--gemoffload-text-muted)]">
												{ row.filename } · ID { row.id }
											</div>
										</td>
										<td>{ row.size ? formatBytes( row.size ) : '—' }</td>
										<td title={ row.error }>
											<StatusPill status={ tone } label={ label } />
										</td>
										<td>
											<div className="flex justify-end gap-2">
												<button type="button" className="gemoffload-btn gemoffload-btn--sm gemoffload-btn--outline" onClick={ () => download( row.id ) } disabled={ 'synced' !== row.status || `dl-${ row.id }` === busy }>
													<Download size={ 14 } />
													{ __( 'Download', 'gemoffload' ) }
												</button>
												<button type="button" className="gemoffload-btn gemoffload-btn--sm gemoffload-btn--outline" onClick={ () => setConfirm( row ) } disabled={ 'deleting' === row.status } aria-label={ __( 'Delete', 'gemoffload' ) }>
													<Trash2 size={ 14 } />
												</button>
											</div>
										</td>
									</tr>
								);
							} ) }
						</tbody>
					</table>
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<SectionTitle
					title={ __( 'Restoring', 'gemoffload' ) }
					description={ __( 'A restore replaces every table, so anything written since the backup is lost. It runs from WP-CLI, not from a button, so it can\'t be clicked by accident. The file is plain SQL: phpMyAdmin or any MySQL tool can import a downloaded backup too.', 'gemoffload' ) }
				/>
				<CodeBlock title={ __( 'Terminal', 'gemoffload' ) } code={ 'wp gemoffload backup list\nwp gemoffload backup restore <ID>' } />
			</div>

			<ConfirmModal
				open={ !! confirm }
				danger
				title={ __( 'Delete this backup?', 'gemoffload' ) }
				confirmLabel={ __( 'Delete backup', 'gemoffload' ) }
				onConfirm={ () => remove( confirm.id ) }
				onClose={ () => setConfirm( null ) }
			>
				{ confirm && sprintf( /* translators: %s: date and time */ __( 'The backup from %s is removed from the bucket. This can\'t be undone.', 'gemoffload' ), formatDateTime( confirm.created_at ) ) }
			</ConfirmModal>
		</div>
	);
};

export default BackupsTab;
