import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Types
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

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  wallet: UserWallet | null
  isLoading: boolean
  error: string | null
  lastActivity: number | null
  sessionExpiry: number | null
  autoLogoutEnabled: boolean
  logoutTimer: number // in minutes
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  wallet: null,
  isLoading: false,
  error: null,
  lastActivity: null,
  sessionExpiry: null,
  autoLogoutEnabled: true,
  logoutTimer: 30, // 30 minutes default
}

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Authentication actions
    loginSuccess: (state, action: PayloadAction<{ user: User; wallet: UserWallet }>) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.wallet = action.payload.wallet
      state.error = null
      state.lastActivity = Date.now()

      // Set session expiry
      if (state.autoLogoutEnabled) {
        state.sessionExpiry = Date.now() + state.logoutTimer * 60 * 1000
      }

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(action.payload.user))
        localStorage.setItem("auth_wallet", JSON.stringify(action.payload.wallet))
        localStorage.setItem("auth_session_expiry", state.sessionExpiry?.toString() || "")
      }
    },

    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.wallet = null
      state.error = null
      state.lastActivity = null
      state.sessionExpiry = null

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user")
        localStorage.removeItem("auth_wallet")
        localStorage.removeItem("auth_session_expiry")
      }
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },

    // Wallet balance updates
    updateWalletBalance: (state, action: PayloadAction<number>) => {
      if (state.wallet) {
        state.wallet.balance = action.payload
        state.lastActivity = Date.now()

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_wallet", JSON.stringify(state.wallet))
        }
      }
    },

    // Activity tracking
    updateActivity: (state) => {
      state.lastActivity = Date.now()

      // Extend session if auto-logout is enabled
      if (state.autoLogoutEnabled && state.isAuthenticated) {
        state.sessionExpiry = Date.now() + state.logoutTimer * 60 * 1000

        if (typeof window !== "undefined") {
          localStorage.setItem("auth_session_expiry", state.sessionExpiry.toString())
        }
      }
    },

    // Session management
    setAutoLogout: (state, action: PayloadAction<{ enabled: boolean; timer?: number }>) => {
      state.autoLogoutEnabled = action.payload.enabled

      if (action.payload.timer) {
        state.logoutTimer = action.payload.timer
      }

      // Update session expiry if authenticated
      if (state.isAuthenticated && state.autoLogoutEnabled) {
        state.sessionExpiry = Date.now() + state.logoutTimer * 60 * 1000

        if (typeof window !== "undefined") {
          localStorage.setItem("auth_session_expiry", state.sessionExpiry.toString())
        }
      } else {
        state.sessionExpiry = null

        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_session_expiry")
        }
      }
    },

    // Check and handle expiration
    checkExpiration: (state) => {
      if (state.sessionExpiry && Date.now() > state.sessionExpiry) {
        // Session expired, logout
        state.isAuthenticated = false
        state.user = null
        state.wallet = null
        state.error = "Session expired. Please sign in again."
        state.lastActivity = null
        state.sessionExpiry = null

        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_user")
          localStorage.removeItem("auth_wallet")
          localStorage.removeItem("auth_session_expiry")
        }
      }
    },

    // Restore session from localStorage
    restoreSession: (state) => {
      if (typeof window !== "undefined") {
        try {
          const savedUser = localStorage.getItem("auth_user")
          const savedWallet = localStorage.getItem("auth_wallet")
          const savedExpiry = localStorage.getItem("auth_session_expiry")

          if (savedUser && savedWallet) {
            const user = JSON.parse(savedUser)
            const wallet = JSON.parse(savedWallet)
            const expiry = savedExpiry ? Number.parseInt(savedExpiry) : null

            // Check if session is still valid
            if (!expiry || Date.now() < expiry) {
              state.isAuthenticated = true
              state.user = user
              state.wallet = wallet
              state.sessionExpiry = expiry
              state.lastActivity = Date.now()
            } else {
              // Session expired, clear data
              localStorage.removeItem("auth_user")
              localStorage.removeItem("auth_wallet")
              localStorage.removeItem("auth_session_expiry")
            }
          }
        } catch (error) {
          console.error("Error restoring session:", error)
          // Clear corrupted data
          localStorage.removeItem("auth_user")
          localStorage.removeItem("auth_wallet")
          localStorage.removeItem("auth_session_expiry")
        }
      }
    },

    // Clear all data
    clearAuthData: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user")
        localStorage.removeItem("auth_wallet")
        localStorage.removeItem("auth_session_expiry")
      }
      return initialState
    },

    // Add this reducer to update the user's timezone
    updateUserTimezone: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.timezone = action.payload
        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(state.user))
        }
      }
    },
  },
})

// Export actions
export const {
  loginSuccess,
  logout,
  setLoading,
  setError,
  updateWalletBalance,
  updateActivity,
  setAutoLogout,
  checkExpiration,
  restoreSession,
  clearAuthData,
  updateUserTimezone,
} = authSlice.actions

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectWallet = (state: { auth: AuthState }) => state.auth.wallet
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading

// Export reducer
export default authSlice.reducer
