import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PostDetailClient from "@/components/posts/post-detail-client"

export default async function PostPage({
  params,
}: {
  params: { postId: string }
}) {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("posts")
    .select(`
      *,
      users:user_id (id, username, avatar_url, reputation_score),
      post_likes (id, user_id),
      post_replies (
        *,
        users:user_id (username, avatar_url, reputation_score)
      )
    `)
    .eq("id", params.postId)
    .single()

  if (!post) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <PostDetailClient post={post} currentUserId={user?.id} />
      </div>
    </div>
  )
}
