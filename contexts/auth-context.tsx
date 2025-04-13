"use client"

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

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

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulación de login - en una app real esto sería una llamada a API
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const foundUser = users.find((u: User) => u.email === email)
      
      if (foundUser) {
        // En una app real, verificarías la contraseña con hash
        setUser(foundUser)
        localStorage.setItem("currentUser", JSON.stringify(foundUser))
        setIsLoading(false)
        return true
      }
      
      setIsLoading(false)
      return false
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const register = async (name: string, email: string, password: string, role: "admin" | "employee") => {
    setIsLoading(true)
    try {
      // Simulación de registro - en una app real esto sería una llamada a API
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      
      // Verificar si el usuario ya existe
      if (users.some((u: User) => u.email === email)) {
        setIsLoading(false)
        return false
      }
      
      // Crear nuevo usuario
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        role,
        companies: []
      }
      
      // Guardar en "base de datos"
      users.push(newUser)
      localStorage.setItem("users", JSON.stringify(users))
      
      // Iniciar sesión con el nuevo usuario
      setUser(newUser)
      localStorage.setItem("currentUser", JSON.stringify(newUser))
      
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Registration error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
    router.push("/login")
  }

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