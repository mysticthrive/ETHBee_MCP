"use client"

import { motion } from "framer-motion"
import { Search, Calendar, User, Tag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BeeIcon } from "@/components/shared/bee-icon"

// Mock blog post data
const featuredPost = {
  id: "solana-defi-trends-2024",
  title: "Top Solana DeFi Trends to Watch in 2024",
  excerpt:
    "Explore the most promising decentralized finance trends on Solana that are set to reshape the ecosystem in 2024.",
  coverImage: "/blog-featured.png",
  date: "May 5, 2024",
  author: "Alex Johnson",
  authorAvatar: "/diverse-group.png",
  category: "DeFi",
  readTime: "8 min read",
}

const recentPosts = [
  {
    id: "ai-trading-strategies",
    title: "5 AI-Powered Trading Strategies for Solana Tokens",
    excerpt:
      "Learn how to leverage artificial intelligence to enhance your Solana trading strategies and maximize returns.",
    coverImage: "/blog-post-1.png",
    date: "May 2, 2024",
    author: "Sarah Williams",
    category: "Trading",
    readTime: "6 min read",
  },
  {
    id: "solana-nft-marketplace",
    title: "The Evolution of Solana NFT Marketplaces",
    excerpt:
      "A deep dive into how Solana NFT marketplaces have evolved and what the future holds for digital collectibles.",
    coverImage: "/blog-post-2.png",
    date: "April 28, 2024",
    author: "Michael Chen",
    category: "NFTs",
    readTime: "5 min read",
  },
  {
    id: "solana-vs-ethereum",
    title: "Solana vs. Ethereum: Performance Analysis for Traders",
    excerpt:
      "A comprehensive comparison of Solana and Ethereum from a trader's perspective, focusing on speed, fees, and ecosystem.",
    coverImage: "/blog-post-3.png",
    date: "April 22, 2024",
    author: "David Rodriguez",
    category: "Analysis",
    readTime: "10 min read",
  },
  {
    id: "social-sentiment-trading",
    title: "How Social Sentiment Affects Solana Token Prices",
    excerpt: "Exploring the correlation between social media sentiment and price movements of popular Solana tokens.",
    coverImage: "/blog-post-4.png",
    date: "April 15, 2024",
    author: "Emma Thompson",
    category: "Social Analysis",
    readTime: "7 min read",
  },
]

const categories = [
  { name: "Trading", count: 12 },
  { name: "DeFi", count: 8 },
  { name: "NFTs", count: 5 },
  { name: "Analysis", count: 7 },
  { name: "Tutorials", count: 9 },
  { name: "News", count: 14 },
]

export function BlogContent() {
  return (
    <div className="mx-auto px-4 py-16 container">
      {/* Blog header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16 text-center"
      >
        <h1 className="mb-6 font-bold text-white text-4xl md:text-5xl lg:text-6xl">
          EthBee <span className="text-yellow-400">Blog</span>
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-gray-400 text-xl">
          Insights, tutorials, and updates from the world of Solana trading and AI-powered investments.
        </p>

        <div className="relative mx-auto max-w-xl">
          <input
            type="text"
            placeholder="Search articles..."
            className="bg-black/40 backdrop-blur-md px-4 py-3 pl-12 border border-yellow-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50 w-full text-white placeholder-gray-400"
          />
          <Search className="top-1/2 left-4 absolute w-5 h-5 text-gray-400 -translate-y-1/2 transform" />
        </div>
      </motion.div>

      {/* Featured post */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-16"
      >
        <h2 className="flex items-center mb-6 font-bold text-white text-2xl">
          <BeeIcon className="mr-2 w-6 h-6" />
          Featured Article
        </h2>

        <div className="bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="h-64 md:h-auto">
              <img
                src={featuredPost.coverImage || "/placeholder.svg?height=400&width=600&query=crypto blog"}
                alt={featuredPost.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-between p-8">
              <div>
                <div className="flex items-center mb-4">
                  <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-400 text-xs">
                    {featuredPost.category}
                  </span>
                  <span className="ml-4 text-gray-400 text-sm">{featuredPost.readTime}</span>
                </div>
                <h3 className="mb-4 font-bold text-white text-2xl">{featuredPost.title}</h3>
                <p className="mb-6 text-gray-400">{featuredPost.excerpt}</p>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <img
                    src={featuredPost.authorAvatar || "/placeholder.svg"}
                    alt={featuredPost.author}
                    className="mr-3 rounded-full w-10 h-10"
                  />
                  <div>
                    <p className="text-white text-sm">{featuredPost.author}</p>
                    <p className="flex items-center text-gray-400 text-xs">
                      <Calendar className="mr-1 w-3 h-3" />
                      {featuredPost.date}
                    </p>
                  </div>
                </div>
                <Link href={`/blog/${featuredPost.id}`}>
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">Read More</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent posts and sidebar */}
      <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
        {/* Recent posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <h2 className="flex items-center mb-6 font-bold text-white text-2xl">
            <BeeIcon className="mr-2 w-6 h-6" />
            Recent Articles
          </h2>

          <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
            {recentPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex flex-col bg-black/40 backdrop-blur-md border border-yellow-500/30 rounded-xl overflow-hidden"
              >
                <div className="h-48">
                  <img
                    src={post.coverImage || `/placeholder.svg?height=300&width=500&query=crypto blog ${index}`}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1 p-6">
                  <div className="flex items-center mb-3">
                    <span className="bg-yellow-500/20 px-2 py-1 rounded-full text-yellow-400 text-xs">
                      {post.category}
                    </span>
                    <span className="ml-3 text-gray-400 text-xs">{post.readTime}</span>
                  </div>
                  <h3 className="mb-3 font-bold text-white text-xl">{post.title}</h3>
                  <p className="flex-1 mb-4 text-gray-400 text-sm">{post.excerpt}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center">
                      <p className="flex items-center text-gray-400 text-xs">
                        <User className="mr-1 w-3 h-3" />
                        {post.author}
                      </p>
                      <p className="flex items-center ml-4 text-gray-400 text-xs">
                        <Calendar className="mr-1 w-3 h-3" />
                        {post.date}
                      </p>
                    </div>
                    <Link
                      href={`/blog/${post.id}`}
                      className="flex items-center text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      Read <ArrowRight className="ml-1 w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" className="hover:bg-yellow-500/20 border-yellow-500 text-white">
              Load More Articles
            </Button>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-8"
        >
          {/* Categories */}
          <div className="bg-black/40 backdrop-blur-md p-6 border border-yellow-500/30 rounded-xl">
            <h3 className="flex items-center mb-4 font-bold text-white text-xl">
              <Tag className="mr-2 w-5 h-5 text-yellow-400" />
              Categories
            </h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.name} className="flex justify-between items-center">
                  <Link
                    href={`/blog/category/${category.name.toLowerCase()}`}
                    className="text-gray-400 hover:text-yellow-400"
                  >
                    {category.name}
                  </Link>
                  <span className="bg-yellow-500/20 px-2 py-1 rounded-full text-yellow-400 text-xs">
                    {category.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="bg-black/40 backdrop-blur-md p-6 border border-yellow-500/30 rounded-xl">
            <h3 className="mb-4 font-bold text-white text-xl">Subscribe to Our Newsletter</h3>
            <p className="mb-4 text-gray-400 text-sm">
              Get the latest Solana trading insights and EthBee updates delivered to your inbox.
            </p>
            <input
              type="email"
              placeholder="Your email address"
              className="bg-black/60 mb-3 px-4 py-2 border border-yellow-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50 w-full text-white placeholder-gray-400"
            />
            <Button className="bg-yellow-600 hover:bg-yellow-700 w-full text-white">Subscribe</Button>
          </div>

          {/* Popular tags */}
          <div className="bg-black/40 backdrop-blur-md p-6 border border-yellow-500/30 rounded-xl">
            <h3 className="mb-4 font-bold text-white text-xl">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Solana",
                "DeFi",
                "Trading",
                "NFT",
                "Crypto",
                "Blockchain",
                "AI",
                "Investment",
                "Staking",
                "Analysis",
              ].map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${tag.toLowerCase()}`}
                  className="bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-400 text-xs"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
