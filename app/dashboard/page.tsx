import { SparklesCore } from "@/components/shared/sparkles"
import Navbar from "@/components/layout/navbar"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function DashboardPage() {
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

      <div className="z-10 relative flex flex-col pt-16 h-screen">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          <DashboardContent />
        </div>
      </div>
    </main>
  )
}
