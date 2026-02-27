import { SignUp } from "@clerk/nextjs"
import Image from "next/image"

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <Image 
          src="/logo.png" 
          alt="Tars Logo" 
          width={40} 
          height={40}
          className="rounded-lg"
        />
        <h1 className="text-2xl font-bold">Tars</h1>
      </div>
      <SignUp />
    </div>
  )
}
