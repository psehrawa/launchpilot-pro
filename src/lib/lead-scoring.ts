// Lead Scoring System
// Scores leads from 0-100 based on multiple factors

export interface LeadScoreFactors {
  // Email quality
  hasEmail: boolean;
  emailVerified: boolean;
  
  // Engagement
  hasReplied: boolean;
  hasOpened: boolean;
  hasClicked: boolean;
  
  // Profile quality
  hasCompany: boolean;
  hasTitle: boolean;
  hasLinkedIn: boolean;
  hasTwitter: boolean;
  
  // Social proof
  followers?: number;
  karma?: number;
  repos?: number;
  
  // Source quality
  source: string;
  
  // Recency
  daysSinceAdded: number;
  daysSinceContacted?: number;
}

export interface LeadScore {
  total: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: {
    category: string;
    score: number;
    maxScore: number;
    details: string;
  }[];
}

export function calculateLeadScore(factors: LeadScoreFactors): LeadScore {
  const breakdown: LeadScore["breakdown"] = [];
  let total = 0;

  // Email Quality (max 25 points)
  let emailScore = 0;
  if (factors.hasEmail) emailScore += 15;
  if (factors.emailVerified) emailScore += 10;
  breakdown.push({
    category: "Email Quality",
    score: emailScore,
    maxScore: 25,
    details: factors.hasEmail 
      ? (factors.emailVerified ? "Verified email" : "Has email, unverified")
      : "No email",
  });
  total += emailScore;

  // Engagement (max 30 points)
  let engagementScore = 0;
  if (factors.hasReplied) engagementScore += 20;
  else if (factors.hasClicked) engagementScore += 10;
  else if (factors.hasOpened) engagementScore += 5;
  breakdown.push({
    category: "Engagement",
    score: engagementScore,
    maxScore: 30,
    details: factors.hasReplied 
      ? "Has replied" 
      : factors.hasClicked 
        ? "Clicked link" 
        : factors.hasOpened 
          ? "Opened email" 
          : "No engagement yet",
  });
  total += engagementScore;

  // Profile Completeness (max 20 points)
  let profileScore = 0;
  if (factors.hasCompany) profileScore += 5;
  if (factors.hasTitle) profileScore += 5;
  if (factors.hasLinkedIn) profileScore += 5;
  if (factors.hasTwitter) profileScore += 5;
  breakdown.push({
    category: "Profile",
    score: profileScore,
    maxScore: 20,
    details: `${[
      factors.hasCompany && "Company",
      factors.hasTitle && "Title",
      factors.hasLinkedIn && "LinkedIn",
      factors.hasTwitter && "Twitter",
    ].filter(Boolean).join(", ") || "Incomplete"}`,
  });
  total += profileScore;

  // Social Proof (max 15 points)
  let socialScore = 0;
  if (factors.followers) {
    if (factors.followers > 10000) socialScore += 15;
    else if (factors.followers > 1000) socialScore += 10;
    else if (factors.followers > 100) socialScore += 5;
  }
  if (factors.karma) {
    if (factors.karma > 10000) socialScore += 10;
    else if (factors.karma > 1000) socialScore += 5;
  }
  socialScore = Math.min(socialScore, 15);
  breakdown.push({
    category: "Social Proof",
    score: socialScore,
    maxScore: 15,
    details: factors.followers 
      ? `${factors.followers.toLocaleString()} followers` 
      : factors.karma 
        ? `${factors.karma.toLocaleString()} karma`
        : "Unknown",
  });
  total += socialScore;

  // Source Quality (max 10 points)
  const sourceScores: Record<string, number> = {
    "referral": 10,
    "warm": 10,
    "linkedin": 8,
    "hunter": 7,
    "github": 6,
    "twitter": 5,
    "producthunt": 5,
    "hackernews": 5,
    "reddit": 4,
    "cold": 3,
  };
  const sourceScore = sourceScores[factors.source] || 3;
  breakdown.push({
    category: "Source",
    score: sourceScore,
    maxScore: 10,
    details: factors.source,
  });
  total += sourceScore;

  // Calculate grade
  let grade: LeadScore["grade"];
  if (total >= 80) grade = "A";
  else if (total >= 60) grade = "B";
  else if (total >= 40) grade = "C";
  else if (total >= 20) grade = "D";
  else grade = "F";

  return { total, grade, breakdown };
}

export function getScoreColor(grade: LeadScore["grade"]): string {
  switch (grade) {
    case "A": return "text-green-600 bg-green-50";
    case "B": return "text-blue-600 bg-blue-50";
    case "C": return "text-yellow-600 bg-yellow-50";
    case "D": return "text-orange-600 bg-orange-50";
    case "F": return "text-red-600 bg-red-50";
  }
}
