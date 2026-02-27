# Tars Live Demo Script: The Customization Flex

During your live demo or technical interview, use this exact sequence to prove you didn't just write "a feature," but built a maintainable and scalable frontend system.

### The Setup
Have two windows open side-by-side:
1. **Left side:** VS Code.
2. **Right side:** Chrome/Edge running the app (`npm run dev`).

Navigate to a chat where you can see multiple different UI elements (buttons, message bubbles, the sidebar).

---

## 🎬 Act 1: The One-Second Rebrand

**What to say:**
> *"One thing I focused heavily on for this application is maintainability. Because it uses a centralized CSS variable system mapped to Tailwind, I can completely re-theme the entire application for a new client in about one second. Let me show you."*

**What to do:**
1. In VS Code, open `app/globals.css`.
2. Scroll to **Line 13**. You will see:
   ```css
   --primary: 221.2 83.2% 53.3%;
   ```
3. Delete those numbers and paste in this Emerald Green color:
   ```css
   --primary: 142.1 76.2% 36.3%;
   ```
4. **Hit Save (Ctrl+S / Cmd+S).**
5. Point to the browser window. The buttons, links, and accents will instantly flash from blue to green without the page reloading.

---

## 🎬 Act 2: Modifying a Reusable Component

**What to say:**
> *"Beyond globals, I built the UI out of atomic components. If I need to change how a core element looks—like every button in the app—I don't need to hunt down 50 different files. I change one central component."*

**What to do:**
1. In VS Code, open `components/ui/button.tsx`.
2. Scroll down to around **Line 18**. You will find the `cva` definition for the default button variants:
   ```tsx
   default: "bg-primary text-primary-foreground hover:bg-primary/90",
   ```
3. Change it to make the buttons completely rounded (add `rounded-full`) and add a slight shadow (`shadow-md`):
   ```tsx
   default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-md",
   ```
4. **Hit Save (Ctrl+S / Cmd+S).**
5. Point to the browser window. All primary buttons across the site will instantly transform into pill shapes with drop shadows.

---

## 🎬 Act 3: Changing a Core Layout Rule

**What to say:**
> *"And finally, layout responsiveness. Instead of hardcoding widths, everything is governed by Tailwind flexbox grids. If we wanted to make the sidebar significantly wider to accommodate longer names..."*

**What to do:**
1. In VS Code, open `components/chat/chat-sidebar.tsx` or wherever your layout file holds the sidebar container (e.g., `app/chat/layout.tsx`).
2. Find the container `div` defining width (often `w-80` or `w-64`).
3. Change it to `w-96` (which expands it by 4 rems).
4. **Hit Save.**
5. Point to the browser window as the sidebar smoothly snaps to its new width while the chat area flexes perfectly to fill the remaining space.

---

### 🎤 The Mic Drop Conclusion
> *"By structuring the application this way—centralized tokens, atomic components, and utility-class layouts—this codebase is highly scalable and ready for a team of developers to build on top of without stepping on each other's toes."*
