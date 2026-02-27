"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { MessageWithSender } from "@/types"
import { MessageBubble } from "./message-bubble"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { ArrowDown, Send, X, Smile, Trash2, Copy, MessageSquare, ArrowLeft } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatLastSeen } from "@/lib/date-utils"
import { useRouter } from "next/navigation"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

interface ChatAreaProps {
  conversationId: Id<"conversations">
  currentUserId: Id<"users">
}

export function ChatArea({ conversationId, currentUserId }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("")
  const lastTypedRef = useRef<number>(0)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<{ type: 'input' } | { type: 'reaction', messageId: Id<"messages"> } | null>(null)
  const [selectedMessages, setSelectedMessages] = useState<Set<Id<"messages">>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Id<"messages"> | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)

  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
    currentUserId
  })
  const messagesData = useQuery(api.messages.getMessages, { conversationId, userId: currentUserId })
  const messages = messagesData?.messages || []
  const hasMore = messagesData?.hasMore || false
  const nextCursor = messagesData?.nextCursor
  const typingUsers = useQuery(api.typing.getTypingUsers, {
    conversationId,
    currentUserId,
  })

  const sendMessage = useMutation(api.messages.sendMessage)
  const markAsRead = useMutation(api.messages.markAsRead)
  const updateTypingStatus = useMutation(api.typing.updateTypingStatus)
  const toggleReaction = useMutation(api.messages.toggleReaction)
  const deleteMessage = useMutation(api.messages.deleteMessage)
  const deleteForMe = useMutation(api.messages.deleteForMe)
  const editMessage = useMutation(api.messages.editMessage)

  const loadOlderMessages = async () => {
    if (!hasMore || !nextCursor || isLoadingOlder) return

    setIsLoadingOlder(true)
    try {
      // This would need a paginated query implementation
      // For now, we'll just show a message
      console.log("Loading older messages...")
    } catch (error) {
      console.error("Failed to load older messages:", error)
    } finally {
      setIsLoadingOlder(false)
    }
  }

  const { scrollRef, showScrollButton, scrollToBottom } = useAutoScroll(`${messages?.length || 0}-${typingUsers?.length || 0}`)
  const router = useRouter()

  // Mark as read when messages load
  useEffect(() => {
    if (messages && messages.length > 0) {
      const timeout = setTimeout(() => {
        markAsRead({ conversationId, userId: currentUserId })
      }, 100) // Debounce for performance
      return () => clearTimeout(timeout)
    }
  }, [messages, conversationId, currentUserId, markAsRead])

  // Mark as read when messages load
  useEffect(() => {
    if (messages && messages.length > 0) {
      const timeout = setTimeout(() => {
        markAsRead({ conversationId, userId: currentUserId })
      }, 100) // Debounce for performance
      return () => clearTimeout(timeout)
    }
  }, [messages, conversationId, currentUserId, markAsRead])

  const handleSend = async () => {
    if (!messageText.trim()) return

    const text = messageText
    setMessageText("")
    setSendError(null)

    // Clear typing status immediately upon sending
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    updateTypingStatus({ conversationId, userId: currentUserId, isTyping: false }).catch(console.error)

    try {
      if (editingMessageId) {
        await editMessage({
          messageId: editingMessageId,
          userId: currentUserId,
          content: text,
        })
        setEditingMessageId(null)
      } else {
        await sendMessage({
          conversationId,
          senderId: currentUserId,
          content: text,
          ...(replyingTo ? { replyToMessageId: replyingTo } : {}),
        })
        setReplyingTo(null)
      }
    } catch (error: any) {
      setSendError(error?.message || "Failed to send message")
      setMessageText(text) // Restore message text
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === "Escape") {
      if (isSelectionMode) {
        handleExitSelectionMode()
      }
      if (emojiPickerTarget) {
        setEmojiPickerTarget(null)
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (e.key === "a" && !isSelectionMode) {
        e.preventDefault()
        // Enter selection mode and select all messages
        setIsSelectionMode(true)
        setSelectedMessages(new Set(messages.map(m => m._id)))
      } else if (e.key === "c" && selectedMessages.size > 0) {
        e.preventDefault()
        handleCopySelected()
      }
    } else if (e.key === "Delete" && selectedMessages.size > 0) {
      e.preventDefault()
      handleDeleteSelected()
    }
  }

  const handleMessageLongPress = (messageId: Id<"messages">) => {
    setIsSelectionMode(true)
    setSelectedMessages(new Set([messageId]))
  }

  const handleMessageSelect = (messageId: Id<"messages">) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const handleReply = (messageId: Id<"messages">) => {
    setEditingMessageId(null) // Clear edit state
    setReplyingTo(messageId)
  }

  const handleEdit = (message: MessageWithSender) => {
    setReplyingTo(null) // Clear reply state
    setEditingMessageId(message._id)
    setMessageText(message.content)
  }

  const handleDeleteSelected = async () => {
    try {
      if (!currentUserId) {
        throw new Error("User not authenticated")
      }

      for (const messageId of selectedMessages) {
        await deleteForMe({ messageId, userId: currentUserId })
      }

      setSelectedMessages(new Set())
      setIsSelectionMode(false)
    } catch (error) {
      console.error("Failed to delete messages:", error)
      setSendError("Failed to delete messages. Please try again.")
      // Keep selection mode on error so user can retry
    }
  }

  const handleCopySelected = () => {
    const selectedText = messages
      .filter(msg => selectedMessages.has(msg._id))
      .map(msg => msg.content)
      .join('\n')

    navigator.clipboard.writeText(selectedText)
    setSelectedMessages(new Set())
    setIsSelectionMode(false)
  }

  const handleExitSelectionMode = () => {
    setSelectedMessages(new Set())
    setIsSelectionMode(false)
  }

  if (!conversation || !messagesData) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-64 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const otherUserData = conversation?.otherUser

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => router.push("/chat")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {isSelectionMode ? (
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExitSelectionMode}
              >
                <X className="h-5 w-5" />
              </Button>
              <span className="font-medium">{selectedMessages.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopySelected}
                disabled={selectedMessages.size === 0}
              >
                <Copy className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteSelected}
                disabled={selectedMessages.size === 0}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            {conversation?.isGroup ? (
              <>
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>{conversation.name?.[0] || "G"}</AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p className="font-medium">{conversation.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {/* @ts-ignore - groupMembers might not be in type yet */}
                    {(conversation as any).groupMembers?.length || 0} members
                  </p>
                </div>
              </>
            ) : otherUserData && (
              <>
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={otherUserData.imageUrl} alt={otherUserData.name} />
                    <AvatarFallback>{otherUserData.name[0]}</AvatarFallback>
                  </Avatar>
                  {otherUserData.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{otherUserData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {otherUserData.isOnline
                      ? "Online"
                      : formatLastSeen(otherUserData.lastSeen)}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {!isSelectionMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/chat")}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 relative">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto p-4"
          onKeyDown={handleKeyPress}
          tabIndex={0}
        >
          {!messagesData ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full max-w-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hasMore && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadOlderMessages}
                    disabled={isLoadingOlder}
                    className="text-xs"
                  >
                    {isLoadingOlder ? (
                      <>
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Load older messages"
                    )}
                  </Button>
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble
                  key={message._id}
                  message={message as unknown as MessageWithSender}
                  isOwn={message.senderId === currentUserId}
                  currentUserId={currentUserId}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedMessages.has(message._id)}
                  onSelect={() => handleMessageSelect(message._id)}
                  onLongPress={() => handleMessageLongPress(message._id)}
                  onReply={() => handleReply(message._id)}
                  onEdit={() => handleEdit(message as unknown as MessageWithSender)}
                  onShowFullPicker={() => setEmojiPickerTarget({ type: 'reaction', messageId: message._id })}
                />
              ))}
            </div>
          )}

          {typingUsers && typingUsers.length > 0 && (
            <div className="flex items-center gap-2 mt-4 mb-2 p-2 bg-muted/30 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-sm text-muted-foreground">
                {typingUsers.length === 1
                  ? `${typingUsers[0]?.name} is typing...`
                  : `${typingUsers.map(u => u.name).slice(0, 2).join(', ')} and ${typingUsers.length - 2} others are typing...`
                }
              </span>
            </div>
          )}
        </div>

        {showScrollButton && (
          <Button
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-lg"
            onClick={() => scrollToBottom()}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4 relative">
        {sendError && (
          <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive flex items-center justify-between">
            <span>{sendError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSendError(null)}
              className="h-6 px-2 text-destructive hover:text-destructive"
            >
              Retry
            </Button>
          </div>
        )}

        {(replyingTo || editingMessageId) && (() => {
          const targetMsgId = replyingTo || editingMessageId
          const targetMsg = messages.find((m) => m._id === targetMsgId)
          if (!targetMsg) return null

          return (
            <div className="mb-2 p-2 rounded-lg bg-muted border-l-4 border-primary text-sm flex justify-between items-start">
              <div>
                <p className="font-semibold text-primary">
                  {editingMessageId ? 'Editing Message' : (targetMsg.senderId === currentUserId ? 'Replying to You' : `Replying to ${targetMsg.sender?.name}`)}
                </p>
                <p className="text-muted-foreground truncate max-w-[200px] md:max-w-md">{targetMsg.content}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 shrink-0"
                onClick={() => {
                  if (replyingTo) setReplyingTo(null)
                  if (editingMessageId) {
                    setEditingMessageId(null)
                    setMessageText("")
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )
        })()}

        <div className="flex gap-2">
          <Popover
            open={!!emojiPickerTarget}
            onOpenChange={(open) => {
              if (!open) setEmojiPickerTarget(null)
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setEmojiPickerTarget(prev => prev?.type === 'input' ? null : { type: 'input' })}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={10}
              className="w-auto p-0 border-none bg-transparent shadow-none"
            >
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => {
                  if (emojiPickerTarget?.type === 'reaction') {
                    toggleReaction({
                      messageId: emojiPickerTarget.messageId,
                      userId: currentUserId,
                      emoji: emoji.native,
                    })
                  } else {
                    setMessageText(prev => prev + emoji.native)
                  }
                  setEmojiPickerTarget(null)
                }}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
              />
            </PopoverContent>
          </Popover>
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value)
              const now = Date.now()

              if (now - lastTypedRef.current > 1000) {
                updateTypingStatus({ conversationId, userId: currentUserId, isTyping: true }).catch(console.error)
                lastTypedRef.current = now
              }

              // Always reset the 2-second idle timeout when the user types
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
              typingTimeoutRef.current = setTimeout(() => {
                updateTypingStatus({ conversationId, userId: currentUserId, isTyping: false }).catch(console.error)
              }, 2000)

            }}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleSend} disabled={!messageText.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
