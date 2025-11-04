/**
 * Trigger reputation update for a user
 * Call this after significant user actions
 */
export async function updateUserReputation(userId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/calculate-reputation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      },
    )

    if (!response.ok) {
      console.error("Failed to update reputation:", await response.text())
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Reputation update error:", error)
    return null
  }
}

/**
 * Get user reputation tier based on score
 */
export function getReputationTier(score: number): {
  tier: string
  color: string
  description: string
} {
  if (score >= 85) {
    return {
      tier: "Trusted Authority",
      color: "text-green-600",
      description: "Consistently high-quality contributor",
    }
  }
  if (score >= 70) {
    return {
      tier: "Reliable",
      color: "text-blue-600",
      description: "Generally trustworthy content",
    }
  }
  if (score >= 50) {
    return {
      tier: "Participant",
      color: "text-yellow-600",
      description: "Moderate quality contributions",
    }
  }
  return {
    tier: "New Member",
    color: "text-gray-600",
    description: "Build reputation through quality posts",
  }
}
