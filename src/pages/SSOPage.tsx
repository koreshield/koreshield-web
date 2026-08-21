import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api-client';

export const SSOPage: React.FC = () => {
	const location = useLocation();
	const query = new URLSearchParams(location.search);
	const redirectUri = query.get('redirect_uri');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!redirectUri) {
			// Don't set error in effect synchronously
			return;
		}

		let isMounted = true;

		const generateTicket = async () => {
			try {
				const response = await api.generateSSOTicket();
				const ticket = response.ticket;
				
				if (isMounted && ticket) {
					// Construct the redirect URL with the ticket
					const url = new URL(redirectUri);
					url.searchParams.append('ticket', ticket);
					window.location.href = url.toString();
				}
			} catch (err) {
				if (isMounted) {
					setError("Failed to generate SSO ticket. Please try again.");
					console.error("SSO Error:", err);
				}
			}
		};

		generateTicket();

		return () => {
			isMounted = false;
		};
	}, [redirectUri]);

	if (!redirectUri) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
					<h2 className="text-xl font-semibold text-red-600 mb-4">SSO Error</h2>
					<p className="text-gray-700 dark:text-gray-300 mb-6">Missing redirect_uri parameter</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
					<h2 className="text-xl font-semibold text-red-600 mb-4">SSO Error</h2>
					<p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
			<div className="flex flex-col items-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark mb-4"></div>
				<p className="text-gray-600 dark:text-gray-400">Authenticating with Guardian...</p>
			</div>
		</div>
	);
};

export default SSOPage;
