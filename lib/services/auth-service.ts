import { getSupabaseAdmin } from "@/lib/supabase/utils"
import bcrypt from "bcryptjs"
import { generateWallet } from "./wallet-generation-service"

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  is_verified: boolean
  created_at: string
  timezone?: string
}

export interface UserWallet {
  id: string
  wallet_address: string
  balance: number
  is_active: boolean
}

export interface SignUpData {
  email: string
  password: string
  first_name?: string
  last_name?: string
  timezone?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface UpdateProfileData {
  email?: string
  password?: string
  first_name?: string
  last_name?: string
  timezone?: string
  profile_image?: string
  notification_preferences?: {
    email_notifications?: boolean
    price_alerts?: boolean
    trading_signals?: boolean
  }
}

export interface AuthResponse {
  success: boolean
  user?: User
  wallet?: UserWallet
  error?: string
  token?: string
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", data.email).single()

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      }
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        email: data.email,
        password_hash: passwordHash,
        first_name: data.first_name,
        last_name: data.last_name,
        timezone: data.timezone || "UTC",
      })
      .select()
      .single()

    if (userError || !newUser) {
      return {
        success: false,
        error: "Failed to create user account",
      }
    }

    // Generate wallet for the user
    const walletResult = await generateWallet(newUser.id)

    if (!walletResult.success) {
      // Rollback user creation if wallet generation fails
      await supabase.from("users").delete().eq("id", newUser.id)
      return {
        success: false,
        error: "Failed to create wallet for user",
      }
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        is_verified: newUser.is_verified,
        created_at: newUser.created_at,
        timezone: newUser.timezone,
      },
      wallet: walletResult.wallet,
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during sign up",
    }
  }
}

export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get user by email
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", data.email).single()

    if (userError || !user) {
      return {
        success: false,
        error: "Invalid email or password",
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password_hash)

    if (!isValidPassword) {
      return {
        success: false,
        error: "Invalid email or password",
      }
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, wallet_address, balance, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (walletError || !wallet) {
      return {
        success: false,
        error: "User wallet not found",
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: user.is_verified,
        created_at: user.created_at,
        timezone: user.timezone,
      },
      wallet: {
        id: wallet.id,
        wallet_address: wallet.wallet_address,
        balance: Number.parseFloat(wallet.balance),
        is_active: wallet.is_active,
      },
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred during sign in",
    }
  }
}

export async function getUserProfile(userId: string): Promise<AuthResponse> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, wallet_address, balance, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (walletError || !wallet) {
      return {
        success: false,
        error: "User wallet not found",
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: user.is_verified,
        created_at: user.created_at,
        timezone: user.timezone,
      },
      wallet: {
        id: wallet.id,
        wallet_address: wallet.wallet_address,
        balance: Number.parseFloat(wallet.balance),
        is_active: wallet.is_active,
      },
    }
  } catch (error) {
    console.error("Get user profile error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get user profile",
    }
  }
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileData,
  currentPassword?: string,
): Promise<AuthResponse> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get current user data
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    // If updating password, verify current password
    if (updates.password) {
      if (!currentPassword) {
        return {
          success: false,
          error: "Current password is required to update password",
        }
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValidPassword) {
        return {
          success: false,
          error: "Current password is incorrect",
        }
      }

      // Hash new password
      const saltRounds = 12
      updates.password = await bcrypt.hash(updates.password, saltRounds)
    }

    // If updating email, check if it's already in use
    if (updates.email && updates.email !== user.email) {
      const { data: existingUser } = await supabase.from("users").select("id").eq("email", updates.email).single()

      if (existingUser) {
        return {
          success: false,
          error: "Email is already in use",
        }
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {}

    if (updates.email) updateData.email = updates.email
    if (updates.password) updateData.password_hash = updates.password
    if (updates.first_name !== undefined) updateData.first_name = updates.first_name
    if (updates.last_name !== undefined) updateData.last_name = updates.last_name
    if (updates.timezone) updateData.timezone = updates.timezone
    if (updates.profile_image) updateData.profile_image = updates.profile_image

    // Handle notification preferences in a separate table or as JSON in the users table
    if (updates.notification_preferences) {
      updateData.notification_preferences = updates.notification_preferences
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single()

    if (updateError || !updatedUser) {
      return {
        success: false,
        error: "Failed to update user profile",
      }
    }

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        is_verified: updatedUser.is_verified,
        created_at: updatedUser.created_at,
        timezone: updatedUser.timezone,
      },
    }
  } catch (error) {
    console.error("Update user profile error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user profile",
    }
  }
}
