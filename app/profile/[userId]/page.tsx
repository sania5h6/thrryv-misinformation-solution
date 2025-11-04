import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ProfileClient from "@/components/profile/profile-client"

export default async function ProfilePage({
  params,
}: {
  params: { userId: string }
}) {
  const supabase = await createClient()

  // Get user profile
  const { data: user } = await supabase.from("users").select("*").eq("id", params.userId).single()

  if (!user) {
    notFound()
  }

  // Get user's posts
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      post_likes (id),
      post_replies (id)
    `)
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get follower status
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  let isFollowing = false
  if (currentUser && currentUser.id !== params.userId) {
    const { data: follower } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", params.userId)
      .single()

    isFollowing = !!follower
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileClient user={user} posts={posts || []} isFollowing={isFollowing} currentUserId={currentUser?.id} />
    </div>
  )
}
