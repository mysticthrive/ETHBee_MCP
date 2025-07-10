"use client"

/**
 * Typed Redux hooks for authentication state management
 * Provides type-safe access to Redux store
 */

import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import { useCallback, useEffect } from "react"
import type { RootState, AppDispatch } from "./index"
import {
  selectIsAuthenticated,
  selectUser,
  selectWallet,
  selectAuthLoading,
  selectAuthError,
  selectAuth,
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
  type User,
  type UserWallet,
} from "./auth-slice"

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Auth state selectors
export const useIsAuthenticated = () => useAppSelector(selectIsAuthenticated)
export const useUser = () => useAppSelector(selectUser)
export const useUserWallet = () => useAppSelector(selectWallet)
export const useAuthLoading = () => useAppSelector(selectAuthLoading)
export const useAuthError = () => useAppSelector(selectAuthError)
export const useAuthState = () => useAppSelector(selectAuth)

// Legacy selectors for compatibility with existing components
export const useWalletConnection = () => {
  const auth = useAppSelector(selectAuth)
  return {
    connected: auth.isAuthenticated,
    publicKey: auth.wallet?.wallet_address || null,
    isLoading: auth.isLoading,
    isInitializing: auth.isLoading,
  }
}

export const useWalletConnected = () => useAppSelector(selectIsAuthenticated)
export const useWalletPublicKey = () => {
  const wallet = useAppSelector(selectWallet)
  return wallet?.wallet_address || null
}
export const useWalletAddress = () => {
  const wallet = useAppSelector(selectWallet)
  return wallet?.wallet_address || null
}
export const useWalletBalance = () => {
  const wallet = useAppSelector(selectWallet)
  return wallet?.balance || 0
}

export const useAuthSession = () => {
  const auth = useAppSelector(selectAuth)
  return {
    lastActivity: auth.lastActivity,
    expirationTime: auth.logoutTimer * 60 * 1000,
    isExpired: auth.sessionExpiry ? Date.now() > auth.sessionExpiry : false,
    timeUntilExpiration: auth.sessionExpiry ? Math.max(0, auth.sessionExpiry - Date.now()) : 0,
  }
}

// Auth actions
export const useAuthActions = () => {
  const dispatch = useAppDispatch()

  return {
    loginSuccess: (user: User, wallet: UserWallet) => dispatch(loginSuccess({ user, wallet })),
    logout: () => dispatch(logout()),
    setLoading: (isLoading: boolean) => dispatch(setLoading(isLoading)),
    setError: (error: string | null) => dispatch(setError(error)),
    updateWalletBalance: (balance: number) => dispatch(updateWalletBalance(balance)),
    restoreSession: useCallback(() => {
      dispatch(restoreSession())
    }, [dispatch]),
    clearAuthData: useCallback(() => {
      dispatch(clearAuthData())
    }, [dispatch]),
    signIn: useCallback(
      async (email: string, password: string) => {
        dispatch(setLoading(true))

        try {
          const response = await fetch("/api/auth/signin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          })

          const result = await response.json()

          if (result.success) {
            dispatch(
              loginSuccess({
                user: result.user,
                wallet: result.wallet,
              }),
            )
            console.log("User signed in successfully:", result.user.email)
            return { success: true }
          } else {
            dispatch(setError(result.error))
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = "Failed to sign in"
          dispatch(setError(errorMessage))
          return { success: false, error: errorMessage }
        } finally {
          dispatch(setLoading(false))
        }
      },
      [dispatch],
    ),

    signUp: useCallback(
      async (userData: {
        email: string
        password: string
        first_name?: string
        last_name?: string
      }) => {
        dispatch(setLoading(true))

        try {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          })

          const result = await response.json()

          if (result.success) {
            dispatch(
              loginSuccess({
                user: result.user,
                wallet: result.wallet,
              }),
            )
            console.log("User signed up successfully:", result.user.email)
            return { success: true }
          } else {
            dispatch(setError(result.error))
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = "Failed to sign up"
          dispatch(setError(errorMessage))
          return { success: false, error: errorMessage }
        } finally {
          dispatch(setLoading(false))
        }
      },
      [dispatch],
    ),

    updateActivity: useCallback(() => {
      dispatch(updateActivity())
    }, [dispatch]),

    setAutoLogout: useCallback(
      (enabled: boolean, timer?: number) => {
        dispatch(setAutoLogout({ enabled, timer }))
      },
      [dispatch],
    ),

    clearError: useCallback(() => {
      dispatch(setError(null))
    }, [dispatch]),
  }
}

// Activity tracking hook
export const useActivityTracker = () => {
  const dispatch = useAppDispatch()
  const isAuthenticated = useIsAuthenticated()

  const trackActivity = useCallback(() => {
    if (isAuthenticated) {
      dispatch(updateActivity())
    }
  }, [dispatch, isAuthenticated])

  // Auto-track common user activities
  useEffect(() => {
    if (!isAuthenticated) return

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    const throttledTrackActivity = throttle(trackActivity, 30000) // Throttle to once per 30 seconds

    events.forEach((event) => {
      document.addEventListener(event, throttledTrackActivity, true)
    })

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledTrackActivity, true)
      })
    }
  }, [isAuthenticated, trackActivity])

  return trackActivity
}

// Expiration checker hook
export const useExpirationChecker = () => {
  const dispatch = useAppDispatch()
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    if (!isAuthenticated) return

    // Check for expiration every minute
    const interval = setInterval(() => {
      dispatch(checkExpiration())
    }, 60000) // 1 minute

    return () => clearInterval(interval)
  }, [dispatch, isAuthenticated])
}

// Utility function for throttling
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}
