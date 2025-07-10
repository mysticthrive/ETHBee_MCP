"use client"

import { BeeIcon } from "@/components/shared/bee-icon"
import Link from "next/link"
import { Twitter, Github, DiscIcon as Discord, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-black/[0.96] backdrop-blur-sm border-white/10 border-t">
      <div className="mx-auto px-6 py-12 container">
        <div className="gap-8 grid grid-cols-1 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <BeeIcon className="w-8 h-8" />
              <span className="font-medium text-white text-xl">EthBee</span>
            </Link>
            <p className="mb-4 text-gray-400">
              AI-powered Solana trading assistant that simplifies your crypto journey.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-yellow-400">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400">
                <Discord className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-gray-400 hover:text-yellow-400">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-yellow-400">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/ai-chat" className="text-gray-400 hover:text-yellow-400">
                  AI Chat
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-yellow-400">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-yellow-400">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-yellow-400">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-yellow-400">
                  Community
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-yellow-400">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-400 hover:text-yellow-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-yellow-400">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-yellow-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="text-gray-400 hover:text-yellow-400">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex md:flex-row flex-col justify-between items-center mt-12 pt-8 border-white/10 border-t">
          <p className="mb-4 md:mb-0 text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} EthBee. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="text-gray-400 hover:text-yellow-400 text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="text-gray-400 hover:text-yellow-400 text-sm">
              Terms & Conditions
            </Link>
            <Link href="#" className="text-gray-400 hover:text-yellow-400 text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
