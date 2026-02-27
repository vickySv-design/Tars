"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateGroupDialogProps {
  currentUserId: Id<"users">
}

export function CreateGroupDialog({ currentUserId }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([])
  
  const users = useQuery(api.users.getAllUsers, { currentUserId })
  const createGroup = useMutation(api.conversations.createGroupConversation)
  const router = useRouter()

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return

    try {
      const conversationId = await createGroup({
        creatorId: currentUserId,
        memberIds: selectedUsers,
        name: groupName.trim(),
      })
      
      setOpen(false)
      setGroupName("")
      setSelectedUsers([])
      router.push(`/chat?id=${conversationId}`)
    } catch (error) {
      console.error("Failed to create group:", error)
    }
  }

  const toggleUser = (userId: Id<"users">) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Select Members</p>
            <ScrollArea className="h-48 border rounded-md">
              {users?.map((user) => (
                <div key={user._id} className="flex items-center space-x-3 p-3 hover:bg-accent">
                  <Checkbox
                    checked={selectedUsers.includes(user._id)}
                    onCheckedChange={() => toggleUser(user._id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.imageUrl} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.name}</span>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
            >
              Create Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}