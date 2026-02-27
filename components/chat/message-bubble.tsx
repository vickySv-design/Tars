"use client"

import { useState, useRef, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { MessageWithSender, REACTION_EMOJIS, ReactionEmoji } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatMessageTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { Smile, Trash2, Plus, Check, Reply, CheckCheck, EyeOff, Edit2, Forward, Globe } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MessageBubbleProps {
  message: MessageWithSender
  isOwn: boolean
  currentUserId: Id<"users">
  isSelectionMode?: boolean
  isSelected?: boolean
  onSelect?: () => void
  onLongPress?: () => void
  onReply?: () => void
  onEdit?: () => void
  onShowFullPicker?: () => void
}

export function MessageBubble({ message, isOwn, currentUserId, isSelectionMode, isSelected, onSelect, onLongPress, onReply, onEdit, onShowFullPicker }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const deleteForMe = useMutation(api.messages.deleteForMe)
  const deleteMessage = useMutation(api.messages.deleteMessage)
  const toggleReaction = useMutation(api.messages.toggleReaction)

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setShowReactions(false)
        setShowDeleteMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseDown = () => {
    if (!isSelectionMode) {
      const timer = setTimeout(() => {
        onLongPress?.()
      }, 500)
      setPressTimer(timer)
    }
  }

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (!isSelectionMode) {
      setShowActions(true)
    }
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowActions(false)
      setShowReactions(false)
      setShowDeleteMenu(false)
    }, 250)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!message) {
    return null
  }

  const handleDeleteForMe = async () => {
    await deleteForMe({ messageId: message._id, userId: currentUserId })
    setShowDeleteMenu(false)
  }

  const handleDeleteForEveryone = async () => {
    try {
      await deleteMessage({ messageId: message._id, userId: currentUserId })
    } catch (error) {
      console.error("Failed to delete for everyone:", error)
    } finally {
      setShowDeleteMenu(false)
    }
  }

  const handleReaction = async (emoji: ReactionEmoji) => {
    await toggleReaction({
      messageId: message._id,
      userId: currentUserId,
      emoji,
    })
    setShowReactions(false)
  }

  const reactionCounts = (message.reactions || []).reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const userReactions = (message.reactions || [])
    .filter((r) => r.userId === currentUserId)
    .map((r) => r.emoji)

  return (
    <div className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
      {!isOwn && message.sender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.imageUrl} alt={message.sender.name} />
          <AvatarFallback>{message.sender.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-1", isOwn && "items-end")}>
        <div
          ref={bubbleRef}
          className="flex items-center gap-2 group"
          onClick={() => isSelectionMode && onSelect?.()}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* SENDER SIDE - Icons on LEFT */}
          {isOwn && (
            <div className="flex gap-1">
              <div className="relative">
                {!message.isDeleted && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onReply?.()
                      }}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="relative">
                {!message.isDeleted && (
                  <Popover open={showReactions} onOpenChange={(open) => setShowReactions(open)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-auto p-2" sideOffset={5}>
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReaction(emoji)
                              setShowReactions(false)
                            }}
                            className="hover:scale-110 transition-transform text-lg p-1 rounded hover:bg-accent flex items-center justify-center w-8 h-8 shrink-0"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              {!message.isDeleted && (
                <div className="relative">
                  <Popover open={showDeleteMenu} onOpenChange={(open) => setShowDeleteMenu(open)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-auto p-1 min-w-[140px] flex flex-col gap-1" sideOffset={5}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs h-8"
                        onClick={(e) => { e.stopPropagation(); handleDeleteForMe() }}
                      >
                        <EyeOff className="h-3 w-3 mr-2" />
                        Delete for Me
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "max-w-xs lg:max-w-md px-3 py-2 rounded-lg",
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-muted",
              message.isDeleted && "opacity-60"
            )}
          >
            <div className="flex flex-col gap-1">
              {message.forwardedFrom && !message.isDeleted && (
                <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1 font-medium italic px-1">
                  <Forward className="h-3 w-3" />
                  <span>Forwarded</span>
                </div>
              )}
              {message.replyToMessage && !message.isDeleted && message.replyToMessage.sender && (
                <div className="mb-2 p-2 rounded bg-background/20 border-l-2 border-primary-foreground/50 text-xs flex flex-col gap-0.5 max-w-[200px] truncate">
                  <p className="font-semibold opacity-75">{isOwn && message.replyToMessage.senderId === currentUserId ? 'You' : (message.replyToMessage.sender?.name || 'Unknown')}</p>
                  <p className="opacity-90 truncate">{message.replyToMessage.content}</p>
                </div>
              )}
              {message.isDeleted ? (
                <p className="text-foreground/60 italic">This message was deleted</p>
              ) : (
                <p>{message.content || ''}</p>
              )}
              <div className={cn(
                "flex items-center gap-2 text-xs",
                isOwn ? "flex-row-reverse text-primary-foreground/80" : "text-muted-foreground"
              )}>
                <div className="flex items-center gap-1">
                  <span>{formatMessageTime(message._creationTime)}</span>
                  {message.editedAt && !message.isDeleted && (
                    <span className="text-[10px] opacity-70 italic">(edited)</span>
                  )}
                </div>
                {isOwn && !message.isDeleted && (
                  <div className="text-xs text-primary-foreground/80">
                    {message.isRead ? "seen" : "delivered"}
                  </div>
                )}
              </div>
            </div>
            {Object.keys(reactionCounts).length > 0 && !message.isDeleted && (
              <div className="flex gap-1 mt-1">
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                  <div
                    key={emoji}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                      userReactions.includes(emoji)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECEIVER SIDE - Icons on RIGHT */}
          {!isOwn && (
            <div className="flex gap-1">
              <div className="relative">
                {!message.isDeleted && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onReply?.()
                      }}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="relative">
                {!message.isDeleted && (
                  <Popover open={showReactions} onOpenChange={(open) => setShowReactions(open)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-auto p-2" sideOffset={5}>
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReaction(emoji)
                              setShowReactions(false)
                            }}
                            className="hover:scale-110 transition-transform text-lg p-1 rounded hover:bg-accent flex items-center justify-center w-8 h-8 shrink-0"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              {!message.isDeleted && (
                <div className="relative">
                  <Popover open={showDeleteMenu} onOpenChange={(open) => setShowDeleteMenu(open)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-auto p-1 min-w-[170px] flex flex-col gap-1" sideOffset={5}>
                      {Date.now() - message._creationTime < 5 * 60 * 1000 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.();
                            setShowDeleteMenu(false);
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-2" />
                          Edit Message
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs h-8"
                        onClick={(e) => { e.stopPropagation(); handleDeleteForMe() }}
                      >
                        <EyeOff className="h-3 w-3 mr-2" />
                        Delete for Me
                      </Button>

                      {Date.now() - message._creationTime < 60 * 60 * 1000 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="justify-start text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.stopPropagation(); handleDeleteForEveryone() }}
                        >
                          <Globe className="h-3 w-3 mr-2" />
                          Delete for Everyone
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
