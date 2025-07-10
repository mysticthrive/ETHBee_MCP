"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react"
import { useAuthActions } from "@/store/hooks"
import { CustomButton } from "@/components/ui-custom/CustomButton"

interface SignUpFormProps {
  onSuccess?: () => void
  onSwitchToSignIn?: () => void
}

export function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signUp } = useAuthActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
      })

      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || "Sign up failed")
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
      <div className="bg-transparent shadow-2xl px-6 pt-8 pb-8 w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-400/30 rounded-md">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="gap-3 grid grid-cols-2">
            <div className="relative flex items-center">
              <User className="top-1/2 left-3 z-10 absolute w-5 h-5 text-amber-400 -translate-y-1/2 pointer-events-none" />
              <Input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="bg-black/50 focus:bg-black/80 shadow-lg backdrop-blur-md py-3 pl-12 border border-gray-700 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 h-12 text-white placeholder:text-gray-400 text-lg transition-all duration-200"
                autoComplete="given-name"
              />
            </div>
            <div className="relative flex items-center">
              <User className="top-1/2 left-3 z-10 absolute w-5 h-5 text-amber-400 -translate-y-1/2 pointer-events-none" />
              <Input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="bg-black/50 focus:bg-black/80 shadow-lg backdrop-blur-md py-3 pl-12 border border-gray-700 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 h-12 text-white placeholder:text-gray-400 text-lg transition-all duration-200"
                autoComplete="family-name"
              />
            </div>
          </div>
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
                autoComplete="new-password"
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
            <div className="relative flex items-center">
              <Lock className="top-1/2 left-3 z-10 absolute w-5 h-5 text-amber-400 -translate-y-1/2 pointer-events-none" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="bg-black/50 focus:bg-black/80 shadow-lg backdrop-blur-md py-3 pr-12 pl-12 border border-gray-700 focus:border-amber-400 rounded-xl focus:ring-2 focus:ring-amber-400/40 h-12 text-white placeholder:text-gray-400 text-lg transition-all duration-200"
                required
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="top-0 right-0 absolute hover:bg-transparent px-3 py-2 h-full"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
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
                Signing Up...
              </>
            ) : (
              "Sign Up"
            )}
          </CustomButton>
          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent h-px" />
            <span className="text-gray-500 text-xs">or</span>
            <div className="flex-1 bg-gradient-to-l from-transparent via-gray-700 to-transparent h-px" />
          </div>
          <div className="mt-0 text-sm text-center">
            <span className="text-gray-500">Already have an account? </span>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-gray-400 hover:text-amber-500 underline underline-offset-2"
              onClick={onSwitchToSignIn}
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
