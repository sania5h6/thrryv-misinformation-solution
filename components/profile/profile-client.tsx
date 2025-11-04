"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getReputationTier } from "@/lib/reputation"
import { UserPlus, UserMinus } from "lucide-react"
import PostCard from "@/components/feed/post-card"

interface User {
  id: string
  username: string
  email: string
  bio: string | null
  avatar_url: string | null
  reputation_score: number
  total_posts: number
  followers_count: number
  following_count: number
  created_at: string
}

interface Post {
  id: string
  content: string
  overall_score: number
  quality_score: number
  misinformation_risk: number
  created_at: string
  user_id: string
  users: {
    username: string
    avatar_url: string | null
    reputation_score: number
  }
  post_likes: { id: string }[]
  post_replies: { id: string }[]
  is_flagged: boolean
}

export default function ProfileClient({
  user,
  posts,
  isFollowing,
  currentUserId,
}: {
  user: User
  posts: Post[]
  isFollowing: boolean
  currentUserId?: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [following, setFollowing] = useState(isFollowing)
  const [followerCount, setFollowerCount] = useState(user.followers_count)
  const [isLoading, setIsLoading] = useState(false)

  const reputationTier = getReputationTier(user.reputation_score)
  const isOwnProfile = currentUserId === user.id

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      router.push("/auth/login")
      return
    }

    setIsLoading(true)
    try {
      if (following) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", user.id)

        if (error) throw error
        setFollowing(false)
        setFollowerCount((c) => c - 1)
      } else {
        // Follow
        const { error } = await supabase.from("followers").insert({
          follower_id: currentUserId,
          following_id: user.id,
        })

        if (error) throw error
        setFollowing(true)
        setFollowerCount((c) => c + 1)
      }
    } catch (error) {
      console.error("Follow toggle error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProfile = () => {
    router.push("/settings/profile")
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-3xl font-bold text-primary">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.username[0].toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground">{user.username}</h1>
                <p className={`text-sm font-semibold ${reputationTier.color}`}>{reputationTier.tier}</p>
                <p className="text-sm text-muted-foreground">{reputationTier.description}</p>

                {user.bio && <p className="text-foreground mt-2 text-sm">{user.bio}</p>}

                <div className="flex gap-4 mt-3 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{user.total_posts}</p>
                    <p className="text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{followerCount}</p>
                    <p className="text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user.following_count}</p>
                    <p className="text-muted-foreground">Following</p>
                  </div>
                </div>
              </div>
            </div>

            {isOwnProfile ? (
              <Button onClick={handleEditProfile}>Edit Profile</Button>
            ) : (
              <Button onClick={handleFollowToggle} disabled={isLoading} variant={following ? "outline" : "default"}>
                {following ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reputation Stats */}
      <div className="max-w-2xl mx-auto p-4">
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Reputation Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Reputation Score</p>
              <p className="text-3xl font-bold text-primary">{user.reputation_score.toFixed(1)}/100</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-lg font-semibold">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>

        {/* Posts */}
        <h2 className="text-lg font-semibold mb-4">Posts</h2>
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId || ""} onUpdate={() => {}} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {isOwnProfile ? "No posts yet. Create your first post!" : "This user has no posts yet."}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
