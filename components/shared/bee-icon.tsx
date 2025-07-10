"use client"

import { motion } from "framer-motion"

export function BeeIcon({ className = "w-8 h-8", color = "text-yellow-400" }) {
  return (
    <motion.div
      className={`relative ${className} ${color}`}
      animate={{ rotate: [0, 5, 0, -5, 0] }}
      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Body */}
        <motion.ellipse
          cx="12"
          cy="12"
          rx="8"
          ry="6"
          fill="#F59E0B"
          stroke="#000"
          strokeWidth="1"
          animate={{ scaleX: [1, 1.05, 1], scaleY: [1, 0.95, 1] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.5 }}
        />

        {/* Stripes */}
        <motion.path d="M8 10 H16" stroke="#000" strokeWidth="1.5" />
        <motion.path d="M7 12 H17" stroke="#000" strokeWidth="1.5" />
        <motion.path d="M8 14 H16" stroke="#000" strokeWidth="1.5" />

        {/* Wings */}
        <motion.ellipse
          cx="7"
          cy="8"
          rx="4"
          ry="3"
          fill="#FFFFFF"
          stroke="#000"
          strokeWidth="0.5"
          opacity="0.7"
          animate={{ rotate: [0, 15, 0, -15, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.2 }}
        />
        <motion.ellipse
          cx="17"
          cy="8"
          rx="4"
          ry="3"
          fill="#FFFFFF"
          stroke="#000"
          strokeWidth="0.5"
          opacity="0.7"
          animate={{ rotate: [0, -15, 0, 15, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.2 }}
        />

        {/* Eyes */}
        <circle cx="10" cy="10" r="0.8" fill="#000" />
        <circle cx="14" cy="10" r="0.8" fill="#000" />

        {/* Smile */}
        <path d="M10 13 Q12 15, 14 13" fill="none" stroke="#000" strokeWidth="0.8" />

        {/* Antenna */}
        <motion.path
          d="M10 7 Q9 5, 8 4"
          fill="none"
          stroke="#000"
          strokeWidth="0.8"
          animate={{ d: ["M10 7 Q9 5, 8 4", "M10 7 Q9 4, 8 3", "M10 7 Q9 5, 8 4"] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
        />
        <motion.path
          d="M14 7 Q15 5, 16 4"
          fill="none"
          stroke="#000"
          strokeWidth="0.8"
          animate={{ d: ["M14 7 Q15 5, 16 4", "M14 7 Q15 4, 16 3", "M14 7 Q15 5, 16 4"] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
        />

        {/* Stinger */}
        <path d="M12 18 L12 20" stroke="#000" strokeWidth="1" />
      </svg>
    </motion.div>
  )
}
