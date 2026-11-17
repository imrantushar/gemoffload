import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { CheckCircle2, XCircle, PlugZap, Loader2, Eye, EyeOff } from 'lucide-react';
import Field from '@GOSComponents/Field';
import GOSToggle from '@GOSComponents/GOSToggle';
import GOSAlert from '@GOSComponents/GOSAlert';
import { API, namespace, errorMessage, notify } from '@GOSUtils/helper';
import { SectionTitle } from './common';
import GOSSelect from '@GOSComponents/GOSSelect';
import SetupGuide from './SetupGuide';

const AWS_REGIONS = [
	'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'ca-central-1', 'sa-east-1',
	'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1', 'eu-south-1', 'eu-south-2',
	'ap-south-1', 'ap-south-2', 'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
	'me-south-1', 'me-central-1', 'af-south-1', 'il-central-1',
];

const STEP_LABELS = {
	put: __( 'Upload a probe file', 'gemoffload' ),
	head: __( 'Read it back', 'gemoffload' ),
	delete: __( 'Delete it', 'gemoffload' ),
};

const ProviderCard = ( { provider, active, onSelect, disabled } ) => (
	<button
		type="button"
		disabled={ disabled }
		onClick={ () => onSelect( provider.key ) }
		className={ `flex flex-col items-start gap-1 rounded-[8px] border p-4 text-left transition-colors ${
			active ? 'border-[var(--gemoffload-primary)] bg-[var(--gemoffload-second-primary)]' : 'border-[var(--gemoffload-border-color)] hover:bg-[var(--gemoffload-secondary-color)]'
		}` }
		style={ { borderWidth: active ? 2 : 1 } }
	>
		<span className={ `text-[14px] font-semibold ${ active ? 'text-[var(--gemoffload-primary)]' : 'text-[var(--gemoffload-font-color)]' }` }>{ provider.label }</span>
		<span className="text-[12px] leading-[1.45] text-[var(--gemoffload-font-secondary-color)]">{ provider.description }</span>
	</button>
);

const TestResult = ( { result } ) => {
	const { role, report } = result;
	return (
		<div className="rounded-[8px] border border-[var(--gemoffload-border-color)] p-4">
			<div className="mb-3 flex items-center justify-between gap-3">
				<div className="text-[13px] font-semibold">
					{ role === 'private' ? __( 'Private bucket', 'gemoffload' ) : __( 'Public bucket', 'gemoffload' ) }
					<code className="gemoffload-code ml-2">{ report.bucket }</code>
				</div>
				{ report.ok ? (
					<span className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--gemoffload-success)]">
						<CheckCircle2 size={ 16 } /> { __( 'Works', 'gemoffload' ) }
					</span>
				) : (
					<span className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--gemoffload-danger)]">
						<XCircle size={ 16 } /> { __( 'Failed', 'gemoffload' ) }
					</span>
				) }
			</div>
			<ul className="flex flex-col gap-1.5">
				{ report.steps.map( ( step ) => (
					<li key={ step.name } className="flex items-center justify-between text-[13px]">
						<span className="flex items-center gap-2">
							{ step.ok ? <CheckCircle2 size={ 14 } className="text-[var(--gemoffload-success)]" /> : <XCircle size={ 14 } className="text-[var(--gemoffload-danger)]" /> }
							{ STEP_LABELS[ step.name ] || step.name }
						</span>
						<span className="text-[12px] text-[var(--gemoffload-text-muted)]">{ step.ms } ms</span>
					</li>
				) ) }
			</ul>
			{ report.error && (
				<div className="mt-3">
					<GOSAlert type="error" title={ report.error.code }>
						{ report.error.message }
						{ report.error.hint && <div className="mt-1 font-medium">{ report.error.hint }</div> }
					</GOSAlert>
				</div>
			) }
			{ report.clock_warning && (
				<div className="mt-3">
					<GOSAlert type="warning">{ report.clock_warning }</GOSAlert>
				</div>
			) }
		</div>
	);
};

const ConnectionTab = ( { form, meta, setSetting, setCredential, setProvider, isDirty, saving, onSave } ) => {
	const dispatch = useDispatch();
	const [ testing, setTesting ] = useState( false );
	const [ results, setResults ] = useState( null );
	const [ showSecret, setShowSecret ] = useState( false );

	const s = form.settings;
	const c = form.credentials;
	const locked = meta.credentials.locked || {};
	const provider = s.provider;

	const test = async () => {
		setTesting( true );
		setResults( null );
		try {
			const res = await API.post( `${ namespace }connection/test`, { settings: s, credentials: c } );
			setResults( res.data );
			if ( res.data.message ) {
				notify( dispatch, res.data.message, 'warning' );
			}
		} catch ( e ) {
			notify( dispatch, errorMessage( e ), 'error' );
		} finally {
			setTesting( false );
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<div className="flex items-start justify-between gap-6 rounded-[8px] border border-[var(--gemoffload-border-color)] p-4">
				<div>
					<div className="text-[14px] font-semibold">{ __( 'Cloud storage', 'gemoffload' ) }</div>
					<p className="mt-1 text-[13px] text-[var(--gemoffload-font-secondary-color)]">
						{ __( 'When off, nothing uploads and every URL points at this server again. Stored objects are kept.', 'gemoffload' ) }
					</p>
				</div>
				<GOSToggle checked={ !! s.enabled } onChange={ ( v ) => setSetting( [ 'enabled' ], v ) } label={ __( 'Cloud storage', 'gemoffload' ) } />
			</div>

			{ meta.credentials.needs_reentry && (
				<GOSAlert type="warning" title={ __( 'Re-enter your secret key', 'gemoffload' ) }>
					{ __( 'The stored secret can\'t be decrypted because the WordPress salts changed.', 'gemoffload' ) }
				</GOSAlert>
			) }

			<div>
				<SectionTitle title={ __( 'Provider', 'gemoffload' ) } />
				<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
					{ meta.providers.map( ( p ) => (
						<ProviderCard key={ p.key } provider={ p } active={ provider === p.key } disabled={ locked.provider } onSelect={ setProvider } />
					) ) }
				</div>
				<div className="mt-4">
					<SetupGuide
						provider={ provider }
						providerLabel={ meta.providers.find( ( p ) => p.key === provider )?.label || provider }
						settings={ s }
						credentials={ c }
					/>
				</div>
			</div>

			<div>
				<SectionTitle
					title={ __( 'Endpoint', 'gemoffload' ) }
					description={
						provider === 'r2'
							? __( 'The endpoint is built from your account ID: https://<account_id>.r2.cloudflarestorage.com.', 'gemoffload' )
							: provider === 'aws'
								? __( 'The region is part of every signature; a wrong one fails with “signature does not match”.', 'gemoffload' )
								: __( 'Any service that speaks the S3 API with SigV4 signing.', 'gemoffload' )
					}
				/>
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					{ provider === 'r2' && (
						<>
							<Field label={ __( 'Account ID', 'gemoffload' ) } required locked={ locked.account_id } help={ __( 'Cloudflare dashboard → R2 → Account details.', 'gemoffload' ) }>
								<input id="gemoffload-f-account-id" className="gemoffload-input" value={ s.endpoint.account_id } disabled={ locked.account_id } onChange={ ( e ) => setSetting( [ 'endpoint', 'account_id' ], e.target.value.trim() ) } placeholder="9f2c4e1a…" />
							</Field>
							<Field label={ __( 'Jurisdiction', 'gemoffload' ) } help={ __( 'Only for buckets created with a data-location jurisdiction.', 'gemoffload' ) }>
								<GOSSelect
									value={ s.endpoint.jurisdiction }
									inputId="gemoffload-f-jurisdiction"
									onChange={ ( v ) => setSetting( [ 'endpoint', 'jurisdiction' ], v ) }
									options={ [
										{ value: '', label: __( 'Default', 'gemoffload' ) },
										{ value: 'eu', label: __( 'European Union (EU)', 'gemoffload' ) },
										{ value: 'fedramp', label: 'FedRAMP' },
									] }
									aria-label={ __( 'Jurisdiction', 'gemoffload' ) }
								/>
							</Field>
						</>
					) }
					{ provider === 'aws' && (
						<Field label={ __( 'Region', 'gemoffload' ) } required>
							<GOSSelect
								value={ s.endpoint.region }
								inputId="gemoffload-f-region"
								onChange={ ( v ) => setSetting( [ 'endpoint', 'region' ], v ) }
								options={ AWS_REGIONS.map( ( r ) => ( { value: r, label: r } ) ) }
								isSearchable
								aria-label={ __( 'Region', 'gemoffload' ) }
							/>
						</Field>
					) }
					{ provider === 'custom' && (
						<>
							<Field label={ __( 'Endpoint URL', 'gemoffload' ) } required help={ __( 'For example https://s3.eu-central-1.wasabisys.com', 'gemoffload' ) }>
								<input id="gemoffload-f-endpoint" className="gemoffload-input" value={ s.endpoint.url } onChange={ ( e ) => setSetting( [ 'endpoint', 'url' ], e.target.value.trim() ) } placeholder="https://" />
							</Field>
							<Field label={ __( 'Region', 'gemoffload' ) }>
								<input id="gemoffload-f-region" className="gemoffload-input" value={ s.endpoint.region } onChange={ ( e ) => setSetting( [ 'endpoint', 'region' ], e.target.value.trim() ) } placeholder="us-east-1" />
							</Field>
							<Field label={ __( 'Path-style addressing', 'gemoffload' ) } help={ __( 'endpoint/bucket/key instead of bucket.endpoint/key. MinIO needs it.', 'gemoffload' ) }>
								<GOSToggle checked={ !! s.endpoint.path_style } onChange={ ( v ) => setSetting( [ 'endpoint', 'path_style' ], v ) } label={ __( 'Path-style addressing', 'gemoffload' ) } />
							</Field>
						</>
					) }
				</div>
			</div>

			<div>
				<SectionTitle
					title={ __( 'Access key', 'gemoffload' ) }
					description={
						provider === 'r2'
							? __( 'Create an R2 API token with “Object Read & Write”, scoped to your buckets.', 'gemoffload' )
							: provider === 'aws'
								? __( 'Use an IAM user limited to s3:GetObject, s3:PutObject, s3:DeleteObject and s3:ListBucket on your buckets.', 'gemoffload' )
								: __( 'A key from your storage service that can read, write, list and delete objects in both buckets.', 'gemoffload' )
					}
				/>
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Field label={ __( 'Access key ID', 'gemoffload' ) } required locked={ locked.access_key_id }>
						<input id="gemoffload-f-access-key" className="gemoffload-input" autoComplete="off" value={ c.access_key_id } disabled={ locked.access_key_id } onChange={ ( e ) => setCredential( 'access_key_id', e.target.value.trim() ) } />
					</Field>
					<Field
						label={ __( 'Secret access key', 'gemoffload' ) }
						required
						locked={ locked.secret_access_key }
						help={ __( 'Encrypted with libsodium before it is stored, and never sent back to the browser.', 'gemoffload' ) }
					>
						<div className="relative">
							<input
								id="gemoffload-f-secret-key"
								className="gemoffload-input !pr-10"
								type={ showSecret ? 'text' : 'password' }
								autoComplete="new-password"
								value={ c.secret_access_key }
								disabled={ locked.secret_access_key }
								onFocus={ ( e ) => c.secret_access_key.startsWith( '••••' ) && e.target.select() }
								onChange={ ( e ) => setCredential( 'secret_access_key', e.target.value ) }
							/>
							<button type="button" className="absolute right-2 top-1/2 flex -translate-y-1/2 p-1 text-[var(--gemoffload-text-muted)]" onClick={ () => setShowSecret( ( v ) => ! v ) } aria-label={ __( 'Show or hide the secret', 'gemoffload' ) }>
								{ showSecret ? <EyeOff size={ 16 } /> : <Eye size={ 16 } /> }
							</button>
						</div>
					</Field>
				</div>
			</div>

			<div>
				<SectionTitle
					title={ __( 'Buckets', 'gemoffload' ) }
					description={ __( 'Public media goes to the public bucket behind your CDN domain. Protected files go to the private bucket and are only ever served through short-lived signed URLs.', 'gemoffload' ) }
				/>
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Field label={ __( 'Public bucket', 'gemoffload' ) } required>
						<input id="gemoffload-f-public-bucket" className="gemoffload-input" value={ s.buckets.public.name } onChange={ ( e ) => setSetting( [ 'buckets', 'public', 'name' ], e.target.value.trim().toLowerCase() ) } placeholder="my-site-media" />
					</Field>
					<Field
						label={ __( 'Public URL', 'gemoffload' ) }
						required={ provider === 'r2' }
						help={
							provider === 'r2'
								? __( 'Your R2 custom domain (recommended) or the r2.dev subdomain, which is rate-limited and meant for testing.', 'gemoffload' )
								: __( 'Your CloudFront or CDN domain. Leave empty to use the bucket’s own address (needs a public-read bucket policy).', 'gemoffload' )
						}
					>
						<input id="gemoffload-f-public-url" className="gemoffload-input" value={ s.buckets.public.public_url } onChange={ ( e ) => setSetting( [ 'buckets', 'public', 'public_url' ], e.target.value.trim() ) } placeholder="https://media.example.com" />
					</Field>
					<Field
						label={ __( 'Private bucket', 'gemoffload' ) }
						help={ __( 'Keep "Block public access" on. Leave empty to share the public bucket (not recommended).', 'gemoffload' ) }
					>
						<input id="gemoffload-f-private-bucket" className="gemoffload-input" value={ s.buckets.private.name } onChange={ ( e ) => setSetting( [ 'buckets', 'private', 'name' ], e.target.value.trim().toLowerCase() ) } placeholder="my-site-protected" />
					</Field>
				</div>
			</div>

			<div className="flex flex-col gap-4 border-t border-[var(--gemoffload-border-color)] pt-6">
				<div className="flex flex-wrap items-center gap-3">
					<button type="button" className="gemoffload-btn gemoffload-btn--soft" onClick={ test } disabled={ testing }>
						{ testing ? <Loader2 size={ 16 } className="gemoffload-spin" /> : <PlugZap size={ 16 } /> }
						{ testing ? __( 'Testing…', 'gemoffload' ) : __( 'Test connection', 'gemoffload' ) }
					</button>
					<button type="button" className="gemoffload-btn gemoffload-btn--primary" onClick={ onSave } disabled={ ! isDirty || saving }>
						{ saving ? __( 'Saving…', 'gemoffload' ) : __( 'Save changes', 'gemoffload' ) }
					</button>
					<span className="text-[12px] text-[var(--gemoffload-text-muted)]">
						{ isDirty
							? __( 'Testing doesn\'t save. Save to keep these values.', 'gemoffload' )
							: __( 'Tests the values above, saved or not: uploads, reads and deletes a small probe file.', 'gemoffload' ) }
					</span>
				</div>
				{ results && results.results?.length > 0 && (
					<>
						{ results.ok && (
							<GOSAlert type="success">
								{ sprintf(
									/* translators: %d: number of buckets */
									__( 'Connection works for %d bucket(s). Save to apply.', 'gemoffload' ),
									results.results.length
								) }
							</GOSAlert>
						) }
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
							{ results.results.map( ( r ) => (
								<TestResult key={ r.role } result={ r } />
							) ) }
						</div>
					</>
				) }
			</div>
		</div>
	);
};

export default ConnectionTab;
