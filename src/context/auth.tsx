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
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`user_${userId}_`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
  }
};

const getUserData = (userId: string, section: string, key: string) => {
  try {
    const storageKey = getUserStorageKey(userId, section, key);
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

const setUserData = (userId: string, section: string, key: string, value: any) => {
  try {
    const storageKey = getUserStorageKey(userId, section, key);
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (e) {
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
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setCurrentUser(userCredential.user);
  };

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    setCurrentUser(userCredential.user);
  };

  const logout = async () => {
    if (currentUser) {
    }
    await signOut(auth);
    setCurrentUser(null);
  };

  const handleGetUserData = async (section: keyof UserData, key: string) => {
    if (!currentUser) {
      return null;
    }
    return getUserData(currentUser.uid, section, key);
  };

  const handleSetUserData = async (section: keyof UserData, key: string, value: any) => {
    if (!currentUser) {
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