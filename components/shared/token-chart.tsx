"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface TokenChartProps {
  tokenId: string
  color: string
}

export function TokenChart({ tokenId, color }: TokenChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Generate random data based on tokenId
    // In a real app, this would fetch actual price data
    const seed = tokenId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const dataPoints = 50
    const data = Array.from({ length: dataPoints }, (_, i) => {
      const randomFactor = Math.sin(seed + i) * 0.5 + 0.5
      return 100 + randomFactor * 50 + Math.sin(i / 5) * 20
    })

    // Draw chart
    const padding = 20
    const chartWidth = rect.width - padding * 2
    const chartHeight = rect.height - padding * 2

    const minValue = Math.min(...data) * 0.9
    const maxValue = Math.max(...data) * 1.1
    const valueRange = maxValue - minValue

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()

      // Price labels
      const price = maxValue - (valueRange / 4) * i
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "left"
      ctx.fillText(`$${price.toFixed(2)}`, padding, y - 5)
    }

    // Draw line chart
    ctx.strokeStyle = color || "#14F195"
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((value, index) => {
      const x = padding + (chartWidth / (dataPoints - 1)) * index
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw area under the line
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight)
    gradient.addColorStop(0, `${color}40` || "rgba(20, 241, 149, 0.3)")
    gradient.addColorStop(1, `${color}00` || "rgba(20, 241, 149, 0)")

    ctx.fillStyle = gradient
    ctx.beginPath()

    // Start from bottom left
    ctx.moveTo(padding, padding + chartHeight)

    // Draw the same line as before
    data.forEach((value, index) => {
      const x = padding + (chartWidth / (dataPoints - 1)) * index
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    // Complete the path to bottom right
    ctx.lineTo(padding + chartWidth, padding + chartHeight)
    ctx.closePath()
    ctx.fill()

    // Draw current price indicator
    const lastValue = data[data.length - 1]
    const lastX = padding + chartWidth
    const lastY = padding + chartHeight - ((lastValue - minValue) / valueRange) * chartHeight

    ctx.fillStyle = color || "#14F195"
    ctx.beginPath()
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "white"
    ctx.font = "bold 12px sans-serif"
    ctx.textAlign = "right"
    ctx.fillText(`$${lastValue.toFixed(2)}`, lastX - 10, lastY - 10)
  }, [tokenId, color])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
    </motion.div>
  )
}
