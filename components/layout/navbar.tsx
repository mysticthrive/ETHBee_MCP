"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, MessageSquareText, LayoutDashboard, X, User, LogOut, Loader2, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import type React from "react"
import { BeeIcon } from "@/components/shared/bee-icon"
import { usePathname } from "next/navigation"
import { useIsAuthenticated, useUser, useAuthLoading, useAuthActions } from "@/store/hooks"
import { CustomButton } from "@/components/ui-custom/CustomButton"
import { useRouter } from "next/navigation"

function NavItem({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative group ${active ? "text-white bg-yellow-500/10" : "text-gray-300 hover:text-white hover:bg-black/20"}`}
    >
      {children}
      <motion.span
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-yellow-500 rounded-full ${active ? "w-10" : "w-0"}`}
        initial={false}
        animate={{ width: active ? "2rem" : "0rem" }}
        transition={{ duration: 0.3 }}
      />
    </Link>
  )
}

function MobileNavItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      className="flex items-center hover:bg-yellow-500/10 px-2 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const isLoading = useAuthLoading()
  const { logout, restoreSession } = useAuthActions()
  const router = useRouter()

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true)
    restoreSession()
  }, [restoreSession])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const openSignIn = () => {
    router.push("/auth/login")
  }

  const openSignUp = () => {
    router.push("/auth/signup")
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4 transition-all duration-300 z-50 ${scrolled
          ? "bg-black/80 backdrop-blur-md border-b border-yellow-500/20 shadow-md"
          : "bg-transparent backdrop-blur-sm border-b border-white/10"
          }`}
      >
        <Link href="/" className="group flex items-center space-x-2">
          <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
            <BeeIcon className="w-10 h-10" />
          </motion.div>
          <span className="font-medium text-white group-hover:text-yellow-400 text-xl transition-colors">EthBee</span>
        </Link>

        <div className="hidden md:flex items-center space-x-1">
          <NavItem href="/" active={pathname === "/"}>
            Home
          </NavItem>

          <NavItem href="/features" active={pathname === "/features"}>
            Features
          </NavItem>

          <NavItem href="/dashboard" active={pathname === "/dashboard"}>
            <LayoutDashboard className="mr-1 w-4 h-4" />
            Dashboard
          </NavItem>

          <NavItem href="/trading" active={pathname === "/trading"}>
            <TrendingUp className="mr-1 w-4 h-4" />
            Trading
          </NavItem>

          <NavItem href="/ai-chat" active={pathname === "/ai-chat"}>
            <MessageSquareText className="mr-1 w-4 h-4" />
            AI Chat
          </NavItem>

          <NavItem href="/blog" active={pathname?.startsWith("/blog")}>
            Blog
          </NavItem>
        </div>

        <div className="hidden md:flex items-center space-x-3">
          {!isHydrated ? (
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                className="hover:bg-yellow-500/10 text-white hover:text-yellow-400 transition-all"
              >
                Sign In
              </Button>
              <div className="bg-gray-600 px-4 py-2 rounded-lg">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-yellow-500/10 px-3 py-2 border border-yellow-500/30 rounded-lg">
                <User className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-white text-sm">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.email}
                </span>
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
            <div className="flex items-center space-x-3">
              <CustomButton
                customVariant="textOnly"
                className="transition-all"
                onClick={() => router.push("/auth/signup")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <User className="mr-2 w-4 h-4" />
                    Sign Up
                  </>
                )}
              </CustomButton>
              <CustomButton
                customVariant="gradient"
                className="transition-all"
                onClick={() => router.push("/auth/login")}
              >
                Sign In
              </CustomButton>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-yellow-500/10 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden top-full right-0 left-0 absolute bg-black/95 backdrop-blur-md p-4 border-yellow-500/20 border-b">
            <div className="flex flex-col space-y-4">
              <MobileNavItem href="/" onClick={() => setMobileMenuOpen(false)}>
                Home
              </MobileNavItem>
              <MobileNavItem href="/features" onClick={() => setMobileMenuOpen(false)}>
                Features
              </MobileNavItem>
              <MobileNavItem href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </MobileNavItem>
              <MobileNavItem href="/trading" onClick={() => setMobileMenuOpen(false)}>
                Trading
              </MobileNavItem>
              <MobileNavItem href="/ai-chat" onClick={() => setMobileMenuOpen(false)}>
                AI Chat
              </MobileNavItem>
              <MobileNavItem href="/blog" onClick={() => setMobileMenuOpen(false)}>
                Blog
              </MobileNavItem>
              <div className="flex flex-col space-y-2 pt-2 border-white/10 border-t">
                {!isHydrated ? (
                  <div className="space-y-2">
                    <CustomButton customVariant="textOnly" className="justify-start" onClick={openSignUp}>
                      <User className="mr-2 w-4 h-4" />
                      Sign Up
                    </CustomButton>
                    <CustomButton customVariant="gradient" className="justify-start" onClick={openSignIn}>
                      Sign In
                    </CustomButton>
                  </div>
                ) : isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 bg-yellow-500/10 px-3 py-2 border border-yellow-500/30 rounded-lg">
                      <User className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-white text-sm">
                        {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.email}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="justify-start hover:bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
                      onClick={logout}
                    >
                      <LogOut className="mr-2 w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <CustomButton customVariant="textOnly" className="justify-start" onClick={openSignUp}>
                      <User className="mr-2 w-4 h-4" />
                      Sign Up
                    </CustomButton>
                    <CustomButton customVariant="gradient" className="justify-start" onClick={openSignIn}>
                      Sign In
                    </CustomButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.nav>
    </>
  )
}