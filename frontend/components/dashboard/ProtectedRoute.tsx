'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isInitializing && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isInitializing, router]);

    if (isInitializing) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div>Loading...</div>;
    }

    return <>{children}</>;
}
