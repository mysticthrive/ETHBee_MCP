"use client"

import { useEffect, useRef, useState } from "react"
import { useMousePosition } from "@/lib/hooks/use-mouse-position"

interface SparklesProps {
  id?: string
  background?: string
  minSize?: number
  maxSize?: number
  particleDensity?: number
  className?: string
  particleColor?: string
}

// Move Particle class outside useEffect for better performance
class Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  width: number
  height: number

  constructor(width: number, height: number, minSize: number, maxSize: number) {
    this.width = width
    this.height = height
    this.x = Math.random() * width
    this.y = Math.random() * height
    this.size = Math.random() * (maxSize - minSize) + minSize
    this.speedX = Math.random() * 0.5 - 0.25
    this.speedY = Math.random() * 0.5 - 0.25
    // Randomly choose between yellow and black for bee-like particles
    this.color = Math.random() > 0.7 ? "#000000" : "#F59E0B"
  }

  update(mouseX: number, mouseY: number) {
    this.x += this.speedX
    this.y += this.speedY

    if (this.x > this.width) this.x = 0
    if (this.x < 0) this.x = this.width
    if (this.y > this.height) this.y = 0
    if (this.y < 0) this.y = this.height

    // Mouse interaction - particles move away from mouse
    const dx = mouseX - this.x
    const dy = mouseY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < 100) {
      const angle = Math.atan2(dy, dx)
      this.x -= Math.cos(angle) * 2
      this.y -= Math.sin(angle) * 2
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Add glow effect for better visibility
    ctx.shadowColor = this.color
    ctx.shadowBlur = 4
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    // Reset shadow
    ctx.shadowBlur = 0
  }
}

export const SparklesCore = ({
  id = "tsparticles",
  background = "transparent",
  minSize = 1.2,
  maxSize = 2.8,
  particleDensity = 100,
  className = "h-full w-full",
  particleColor = "#F59E0B",
}: SparklesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePosition = useMousePosition()
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 })
  const [isMounted, setIsMounted] = useState(false)

  // Use refs to store particles and animation state
  const particlesRef = useRef<Particle[]>([])
  const animationFrameIdRef = useRef<number | null>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })

  // Update mouse position ref whenever it changes
  useEffect(() => {
    mousePositionRef.current = mousePosition
  }, [mousePosition])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    if (typeof window === "undefined") return

    let isInitialized = false
    let isUnmounted = false

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      updateDimensions()
    }

    const safeInitAndAnimate = () => {
      // Cancel any previous animation frame
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
      // Only initialize once per effect run
      if (!isInitialized) {
        resizeCanvas()
        particlesRef.current = []
        for (let i = 0; i < particleDensity; i++) {
          particlesRef.current.push(new Particle(canvas.width, canvas.height, minSize, maxSize))
        }
        isInitialized = true
      }
      // Start animation
      const animate = () => {
        if (!ctx || !canvas || isUnmounted) {
          return
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        particlesRef.current.forEach((particle) => {
          particle.update(mousePositionRef.current.x, mousePositionRef.current.y)
          particle.draw(ctx)
        })
        animationFrameIdRef.current = requestAnimationFrame(animate)
      }
      animate()
    }

    safeInitAndAnimate()

    const handleResize = () => {
      if (typeof window === "undefined") return
      isInitialized = false // allow re-initialization
      resizeCanvas()
      particlesRef.current = []
      for (let i = 0; i < particleDensity; i++) {
        particlesRef.current.push(new Particle(canvas.width, canvas.height, minSize, maxSize))
      }
      safeInitAndAnimate()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      isUnmounted = true
      window.removeEventListener("resize", handleResize)
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [isMounted, particleDensity, minSize, maxSize])

  // Don't render during SSR
  if (!isMounted) return null

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={className}
      style={{
        background,
        width: dimensions.width,
        height: dimensions.height,
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
