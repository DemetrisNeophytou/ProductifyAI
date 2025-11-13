export const CONTENT_WRITER_PROMPT = {
  plus: `Task: Generate high-quality content for {contentType} in {niche} for {audienceLevel} audience.

Content Types: chapter_draft, checklist, worksheet, script, email_sequence

PLUS TIER OUTPUT:
Focus on clarity, actionability, and quick implementation.

JSON Format:
{
  "content": {
    "type": "{contentType}",
    "title": "Clear, engaging title",
    "markdown": "Full content in markdown format",
    "wordCount": number,
    "readTime": "X minutes"
  },
  "usageTips": ["3-4 tips for using this content effectively"],
  "nextSteps": ["2-3 actions to take after using this content"]
}

Quality Standards:
- Clear, beginner-friendly language
- Actionable steps with examples
- Scannable formatting (bullets, numbers, headers)
- Include specific metrics and benchmarks
- Add practical exercises where relevant

Content Guidelines:
- Chapters: 800-1200 words, with clear structure
- Checklists: 10-20 items, grouped logically
- Worksheets: Interactive with fill-in sections
- Scripts: Word-for-word with timing cues
- Emails: 150-300 words, single CTA`,

  pro: `Task: Generate COMPREHENSIVE multi-format content pack for {niche} targeting {audienceLevel} audience.

PRO TIER OUTPUT:
Deep, detailed content with multiple formats and advanced strategies.

JSON Format:
{
  "mainContent": {
    "type": "{contentType}",
    "title": "Compelling, SEO-optimized title",
    "markdown": "Comprehensive content in markdown",
    "wordCount": number,
    "readTime": "X minutes",
    "sections": [
      {
        "heading": "Section title",
        "keyTakeaways": ["Main points"],
        "examples": ["Real-world examples"],
        "exercises": ["Practice activities"]
      }
    ]
  },
  "multiFormatPack": {
    "emailSequence": [
      {
        "day": 1,
        "subject": "Compelling subject line",
        "body": "Email content with clear CTA",
        "cta": "Specific call-to-action"
      }
    ],
    "socialPosts": {
      "twitter": ["3-5 tweet-sized snippets"],
      "linkedin": ["2-3 LinkedIn posts"],
      "instagram": ["2-3 caption + hashtag combinations"]
    },
    "salesBullets": ["10-15 benefit-driven bullets for sales page"],
    "faqs": [
      {
        "question": "Common question",
        "answer": "Clear, reassuring answer"
      }
    ]
  },
  "advancedElements": {
    "caseStudies": ["2-3 success story frameworks"],
    "bonusContent": ["High-value bonus ideas"],
    "upsellHooks": ["Natural upgrade opportunities"]
  },
  "implementationPlan": {
    "immediate": ["Do this today"],
    "thisWeek": ["Complete this week"],
    "thisMonth": ["Achieve this month"]
  },
  "successMetrics": {
    "engagementKPIs": ["What to track"],
    "revenueTargets": ["Revenue expectations"],
    "completionGoals": ["User completion targets"]
  }
}

Quality Standards:
- Advanced depth with strategic insights
- Multiple formats for different channels
- Revenue-focused positioning
- Include psychological triggers
- Add scarcity/urgency elements
- Optimize for €100k+ revenue goals

Content Guidelines:
- Chapters: 1500-2500 words, deep analysis
- Email Sequences: 5-10 emails, nurture-focused
- Social Posts: Platform-optimized, engagement-driven
- Sales Copy: Conversion-optimized with proof`
};


