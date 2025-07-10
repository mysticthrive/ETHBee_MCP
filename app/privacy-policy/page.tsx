import Navbar from "@/components/layout/navbar"
import { SparklesCore } from "@/components/shared/sparkles"
import { PrivacyPolicyContent } from "@/components/shared/privacy-policy-content"

export default function PrivacyPolicyPage() {
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
        <div className="flex-1 overflow-hidden">
          <PrivacyPolicyContent />
        </div>
      </div>
    </main>
  )
}
