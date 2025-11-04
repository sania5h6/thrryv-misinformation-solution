"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createUserProfile(userId: string, username: string, email: string) {
  const cookieStore = await cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Handle errors silently
        }
      },
    },
  })

  const { error } = await supabase.from("users").upsert({
    id: userId,
    email,
    username,
    reputation_score: 0,
  })

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`)
  }

  return { success: true }
}
