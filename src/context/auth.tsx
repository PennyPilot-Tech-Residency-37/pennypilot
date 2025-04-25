import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { app } from "../types/firebaseConfig";
import { getAuth, User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

export const auth = getAuth(app);

interface AuthContextType {
  currentUser: User | null;
  idToken: string | null; // Add idToken
  loading: boolean;
  login: (email: string, password: string) => Promise<void>; // Add login method
  logout: () => Promise<void>; // Add logout method
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  idToken: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    setIdToken(token);
    setCurrentUser(userCredential.user);
  };

  const logout = async () => {
    await signOut(auth);
    setIdToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, idToken, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);