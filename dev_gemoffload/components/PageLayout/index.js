import React from 'react';
import { __ } from '@wordpress/i18n';
import { ChevronRight } from 'lucide-react';
import { plugin_root_url } from '@GOSUtils/helper';
import TopBar from '@GOSComponents/TopBar';
import TopBarNav from '@GOSComponents/TopBarNav';
import SubTopBar from '@GOSComponents/SubTopBar';

/**
 * Standard page frame: sticky top bar with breadcrumb and section pills,
 * then the page heading with its actions, then the content.
 */
const PageLayout = ( { title, heading, description, actions, children } ) => (
	<>
		<TopBar
			leftContent={ () => (
				<>
					<img
						src={ `${ plugin_root_url }assets/images/logo.svg` }
						alt={ __( 'GemOffload', 'gemoffload' ) }
						width="32"
						height="32"
						style={ { borderRadius: '6px' } }
					/>
					<ChevronRight size={ 16 } className="shrink-0 text-[var(--gemoffload-text-muted)]" />
					<span className="gemoffload-topbar__crumb">{ title }</span>
				</>
			) }
			middleContent={ () => <TopBarNav /> }
		/>
		<SubTopBar heading={ heading || title } description={ description }>
			{ actions }
		</SubTopBar>
		<div className="gemoffload-page-content">{ children }</div>
	</>
);

export default PageLayout;
