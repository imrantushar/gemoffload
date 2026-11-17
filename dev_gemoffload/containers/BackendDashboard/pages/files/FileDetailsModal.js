import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { Check, Copy, Download, ExternalLink, FileText, Loader2, Lock, X } from 'lucide-react';
import GOSToggle from '@GOSComponents/GOSToggle';
import StatusPill from '@GOSComponents/StatusPill';
import Tooltip from '@GOSComponents/Tooltip';
import { API, errorMessage, formatDateTime, namespace, notify } from '@GOSUtils/helper';

const FIELDS = [ 'title', 'alt', 'caption', 'description', 'private' ];

const valuesOf = ( file ) => ( {
	title: file.title,
	alt: file.alt,
	caption: file.caption,
	description: file.description,
	private: file.cloud.private,
} );

const Preview = ( { file } ) => {
	const box = 'flex aspect-video w-full items-center justify-center overflow-hidden rounded-[6px] border border-[var(--gemoffload-border-color)] bg-[var(--gemoffload-secondary-color)]';
	if ( file.kind === 'image' ) {
		return (
			<div className={ box }>
				<img src={ file.preview } alt={ file.alt } className="max-h-full max-w-full object-contain" />
			</div>
		);
	}
	if ( file.kind === 'video' ) {
		return (
			<div className={ box }>
				{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
				<video src={ file.preview } controls preload="metadata" className="max-h-full max-w-full" />
			</div>
		);
	}
	if ( file.kind === 'audio' ) {
		return (
			<div className={ `${ box } !aspect-auto px-4 py-8` }>
				{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
				<audio src={ file.preview } controls preload="metadata" className="w-full" />
			</div>
		);
	}
	return (
		<div className={ `${ box } flex-col gap-2 text-[var(--gemoffload-text-muted)]` }>
			<FileText size={ 40 } />
			<span className="text-[13px]">{ file.file_type }</span>
		</div>
	);
};

const Info = ( { label, children } ) =>
	children ? (
		<div className="flex justify-between gap-4 py-1.5 text-[13px]">
			<span className="shrink-0 text-[var(--gemoffload-font-secondary-color)]">{ label }</span>
			<span className="min-w-0 text-right font-medium [overflow-wrap:anywhere]">{ children }</span>
		</div>
	) : null;

/**
 * A media library file, edited without leaving the plugin: its details,
 * where its copies are stored, and whether it is private.
 */
const FileDetailsModal = ( { attachmentId, onClose, onSaved } ) => {
	const dispatch = useDispatch();
	const [ file, setFile ] = useState( null );
	const [ form, setForm ] = useState( null );
	const [ error, setError ] = useState( '' );
	const [ saving, setSaving ] = useState( false );
	const [ copied, setCopied ] = useState( false );

	useEffect( () => {
		let live = true;
		setFile( null );
		setError( '' );
		API.get( `${ namespace }attachment`, { params: { id: attachmentId } } )
			.then( ( res ) => {
				if ( live ) {
					setFile( res.data );
					setForm( valuesOf( res.data ) );
				}
			} )
			.catch( ( e ) => live && setError( errorMessage( e ) ) );
		return () => {
			live = false;
		};
	}, [ attachmentId ] );

	const dirty = !! file && FIELDS.some( ( key ) => form[ key ] !== valuesOf( file )[ key ] );

	const close = () => {
		// eslint-disable-next-line no-alert
		if ( ! dirty || window.confirm( __( 'Discard your changes to this file?', 'gemoffload' ) ) ) {
			onClose();
		}
	};

	useEffect( () => {
		const onKey = ( e ) => e.key === 'Escape' && close();
		document.addEventListener( 'keydown', onKey );
		return () => document.removeEventListener( 'keydown', onKey );
	} );

	const set = ( key ) => ( e ) => setForm( { ...form, [ key ]: e.target.value } );

	const save = async () => {
		setSaving( true );
		try {
			const body = { id: attachmentId };
			FIELDS.forEach( ( key ) => {
				if ( form[ key ] !== valuesOf( file )[ key ] ) {
					body[ key ] = form[ key ];
				}
			} );
			const res = await API.post( `${ namespace }attachment/save`, body );
			setFile( res.data );
			setForm( valuesOf( res.data ) );
			notify( dispatch, __( 'File updated.', 'gemoffload' ) );
			onSaved?.();
		} catch ( e ) {
			notify( dispatch, errorMessage( e ), 'error' );
		} finally {
			setSaving( false );
		}
	};

	const copy = async () => {
		try {
			await navigator.clipboard.writeText( file.url );
			setCopied( true );
			setTimeout( () => setCopied( false ), 1500 );
		} catch ( e ) {
			notify( dispatch, __( 'Couldn\'t copy. Select the address and copy it instead.', 'gemoffload' ), 'error' );
		}
	};

	const cloud = file?.cloud;

	return createPortal(
		<div className="gemoffload-scope">
			<div
				className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
				style={ { background: 'rgba(14,17,22,0.55)', fontFamily: 'var(--gemoffload-font)' } }
				onMouseDown={ ( e ) => e.target === e.currentTarget && close() }
			>
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="gemoffload-file-details-title"
					className="flex max-h-[calc(100vh-48px)] w-full max-w-[1040px] flex-col rounded-[8px] border border-[var(--gemoffload-border-color)] bg-[var(--gemoffload-background)]"
					style={ { boxShadow: 'var(--gemoffload-shadow-menu)', color: 'var(--gemoffload-font-color)' } }
				>
					<div className="flex items-center justify-between gap-4 border-b border-[var(--gemoffload-border-color)] px-5 py-4">
						<h3 id="gemoffload-file-details-title" className="m-0 min-w-0 text-[16px] font-semibold">
							<Tooltip content={ file?.file_name } className="gemoffload-truncate">
								{ file ? file.file_name : __( 'File details', 'gemoffload' ) }
							</Tooltip>
						</h3>
						<button type="button" onClick={ close } aria-label={ __( 'Close', 'gemoffload' ) } className="flex border-0 bg-transparent p-1 text-[var(--gemoffload-text-muted)]">
							<X size={ 18 } />
						</button>
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto">
						{ ! file && ! error && (
							<div className="flex items-center justify-center gap-2 py-24 text-[var(--gemoffload-text-muted)]">
								<Loader2 size={ 18 } className="gemoffload-spin" />
								{ __( 'Loading…', 'gemoffload' ) }
							</div>
						) }
						{ error && <div className="px-5 py-16 text-center text-[var(--gemoffload-danger)]">{ error }</div> }

						{ file && (
							<div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
								<div className="flex min-w-0 flex-col gap-5">
									<Preview file={ file } />

									<div>
										<div className="gemoffload-label">{ __( 'File URL', 'gemoffload' ) }</div>
										<div className="flex gap-2">
											<input className="gemoffload-input" readOnly value={ file.url } onFocus={ ( e ) => e.target.select() } aria-label={ __( 'File URL', 'gemoffload' ) } />
											<button type="button" className="gemoffload-btn gemoffload-btn--outline shrink-0" onClick={ copy }>
												{ copied ? <Check size={ 15 } /> : <Copy size={ 15 } /> }
												{ copied ? __( 'Copied', 'gemoffload' ) : __( 'Copy', 'gemoffload' ) }
											</button>
										</div>
										{ cloud.private && <p className="gemoffload-help">{ __( 'A private link: it opens only for people allowed to see the file, through a short-lived signed address.', 'gemoffload' ) }</p> }
									</div>

									<div className="rounded-[6px] border border-[var(--gemoffload-border-color)] px-4 py-2">
										<Info label={ __( 'File type', 'gemoffload' ) }>{ file.file_type || file.mime_type }</Info>
										<Info label={ __( 'File size', 'gemoffload' ) }>{ file.size_label }</Info>
										<Info label={ __( 'Dimensions', 'gemoffload' ) }>{ file.width ? `${ file.width } × ${ file.height }` : '' }</Info>
										<Info label={ __( 'Length', 'gemoffload' ) }>{ file.length }</Info>
										<Info label={ __( 'Uploaded on', 'gemoffload' ) }>{ formatDateTime( file.uploaded_on ) }</Info>
										<Info label={ __( 'Uploaded by', 'gemoffload' ) }>
											{ file.author && ( file.author_url ? <a href={ file.author_url } className="text-[var(--gemoffload-primary)]">{ file.author }</a> : file.author ) }
										</Info>
									</div>
								</div>

								<div className="flex min-w-0 flex-col gap-5">
									<div className="rounded-[6px] border border-[var(--gemoffload-border-color)] p-4">
										<div className="flex items-start justify-between gap-4">
											<div>
												<div className="flex items-center gap-1.5 text-[14px] font-semibold">
													{ form.private && <Lock size={ 14 } /> }
													{ __( 'Private', 'gemoffload' ) }
												</div>
												<p className="gemoffload-help !mt-1">
													{ __( 'Kept in the private bucket and opened through a signed link after an access check.', 'gemoffload' ) }
												</p>
											</div>
											<GOSToggle
												checked={ !! form.private }
												disabled={ cloud.locked || ! cloud.available }
												onChange={ ( v ) => setForm( { ...form, private: v } ) }
												label={ __( 'Private', 'gemoffload' ) }
											/>
										</div>
										{ cloud.locked && (
											<div className="mt-3 text-[12px] leading-[1.5] text-[var(--gemoffload-font-secondary-color)]">
												{ __( 'Kept private because it is used by:', 'gemoffload' ) }
												<ul className="ml-4 mt-1 list-disc">
													{ cloud.uses.map( ( u ) => (
														<li key={ u }>{ u }</li>
													) ) }
												</ul>
											</div>
										) }
										{ cloud.orphaned && (
											<p className="gemoffload-help">{ __( 'Made private by a product that no longer uses it. It stays private until you switch this off.', 'gemoffload' ) }</p>
										) }

										<div className="mt-4 border-t border-[var(--gemoffload-border-color)] pt-3">
											<div className="mb-2 text-[12px] font-medium text-[var(--gemoffload-font-secondary-color)]">{ cloud.label }</div>
											{ cloud.variants.length === 0 && <p className="gemoffload-help !mt-0">{ __( 'Not in the cloud yet. Only this server has the file.', 'gemoffload' ) }</p> }
											<div className="flex flex-col gap-2">
												{ cloud.variants.map( ( v ) => (
													<div key={ v.variant } className="flex items-center gap-3 text-[12px]">
														<span className="w-[92px] shrink-0 text-[var(--gemoffload-font-secondary-color)]">{ v.variant }</span>
														<Tooltip content={ `${ v.bucket }/${ v.object_key }` } className="gemoffload-code gemoffload-truncate min-w-0 flex-1">
															{ v.object_key }
														</Tooltip>
														<span className="shrink-0">{ v.size_label }</span>
														<StatusPill status={ v.status } />
													</div>
												) ) }
											</div>
										</div>
									</div>

									<div>
										<label className="gemoffload-label" htmlFor="gemoffload-file-title">{ __( 'Title', 'gemoffload' ) }</label>
										<input id="gemoffload-file-title" className="gemoffload-input" value={ form.title } onChange={ set( 'title' ) } />
									</div>
									{ file.kind === 'image' && (
										<div>
											<label className="gemoffload-label" htmlFor="gemoffload-file-alt">{ __( 'Alternative text', 'gemoffload' ) }</label>
											<input id="gemoffload-file-alt" className="gemoffload-input" value={ form.alt } onChange={ set( 'alt' ) } />
											<p className="gemoffload-help">{ __( 'Describe the image for people who can\'t see it. Leave empty if it is only decoration.', 'gemoffload' ) }</p>
										</div>
									) }
									<div>
										<label className="gemoffload-label" htmlFor="gemoffload-file-caption">{ __( 'Caption', 'gemoffload' ) }</label>
										<textarea id="gemoffload-file-caption" className="gemoffload-input" rows={ 2 } value={ form.caption } onChange={ set( 'caption' ) } />
									</div>
									<div>
										<label className="gemoffload-label" htmlFor="gemoffload-file-description">{ __( 'Description', 'gemoffload' ) }</label>
										<textarea id="gemoffload-file-description" className="gemoffload-input" rows={ 4 } value={ form.description } onChange={ set( 'description' ) } />
										<p className="gemoffload-help">{ __( 'Shown on the file\'s attachment page.', 'gemoffload' ) }</p>
									</div>
								</div>
							</div>
						) }
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--gemoffload-border-color)] px-5 py-3">
						<div className="flex flex-wrap gap-2">
							{ file && (
								<>
									<a className="gemoffload-btn gemoffload-btn--outline gemoffload-btn--sm" href={ file.url } target="_blank" rel="noreferrer" download={ file.file_name }>
										<Download size={ 14 } />
										{ __( 'Download', 'gemoffload' ) }
									</a>
									<a className="gemoffload-btn gemoffload-btn--outline gemoffload-btn--sm" href={ file.edit_url } target="_blank" rel="noreferrer">
										<ExternalLink size={ 14 } />
										{ __( 'Open in WordPress', 'gemoffload' ) }
									</a>
								</>
							) }
						</div>
						<div className="flex gap-2">
							<button type="button" className="gemoffload-btn gemoffload-btn--outline" onClick={ close }>
								{ dirty ? __( 'Cancel', 'gemoffload' ) : __( 'Close', 'gemoffload' ) }
							</button>
							<button type="button" className="gemoffload-btn gemoffload-btn--primary" onClick={ save } disabled={ ! dirty || saving }>
								{ saving && <Loader2 size={ 15 } className="gemoffload-spin" /> }
								{ saving ? __( 'Saving…', 'gemoffload' ) : __( 'Save changes', 'gemoffload' ) }
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
};

export default FileDetailsModal;
