"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      console.log("[v0] Attempting password reset for email:", email)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password`,
      })

      if (error) {
        console.log("[v0] Reset error:", error)
        throw error
      }

      console.log("[v0] Password reset email sent successfully")
      setEmailSent(true)
      setMessage({
        type: "success",
        text: "Check your email for a password reset link. It may take a few minutes to arrive.",
      })
      setEmail("")
    } catch (err) {
      console.log("[v0] Catch error:", err)
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to send reset email. Make sure the email exists.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Thrryv</h1>
            <p className="text-muted-foreground">Reset your password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || emailSent}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.type === "success" ? "bg-green-50 text-green-800" : "bg-destructive/10 text-destructive"
                }`}
              >
                {message.text}
              </div>
            )}

            {!emailSent && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            )}

            {emailSent && (
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setEmailSent(false)}
              >
                Send another email
              </Button>
            )}
          </form>

          {emailSent && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm text-blue-800">
              <p className="font-medium mb-2">Didn't receive the email?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your spam/junk folder</li>
                <li>Wait a few minutes for delivery</li>
                <li>Make sure you entered the correct email</li>
              </ul>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
