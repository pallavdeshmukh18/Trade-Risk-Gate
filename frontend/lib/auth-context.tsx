'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type AuthUser = {
    name: string;
    email: string;
    picture?: string;
};

interface AuthContextType {
    token: string | null;
    user: AuthUser | null;
    userName: string | null;
    userEmail: string | null;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    signup: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    isInitializing: boolean;
    error: string | null;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [userPicture, setUserPicture] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const storedName = localStorage.getItem('user_name');
        const storedEmail = localStorage.getItem('user_email');
        const storedPicture = localStorage.getItem('user_picture');
        if (storedToken) {
            setToken(storedToken);
        }
        if (storedName) {
            setUserName(storedName);
        }
        if (storedEmail) {
            setUserEmail(storedEmail);
        }
        if (storedPicture) {
            setUserPicture(storedPicture);
        }
        setIsInitializing(false);
    }, []);

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

    const persistAuthState = (data: { token: string; name?: string | null; email?: string | null; picture?: string | null }) => {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('auth_token', data.token);

        if (data.email) {
            setUserEmail(data.email);
            localStorage.setItem('user_email', data.email);
        }

        if (data.name) {
            setUserName(data.name);
            localStorage.setItem('user_name', data.name);
        }

        if (data.picture) {
            setUserPicture(data.picture);
            localStorage.setItem('user_picture', data.picture);
        } else {
            setUserPicture(null);
            localStorage.removeItem('user_picture');
        }
    };

    useEffect(() => {
        if (!token) return;
        if (!apiUrl) return;

        const shouldHydrateProfile = !userName || !userEmail || !userPicture;
        if (!shouldHydrateProfile) return;

        const hydrateProfile = async () => {
            try {
                const response = await fetch(`${apiUrl}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    return;
                }

                const data = await response.json();

                if (data.name) {
                    setUserName(data.name);
                    localStorage.setItem('user_name', data.name);
                }

                if (data.email) {
                    setUserEmail(data.email);
                    localStorage.setItem('user_email', data.email);
                }

                if (data.picture) {
                    setUserPicture(data.picture);
                    localStorage.setItem('user_picture', data.picture);
                }
            } catch (err) {
                console.error('Failed to hydrate auth profile', err);
            }
        };

        void hydrateProfile();
    }, [apiUrl, token, userEmail, userName, userPicture]);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!apiUrl) {
                throw new Error('API unavailable. Set NEXT_PUBLIC_API_URL for production.');
            }

            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Login failed');
            }

            const data = await response.json();
            const namePart = email.split('@')[0];
            const displayName = data.name || namePart.charAt(0).toUpperCase() + namePart.slice(1);
            persistAuthState({
                token: data.token,
                email: data.email || email,
                name: displayName,
                picture: data.picture || null,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!apiUrl) {
                throw new Error('API unavailable. Set NEXT_PUBLIC_API_URL for production.');
            }
            window.location.href = `${apiUrl}/auth/google`;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Google login failed';
            setError(errorMessage);
            throw err;
        }
    };

    const signup = async (email: string, password: string, name?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            if (!apiUrl) {
                throw new Error('API unavailable. Set NEXT_PUBLIC_API_URL for production.');
            }

            const response = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Signup failed');
            }

            await response.json();
            // After successful signup, automatically log in
            if (name) {
                setUserName(name);
                localStorage.setItem('user_name', name);
            }
            setUserEmail(email);
            localStorage.setItem('user_email', email);
            await login(email, password);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Signup failed';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUserPicture(null);
        setUserName(null);
        setUserEmail(null);
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_picture');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        setError(null);
    };

    const user = userName && userEmail
        ? {
            name: userName,
            email: userEmail,
            picture: userPicture || undefined,
        }
        : null;

    const value: AuthContextType = {
        token,
        user,
        userName,
        userEmail,
        login,
        loginWithGoogle,
        signup,
        logout,
        isLoading,
        isInitializing,
        error,
        isAuthenticated: !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
