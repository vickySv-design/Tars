"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Upload, Camera } from "lucide-react"

export function ProfileSettings() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState(user?.fullName || "")
  
  const updateProfile = useMutation(api.users.updateProfile)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      // Upload to Clerk
      await user.setProfileImage({ file })
      
      // Update in Convex
      await updateProfile({
        clerkId: user.id,
        name: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl,
      })
    } catch (error) {
      console.error("Failed to upload image:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleNameUpdate = async () => {
    if (!user || !name.trim()) return

    try {
      await user.update({ firstName: name.split(" ")[0], lastName: name.split(" ").slice(1).join(" ") })
      
      await updateProfile({
        clerkId: user.id,
        name: name.trim(),
        email: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl,
      })
      
      setOpen(false)
    } catch (error) {
      console.error("Failed to update name:", error)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
                <AvatarFallback className="text-2xl">
                  {user.fullName?.[0] || user.emailAddresses[0]?.emailAddress[0]}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={user.primaryEmailAddress?.emailAddress || ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNameUpdate} disabled={!name.trim()}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}