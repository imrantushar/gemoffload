import React from 'react';
import { __ } from '@wordpress/i18n';
import { HelpCircle, Moon, Sun } from 'lucide-react';
import { useThemeMode } from '@GOSUtils/theme';
import './styles.scss';

const ThemeToggle = () => {
	const { isDark, toggle } = useThemeMode();
	const label = isDark ? __( 'Switch to light mode', 'gemoffload' ) : __( 'Switch to dark mode', 'gemoffload' );
	return (
		<button
			type="button"
			onClick={ toggle }
			title={ label }
			aria-label={ label }
			className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--gemoffload-border-color)] bg-[var(--gemoffload-body-background)] text-[var(--gemoffload-font-color)] transition-colors"
		>
			{ isDark ? <Sun size={ 16 } /> : <Moon size={ 16 } /> }
		</button>
	);
};

const TopBar = ( { leftContent = () => null, middleContent = () => null } ) => (
	<div className="gemoffload-topbar">
		<div className="gemoffload-topbar__left">{ leftContent() }</div>
		<div className="gemoffload-topbar__middle">{ middleContent() }</div>
		<div className="gemoffload-topbar__right">
			<ThemeToggle />
			<a
				className="gemoffload-btn gemoffload-btn--outline gemoffload-help-button"
				href="https://kodezen.com/docs/"
				target="_blank"
				rel="noreferrer"
			>
				<HelpCircle size={ 16 } />
				<span className="gemoffload-help-button__label">{ __( 'Help', 'gemoffload' ) }</span>
			</a>
		</div>
	</div>
);

export default TopBar;
