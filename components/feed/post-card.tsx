"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface PostCardProps {
  post: {
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
  currentUserId: string
  onUpdate: (post: any) => void
}

export default function PostCard({ post, currentUserId, onUpdate }: PostCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLiked, setIsLiked] = useState(post.post_likes.some((like) => like.id === currentUserId))
  const [likesCount, setLikesCount] = useState(post.post_likes.length)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async () => {
    setIsLoading(true)
    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId)

        if (error) throw error
        setIsLiked(false)
        setLikesCount((c) => c - 1)
      } else {
        // Add like
        const { error } = await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        })

        if (error) throw error
        setIsLiked(true)
        setLikesCount((c) => c + 1)
      }
    } catch (error) {
      console.error("Error updating like:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getRiskColor = (risk: number) => {
    if (risk <= 25) return "text-green-600"
    if (risk <= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Link href={`/profile/${post.user_id}`} className="flex-1">
            <div className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {post.users.avatar_url ? (
                  <img
                    src={post.users.avatar_url || "/placeholder.svg"}
                    alt={post.users.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-bold">{post.users.username[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{post.users.username}</p>
                <p className="text-xs text-muted-foreground">Reputation: {post.users.reputation_score.toFixed(1)}</p>
              </div>
            </div>
          </Link>
          <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
        </div>

        {/* Content */}
        <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

        {/* Quality Indicators */}
        <div className="grid grid-cols-3 gap-3 mb-4 bg-muted/50 p-3 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Quality Score</p>
            <p className={`text-lg font-bold ${getScoreColor(post.quality_score)}`}>{post.quality_score.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Overall</p>
            <p className={`text-lg font-bold ${getScoreColor(post.overall_score)}`}>{post.overall_score.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Misinformation Risk</p>
            <p className={`text-lg font-bold ${getRiskColor(post.misinformation_risk)}`}>
              {post.misinformation_risk.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Flags */}
        {post.is_flagged && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700 dark:text-yellow-400">Flagged for review</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLoading}
            className={isLiked ? "text-red-600" : ""}
          >
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
            {likesCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push(`/post/${post.id}`)}>
            <MessageCircle className="w-4 h-4 mr-1" />
            {post.post_replies.length}
          </Button>
        </div>
      </div>
    </Card>
  )
}
