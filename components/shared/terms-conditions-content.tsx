"use client"

import { motion } from "framer-motion"
import { BeeIcon } from "@/components/shared/bee-icon"

export function TermsConditionsContent() {
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
          <h1 className="font-bold text-white text-3xl">Terms and Conditions</h1>
        </div>

        <div className="prose-invert max-w-none prose prose-yellow">
          <p className="text-gray-300">Last Updated: May 8, 2024</p>

          <h2>Introduction</h2>
          <p>
            Welcome to EthBee. These Terms and Conditions govern your use of our website and services. By accessing or
            using EthBee, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not
            access our services.
          </p>

          <h2>Definitions</h2>
          <ul>
            <li>"EthBee," "we," "us," and "our" refer to the EthBee platform and its operators.</li>
            <li>"User," "you," and "your" refer to the individual or entity using our services.</li>
            <li>"Services" refers to all features, applications, and services offered by EthBee.</li>
            <li>"Solana" refers to the Solana blockchain network and its native cryptocurrency.</li>
          </ul>

          <h2>Account Registration</h2>
          <p>
            To use certain features of our services, you may need to create an account. You are responsible for
            maintaining the confidentiality of your account information and for all activities that occur under your
            account. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information when creating your account</li>
            <li>Update your information to keep it accurate and current</li>
            <li>Safeguard your account credentials</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>

          <h2>Wallet Connection</h2>
          <p>Our services require connection to a Solana wallet. By connecting your wallet, you:</p>
          <ul>
            <li>Confirm that you are the legitimate owner or authorized user of the wallet</li>
            <li>Understand that EthBee does not store your private keys</li>
            <li>Accept responsibility for all transactions initiated through our platform</li>
            <li>Acknowledge the risks associated with cryptocurrency transactions</li>
          </ul>

          <h2>AI Trading Features</h2>
          <p>EthBee provides AI-powered trading features. By using these features, you acknowledge that:</p>
          <ul>
            <li>Trading cryptocurrencies involves significant risk</li>
            <li>AI recommendations are not financial advice</li>
            <li>Past performance is not indicative of future results</li>
            <li>You are solely responsible for your trading decisions</li>
            <li>Market conditions can change rapidly and unpredictably</li>
          </ul>

          <h2>Prohibited Activities</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use our services for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to any part of our services</li>
            <li>Interfere with or disrupt the operation of our services</li>
            <li>Circumvent any security measures we implement</li>
            <li>Use automated methods to access or use our services without our permission</li>
            <li>Impersonate another person or entity</li>
            <li>Engage in market manipulation or fraudulent activities</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            All content, features, and functionality of our services, including but not limited to text, graphics,
            logos, icons, images, audio clips, and software, are the exclusive property of EthBee or its licensors and
            are protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h2>Disclaimer of Warranties</h2>
          <p>
            Our services are provided "as is" and "as available" without warranties of any kind, either express or
            implied. We do not guarantee that our services will be uninterrupted, secure, or error-free.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, EthBee shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out
            of or in connection with your use of our services.
          </p>

          <h2>Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless EthBee and its officers, directors, employees, and agents from any
            claims, liabilities, damages, losses, and expenses arising from your use of our services or violation of
            these Terms.
          </p>

          <h2>Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the
            updated Terms on this page and updating the "Last Updated" date. Your continued use of our services after
            such modifications constitutes your acceptance of the revised Terms.
          </p>

          <h2>Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard
            to its conflict of law provisions.
          </p>

          <h2>Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <p>
            Email: legal@ethbee.io
            <br />
            Address: 123 Blockchain Street, Crypto City, CC 12345
          </p>
        </div>
      </motion.div>
    </div>
  )
}
