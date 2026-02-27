"use client"

import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import { User } from "@/types"
import { ProfileSettings } from "../chat/profile-settings"

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Tars Logo" 
            width={32} 
            height={32}
            className="rounded-lg"
          />
          <h1 className="text-xl font-bold">Tars</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <ProfileSettings />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  )
}
