"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react"
import { useAuthActions } from "@/store/hooks"
import { CustomButton } from "@/components/ui-custom/CustomButton"

interface SignInFormProps {
  onSuccess?: () => void
  onSwitchToSignUp?: () => void
}

export function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn } = useAuthActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn(formData.email, formData.password)

      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || "Sign in failed")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-400/30 rounded-md">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-3">
          <div className="relative flex items-center">
            <Mail className="top-1/2 left-3 z-10 absolute w-5 h-5 text-amber-400 -translate-y-1/2 pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-black/50 focus:bg-black/80 shadow-lg backdrop-blur-md py-3 pl-12 border border-gray-700 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 h-12 text-white placeholder:text-gray-400 text-lg transition-all duration-200"
              required
              autoComplete="email"
            />
          </div>
          <div className="relative flex items-center">
            <Lock className="top-1/2 left-3 z-10 absolute w-5 h-5 text-amber-400 -translate-y-1/2 pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="bg-black/50 focus:bg-black/80 shadow-lg backdrop-blur-md py-3 pr-12 pl-12 border border-gray-700 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 h-12 text-white placeholder:text-gray-400 text-lg transition-all duration-200"
              required
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="top-0 right-0 absolute hover:bg-transparent px-3 py-2 h-full"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>
        <CustomButton
          customVariant="gradient"
          type="submit"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </CustomButton>
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent h-px" />
          <span className="text-gray-500 text-xs">or</span>
          <div className="flex-1 bg-gradient-to-l from-transparent via-gray-700 to-transparent h-px" />
        </div>
        <div className="mt-0 text-sm text-center">
          <span className="text-gray-500">Don't have an account? </span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-gray-400 hover:text-amber-500 underline underline-offset-2"
            onClick={onSwitchToSignUp}
          >
            Sign up
          </Button>
        </div>
      </form>
    </div>
  )
}
