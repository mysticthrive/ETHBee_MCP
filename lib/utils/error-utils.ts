/**
 * Logs an error with context information
 */
export function logError(error: unknown, context: string, additionalData?: Record<string, any>): void {
  console.error(`Error in ${context}:`, error)

  if (additionalData) {
    console.error("Additional context:", additionalData)
  }

  // In a production environment, you might want to send this to a logging service
  // like Sentry, LogRocket, etc.
}

/**
 * Converts technical errors to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes("Invalid public key")) {
      return "The provided token address is not a valid Solana address."
    }

    if (error.message.includes("not found") || error.message.includes("404")) {
      return "The token could not be found on the Solana blockchain."
    }

    if (error.message.includes("timeout") || error.message.includes("timed out")) {
      return "The request timed out. The Solana network might be congested."
    }

    if (error.message.includes("rate limit") || error.message.includes("429")) {
      return "Rate limit exceeded. Please try again in a moment."
    }

    // Return the actual error message if it's not too technical
    if (error.message.length < 100 && !error.message.includes("Error:")) {
      return error.message
    }
  }

  // Default generic message
  return "An error occurred while processing your request. Please try again later."
}
