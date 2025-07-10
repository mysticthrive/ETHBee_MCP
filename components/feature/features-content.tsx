"use client"

import { motion } from "framer-motion"
import {
  MessageSquareText,
  LayoutDashboard,
  Sparkles,
  Users,
  Bell,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  LineChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BeeIcon } from "@/components/shared/bee-icon"
import { FloatingBees } from "@/components/shared/floating-bees"
import Link from "next/link"
import { FeatureCard } from "@/components/feature/feature-card"
import { FeatureShowcase } from "@/components/feature/feature-showcase"
import { FeatureComparison } from "@/components/feature/feature-comparison"
import { CustomButton } from "@/components/ui-custom/CustomButton"

// Feature comparison data
const featureComparisonData = [
  {
    name: "AI Trading Assistant",
    free: "Basic",
    premium: "Advanced",
    enterprise: "Custom",
  },
  {
    name: "Portfolio Dashboard",
    free: true,
    premium: true,
    enterprise: true,
  },
  {
    name: "AI Recommendations",
    free: "Limited",
    premium: "Full Access",
    enterprise: "Priority",
  },
  {
    name: "Social Engagement Monitoring",
    free: false,
    premium: true,
    enterprise: true,
  },
  {
    name: "Market Signal Alerts",
    free: "3 per day",
    premium: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    name: "AI-Powered Trading",
    free: false,
    premium: true,
    enterprise: true,
  },
  {
    name: "Risk Management Tools",
    free: false,
    premium: "Basic",
    enterprise: "Advanced",
  },
  {
    name: "Flash Trading",
    free: false,
    premium: false,
    enterprise: true,
  },
  {
    name: "Scheduled Trading",
    free: false,
    premium: true,
    enterprise: true,
  },
  {
    name: "Advanced Analytics",
    free: false,
    premium: true,
    enterprise: true,
  },
  {
    name: "Priority Support",
    free: false,
    premium: "Email",
    enterprise: "24/7 Dedicated",
  },
]

export function FeaturesContent() {
  return (
    <div className="mx-auto px-4 py-16 container">
      {/* Hero section */}
      <div className="relative mb-20">
        <div className="absolute inset-0 overflow-hidden">
          <FloatingBees count={3} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="z-10 relative mx-auto max-w-3xl text-center"
        >
          <div className="flex justify-center mb-4">
            <BeeIcon className="w-16 h-16" />
          </div>
          <h1 className="mb-6 font-bold text-white text-4xl md:text-5xl lg:text-6xl">
            Powerful <span className="text-yellow-400">Features</span> to Enhance Your Trading
          </h1>
          <p className="mb-8 text-gray-400 text-xl">
            Discover how EthBee's innovative tools can transform your Solana trading experience with AI-powered insights
            and automation.
          </p>
        </motion.div>
      </div>

      {/* Main features grid */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-16">
        <FeatureCard
          icon={<MessageSquareText className="w-6 h-6 text-yellow-400" />}
          title="AI Trading Assistant"
          description="Our intelligent chatbot helps you buy and sell Solana tokens with natural language prompts. No more complex interfaces or confusing trading terms."
          delay={0.1}
        />

        <FeatureCard
          icon={<LayoutDashboard className="w-6 h-6 text-yellow-400" />}
          title="Portfolio Dashboard"
          description="Manage your Solana assets with our intuitive dashboard. Track performance, visualize growth, and execute trades with a single click."
          delay={0.2}
          gradient="from-blue-400/20 to-cyan-600/20"
        />

        <FeatureCard
          icon={<Sparkles className="w-6 h-6 text-yellow-400" />}
          title="AI Recommendation System"
          description="Receive personalized trading recommendations based on market analysis, token fundamentals, and your trading history."
          delay={0.3}
          gradient="from-purple-400/20 to-pink-600/20"
        />

        <FeatureCard
          icon={<Users className="w-6 h-6 text-yellow-400" />}
          title="Social Engagement Monitoring"
          description="Track social sentiment and community engagement for Solana tokens to identify emerging trends before they impact prices."
          delay={0.4}
          gradient="from-green-400/20 to-emerald-600/20"
        />

        <FeatureCard
          icon={<Bell className="w-6 h-6 text-yellow-400" />}
          title="Market Signal Alerts"
          description="Get timely notifications about important market movements, token developments, and trading opportunities."
          delay={0.5}
          gradient="from-red-400/20 to-orange-600/20"
        />

        <FeatureCard
          icon={<TrendingUp className="w-6 h-6 text-yellow-400" />}
          title="AI-Powered Trading"
          description="Leverage advanced AI algorithms to execute trades at optimal times, maximize profits, and minimize risks in volatile markets."
          delay={0.6}
        />
      </div>

      {/* Additional features section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <h2 className="mb-12 font-bold text-white text-3xl text-center">
          Additional <span className="text-yellow-400">Premium</span> Features
        </h2>

        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
          <div className="flex items-start bg-black/40 backdrop-blur-md p-6 border border-yellow-500/30 rounded-xl">
            <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-br from-yellow-400/20 to-amber-600/20 mr-4 rounded-lg w-10 h-10">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="mb-1 font-bold text-white text-lg">Risk Management Tools</h3>
              <p className="text-gray-400">
                Advanced tools to help you manage risk, set stop-losses, and protect your investments during market
                volatility.
              </p>
            </div>
          </div>

          <div className="flex items-start bg-black/40 backdrop-blur-md p-6 border border-yellow-500/30 rounded-xl">
            <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-br from-yellow-400/20 to-amber-600/20 mr-4 rounded-lg w-10 h-10">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="mb-1 font-bold text-white text-lg">Flash Trading</h3>
              <p className="text-gray-400">
                Execute high-speed trades to capitalize on brief market inefficiencies and price discrepancies across
                exchanges.
              </p>
            </div>
          </div>

          <div className="flex items-start bg-black/40 backdrop-blur-md p-6 border border-yellow-500/30 rounded-xl">
            <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-br from-yellow-400/20 to-amber-600/20 mr-4 rounded-lg w-10 h-10">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="mb-1 font-bold text-white text-lg">Scheduled Trading</h3>
              <p className="text-gray-400">
                Set up automated trading schedules to implement dollar-cost averaging and other time-based investment
                strategies.
              </p>
            </div>
          </div>

          <div className="flex items-start bg-black/40 backdrop-blur-md p-6 border border-yellow-500/30 rounded-xl">
            <div className="flex flex-shrink-0 justify-center items-center bg-gradient-to-br from-yellow-400/20 to-amber-600/20 mr-4 rounded-lg w-10 h-10">
              <LineChart className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="mb-1 font-bold text-white text-lg">Advanced Analytics</h3>
              <p className="text-gray-400">
                Deep dive into token metrics, on-chain activity, and market correlations to inform your trading
                decisions.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <h2 className="mb-12 font-bold text-white text-3xl text-center">
          Choose Your <span className="text-yellow-400">Plan</span>
        </h2>

        <FeatureComparison features={featureComparisonData} />
      </motion.div>

      {/* Feature showcase with image */}
      <FeatureShowcase
        title="AI-Powered Trading"
        highlightedText="Revolution"
        description="EthBee combines cutting-edge artificial intelligence with deep Solana ecosystem knowledge to provide you with the most advanced trading platform available."
        bulletPoints={[
          "Natural language trading commands",
          "Predictive market analysis",
          "Personalized trading strategies",
          "Continuous learning from market data",
        ]}
        buttonText="Try AI Chat Now"
        buttonLink="/ai-chat"
        imageSrc="/ai-trading-assistant.png"
        imageAlt="AI Trading Assistant"
        iconComponent={<Sparkles className="w-4 h-4 text-yellow-400" />}
      />

      {/* CTA section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mx-auto my-16 max-w-3xl text-center"
      >
        <h2 className="mb-6 font-bold text-white text-3xl">
          Ready to <span className="text-yellow-400">Transform</span> Your Trading?
        </h2>
        <p className="mb-8 text-gray-400 text-xl">
          Join thousands of traders who are already using EthBee to enhance their Solana trading experience.
        </p>
        <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
          <CustomButton customVariant="gradient" size="lg">
            Get Started Free
          </CustomButton>
          <Link href="/dashboard" passHref legacyBehavior>
            <CustomButton customVariant="outlineYellow" size="lg">
              View Demo
            </CustomButton>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
