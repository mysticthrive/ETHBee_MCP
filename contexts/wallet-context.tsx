"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { PublicKey } from "@solana/web3.js"

// Add type definitions for the Solana wallet
declare global {
    interface Window {
        solana?: {
            connect: () => Promise<{ publicKey: PublicKey }>
            disconnect: () => Promise<void>
            isConnected: boolean
        }
    }
}

interface WalletContextType {
    publicKey: PublicKey | null
    connected: boolean
    connecting: boolean
    connect: () => Promise<void>
    disconnect: () => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
    publicKey: null,
    connected: false,
    connecting: false,
    connect: async () => { },
    disconnect: async () => { },
})

export function WalletProvider({ children }: { children: ReactNode }) {
    const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
    const [connected, setConnected] = useState(false)
    const [connecting, setConnecting] = useState(false)

    useEffect(() => {
        // Check if wallet is already connected
        const checkWallet = async () => {
            if (typeof window !== "undefined" && window.solana) {
                try {
                    const resp = await window.solana.connect()
                    setPublicKey(resp.publicKey)
                    setConnected(true)
                } catch (err) {
                    console.log("Wallet not connected")
                }
            }
        }

        checkWallet()
    }, [])

    const connect = async () => {
        if (typeof window === "undefined" || !window.solana) {
            console.error("Solana wallet not found!")
            return
        }

        setConnecting(true)
        try {
            const resp = await window.solana.connect()
            setPublicKey(resp.publicKey)
            setConnected(true)
        } catch (err) {
            console.error("Failed to connect wallet:", err)
        } finally {
            setConnecting(false)
        }
    }

    const disconnect = async () => {
        if (typeof window === "undefined" || !window.solana) {
            return
        }

        try {
            await window.solana.disconnect()
            setPublicKey(null)
            setConnected(false)
        } catch (err) {
            console.error("Failed to disconnect wallet:", err)
        }
    }

    return (
        <WalletContext.Provider
            value={{
                publicKey,
                connected,
                connecting,
                connect,
                disconnect,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export const useWallet = () => useContext(WalletContext)
