"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Trash2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface ModerationFlag {
  id: string
  post_id: string
  user_id: string
  reason: string
  status: string
  admin_notes: string | null
  created_at: string
  posts: {
    id: string
    content: string
    overall_score: number
    misinformation_risk: number
    user_id: string
  }
  users: {
    username: string
  }
}

export default function AdminDashboard({
  flags,
  stats,
}: {
  flags: ModerationFlag[]
  stats: {
    totalUsers: number
    totalPosts: number
    flaggedPosts: number
    pendingFlags: number
  }
}) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedFlag, setSelectedFlag] = useState<ModerationFlag | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  const handleApproveFlag = async (flagId: string, postId: string) => {
    setProcessingId(flagId)
    try {
      // Mark flag as approved
      const { error: flagError } = await supabase
        .from("moderation_flags")
        .update({ status: "approved", admin_notes: notes })
        .eq("id", flagId)

      if (flagError) throw flagError

      // Remove the post
      const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId)

      if (deleteError) throw deleteError

      router.refresh()
    } catch (error) {
      console.error("Error approving flag:", error)
    } finally {
      setProcessingId(null)
      setSelectedFlag(null)
      setNotes("")
    }
  }

  const handleRejectFlag = async (flagId: string) => {
    setProcessingId(flagId)
    try {
      const { error } = await supabase
        .from("moderation_flags")
        .update({ status: "rejected", admin_notes: notes })
        .eq("id", flagId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error rejecting flag:", error)
    } finally {
      setProcessingId(null)
      setSelectedFlag(null)
      setNotes("")
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor content and manage moderation flags</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-muted-foreground text-sm mb-1">Total Users</div>
          <div className="text-3xl font-bold text-primary">{stats.totalUsers}</div>
        </Card>
        <Card className="p-6">
          <div className="text-muted-foreground text-sm mb-1">Total Posts</div>
          <div className="text-3xl font-bold text-primary">{stats.totalPosts}</div>
        </Card>
        <Card className="p-6">
          <div className="text-muted-foreground text-sm mb-1">Flagged Posts</div>
          <div className="text-3xl font-bold text-destructive">{stats.flaggedPosts}</div>
        </Card>
        <Card className="p-6">
          <div className="text-muted-foreground text-sm mb-1">Pending Review</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pendingFlags}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flags List */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Pending Flags ({flags.length})
            </h2>

            {flags.length > 0 ? (
              <div className="space-y-3">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    onClick={() => {
                      setSelectedFlag(flag)
                      setNotes("")
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition ${
                      selectedFlag?.id === flag.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{flag.posts.content.substring(0, 100)}...</p>
                        <p className="text-sm text-muted-foreground">
                          By @{flag.posts.user_id} | Flagged by {flag.users.username}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-yellow-600">{flag.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(flag.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Score: {flag.posts.overall_score.toFixed(0)}%
                      </span>
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                        Misinformation: {flag.posts.misinformation_risk.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending flags. Great work!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Detail Panel */}
        {selectedFlag && (
          <Card className="p-6 h-fit sticky top-6">
            <h3 className="font-semibold mb-4">Review Details</h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Post Content</p>
                <p className="text-sm text-foreground bg-muted p-3 rounded">{selectedFlag.posts.content}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Flag Reason</p>
                <p className="text-sm text-foreground bg-muted p-3 rounded">{selectedFlag.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Quality Score</p>
                  <p className="text-lg font-bold text-primary">{selectedFlag.posts.overall_score.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Misinformation Risk</p>
                  <p className="text-lg font-bold text-destructive">
                    {selectedFlag.posts.misinformation_risk.toFixed(0)}%
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this decision..."
                  className="w-full h-20 p-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handleApproveFlag(selectedFlag.id, selectedFlag.post_id)}
                disabled={processingId === selectedFlag.id}
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Post
              </Button>
              <Button
                onClick={() => handleRejectFlag(selectedFlag.id)}
                disabled={processingId === selectedFlag.id}
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Reject Flag
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href={`/profile/${selectedFlag.posts.user_id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Profile
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
