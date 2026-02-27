"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMessageTime } from "@/lib/date-utils"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface ConversationListProps {
  currentUserId: Id<"users">
}

export function ConversationList({ currentUserId }: ConversationListProps) {
  const conversations = useQuery(api.conversations.getUserConversations, {
    userId: currentUserId,
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeConversationId = searchParams.get("id")

  if (!conversations) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start a conversation by selecting a user
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {conversations.map((conversation) => {
          if (!conversation) return null

          const displayName = conversation.isGroup
            ? conversation.name
            : conversation.otherUser?.name
          const displayImage = conversation.isGroup
            ? undefined
            : conversation.otherUser?.imageUrl
          const isOnline = conversation.otherUser?.isOnline
          const memberCount = conversation.isGroup ? conversation.groupMembers?.length : null

          return (
            <button
              key={conversation._id}
              onClick={() => router.push(`/chat?id=${conversation._id}`)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors",
                activeConversationId === conversation._id && "bg-accent"
              )}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={displayImage} alt={displayName} />
                  <AvatarFallback>{displayName?.[0]}</AvatarFallback>
                </Avatar>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{displayName}</p>
                    {conversation.isGroup && memberCount && (
                      <span className="text-xs text-muted-foreground">({memberCount})</span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatMessageTime(conversation.lastMessage._creationTime)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage
                      ? conversation.lastMessage.isDeleted
                        ? "Message deleted"
                        : conversation.lastMessage.content
                      : "No messages yet"}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shrink-0">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
