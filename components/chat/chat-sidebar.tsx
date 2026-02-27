"use client"

import { useState } from "react"
import Image from "next/image"
import { Id } from "@/convex/_generated/dataModel"
import { ConversationList } from "./conversation-list"
import { UserList } from "./user-list"
import { CreateGroupDialog } from "./create-group-dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  currentUserId: Id<"users">
}

export function ChatSidebar({ currentUserId }: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"conversations" | "users">("conversations")

  return (
    <div className="flex flex-col h-full border-r">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Tars Logo" 
            width={28} 
            height={28}
            className="rounded-lg"
          />
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("conversations")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors",
            activeTab === "conversations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium">Chats</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors",
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4" />
          <span className="font-medium">Users</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "conversations" ? (
          <div className="flex flex-col h-full">
            <div className="p-2 border-b">
              <CreateGroupDialog currentUserId={currentUserId} />
            </div>
            <ConversationList currentUserId={currentUserId} />
          </div>
        ) : (
          <UserList currentUserId={currentUserId} />
        )}
      </div>
    </div>
  )
}
