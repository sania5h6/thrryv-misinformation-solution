import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CreatePostClient from "@/components/create-post/create-post-client"

export default async function CreatePostPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <CreatePostClient userId={user.id} />
      </div>
    </div>
  )
}
