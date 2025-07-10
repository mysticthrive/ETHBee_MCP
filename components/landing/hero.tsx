"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { MessageSquareText } from "lucide-react"
import { FloatingBees } from "@/components/shared/floating-bees"
import { BeeAnimation } from "@/components/shared/bee-animation"
import Link from "next/link"
import { useIsAuthenticated } from "@/store/hooks"
import { CustomButton } from "@/components/ui-custom/CustomButton"

export default function Hero() {
  const isAuthenticated = useIsAuthenticated()
  return (
    <>
      <div className="relative flex items-center pt-20 min-h-[calc(100vh)]">
        {/* Floating bees background */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingBees count={6} />
        </div>

        <div className="z-10 relative mx-auto px-6 container">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="mb-6 font-bold text-white text-4xl md:text-6xl lg:text-7xl">
                Ethereum Trading with
                <span className="bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 text-transparent">
                  {" "}
                  AI Power
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-8 max-w-2xl text-gray-400 text-xl"
            >
              Track your Ethereum portfolio and let our AI transform your trading strategy with powerful analytics and
              insights.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex sm:flex-row flex-col justify-center items-center gap-4"
            >
              {isAuthenticated ? (
                <Link href="/dashboard" passHref legacyBehavior>
                  <CustomButton
                    type="button"
                    customVariant="gradient"
                    size="lg"
                  >
                    Go to Dashboard
                  </CustomButton>
                </Link>
              ) : (
                <Link href="/auth/login" passHref legacyBehavior>
                  <CustomButton type="button" customVariant="gradient" size="lg">
                    Get Started
                  </CustomButton>
                </Link>
              )}
              <Link href="/ai-chat" passHref legacyBehavior>
                <CustomButton type="button" customVariant="outlineYellow" size="lg">
                  <span className="flex items-center">
                    <MessageSquareText className="mr-2 w-5 h-5" />
                    Try AI Chat
                  </span>
                </CustomButton>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Animated bee */}
        <div className="right-0 bottom-0 absolute w-96 h-96">
          <BeeAnimation />
        </div>
      </div>
    </>
  )
}
