"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function FeedHeader({
  sortBy,
  onSortChange,
}: {
  sortBy: "score" | "latest"
  onSortChange: (sort: "score" | "latest") => void
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="sticky top-0 bg-background/95 backdrop-blur z-50 border-b">
      <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-primary">Thrryv Feed</h1>
          <p className="text-sm text-muted-foreground">Quality-driven content</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button
              variant={sortBy === "score" ? "default" : "outline"}
              size="sm"
              onClick={() => onSortChange("score")}
            >
              Top Quality
            </Button>
            <Button
              variant={sortBy === "latest" ? "default" : "outline"}
              size="sm"
              onClick={() => onSortChange("latest")}
            >
              Latest
            </Button>
          </div>

          <div className="border-l pl-2 ml-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/create-post")} className="mr-2">
              + Post
            </Button>

            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
