"use client"

import { motion } from "framer-motion"
import { BeeIcon } from "@/components/shared/bee-icon"

export function Marquee() {
  return (
    <div className="bg-black backdrop-blur-sm py-3 border-y border-yellow-500/20 overflow-hidden">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: "-100%" }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 20,
          ease: "linear",
        }}
        className="flex items-center whitespace-nowrap"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center mx-8">
            <BeeIcon className="mr-2 w-5 h-5" />
            <span className="font-medium text-yellow-400">Trade smarter with AI-powered insights</span>
            <span className="mx-4 text-yellow-400/50">•</span>
            <span className="font-medium text-yellow-400">Join thousands of traders using EthBee</span>
            <span className="mx-4 text-yellow-400/50">•</span>
            <span className="font-medium text-yellow-400">New features coming soon</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
