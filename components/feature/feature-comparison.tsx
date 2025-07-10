"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

interface FeatureComparisonProps {
  features: {
    name: string
    free: boolean | string
    premium: boolean | string
    enterprise: boolean | string
  }[]
}

export function FeatureComparison({ features }: FeatureComparisonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-4 text-left text-gray-400 font-medium">Feature</th>
            <th className="p-4 text-center text-gray-400 font-medium">Free</th>
            <th className="p-4 text-center text-yellow-400 font-medium">Premium</th>
            <th className="p-4 text-center text-yellow-400 font-medium">Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-t border-gray-800">
              <td className="p-4 text-white">{feature.name}</td>
              <td className="p-4 text-center">
                {typeof feature.free === "boolean" ? (
                  feature.free ? (
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-red-400 mx-auto" />
                  )
                ) : (
                  <span className="text-green-400">{feature.free}</span>
                )}
              </td>
              <td className="p-4 text-center">
                {typeof feature.premium === "boolean" ? (
                  feature.premium ? (
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-red-400 mx-auto" />
                  )
                ) : (
                  <span className="text-green-400">{feature.premium}</span>
                )}
              </td>
              <td className="p-4 text-center">
                {typeof feature.enterprise === "boolean" ? (
                  feature.enterprise ? (
                    <Check className="w-5 h-5 text-green-400 mx-auto" />
                  ) : (
                    <X className="w-5 h-5 text-red-400 mx-auto" />
                  )
                ) : (
                  <span className="text-green-400">{feature.enterprise}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}
