"use client"

import { useState, useEffect } from "react"
import { useIsAuthenticated, useUser, useUserWallet, useAuthLoading, useAuthActions } from "@/store/hooks"
import { Button } from "@/components/ui/button"
import { User, LogOut, AlertTriangle, CheckCircle2, Loader2, Wallet } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

interface UserStatusProps {
  showFullInfo?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "compact" | "banner"
}

export function UserStatus({ showFullInfo = false, size = "md", variant = "default" }: UserStatusProps) {
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const wallet = useUserWallet()
  const isLoading = useAuthLoading()
  const { logout } = useAuthActions()
  const [isHydrated, setIsHydrated] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const router = useRouter()

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Show loading state during hydration
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-gray-500/10 px-3 py-2 border border-gray-500/30 rounded-lg">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      </div>
    )
  }

  if (variant === "banner") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 mb-4 p-4 border border-yellow-500/30 rounded-lg"
        >
          {isAuthenticated ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="flex justify-center items-center bg-green-500/20 rounded-full w-10 h-10">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Signed In</h3>
                  <p className="text-gray-400 text-sm">
                    {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.email}
                  </p>
                  {wallet && (
                    <p className="text-gray-500 text-xs">
                      Wallet:{" "}
                      {showFullInfo
                        ? wallet.wallet_address
                        : `${wallet.wallet_address.slice(0, 8)}...${wallet.wallet_address.slice(-8)}`}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
                onClick={logout}
              >
                <LogOut className="mr-1 w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="flex justify-center items-center bg-yellow-500/20 rounded-full w-10 h-10">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Authentication Required</h3>
                  <p className="text-gray-400 text-sm">Sign in to access your wallet and trading features</p>
                </div>
              </div>
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => router.push("/auth")}>
                Sign In
              </Button>
            </div>
          )}
        </motion.div>
      </>
    )
  }

  if (variant === "compact") {
    return (
      <>
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <div
                className={`flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded ${size === "sm" ? "px-2 py-1" : size === "md" ? "px-3 py-2" : "px-4 py-3"}`}
              >
                <CheckCircle2
                  className={`text-green-400 ${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"}`}
                />
                <span className="font-medium text-green-400 text-xs">Signed In</span>
              </div>
              <span className="text-gray-400 text-xs">{user?.first_name || user?.email?.slice(0, 8)}</span>
            </>
          ) : (
            <div
              className={`flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/30 rounded ${size === "sm" ? "px-2 py-1" : size === "md" ? "px-3 py-2" : "px-4 py-3"}`}
            >
              <AlertTriangle
                className={`text-yellow-400 ${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"}`}
              />
              <span className="font-medium text-yellow-400 text-xs">Not Signed In</span>
            </div>
          )}
        </div>
      </>
    )
  }

  // Default variant
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-3",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  // Map our size to button component size
  const buttonSize = size === "md" ? "default" : size

  return (
    <>
      <div className="flex items-center space-x-2">
        {isAuthenticated ? (
          <>
            <div
              className={`flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-lg ${sizeClasses[size]}`}
            >
              <CheckCircle2 className={`text-green-400 ${iconSizes[size]}`} />
              <div className="flex flex-col">
                <span className="font-medium text-green-400">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.email}
                </span>
                {wallet && showFullInfo && (
                  <span className="text-gray-500 text-xs">
                    <Wallet className="inline mr-1 w-3 h-3" />
                    {wallet.wallet_address.slice(0, 8)}...{wallet.wallet_address.slice(-8)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size={buttonSize}
              className="hover:bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
              onClick={logout}
            >
              <LogOut className={iconSizes[size]} />
            </Button>
          </>
        ) : (
          <>
            <div
              className={`flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg ${sizeClasses[size]}`}
            >
              <AlertTriangle className={`text-yellow-400 ${iconSizes[size]}`} />
              <span className="font-medium text-yellow-400">Not Signed In</span>
            </div>
            <Button
              size={buttonSize}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => router.push("/auth")}
            >
              <User className={`mr-1 ${iconSizes[size]}`} />
              Sign In
            </Button>
          </>
        )}
      </div>
    </>
  )
}
