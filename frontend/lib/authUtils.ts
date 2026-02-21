/**
 * Authentication utilities for CincyMuse admin dashboard
 * Wraps AWS Amplify Auth operations
 */

import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export interface UserRole {
  role: 'Admin' | 'Viewer';
}

export interface AuthUser {
  username: string;
  email: string;
  role: 'Admin' | 'Viewer';
}

/**
 * Sign in with email and password
 * 
 * @param email - User's email address
 * @param password - User's password
 */
export async function login(email: string, password: string): Promise<void> {
  try {
    await signIn({
      username: email,
      password,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Login failed: ${error.message}`);
    }
    throw new Error('Login failed');
  }
}

/**
 * Sign out the current user
 */
export async function logout(): Promise<void> {
  try {
    await signOut();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
    throw new Error('Logout failed');
  }
}

/**
 * Get the current authenticated user with role information
 * 
 * @returns Promise resolving to user info or null if not authenticated
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    
    // Extract custom:role attribute from ID token
    const idToken = session.tokens?.idToken;
    const role = (idToken?.payload['custom:role'] as string) || 'Viewer';
    
    return {
      username: user.username,
      email: user.signInDetails?.loginId || '',
      role: role as 'Admin' | 'Viewer',
    };
  } catch (error) {
    // User is not authenticated
    return null;
  }
}

/**
 * Check if the current user is authenticated
 * 
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the current user has Admin role
 * 
 * @returns Promise resolving to true if user is Admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentAuthUser();
  return user?.role === 'Admin';
}

/**
 * Get the current user's JWT token
 * 
 * @returns Promise resolving to JWT token string
 */
export async function getAuthToken(): Promise<string> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return token;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get auth token: ${error.message}`);
    }
    throw new Error('Failed to get auth token');
  }
}
