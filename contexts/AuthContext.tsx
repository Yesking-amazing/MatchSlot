import {
    signIn as authSignIn,
    signOut as authSignOut,
    signUp as authSignUp,
    getSession,
    onAuthStateChange,
    SignInData,
    SignUpData,
} from '@/lib/auth';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (data: SignInData) => Promise<void>;
    signUp: (data: SignUpData) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        getSession()
            .then((session) => {
                setSession(session);
                setUser(session?.user ?? null);
            })
            .catch((error) => {
                console.error('Error getting session:', error);
            })
            .finally(() => {
                setLoading(false);
            });

        // Listen for auth changes
        const subscription = onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (data: SignInData) => {
        setLoading(true);
        try {
            await authSignIn(data);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (data: SignUpData) => {
        setLoading(true);
        try {
            await authSignUp(data);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await authSignOut();
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
