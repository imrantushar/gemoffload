import React from 'react';
import { __ } from '@wordpress/i18n';
import { useQuery } from '@GOSUtils/helper';
import Notification from '@GOSComponents/Notification';
import Dashboard from './pages/dashboard';
import Files from './pages/files';
import Tools from './pages/tools';
import Settings from './pages/settings';

const renderPage = ( page ) => {
	switch ( page ) {
		case 'gemoffload':
			return <Dashboard />;
		case 'gemoffload-files':
			return <Files />;
		case 'gemoffload-tools':
			return <Tools />;
		case 'gemoffload-settings':
			return <Settings />;
		default:
			return <p className="p-6">{ __( 'No page found', 'gemoffload' ) }</p>;
	}
};

export default function BackendDashboard() {
	const page = useQuery().get( 'page' );

	return (
		<div className="gemoffload-admin-content">
			<Notification />
			{ /* Keyed by page so switching menu items replays the enter animation. */ }
			<div key={ page } className="gemoffload-route">
				{ renderPage( page ) }
			</div>
		</div>
	);
}
