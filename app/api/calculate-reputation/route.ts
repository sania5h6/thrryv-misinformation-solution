import { createClient } from "@/lib/supabase/server"

/**
 * Reputation Scoring Algorithm for Thrryv
 *
 * Base Score: 50 (neutral starting point)
 *
 * Contributions to Reputation:
 * - High-quality posts (70%+ score): +0.5 points
 * - Quality engagement (likes on quality posts): +0.1 per like
 * - Helpful replies: +0.3 per reply on quality posts
 * - Positive community feedback: +0.2 per like on user's content
 *
 * Penalties:
 * - Flagged/removed posts: -2 points
 * - Misinformation detected (70%+ risk): -5 points
 * - Multiple flags: -1 point per flag
 */

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get user from request body
    const { userId } = await request.json()

    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 })
    }

    // Get user's current reputation
    const { data: user } = await supabase
      .from("users")
      .select("reputation_score, total_posts, followers_count")
      .eq("id", userId)
      .single()

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    let reputationChange = 0
    const breakdown: Record<string, number> = {}

    // 1. Calculate from posts
    const { data: userPosts } = await supabase
      .from("posts")
      .select("id, overall_score, misinformation_risk, is_flagged, likes_count")
      .eq("user_id", userId)

    if (userPosts) {
      for (const post of userPosts) {
        // High-quality posts bonus
        if (post.overall_score >= 70) {
          reputationChange += 0.5
          breakdown["high_quality_posts"] = (breakdown["high_quality_posts"] || 0) + 0.5
        }

        // Misinformation penalty
        if (post.misinformation_risk >= 70) {
          reputationChange -= 5
          breakdown["misinformation_penalty"] = (breakdown["misinformation_penalty"] || 0) - 5
        }

        // Flagged content penalty
        if (post.is_flagged) {
          reputationChange -= 2
          breakdown["flagged_content"] = (breakdown["flagged_content"] || 0) - 2
        }

        // Engagement bonus (likes on posts)
        reputationChange += post.likes_count * 0.1
        breakdown["engagement_likes"] = (breakdown["engagement_likes"] || 0) + post.likes_count * 0.1
      }
    }

    // 2. Calculate from replies
    const { data: userReplies } = await supabase
      .from("post_replies")
      .select(`
        id, 
        quality_score, 
        likes_count,
        posts:post_id (overall_score)
      `)
      .eq("user_id", userId)

    if (userReplies) {
      for (const reply of userReplies) {
        // Helpful replies on quality posts
        if (reply.posts && reply.posts.overall_score >= 70) {
          reputationChange += 0.3
          breakdown["helpful_replies"] = (breakdown["helpful_replies"] || 0) + 0.3
        }

        // Engagement bonus (likes on replies)
        reputationChange += reply.likes_count * 0.1
        breakdown["reply_engagement"] = (breakdown["reply_engagement"] || 0) + reply.likes_count * 0.1
      }
    }

    // 3. Account for followers (credibility boost)
    const { data: followerCount } = await supabase
      .from("followers")
      .select("id", { count: "exact", head: 0 })
      .eq("following_id", userId)

    if (followerCount && followerCount.length > 0) {
      const followerBonus = Math.min(followerCount.length * 0.05, 5)
      reputationChange += followerBonus
      breakdown["follower_bonus"] = followerBonus
    }

    // 4. Multiple flags penalty
    const { data: flags } = await supabase
      .from("moderation_flags")
      .select("id", { count: "exact", head: 0 })
      .eq("user_id", userId)
      .eq("status", "pending")

    if (flags && flags.length > 0) {
      const flagPenalty = flags.length * -1
      reputationChange += flagPenalty
      breakdown["multiple_flags"] = flagPenalty
    }

    // Calculate new reputation score (min 0, max 100)
    const newScore = Math.max(0, Math.min(100, user.reputation_score + reputationChange))

    // Update user reputation
    const { error: updateError } = await supabase.from("users").update({ reputation_score: newScore }).eq("id", userId)

    if (updateError) throw updateError

    // Log to reputation history
    await supabase.from("reputation_history").insert({
      user_id: userId,
      old_score: user.reputation_score,
      new_score: newScore,
      reason: `Reputation update: ${JSON.stringify(breakdown)}`,
    })

    return Response.json({
      success: true,
      userId,
      oldScore: user.reputation_score,
      newScore,
      change: reputationChange,
      breakdown,
    })
  } catch (error) {
    console.error("Reputation calculation error:", error)
    return Response.json({ error: "Failed to calculate reputation" }, { status: 500 })
  }
}
