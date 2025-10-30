import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StreamChatInterface } from "@/components/stream-chat-interface"

export const metadata: Metadata = {
  title: "Messages | CollabHub",
  description: "Real-time chat with Stream",
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  return (
    <div className="h-screen">
      <StreamChatInterface />
    </div>
  )
}
