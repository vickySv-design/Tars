"use client"

import { useEffect, useRef, useState } from "react"

export function useAutoScroll<T>(dependency: T) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      })
      setShowScrollButton(false)
    }
  }

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

      if (isNearBottom) {
        setShowScrollButton(false)
        setIsUserScrolling(false)
      } else {
        setIsUserScrolling(true)
      }
    }

    element.addEventListener("scroll", handleScroll)
    return () => element.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!isUserScrolling) {
      scrollToBottom(false)
    } else {
      setShowScrollButton(true)
    }
  }, [dependency, isUserScrolling])

  return { scrollRef, showScrollButton, scrollToBottom }
}
