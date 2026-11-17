import React from 'react';

export const SectionTitle = ( { title, description } ) => (
	<div className="mb-4">
		<h3 className="text-[15px] font-semibold text-[var(--gemoffload-font-color)]">{ title }</h3>
		{ description && <p className="mt-1 text-[13px] leading-[1.5] text-[var(--gemoffload-font-secondary-color)]">{ description }</p> }
	</div>
);

/**
 * A radio choice laid out as a card: title, explanation, selected border.
 */
export const ChoiceCard = ( { name, value, checked, onChange, title, description, badge } ) => (
	<label
		className={ `flex cursor-pointer items-start gap-3 rounded-[8px] border p-4 transition-colors ${
			checked ? 'border-[var(--gemoffload-primary)] bg-[var(--gemoffload-second-primary)]' : 'border-[var(--gemoffload-border-color)] hover:bg-[var(--gemoffload-secondary-color)]'
		}` }
	>
		<input type="radio" name={ name } value={ value } checked={ checked } onChange={ () => onChange( value ) } className="mt-1" />
		<span className="min-w-0">
			<span className="flex items-center gap-2 text-[14px] font-semibold text-[var(--gemoffload-font-color)]">
				{ title }
				{ badge && (
					<span className="rounded-full bg-[var(--gemoffload-success-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--gemoffload-success)]">{ badge }</span>
				) }
			</span>
			<span className="mt-1 block text-[13px] leading-[1.5] text-[var(--gemoffload-font-secondary-color)]">{ description }</span>
		</span>
	</label>
);
