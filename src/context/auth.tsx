import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { app } from "../types/firebaseConfig";
import { getAuth, User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";

export const auth = getAuth(app);

// Define data types for different sections
export interface UserData {
  budget?: {
    categories: any[];
    transactions: any[];
    settings: any;
  };
  taxPrep?: {
    deductibleExpenses: any[];
    income: any[];
    settings: any;
  };
  goals?: {
    financialGoals: any[];
    progress: any;
    settings: any;
  };
  dashboard?: {
    widgets: any[];
    layout: any;
    settings: any;
  };
}

// Helper functions for user-specific localStorage
const getUserStorageKey = (userId: string, section: string, key: string) => `user_${userId}_${section}_${key}`;

// Clear all data for a specific user
const clearUserData = (userId: string) => {
  try {
    console.log('Clearing data for user:', userId);
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`user_${userId}_`)) {
        console.log('Removing key:', key);
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error(`Error clearing data for user ${userId}:`, e);
  }
};

const getUserData = (userId: string, section: string, key: string) => {
  try {
    const storageKey = getUserStorageKey(userId, section, key);
    console.log('Getting data for key:', storageKey);
    const data = localStorage.getItem(storageKey);
    console.log('Retrieved data:', data);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Error reading ${section}.${key} for user ${userId}:`, e);
    return null;
  }
};

const setUserData = (userId: string, section: string, key: string, value: any) => {
  try {
    const storageKey = getUserStorageKey(userId, section, key);
    console.log('Setting data for key:', storageKey);
    console.log('Setting value:', value);
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${section}.${key} for user ${userId}:`, e);
  }
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  getUserData: (section: keyof UserData, key: string) => Promise<any>;
  setUserData: (section: keyof UserData, key: string, value: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
  getUserData: async () => null,
  setUserData: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed. User:', user?.uid);
      if (user) {
        console.log('Logging in user:', user.uid);
        setCurrentUser(user);
      } else {
        console.log('User logged out');
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user.uid);
    setCurrentUser(userCredential.user);
  };

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User signed up:', userCredential.user.uid);
    setCurrentUser(userCredential.user);
  };

  const logout = async () => {
    if (currentUser) {
      console.log('Logging out user:', currentUser.uid);
    }
    await signOut(auth);
    setCurrentUser(null);
  };

  const handleGetUserData = async (section: keyof UserData, key: string) => {
    if (!currentUser) {
      console.log('No current user when getting data');
      return null;
    }
    return getUserData(currentUser.uid, section, key);
  };

  const handleSetUserData = async (section: keyof UserData, key: string, value: any) => {
    if (!currentUser) {
      console.log('No current user when setting data');
      return;
    }
    setUserData(currentUser.uid, section, key, value);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      login, 
      logout, 
      signup,
      getUserData: handleGetUserData,
      setUserData: handleSetUserData
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);