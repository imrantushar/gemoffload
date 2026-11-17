import React from 'react';
import { __ } from '@wordpress/i18n';

const STYLES = {
	synced: { color: 'var(--gemoffload-success)', background: 'var(--gemoffload-success-bg)' },
	pending: { color: 'var(--gemoffload-warning)', background: 'var(--gemoffload-warning-bg)' },
	uploading: { color: 'var(--gemoffload-info)', background: 'var(--gemoffload-info-bg)' },
	failed: { color: 'var(--gemoffload-danger)', background: 'var(--gemoffload-danger-bg)' },
	deleting: { color: 'var(--gemoffload-text-muted)', background: 'var(--gemoffload-secondary-color)' },
	ok: { color: 'var(--gemoffload-success)', background: 'var(--gemoffload-success-bg)' },
	off: { color: 'var(--gemoffload-text-muted)', background: 'var(--gemoffload-secondary-color)' },
	warning: { color: 'var(--gemoffload-warning)', background: 'var(--gemoffload-warning-bg)' },
	error: { color: 'var(--gemoffload-danger)', background: 'var(--gemoffload-danger-bg)' },
};

export const STATUS_LABELS = {
	synced: __( 'Synced', 'gemoffload' ),
	pending: __( 'Pending', 'gemoffload' ),
	uploading: __( 'Uploading', 'gemoffload' ),
	failed: __( 'Failed', 'gemoffload' ),
	deleting: __( 'Removing', 'gemoffload' ),
};

/**
 * Rounded status label with a leading dot, as in Zaplane's logs table.
 */
const StatusPill = ( { status, label } ) => {
	const style = STYLES[ status ] || STYLES.off;
	return (
		<span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium" style={ style }>
			<span className="h-[6px] w-[6px] rounded-full" style={ { background: style.color } } />
			{ label || STATUS_LABELS[ status ] || status }
		</span>
	);
};

export default StatusPill;
