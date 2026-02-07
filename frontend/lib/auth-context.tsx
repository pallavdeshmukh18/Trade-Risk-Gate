'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    token: string | null;
    userName: string | null;
    userEmail: string | null;
    login: (email: string, password: string) => Promise<void>;
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
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedName = localStorage.getItem('user_name');
        const storedEmail = localStorage.getItem('user_email');
        if (storedToken) {
            setToken(storedToken);
        }
        if (storedName) {
            setUserName(storedName);
        }
        if (storedEmail) {
            setUserEmail(storedEmail);
        }
        setIsInitializing(false);
    }, []);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
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
            setToken(data.token);
            localStorage.setItem('auth_token', data.token);
            setUserEmail(email);
            localStorage.setItem('user_email', email);
            // Extract name from email or use provided name
            const namePart = email.split('@')[0];
            const displayName = data.name || namePart.charAt(0).toUpperCase() + namePart.slice(1);
            setUserName(displayName);
            localStorage.setItem('user_name', displayName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email: string, password: string, name?: string) => {
        setIsLoading(true);
        setError(null);
        try {
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

            const data = await response.json();
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
        setUserName(null);
        setUserEmail(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_email');
        setError(null);
    };

    const value: AuthContextType = {
        token,
        userName,
        userEmail,
        login,
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
