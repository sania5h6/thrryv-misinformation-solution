import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // TODO: In production, verify admin status from a table
  // For now, only allow specific user IDs or add admin flag to users table

  // Fetch pending moderation flags
  const { data: flags } = await supabase
    .from("moderation_flags")
    .select(`
      *,
      posts:post_id (id, content, overall_score, misinformation_risk, user_id),
      users:user_id (username)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch platform statistics
  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: 0 })

  const { count: totalPosts } = await supabase.from("posts").select("*", { count: "exact", head: 0 })

  const { count: flaggedPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: 0 })
    .eq("is_flagged", true)

  const { count: pendingFlags } = await supabase
    .from("moderation_flags")
    .select("*", { count: "exact", head: 0 })
    .eq("status", "pending")

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard
        flags={flags || []}
        stats={{
          totalUsers: totalUsers || 0,
          totalPosts: totalPosts || 0,
          flaggedPosts: flaggedPosts || 0,
          pendingFlags: pendingFlags || 0,
        }}
      />
    </div>
  )
}
