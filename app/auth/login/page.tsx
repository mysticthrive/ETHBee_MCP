"use client"

import { useState } from "react"
import { SignInForm } from "@/components/auth/signin-form"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useIsAuthenticated } from "@/store/hooks"
import { useEffect } from "react"

export default function SignInPage() {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleSuccess = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 min-h-screen">
      <div className="shadow-2xl px-6 pt-8 pb-8 rounded-t-full rounded-b-xl w-full max-w-md" >
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-bold text-white text-3xl">Welcome to EthBee</h1>
          <p className="text-gray-400">Your AI-powered Solana trading platform</p>
        </div>
        <SignInForm onSuccess={handleSuccess} onSwitchToSignUp={() => router.push('/auth/signup')} />
        <div className="mt-6 text-center">
          <Button variant="link" className="text-gray-400 hover:text-white" onClick={() => router.push("/")}>← Back to Home</Button>
        </div>
      </div>
    </div>
  )
}
