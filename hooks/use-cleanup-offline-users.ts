"use client"

import { useEffect, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useCleanupOfflineUsers() {
  const markOfflineUsers = useMutation(api.users.markOfflineUsers)
  const cleanupRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Run cleanup every 2 minutes
    cleanupRef.current = setInterval(() => {
      markOfflineUsers({})
    }, 120000) // 2 minutes

    // Run initial cleanup after 30 seconds
    const initialCleanup = setTimeout(() => {
      markOfflineUsers({})
    }, 30000)

    return () => {
      if (cleanupRef.current) {
        clearInterval(cleanupRef.current)
      }
      clearTimeout(initialCleanup)
    }
  }, [markOfflineUsers])
}
