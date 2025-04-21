"use client"

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Auth } from "firebase/auth"
import { Firestore } from "firebase/firestore"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "employee"
  companies?: { companyId: string }[]
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role: "admin" | "employee") => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Cargar usuario desde Firebase al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Importar Firebase Auth
        const { auth, db, ADMIN_ROLE } = await import('@/app/firebaseConfig') as { 
          auth: Auth, 
          db: Firestore, 
          ADMIN_ROLE: string 
        };
        const { onAuthStateChanged } = await import('firebase/auth');
        const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');

        // Verificar si hay un usuario autenticado
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              // Buscar el documento del usuario en Firestore para obtener su rol
              const usersRef = collection(db, "users");
              const q = query(usersRef, where("email", "==", firebaseUser.email));
              const querySnapshot = await getDocs(q);
              
              let userRole = "employee"; // Rol por defecto
              let companies: { companyId: string }[] = [];
              
              if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                userRole = userData.role || "employee";
                companies = userData.companies || [];
              }
              
              // Crear objeto de usuario con la información necesaria
              const userData: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "",
                role: userRole as "admin" | "employee",
                companies
              };
              
              setUser(userData);
            } catch (error) {
              console.error("Error al obtener datos del usuario:", error);
            }
          } else {
            setUser(null);
          }
          setIsLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error al inicializar Firebase Auth:", error);
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Importar Firebase Auth
      const { onSigIn, db, ADMIN_ROLE } = await import('@/app/firebaseConfig') as {
        onSigIn: ({ email, password }: { email: string, password: string }) => Promise<any>,
        db: Firestore,
        ADMIN_ROLE: string
      };
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      // Iniciar sesión con Firebase
      const userCredential = await onSigIn({ email, password });
      
      if (!userCredential) {
        setIsLoading(false);
        return false;
      }
      
      // Obtener el usuario de Firebase
      const firebaseUser = userCredential.user;
      
      // Buscar el documento del usuario en Firestore para obtener su rol
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", firebaseUser.email));
      const querySnapshot = await getDocs(q);
      
      let userRole = "employee"; // Rol por defecto
      let companies: { companyId: string }[] = [];
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        userRole = userData.role || "employee";
        companies = userData.companies || [];
      }
      
      // Crear objeto de usuario con la información necesaria
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || email.split('@')[0],
        role: userRole as "admin" | "employee",
        companies
      };
      
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: "admin" | "employee") => {
    setIsLoading(true);
    try {
      // Importar Firebase Auth
      const { signUp, db } = await import('@/app/firebaseConfig') as {
        signUp: ({ email, password }: { email: string, password: string }) => Promise<any>,
        db: Firestore
      };
      const { doc, setDoc } = await import('firebase/firestore');
      
      // Registrar usuario con Firebase
      const userCredential = await signUp({ email, password });
      
      if (!userCredential) {
        setIsLoading(false);
        return false;
      }
      
      // Obtener el usuario de Firebase
      const firebaseUser = userCredential.user;
      
      // Crear documento del usuario en Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        name,
        email,
        role,
        companies: [],
        createdAt: new Date().toISOString()
      });
      
      // Crear objeto de usuario
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name,
        role,
        companies: []
      };
      
      setUser(userData);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Importar Firebase Auth
      const { logout } = await import('@/app/firebaseConfig') as {
        logout: () => Promise<void>
      };
      
      // Cerrar sesión con Firebase
      await logout();
      
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}