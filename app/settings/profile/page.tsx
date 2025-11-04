import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditProfileClient from "@/components/settings/edit-profile-client"

export default async function EditProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <EditProfileClient profile={profile} />
      </div>
    </div>
  )
}
