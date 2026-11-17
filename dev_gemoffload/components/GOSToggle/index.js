import React from 'react';

/**
 * An on/off switch, the same as ZenCommunity's Toggle: a 36×20 track with a
 * 16px knob, an inset ring that keeps its edge on grey cards, and a focus
 * ring for the keyboard. Styled by .gemoffload-switch (_components.scss) rather
 * than utilities, so WordPress's button styles can't reach it.
 */
const GOSToggle = ( { checked, onChange, label, disabled = false, size = 'md' } ) => (
	<button
		type="button"
		role="switch"
		aria-checked={ !! checked }
		aria-label={ label }
		disabled={ disabled }
		onClick={ () => onChange( ! checked ) }
		className={ `gemoffload-switch${ size === 'sm' ? ' gemoffload-switch--sm' : '' }${ checked ? ' is-on' : '' }` }
	>
		<span className="gemoffload-switch__knob" aria-hidden="true" />
	</button>
);

export default GOSToggle;
