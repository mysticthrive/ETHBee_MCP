"use client"

import { motion } from "framer-motion"
import { CheckCircle, Clock, Zap, Sparkles, TrendingUp, Shield, Bot } from "lucide-react"
import { BeeIcon } from "@/components/shared/bee-icon"

const roadmapItems = [
  {
    quarter: "Q2 2024",
    title: "Platform Launch",
    description: "Initial release of EthBee with core AI trading features and wallet integration.",
    items: [
      { text: "Wallet connection and portfolio tracking", completed: true },
      { text: "AI chat interface for basic trading", completed: true },
      { text: "Token information and analytics", completed: true },
      { text: "Social sentiment monitoring", completed: false },
    ],
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
  },
  {
    quarter: "Q3 2024",
    title: "Enhanced Trading Features",
    description: "Expanding the platform with advanced trading capabilities and deeper AI integration.",
    items: [
      { text: "Automated trading strategies", completed: false },
      { text: "Advanced portfolio analytics", completed: false },
      { text: "Price alerts and notifications", completed: false },
      { text: "Multi-wallet support", completed: false },
    ],
    icon: <TrendingUp className="w-6 h-6 text-yellow-400" />,
  },
  {
    quarter: "Q4 2024",
    title: "AI Advancement",
    description: "Major upgrades to our AI capabilities for more accurate predictions and insights.",
    items: [
      { text: "Enhanced prediction models", completed: false },
      { text: "Voice command trading", completed: false },
      { text: "Personalized trading recommendations", completed: false },
      { text: "Market trend analysis", completed: false },
    ],
    icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
  },
  {
    quarter: "Q1 2025",
    title: "Security & Expansion",
    description: "Strengthening platform security and expanding to new blockchain ecosystems.",
    items: [
      { text: "Advanced security features", completed: false },
      { text: "Cross-chain support", completed: false },
      { text: "Institutional-grade tools", completed: false },
      { text: "Mobile app release", completed: false },
    ],
    icon: <Shield className="w-6 h-6 text-yellow-400" />,
  },
]

export function Roadmap() {
  return (
    <section className="relative py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="mx-auto px-4 container"
      >
        <div className="mb-16 text-center">
          <div className="flex justify-center mb-4">
            <BeeIcon className="w-12 h-12" />
          </div>
          <h2 className="mb-4 font-bold text-white text-3xl md:text-5xl">
            Our <span className="text-yellow-400">Roadmap</span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            Follow our journey as we build the future of AI-powered Solana trading. Here's what we're working on and
            what's coming next.
          </p>
        </div>

        <div className="gap-8 grid grid-cols-1 md:grid-cols-2">
          {roadmapItems.map((item, index) => (
            <motion.div
              key={item.quarter}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative bg-black/40 backdrop-blur-md p-6 border border-yellow-500/30 rounded-xl overflow-hidden"
            >
              <div className="top-0 right-0 absolute bg-yellow-500/5 rounded-bl-full w-24 h-24" />

              <div className="flex items-center mb-4">
                <div className="flex justify-center items-center bg-yellow-500/10 mr-4 rounded-lg w-12 h-12">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">{item.title}</h3>
                  <p className="text-yellow-400 text-sm">{item.quarter}</p>
                </div>
              </div>

              <p className="mb-6 text-gray-400">{item.description}</p>

              <ul className="space-y-3">
                {item.items.map((listItem, i) => (
                  <li key={i} className="flex items-start">
                    {listItem.completed ? (
                      <CheckCircle className="flex-shrink-0 mt-0.5 mr-3 w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="flex-shrink-0 mt-0.5 mr-3 w-5 h-5 text-yellow-400" />
                    )}
                    <span className={`${listItem.completed ? "text-white" : "text-gray-300"}`}>{listItem.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center bg-black/40 backdrop-blur-md p-4 border border-yellow-500/30 rounded-xl">
            <Bot className="mr-3 w-6 h-6 text-yellow-400" />
            <p className="text-gray-300">
              Our roadmap is continuously evolving based on user feedback and market trends.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
