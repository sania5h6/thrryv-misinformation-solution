"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import PostCard from "./post-card"
import FeedHeader from "./feed-header"
import type { RealtimeChannel } from "@supabase/supabase-js"

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

export default function FeedClient({
  initialPosts,
  currentUserId,
}: {
  initialPosts: Post[]
  currentUserId: string
}) {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<"score" | "latest">("score")

  useEffect(() => {
    // Subscribe to real-time updates
    const channel: RealtimeChannel = supabase
      .channel("posts_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newPost = payload.new as Post
          setPosts((current) => [newPost, ...current])
        } else if (payload.eventType === "UPDATE") {
          const updatedPost = payload.new as Post
          setPosts((current) => current.map((p) => (p.id === updatedPost.id ? updatedPost : p)))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "score") {
      return b.overall_score - a.overall_score
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="max-w-2xl mx-auto p-4">
      <FeedHeader sortBy={sortBy} onSortChange={setSortBy} />
      <div className="space-y-4 mt-6">
        {sortedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onUpdate={(updatedPost) => {
              setPosts((current) => current.map((p) => (p.id === updatedPost.id ? updatedPost : p)))
            }}
          />
        ))}
      </div>
    </div>
  )
}
