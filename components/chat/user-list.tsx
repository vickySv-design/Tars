"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserListProps {
  currentUserId: Id<"users">
}

export function UserList({ currentUserId }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const users = useQuery(api.users.getAllUsers, { currentUserId })
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation)
  const router = useRouter()

  const filteredUsers = users?.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUserClick = async (otherUserId: Id<"users">) => {
    const conversationId = await getOrCreateConversation({
      currentUserId,
      otherUserId,
    })
    router.push(`/chat?id=${conversationId}`)
  }

  if (!users) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredUsers && filteredUsers.length > 0 ? (
          <div className="p-2">
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserClick(user._id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.imageUrl} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
