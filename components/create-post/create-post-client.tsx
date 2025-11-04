"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader } from "lucide-react"

export default function CreatePostClient({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evaluationResult, setEvaluationResult] = useState<any>(null)

  const handleEvaluate = async () => {
    if (!content.trim()) {
      setError("Please enter some content")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Call API route to evaluate content with Gemini
      const response = await fetch("/api/evaluate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error("Failed to evaluate content")
      }

      const result = await response.json()
      setEvaluationResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!content.trim()) {
      setError("Please enter some content")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // If no evaluation yet, get it
      let eval_result = evaluationResult
      if (!eval_result) {
        const response = await fetch("/api/evaluate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) throw new Error("Failed to evaluate content")
        eval_result = await response.json()
      }

      // Insert post into database
      const { data, error: insertError } = await supabase.from("posts").insert({
        user_id: userId,
        content,
        quality_score: eval_result.quality_score,
        misinformation_risk: eval_result.misinformation_risk,
        credibility_score: eval_result.credibility_score,
        overall_score: eval_result.overall_score,
        ai_evaluation: eval_result,
      })

      if (insertError) throw insertError

      // Update user's post count
      const { data: userData } = await supabase.from("users").select("total_posts").eq("id", userId).single()

      if (userData) {
        await supabase
          .from("users")
          .update({ total_posts: (userData.total_posts || 0) + 1 })
          .eq("id", userId)
      }

      router.push("/feed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Create Post</h1>
        <p className="text-muted-foreground">
          Share quality content. Your post will be evaluated for credibility and usefulness.
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Your Content</label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setEvaluationResult(null)
            }}
            placeholder="Share your thoughts, insights, or information..."
            className="w-full h-40 p-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-2">{content.length} characters</p>
        </div>

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">{error}</div>}

        {/* Evaluation Result */}
        {evaluationResult && (
          <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-3">
            <h3 className="font-semibold text-foreground">AI Evaluation Results</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Quality Score</p>
                <p
                  className={`text-2xl font-bold ${
                    evaluationResult.quality_score >= 75
                      ? "text-green-600"
                      : evaluationResult.quality_score >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {evaluationResult.quality_score.toFixed(0)}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Credibility</p>
                <p
                  className={`text-2xl font-bold ${
                    evaluationResult.credibility_score >= 75
                      ? "text-green-600"
                      : evaluationResult.credibility_score >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {evaluationResult.credibility_score.toFixed(0)}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Misinformation Risk</p>
                <p
                  className={`text-2xl font-bold ${
                    evaluationResult.misinformation_risk <= 25
                      ? "text-green-600"
                      : evaluationResult.misinformation_risk <= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {evaluationResult.misinformation_risk.toFixed(0)}%
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Overall Score</p>
                <p
                  className={`text-2xl font-bold ${
                    evaluationResult.overall_score >= 75
                      ? "text-green-600"
                      : evaluationResult.overall_score >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {evaluationResult.overall_score.toFixed(0)}%
                </p>
              </div>
            </div>

            {evaluationResult.fact_checks && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold text-foreground mb-2">Fact Checks:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {evaluationResult.fact_checks.map((check: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-medium min-w-fit">{check.verdict}:</span>
                      <span>{check.claim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evaluationResult.improvements && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold text-foreground mb-2">Suggestions:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {evaluationResult.improvements.map((improvement: string, idx: number) => (
                    <li key={idx}>• {improvement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleEvaluate}
            variant="outline"
            disabled={isLoading || !content.trim()}
            className="flex-1 bg-transparent"
          >
            {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? "Evaluating..." : "Evaluate with AI"}
          </Button>

          <Button onClick={handlePublish} disabled={isLoading || !content.trim()} className="flex-1">
            {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? "Publishing..." : "Publish Post"}
          </Button>
        </div>

        <Button onClick={() => router.back()} variant="ghost" className="w-full mt-2" disabled={isLoading}>
          Cancel
        </Button>
      </Card>
    </div>
  )
}
