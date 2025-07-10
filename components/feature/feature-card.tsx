"use client"

import { motion } from "framer-motion"
import type React from "react"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
  gradient?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
  gradient = "from-yellow-400/20 to-amber-600/20",
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="bg-black/40 backdrop-blur-md rounded-xl border border-yellow-500/30 overflow-hidden"
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-6">
        <div className="bg-gradient-to-br from-yellow-400/20 to-amber-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </motion.div>
  )
}
