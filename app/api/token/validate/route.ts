import { NextResponse } from "next/server"
import { validateToken } from "@/lib/services/token-service"
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils"

// Simple in-memory cache for token validation results
const validationCache: Record<
  string,
  {
    timestamp: number
    result: any
  }
> = {}

// Cache expiration time (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000

// Toggle for enabling/disabling cache
const cacheEnabled = true

export async function POST(req: Request) {
  try {
    const { tokenAddress, bypassCache = false } = await req.json()

    // Log the original token address to verify case preservation
    console.log("Token validation request for address:", tokenAddress)

    // Check if we have a cached result and cache is enabled
    const cacheKey = tokenAddress
    if (cacheEnabled && !bypassCache && validationCache[cacheKey]) {
      const cachedData = validationCache[cacheKey]

      // Check if cache is still valid
      if (Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
        console.log("Using cached validation result for:", tokenAddress)
        return NextResponse.json(cachedData.result)
      } else {
        // Remove expired cache entry
        delete validationCache[cacheKey]
      }
    }

    // Validate the token
    const result = await validateToken(tokenAddress)

    // Cache the result if validation was successful
    if (cacheEnabled && result.valid) {
      validationCache[cacheKey] = {
        timestamp: Date.now(),
        result,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    logError(error, "Token validation API", { endpoint: "/api/token/validate" })

    const errorMessage = getUserFriendlyErrorMessage(error)
    const detailedError = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        valid: false,
        error: errorMessage,
        details: `Technical details: ${detailedError}`,
      },
      { status: 500 },
    )
  }
}

// API route to clear the validation cache
export async function DELETE() {
  try {
    // Clear all cache entries
    Object.keys(validationCache).forEach((key) => {
      delete validationCache[key]
    })

    return NextResponse.json({ success: true, message: "Validation cache cleared" })
  } catch (error) {
    logError(error, "Clear validation cache API", { endpoint: "/api/token/validate (DELETE)" })
    return NextResponse.json({ success: false, error: "Failed to clear validation cache" }, { status: 500 })
  }
}
