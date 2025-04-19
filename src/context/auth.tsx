import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { app } from "../types/firebaseConfig"; // Your path, assuming it's relative to src/context/
import { getAuth, User, onAuthStateChanged } from "firebase/auth";

export const auth = getAuth(app); // Export auth for use elsewhere

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);