import { SparklesCore } from "@/components/shared/sparkles"
import Navbar from "@/components/layout/navbar"
// import { LimitOrdersTable } from "@/components/trading/limit-orders-table"

export default function OrdersPage() {
  return (
    <main className="relative bg-grid-white/[0.02] bg-black/[0.96] min-h-screen overflow-hidden antialiased">
      {/* Ambient background with moving particles */}
      <div className="z-0 absolute inset-0 w-full h-full">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#F59E0B"
        />
      </div>

      <div className="z-10 relative flex flex-col pt-16 min-h-screen">
        <Navbar />
        <div className="flex-1 mx-auto px-4 py-8 container">
          <h1 className="mb-8 font-bold text-white text-3xl">
            Your <span className="text-yellow-400">Limit Orders</span>
          </h1>

          <div className="mb-8">
            <p className="mb-4 text-gray-400">
              Limit orders allow you to automatically buy or sell tokens when they reach your target price.
              Your orders will be executed automatically when the market price meets your conditions.
            </p>
          </div>

          {/* <LimitOrdersTable /> */}
        </div>
      </div>
    </main>
  )
}
