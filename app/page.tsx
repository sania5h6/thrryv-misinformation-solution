import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If logged in, redirect to feed
  if (user) {
    redirect("/feed")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Navigation */}
      <nav className="border-b sticky top-0 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">Thrryv</div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold text-balance">Quality Over Virality</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
          Thrryv is a reputation-driven social platform where your credibility matters more than likes. Share verified
          content, build your reputation, and help combat misinformation.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-lg bg-card border hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold mb-4">
            🎯
          </div>
          <h3 className="text-lg font-semibold mb-2">Reputation Scoring</h3>
          <p className="text-muted-foreground">
            Your credibility is measured by the quality and usefulness of your contributions, not vanity metrics.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-card border hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold mb-4">
            🤖
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Content Evaluation</h3>
          <p className="text-muted-foreground">
            Real-time AI analysis checks for accuracy, credibility, and misinformation risks before content spreads.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-card border hover:shadow-lg transition">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold mb-4">
            🛡️
          </div>
          <h3 className="text-lg font-semibold mb-2">Combat Misinformation</h3>
          <p className="text-muted-foreground">
            Community-driven moderation and fact-checking ensure reliable information dominates the platform.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
              1
            </div>
            <h4 className="font-semibold mb-2">Share Content</h4>
            <p className="text-sm text-muted-foreground">Post your thoughts, insights, or information</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
              2
            </div>
            <h4 className="font-semibold mb-2">AI Evaluation</h4>
            <p className="text-sm text-muted-foreground">Content is instantly evaluated for quality and credibility</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
              3
            </div>
            <h4 className="font-semibold mb-2">Build Reputation</h4>
            <p className="text-sm text-muted-foreground">Quality content boosts your credibility score</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
              4
            </div>
            <h4 className="font-semibold mb-2">Gain Visibility</h4>
            <p className="text-sm text-muted-foreground">Higher reputation gets better reach and engagement</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
          <p>Thrryv - Reputation-driven social platform for quality content</p>
          <p className="text-xs mt-2">Combating misinformation through AI-powered evaluation and community trust</p>
        </div>
      </div>
    </div>
  )
}
