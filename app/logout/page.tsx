"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Remove user from localStorage
    localStorage.removeItem("currentUser")

    // Redirect to home page
    router.push("/")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Logging out...</p>
    </div>
  )
}
