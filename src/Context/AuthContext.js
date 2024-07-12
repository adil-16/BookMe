import React, { useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  function ResetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }
  function logout() {
    return signOut(auth);
  }

  const [loaded, setloaded] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setloaded(true);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    logout,
    login,
    loaded,
    ResetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
