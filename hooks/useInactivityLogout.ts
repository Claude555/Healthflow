"use client"

import { useEffect, useRef, useCallback } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface UseInactivityLogoutOptions {
  inactivityTime?: number // Time in milliseconds before logout
  warningTime?: number // Time in milliseconds before showing warning
  onWarning?: () => void
  onLogout?: () => void
}

export function useInactivityLogout({
  inactivityTime = 30 * 60 * 1000, // 30 minutes default
  warningTime = 28 * 60 * 1000, // 2 minutes before logout (28 minutes)
  onWarning,
  onLogout,
}: UseInactivityLogoutOptions = {}) {
  const router = useRouter()
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const handleLogout = useCallback(async () => {
    if (onLogout) {
      onLogout()
    }
    
    toast.error("You've been logged out due to inactivity", {
      duration: 5000,
    })
    
    await signOut({ redirect: false })
    router.push("/login")
  }, [onLogout, router])

  const showWarning = useCallback(() => {
    if (onWarning) {
      onWarning()
    } else {
      toast.warning("You will be logged out in 2 minutes due to inactivity", {
        duration: 5000,
        action: {
          label: "Stay logged in",
          onClick: () => {
            resetTimers()
          },
        },
      })
    }
  }, [onWarning])

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
    }

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      showWarning()
    }, warningTime)

    // Set logout timer
    inactivityTimerRef.current = setTimeout(() => {
      handleLogout()
    }, inactivityTime)
  }, [inactivityTime, warningTime, showWarning, handleLogout])

  useEffect(() => {
    // Events to track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ]

    // Reset timers on any user activity
    const handleActivity = () => {
      resetTimers()
    }

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // Initialize timers
    resetTimers()

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current)
      }
    }
  }, [resetTimers])

  return {
    resetTimers,
    lastActivity: lastActivityRef.current,
  }
}