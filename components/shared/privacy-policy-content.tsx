"use client"

import { motion } from "framer-motion"
import { BeeIcon } from "@/components/shared/bee-icon"

export function PrivacyPolicyContent() {
  return (
    <div className="mx-auto px-4 py-16 container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black/40 backdrop-blur-md mx-auto p-8 border border-yellow-500/30 rounded-xl max-w-4xl"
      >
        <div className="flex items-center mb-6">
          <BeeIcon className="mr-3 w-10 h-10" />
          <h1 className="font-bold text-white text-3xl">Privacy Policy</h1>
        </div>

        <div className="prose-invert max-w-none prose prose-yellow">
          <p className="text-gray-300">Last Updated: May 8, 2024</p>

          <h2>Introduction</h2>
          <p>
            EthBee ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our website and services.
          </p>

          <h2>Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, information we collect automatically when you use
            our services, and information from third parties.
          </p>

          <h3>Information You Provide</h3>
          <ul>
            <li>Account information: When you create an account, we collect your name, email address, and password.</li>
            <li>
              Wallet information: When you connect your Solana wallet, we collect your wallet address and transaction
              history.
            </li>
            <li>
              Profile information: Any additional information you provide in your profile, such as profile picture or
              bio.
            </li>
            <li>Communications: Information you provide when you contact us for support or communicate with us.</li>
          </ul>

          <h3>Information We Collect Automatically</h3>
          <ul>
            <li>
              Usage data: Information about how you use our services, including your interactions with features and
              content.
            </li>
            <li>
              Device information: Information about the device you use to access our services, including device type,
              operating system, and browser type.
            </li>
            <li>Log data: Server logs, IP address, access times, and pages viewed.</li>
            <li>
              Cookies and similar technologies: We use cookies and similar technologies to collect information about
              your browsing activities.
            </li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and execute trades</li>
            <li>Provide personalized AI recommendations and insights</li>
            <li>Communicate with you about our services, updates, and promotions</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues, fraud, or illegal activities</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>Sharing of Information</h2>
          <p>We may share your information with:</p>
          <ul>
            <li>Service providers who perform services on our behalf</li>
            <li>Business partners with whom we jointly offer products or services</li>
            <li>Third parties in connection with a business transaction such as a merger or acquisition</li>
            <li>Law enforcement or other third parties when required by law or to protect our rights</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your information from unauthorized
            access, loss, or alteration. However, no method of transmission over the Internet or electronic storage is
            100% secure, and we cannot guarantee absolute security.
          </p>

          <h2>Your Rights and Choices</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul>
            <li>Access to your personal information</li>
            <li>Correction of inaccurate or incomplete information</li>
            <li>Deletion of your personal information</li>
            <li>Restriction or objection to processing</li>
            <li>Data portability</li>
            <li>Withdrawal of consent</li>
          </ul>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "Last Updated" date.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p>
            Email: privacy@ethbee.io
            <br />
            Address: 123 Blockchain Street, Crypto City, CC 12345
          </p>
        </div>
      </motion.div>
    </div>
  )
}
