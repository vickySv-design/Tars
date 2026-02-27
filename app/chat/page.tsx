"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatArea } from "@/components/chat/chat-area"
import { Header } from "@/components/layout/header"
import { useSearchParams } from "next/navigation"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useCleanupOfflineUsers } from "@/hooks/use-cleanup-offline-users"
import { Skeleton } from "@/components/ui/skeleton"

export default function ChatPage() {
  const { user: clerkUser } = useUser()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("id")

  const syncUser = useMutation(api.users.syncUser)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  )

  useOnlineStatus(currentUser?._id)
  useCleanupOfflineUsers()

  useEffect(() => {
    if (clerkUser && !currentUser) {
      syncUser({
        clerkId: clerkUser.id,
        name: clerkUser.fullName || clerkUser.username || "User",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        imageUrl: clerkUser.imageUrl,
      })
    }
  }, [clerkUser, currentUser, syncUser])

  if (!currentUser) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 flex">
          <div className="w-80 border-r p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <Header user={currentUser} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - hidden on mobile when conversation is open */}
        <div className={`w-full md:w-80 ${conversationId ? "hidden md:block" : "block"}`}>
          <ChatSidebar currentUserId={currentUser._id} />
        </div>

        {/* Chat Area - shown on mobile only when conversation is selected */}
        <div className={`flex-1 ${conversationId ? "block" : "hidden md:block"}`}>
          {conversationId ? (
            <ChatArea
              conversationId={conversationId as any}
              currentUserId={currentUser._id}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">Select a conversation to start chatting</p>
                <p className="text-sm mt-2">or start a new conversation from the Users tab</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
