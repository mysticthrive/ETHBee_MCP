"use client"

import { motion } from "framer-motion"
import { CustomButton } from "@/components/ui-custom/CustomButton"
import Link from "next/link"
import type React from "react"

interface FeatureShowcaseProps {
  title: string
  highlightedText: string
  description: string
  bulletPoints: string[]
  buttonText: string
  buttonLink: string
  imageSrc: string
  imageAlt: string
  iconComponent: React.ReactNode
  reverse?: boolean
}

export function FeatureShowcase({
  title,
  highlightedText,
  description,
  bulletPoints,
  buttonText,
  buttonLink,
  imageSrc,
  imageAlt,
  iconComponent,
  reverse = false,
}: FeatureShowcaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-xl overflow-hidden"
    >
      <div className={`grid grid-cols-1 md:grid-cols-2 ${reverse ? "md:flex-row-reverse" : ""}`}>
        <div className="flex flex-col justify-center p-8">
          <h2 className="mb-4 font-bold text-white text-2xl md:text-3xl">
            {title} <span className="text-yellow-400">{highlightedText}</span>
          </h2>
          <p className="mb-6 text-gray-400">{description}</p>
          <ul className="space-y-3 mb-6">
            {bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <div className="bg-yellow-500/20 mt-0.5 mr-3 p-1 rounded-full">{iconComponent}</div>
                <span className="text-gray-300">{point}</span>
              </li>
            ))}
          </ul>
          <div>
            <Link href={buttonLink} passHref legacyBehavior className="self-start">
              <CustomButton customVariant="gradient" size="lg">
                {buttonText}
              </CustomButton>
            </Link>
          </div>
        </div>
        <div className="flex justify-center items-center bg-gradient-to-br from-yellow-400/10 to-amber-600/10 p-8">
          <img
            src={imageSrc || "/placeholder.svg"}
            alt={imageAlt}
            className="shadow-2xl rounded-lg max-w-full h-auto"
          />
        </div>
      </div>
    </motion.div>
  )
}
