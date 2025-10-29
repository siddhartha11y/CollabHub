import { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MessagingInterface } from "@/components/messaging-interface"

export const metadata: Metadata = {
  title: "Messages | CollabHub",
  description: "Chat with your team members",
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  return (
    <div className="h-screen flex flex-col">
      <MessagingInterface />
    </div>
  )
}
