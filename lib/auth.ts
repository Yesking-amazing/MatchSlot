import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface SignUpData {
    email: string;
    password: string;
    name?: string;
}

export interface SignInData {
    email: string;
    password: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, name }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name || '',
            },
        },
    });

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Sign in with email and password
 */
export async function signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    return data.session;
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error && error.message !== 'Auth session missing!') {
        throw error;
    }

    return data?.user || null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
}
