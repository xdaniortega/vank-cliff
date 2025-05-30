'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect, useState } from 'react';
import LoadingCard from './LoadingCard';
import LoginPage from './LoginPage';
import { colors, spacing } from '@/theme/colors';

interface AuthGuardProps {
	children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps)
{
	const { user, sdkHasLoaded } = useDynamicContext();
	const [isInitializing, setIsInitializing] = useState(true);

	useEffect(() => {
		// Give a brief moment for the SDK to fully initialize
		const timer = setTimeout(() => {
		setIsInitializing(false);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	// Show loading screen while SDK is loading or during initialization
	if (!sdkHasLoaded || isInitializing) {
		return (
		<div style={{
			minHeight: '100vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.background,
			padding: spacing.xl
		}}>
			<div style={{
			maxWidth: '400px',
			width: '100%'
			}}>
			<LoadingCard 
				title="Initializing CryptoManager"
				showSpinner={true}
			>
				<p>Setting up your secure connection...</p>
			</LoadingCard>
			</div>
		</div>
		);
	}

	// Show login page if user is not authenticated
	if (!user) {
		return <LoginPage />;
	}

	// User is authenticated, show the main app
	return <>{children}</>;
}