import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import BackendDashboard from '@GOSContainers/BackendDashboard';
import AdminMenu from '@GOSContainers/BackendDashboard/AdminMenu';
import { store } from '@GOSRedux/store';
import { initThemeMode } from '@GOSUtils/theme';

import '../assets/scss/backend.scss';

document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'gemoffload-app' );
	if ( ! container ) {
		return;
	}

	container.classList.add( 'gemoffload-scope' );
	// Stamp the theme mode before the first paint, so there is no flash.
	initThemeMode();

	const root = createRoot( container );
	flushSync( () => {
		root.render(
			<Provider store={ store }>
				<Router>
					{ /* WordPress's own sidebar entry, kept in step with the router. */ }
					<AdminMenu />
					<BackendDashboard />
				</Router>
			</Provider>
		);
	} );
} );
