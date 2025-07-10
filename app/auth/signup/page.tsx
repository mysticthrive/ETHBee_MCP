"use client"

import { SignUpForm } from "@/components/auth/signup-form"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useIsAuthenticated } from "@/store/hooks"
import { useEffect } from "react"

export default function SignUpPage() {
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
            <div className="w-full max-w-md">
                <div className="text-center">
                    <h1 className="mb-2 font-bold text-white text-3xl">Create your EthBee account</h1>
                    <p className="text-gray-400">Sign up to start trading with AI-powered tools</p>
                </div>
                <SignUpForm onSuccess={handleSuccess} onSwitchToSignIn={() => router.push('/auth/login')} />
                <div className="text-center">
                    <Button variant="link" className="text-gray-400 hover:text-white" onClick={() => router.push("/")}>← Back to Home</Button>
                </div>
            </div>
        </div>
    )
} 