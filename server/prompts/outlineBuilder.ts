export const OUTLINE_BUILDER_PROMPT = {
  plus: `Task: Create a CONCISE product outline for {productType} on {topic} for {audienceLevel} audience.

PLUS TIER REQUIREMENTS:
- Focus on clarity and actionability
- Provide essential structure without overwhelming detail
- Include clear learning outcomes
- Give next 3 concrete actions

Output JSON Format:
{
  "outline": {
    "productType": "{productType}",
    "topic": "{topic}",
    "audienceLevel": "{audienceLevel}",
    "modules": [
      {
        "number": 1,
        "title": "Module title",
        "learningOutcomes": ["What students will achieve"],
        "chapters": [
          {
            "number": 1,
            "title": "Chapter title",
            "keyPoints": ["2-3 key takeaways"]
          }
        ]
      }
    ],
    "assetsToInclude": ["Checklists", "Templates", "Worksheets to create"],
    "buildPlan30": "What to build in 30 minutes",
    "buildPlan60": "What to build in 60 minutes",
    "buildPlan90": "What to build in 90 minutes"
  },
  "nextSteps": ["3 immediate actions to start building this product"]
}

Guidelines:
- 3-5 modules maximum for Plus tier
- 2-4 chapters per module
- Focus on MVP (Minimum Viable Product)
- Prioritize speed to market
- Include quick-win elements`,

  pro: `Task: Create a COMPREHENSIVE product outline for {productType} on {topic} for {audienceLevel} audience.

PRO TIER REQUIREMENTS:
- Deep, detailed structure with execution roadmap
- Include advanced monetization strategies
- Provide step-by-step implementation plan
- Add success metrics and validation checkpoints

Output JSON Format:
{
  "outline": {
    "productType": "{productType}",
    "topic": "{topic}",
    "audienceLevel": "{audienceLevel}",
    "executiveSummary": "2-3 sentences on positioning and unique angle",
    "modules": [
      {
        "number": 1,
        "title": "Module title",
        "learningOutcomes": ["Detailed learning outcomes with metrics"],
        "duration": "Recommended time to complete",
        "chapters": [
          {
            "number": 1,
            "title": "Chapter title",
            "keyPoints": ["4-6 detailed key points"],
            "exercises": ["Practical exercises to reinforce learning"],
            "deliverables": ["What student creates in this chapter"]
          }
        ],
        "milestoneCheckpoint": "Validation checkpoint for this module"
      }
    ],
    "assetsToInclude": {
      "checklists": ["Specific checklists to create"],
      "templates": ["Ready-to-use templates"],
      "worksheets": ["Interactive worksheets"],
      "bonuses": ["High-value bonus materials"]
    },
    "executionPlan": {
      "week1": "Detailed tasks for week 1",
      "week2": "Detailed tasks for week 2",
      "week3": "Detailed tasks for week 3",
      "week4": "Detailed tasks for week 4"
    },
    "successMetrics": {
      "completionRate": "Target completion rate (%)",
      "timeToComplete": "Average time to finish",
      "skillLevel": "Expected skill level after completion",
      "revenueGoal": "Revenue potential with this product"
    }
  },
  "launchStrategy": {
    "pricing": "Recommended pricing tier (€47-€497)",
    "positioning": "How to position in market",
    "differentiators": ["What makes this unique"]
  },
  "nextSteps": ["5-7 detailed implementation steps with timeframes"]
}

Guidelines:
- 5-10 modules for comprehensive coverage
- 3-6 chapters per module with depth
- Include advanced monetization hooks
- Add upsell/cross-sell opportunities
- Focus on €100k+ revenue potential
- Include metrics at every stage`
};
