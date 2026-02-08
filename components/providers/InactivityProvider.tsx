"use client"

import { useSession } from "next-auth/react"
import { useInactivityLogout } from "@/hooks/useInactivityLogout"

interface InactivityProviderProps {
  children: React.ReactNode
  inactivityTime?: number // in minutes
}

export default function InactivityProvider({
  children,
  inactivityTime = 30, // 30 minutes default
}: InactivityProviderProps) {
  const { data: session } = useSession()

  // Only enable inactivity logout if user is logged in
  useInactivityLogout({
    inactivityTime: inactivityTime * 60 * 1000, // Convert to milliseconds
    warningTime: (inactivityTime - 2) * 60 * 1000, // Warning 2 minutes before
  })

  return <>{children}</>
}