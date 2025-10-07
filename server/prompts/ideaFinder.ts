export const IDEA_FINDER_PROMPT = `Task: Generate 5 profitable digital product niche ideas based on user's interests, constraints, and target audience.

Input Format:
- User interests/experience: {interests}
- Available time: {timeAvailable}
- Target audience (B2B/B2C): {audienceType}
- Experience level: {experienceLevel}

Output Requirements:
Return a JSON object with exactly 5 niche ideas. Each idea MUST include:

{
  "ideas": [
    {
      "title": "Clear, specific niche title (e.g., 'Email Marketing for Real Estate Agents')",
      "why": "2-3 sentences explaining why this niche is profitable and achievable",
      "icp": "Ideal Customer Profile - who buys this? (be specific: age, job, pain points)",
      "painPoints": ["3-5 specific pain points this niche solves"],
      "proofKeywords": ["5-7 search keywords to validate demand on Google/Amazon"],
      "revenuePotential": "Realistic annual revenue potential (€10k-€100k+ range)",
      "difficulty": "Easy/Medium/Hard - for beginners",
      "timeToMarket": "Realistic time to create first product (days/weeks)"
    }
  ],
  "nextSteps": ["3 immediate actions user should take to validate these ideas"]
}

Quality Standards:
1. Ideas must be SPECIFIC (not "fitness" but "kettlebell workouts for busy dads")
2. Focus on niches with proven buyers (not just passion projects)
3. Match user's constraints (time, experience level)
4. Include validation metrics (search volume indicators)
5. Prioritize low-competition, high-demand niches
6. Ensure beginners can realistically succeed

Remember: Users need confidence. Show them niches where REAL people are making REAL money.`;
