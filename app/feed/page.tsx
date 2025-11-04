import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FeedClient from "@/components/feed/feed-client"

export default async function FeedPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch posts with user data, sorted by reputation score
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      users:user_id (id, username, avatar_url, reputation_score),
      post_likes (id),
      post_replies (id)
    `)
    .order("overall_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching posts:", error)
    return <div>Error loading posts</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <FeedClient initialPosts={posts || []} currentUserId={user.id} />
    </div>
  )
}
