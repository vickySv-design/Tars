"use client"

import { useEffect, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export function useOnlineStatus(userId: Id<"users"> | undefined) {
  const setOnlineStatus = useMutation(api.users.setOnlineStatus)
  const updateHeartbeat = useMutation(api.users.updateHeartbeat)
  const heartbeatRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!userId) return

    // Set online when component mounts
    setOnlineStatus({ userId, isOnline: true })

    // Start heartbeat every 30 seconds
    heartbeatRef.current = setInterval(() => {
      if (!document.hidden) {
        updateHeartbeat({ userId })
      }
    }, 30000)

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOnlineStatus({ userId, isOnline: false })
      } else {
        setOnlineStatus({ userId, isOnline: true })
        // Restart heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current)
        }
        heartbeatRef.current = setInterval(() => {
          if (!document.hidden) {
            updateHeartbeat({ userId })
          }
        }, 30000)
      }
    }

    // Handle page unload
    const handleBeforeUnload = () => {
      setOnlineStatus({ userId, isOnline: false })
    }

    // Handle connection loss
    const handleOffline = () => {
      setOnlineStatus({ userId, isOnline: false })
    }

    // Handle connection restore
    const handleOnline = () => {
      setOnlineStatus({ userId, isOnline: true })
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
      setOnlineStatus({ userId, isOnline: false })
    }
  }, [userId, setOnlineStatus, updateHeartbeat])
}
