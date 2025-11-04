import { createClient } from "@/lib/supabase/server"
import { updateUserReputation } from "@/lib/reputation"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId, reason } = await request.json()

    if (!postId || !reason) {
      return Response.json({ error: "postId and reason are required" }, { status: 400 })
    }

    // Get the post
    const { data: post } = await supabase
      .from("posts")
      .select("user_id, misinformation_risk, is_flagged")
      .eq("id", postId)
      .single()

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 })
    }

    // Create flag
    const { error: flagError } = await supabase.from("moderation_flags").insert({
      post_id: postId,
      user_id: user.id,
      reason,
      status: "pending",
    })

    if (flagError) throw flagError

    // Mark post as flagged if misinformation risk is high
    if (post.misinformation_risk >= 70 && !post.is_flagged) {
      await supabase.from("posts").update({ is_flagged: true, flagged_reason: reason }).eq("id", postId)

      // Update author's reputation
      await updateUserReputation(post.user_id)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Flag error:", error)
    return Response.json({ error: "Failed to flag content" }, { status: 500 })
  }
}
