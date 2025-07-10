"use client"

import { motion } from "framer-motion"
import { AIChatInterface } from "./ai-chat-interface"
import { Database, Zap, Brain, Lock } from "lucide-react"

export function AIChatSection() {
  return (
    <section className="py-10 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4"
      >
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
          >
            AI-Powered <span className="text-yellow-400">Smart Contract</span> Execution
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Execute crypto transactions directly through natural language. Our AI understands your intent and handles
            the complex blockchain interactions for you.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6"
          >
            <div className="bg-yellow-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-yellow-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Natural Language Transactions</h3>
            <p className="text-gray-400">
              Simply tell our AI what you want to do in plain English. No need to navigate complex interfaces or
              understand blockchain details.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6"
          >
            <div className="bg-yellow-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Brain className="text-yellow-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Learning From Every Interaction</h3>
            <p className="text-gray-400">
              Our AI learns from each transaction to provide better recommendations and execute more complex operations
              over time.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-6"
          >
            <div className="bg-yellow-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Lock className="text-yellow-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure Smart Contract Execution</h3>
            <p className="text-gray-400">
              All transactions are securely executed through audited smart contracts with confirmation steps to ensure
              your assets are protected.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <AIChatInterface />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 flex items-center justify-center text-sm text-gray-400"
        >
          <Database className="w-4 h-4 mr-2 text-yellow-400" />
          <span>
            All interactions are stored in our vector database to improve AI responses and transaction success rates
          </span>
        </motion.div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-yellow-500/5 rounded-full blur-3xl" />
      <div className="absolute top-40 -left-20 w-60 h-60 bg-yellow-500/5 rounded-full blur-3xl" />
    </section>
  )
}
