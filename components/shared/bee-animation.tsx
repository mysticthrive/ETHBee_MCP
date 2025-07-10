"use client"

import { motion } from "framer-motion"
import { BeeIcon } from "@/components/shared/bee-icon"

export function BeeAnimation() {
  return (
    <div className="relative w-full h-full">
      <motion.div
        className="absolute inset-0 flex justify-center items-center"
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0, -10, 0],
        }}
        transition={{
          y: {
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
          x: {
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
        }}
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-4 bg-yellow-500/20 blur-xl rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <BeeIcon className="w-40 h-40" />
        </div>
      </motion.div>
    </div>
  )
}
