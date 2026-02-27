# Customizing Tars: Colors and Layout

This guide shows you exactly where the colors, fonts, and core layout of the Tars application are controlled. Because this app is built with a highly scalable design system (Tailwind CSS + CSS Variables), making massive UI changes only requires tweaking a few lines of code.

---

## 1. Changing the Colors (Live Demo Ready)

The entire color scheme (for both Light and Dark mode) is controlled centrally in **one file**:

### 📄 File: `app/globals.css`

Open this file and look at the `:root` block (Lines 6-32) for Light Mode, and the `.dark` block (Lines 34-59) for Dark Mode. 

To completely change the app's primary branding color, you only need to change **Line 13**.

#### The Code to Change:
```css
/* app/globals.css - Line 13 */
--primary: 221.2 83.2% 53.3%; /* This is the current Blue */
```

#### Try these replacements during a live demo:
If you replace that one line with any of the following, the entire app (buttons, chat bubbles, rings) will **instantly** update without reloading the page:

- **Emerald Green:** `--primary: 142.1 76.2% 36.3%;`
- **Rose Pink:** `--primary: 346.8 77.2% 49.8%;`
- **Amethyst Purple:** `--primary: 262.1 83.3% 57.8%;`

---

## 2. Changing the Global Font

The application uses the `Inter` font from Google Fonts, optimized automatically by Next.js. You can change the typography of the entire application by modifying two lines.

### 📄 File: `app/layout.tsx`

#### The Code to Change:
Look at **Lines 2 and 7**.

```tsx
// 1. Change the import (Line 2)
import { Inter } from "next/font/google" 

// 2. Initialize the new font (Line 7)
const inter = Inter({ subsets: ["latin"] })
```

#### Try this replacement:
To give the app a more geometric, modern feel, change it to `Outfit`:

```tsx
import { Outfit } from "next/font/google"
const outfit = Outfit({ subsets: ["latin"] })

// Then update Line 30 to use the new font:
<body className={outfit.className}>
```

---

## 3. Changing the Core Layout Structure

The foundational structure of the Chat interface—how the sidebar sits next to the chat area—is controlled by Tailwind flexbox grids. 

### 📄 File: `app/chat/layout.tsx` (or similar chat nesting layout)

The layout uses Tailwind classes to define a responsive sidebar. To change how wide the sidebar is, or how it behaves on mobile, you adjust the grid/flex classes on the main container.

For example, the sidebar is likely contained within a wrapper that looks like this:
```tsx
<div className="flex h-screen overflow-hidden">
  {/* Sidebar container */}
  <div className="w-80 border-r hidden md:block"> 
    <ChatSidebar />
  </div>
  
  {/* Main Chat Area */}
  <main className="flex-1 min-w-0">
    {children}
  </main>
</div>
```

**To modify the layout:**
- Change `w-80` to `w-64` (thinner sidebar) or `w-96` (wider sidebar).
- Change `flex-row` configurations to stack things differently.

---

## Summary for the Reviewer/Demo

If a reviewer asks: *"How hard is it to rebrand this for a different client?"*

Your answer: 
> *"It takes 5 seconds. The entire color system runs on CSS variables mapped to Tailwind configuration. I don't have to hunt down hardcoded hex codes in hundreds of components. I just change `--primary` in `globals.css` and the entire application repaints instantly."*
