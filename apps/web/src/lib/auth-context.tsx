'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-client';
import type { BaseUser, UserRole } from '@peer-tutoring/types';

interface AuthContextValue {
  user: User | null;
  userProfile: BaseUser | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<BaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Get role from custom claims, force refresh to ensure latest claims after relogin
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          let userRole = (tokenResult.claims.role as UserRole) || null;
          
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data() as BaseUser;
            setUserProfile(profileData);
            // Use Firestore role as source of truth if available
            if (profileData.role) {
              userRole = profileData.role;
            }
          }
          
          setRole(userRole);

          // Set session cookie for middleware
          const token = await firebaseUser.getIdToken();
          document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;
        } else {
          setUser(null);
          setUserProfile(null);
          setRole(null);
          document.cookie = '__session=; path=/; max-age=0';
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    document.cookie = '__session=; path=/; max-age=0';
    setUser(null);
    setUserProfile(null);
    setRole(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as BaseUser);
      }
    }
  }, [user]);

  return (
    <AuthContext value={{ user, userProfile, role, loading, error, signOut, refreshProfile }}>
      {children}
    </AuthContext>
  );
}
