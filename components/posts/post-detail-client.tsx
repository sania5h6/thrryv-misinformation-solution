"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, AlertCircle, Flag } from "lucide-react"
import Link from "next/link"

export default function PostDetailClient({ post, currentUserId }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [isLiked, setIsLiked] = useState(post.post_likes.some((like: any) => like.user_id === currentUserId))
  const [likesCount, setLikesCount] = useState(post.post_likes.length)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState("")

  const handleLike = async () => {
    if (!currentUserId) {
      router.push("/auth/login")
      return
    }

    try {
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId)
        setIsLiked(false)
        setLikesCount((c) => c - 1)
      } else {
        await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        })
        setIsLiked(true)
        setLikesCount((c) => c + 1)
      }
    } catch (error) {
      console.error("Error updating like:", error)
    }
  }

  const handleReply = async () => {
    if (!currentUserId) {
      router.push("/auth/login")
      return
    }

    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("post_replies").insert({
        post_id: post.id,
        user_id: currentUserId,
        content: replyContent,
        quality_score: 50,
      })

      if (error) throw error

      setReplyContent("")
      router.refresh()
    } catch (error) {
      console.error("Error creating reply:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFlag = async () => {
    if (!currentUserId) {
      router.push("/auth/login")
      return
    }

    if (!flagReason.trim()) return

    try {
      const { error } = await fetch("/api/flag-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          reason: flagReason,
        }),
      })

      setShowFlagModal(false)
      setFlagReason("")
      alert("Thank you for reporting this content")
    } catch (error) {
      console.error("Error flagging content:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Post */}
      <Card className="p-6">
        <Link href={`/profile/${post.users.id}`} className="block mb-4 hover:opacity-80 transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {post.users.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{post.users.username}</p>
              <p className="text-xs text-muted-foreground">Reputation: {post.users.reputation_score.toFixed(1)}</p>
            </div>
          </div>
        </Link>

        <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>

        {/* Score Indicators */}
        <div className="grid grid-cols-3 gap-3 mb-4 bg-muted/50 p-3 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Quality</p>
            <p className="font-bold">{post.quality_score.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Overall</p>
            <p className="font-bold">{post.overall_score.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Misinformation</p>
            <p className="font-bold text-destructive">{post.misinformation_risk.toFixed(0)}%</p>
          </div>
        </div>

        {post.is_flagged && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded flex items-center gap-2 border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-700 dark:text-yellow-400">This post is flagged for review</span>
          </div>
        )}

        <div className="flex items-center gap-2 border-t pt-3 mt-4">
          <Button variant="ghost" size="sm" onClick={handleLike} className={isLiked ? "text-red-600" : ""}>
            <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
            {likesCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowFlagModal(true)}>
            <Flag className="w-4 h-4 mr-1" />
            Report
          </Button>
        </div>
      </Card>

      {/* Flag Modal */}
      {showFlagModal && (
        <Card className="p-6 border-destructive">
          <h3 className="font-semibold mb-3">Report this post</h3>
          <textarea
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Why are you reporting this post?"
            className="w-full h-20 p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground mb-3"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleFlag}
              disabled={!flagReason.trim()}
              className="bg-destructive hover:bg-destructive/90 flex-1"
            >
              Submit Report
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowFlagModal(false)
                setFlagReason("")
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Replies */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Replies ({post.post_replies.length})</h3>

        {/* Reply Form */}
        {currentUserId && (
          <div className="mb-6 pb-6 border-b">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full h-20 p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground mb-2"
            />
            <Button onClick={handleReply} disabled={!replyContent.trim() || isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Reply"}
            </Button>
          </div>
        )}

        {/* Replies List */}
        <div className="space-y-4">
          {post.post_replies.length > 0 ? (
            post.post_replies.map((reply: any) => (
              <div key={reply.id} className="pb-4 border-b last:border-b-0">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {reply.users.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{reply.users.username}</p>
                    <p className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-foreground text-sm">{reply.content}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No replies yet. Be the first!</p>
          )}
        </div>
      </Card>
    </div>
  )
}
