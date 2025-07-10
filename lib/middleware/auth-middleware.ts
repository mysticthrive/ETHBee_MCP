import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface AuthenticatedUser {
  id: string
  email: string
  wallet_address: string
  wallet_id: string
}

export async function getUserFromRequest(
  req: NextRequest,
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "No authorization token provided" }
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // For now, we'll extract userId from the token (you can implement JWT verification here)
    // This is a simplified approach - in production, you'd want proper JWT verification
    let userId: string
    try {
      const decoded = JSON.parse(atob(token)) // Simple base64 decode for demo
      userId = decoded.userId
    } catch {
      return { user: null, error: "Invalid token format" }
    }

    // Get user and wallet info from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        wallets!inner(
          id,
          wallet_address,
          is_active
        )
      `)
      .eq("id", userId)
      .eq("wallets.is_active", true)
      .single()

    if (userError || !user) {
      return { user: null, error: "User not found or no active wallet" }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallets[0].wallet_address,
        wallet_id: user.wallets[0].id,
      },
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    return { user: null, error: "Authentication failed" }
  }
}

// Alternative method for APIs that receive userId in the request body
export async function getUserFromBody(userId: string): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        wallets!inner(
          id,
          wallet_address,
          is_active
        )
      `)
      .eq("id", userId)
      .eq("wallets.is_active", true)
      .single()

    if (userError || !user) {
      return { user: null, error: "User not found or no active wallet" }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        wallet_address: user.wallets[0].wallet_address,
        wallet_id: user.wallets[0].id,
      },
    }
  } catch (error) {
    console.error("Get user from body error:", error)
    return { user: null, error: "Failed to get user information" }
  }
}
