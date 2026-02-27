import { format, isToday, isThisYear } from "date-fns"

export function formatMessageTime(date: Date | number): string {
  const messageDate = typeof date === 'number' ? new Date(date) : date
  
  if (isToday(messageDate)) {
    return format(messageDate, "h:mm a")
  } else if (isThisYear(messageDate)) {
    return format(messageDate, "MMM d, h:mm a")
  } else {
    return format(messageDate, "MMM d, yyyy, h:mm a")
  }
}

export function formatLastSeen(date: Date | number): string {
  const lastSeenDate = typeof date === 'number' ? new Date(date) : date
  
  if (isToday(lastSeenDate)) {
    return `Last seen today at ${format(lastSeenDate, "h:mm a")}`
  } else if (isThisYear(lastSeenDate)) {
    return `Last seen ${format(lastSeenDate, "MMM d 'at' h:mm a")}`
  } else {
    return `Last seen ${format(lastSeenDate, "MMM d, yyyy")}`
  }
}
