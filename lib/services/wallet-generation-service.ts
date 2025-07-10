import { Keypair } from "@solana/web3.js"
import { createClient } from "@supabase/supabase-js"
import CryptoJS from "crypto-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface WalletGenerationResult {
  success: boolean
  wallet?: {
    id: string
    wallet_address: string
    balance: number
    is_active: boolean
  }
  error?: string
}

// Encryption key - in production, this should be stored securely
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "your-secure-encryption-key-here"

function encryptPrivateKey(privateKey: string): string {
  return CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString()
}

export function decryptPrivateKey(encryptedPrivateKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export async function getUserPrivateKey(userId: string): Promise<Keypair | null> {
  try {
    if (!supabase) {
      console.error("Supabase client is not initialized")
      return null
    }

    const { data, error } = await supabase
      .from("wallets")
      .select("private_key_encrypted")
      .eq("user_id", userId)
      .single()

    if (error || !data?.private_key_encrypted) {
      console.error("Error fetching private key:", error)
      return null
    }

    // Decrypt the private key
    const privateKeyBase64 = decryptPrivateKey(data.private_key_encrypted)

    // Convert private key string to Uint8Array and create Keypair
    const privateKeyBytes = Uint8Array.from(Buffer.from(privateKeyBase64, "base64"))
    return Keypair.fromSecretKey(privateKeyBytes)
  } catch (error) {
    console.error("Error in getUserPrivateKey:", error)
    return null
  }
}

export async function generateWallet(userId: string): Promise<WalletGenerationResult> {
  try {
    // Generate new Solana keypair
    const keypair = Keypair.generate()
    const publicKey = keypair.publicKey.toString()
    const privateKey = Buffer.from(keypair.secretKey).toString("base64")

    // Encrypt private key
    const encryptedPrivateKey = encryptPrivateKey(privateKey)

    // Store wallet in database
    const { data: wallet, error } = await supabase
      .from("wallets")
      .insert({
        user_id: userId,
        wallet_address: publicKey,
        private_key_encrypted: encryptedPrivateKey,
        balance: 0,
        is_active: true,
      })
      .select("id, wallet_address, balance, is_active")
      .single()

    if (error || !wallet) {
      console.error("Error creating wallet:", error)
      return {
        success: false,
        error: "Failed to create wallet in database",
      }
    }

    return {
      success: true,
      wallet: {
        id: wallet.id,
        wallet_address: wallet.wallet_address,
        balance: Number.parseFloat(wallet.balance),
        is_active: wallet.is_active,
      },
    }
  } catch (error) {
    console.error("Wallet generation error:", error)
    return {
      success: false,
      error: "Failed to generate wallet",
    }
  }
}

export async function getWalletByUserId(userId: string): Promise<WalletGenerationResult> {
  try {
    const { data: wallet, error } = await supabase
      .from("wallets")
      .select("id, wallet_address, balance, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (error || !wallet) {
      return {
        success: false,
        error: "Wallet not found",
      }
    }

    return {
      success: true,
      wallet: {
        id: wallet.id,
        wallet_address: wallet.wallet_address,
        balance: Number.parseFloat(wallet.balance),
        is_active: wallet.is_active,
      },
    }
  } catch (error) {
    console.error("Get wallet error:", error)
    return {
      success: false,
      error: "Failed to get wallet",
    }
  }
}
