import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: Request) {
  try {
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return Response.json({ error: "Content is required" }, { status: 400 })
    }

    // Evaluate content using Gemini
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      system: `You are an AI content evaluator for Thrryv, a reputation-driven social platform. 
Evaluate content for:
1. Quality Score (0-100): How useful, insightful, and well-articulated is the content?
2. Credibility Score (0-100): How credible and trustworthy is the information?
3. Misinformation Risk (0-100): What is the likelihood this contains misinformation?
4. Overall Score (0-100): Combined assessment of quality and credibility.

Also:
- Identify any claims that need fact-checking
- Suggest improvements
- Determine if content should be flagged

Respond in valid JSON format ONLY with no additional text:
{
  "quality_score": number,
  "credibility_score": number,
  "misinformation_risk": number,
  "overall_score": number,
  "fact_checks": [{"claim": string, "verdict": string, "confidence": number}],
  "improvements": [string],
  "should_flag": boolean,
  "flag_reason": string | null
}`,
      prompt: `Evaluate this content: "${content}"`,
      temperature: 0.3,
    })

    // Parse the response
    let evaluation
    try {
      evaluation = JSON.parse(text)
    } catch {
      return Response.json({ error: "Failed to parse AI evaluation" }, { status: 500 })
    }

    // Ensure scores are within valid ranges
    evaluation.quality_score = Math.min(100, Math.max(0, evaluation.quality_score))
    evaluation.credibility_score = Math.min(100, Math.max(0, evaluation.credibility_score))
    evaluation.misinformation_risk = Math.min(100, Math.max(0, evaluation.misinformation_risk))
    evaluation.overall_score = Math.min(100, Math.max(0, evaluation.overall_score))

    return Response.json(evaluation)
  } catch (error) {
    console.error("Evaluation error:", error)
    return Response.json({ error: "Failed to evaluate content" }, { status: 500 })
  }
}
