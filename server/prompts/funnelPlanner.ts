export const FUNNEL_PLANNER_PROMPT = {
  plus: `Task: Create a BASIC funnel and 5-day launch plan for {productType} in {niche}.

PLUS TIER OUTPUT:
Simple, effective one-page funnel + quick launch strategy.

JSON Format:
{
  "funnel": {
    "type": "One-page funnel with opt-in + pitch",
    "leadMagnet": {
      "title": "Irresistible free offer title",
      "description": "What they get and why they want it",
      "deliveryMethod": "PDF/Video/Checklist/etc."
    },
    "optInCopy": {
      "headline": "Attention-grabbing headline",
      "subheadline": "Supporting promise",
      "bullets": ["3-5 benefit bullets"],
      "cta": "Call-to-action button text"
    },
    "pitchSequence": {
      "email1": "Immediate delivery + welcome",
      "email2": "Value + soft pitch",
      "email3": "Direct offer"
    }
  },
  "launchPlan5Day": {
    "day1": {
      "tasks": ["Specific tasks for day 1"],
      "deliverables": ["What to complete"],
      "timeRequired": "X hours"
    },
    "day2": { "tasks": [], "deliverables": [], "timeRequired": "" },
    "day3": { "tasks": [], "deliverables": [], "timeRequired": "" },
    "day4": { "tasks": [], "deliverables": [], "timeRequired": "" },
    "day5": { "tasks": [], "deliverables": [], "timeRequired": "" }
  },
  "quickWins": ["3 things to do first for fastest results"],
  "nextSteps": ["3 immediate actions to start building this funnel"]
}

Guidelines:
- Keep it simple and achievable
- Focus on one lead magnet + one product
- Email sequence: 3 emails maximum
- Launch in 5 days (realistic for beginners)
- Prioritize speed over perfection`,

  pro: `Task: Create ADVANCED funnel copy and 10-day launch plan with full automation for {productType} in {niche}.

PRO TIER OUTPUT:
Complete funnel ecosystem with all copy + comprehensive launch strategy.

JSON Format:
{
  "fullFunnelCopy": {
    "optInPage": {
      "headline": "Compelling, curiosity-driven headline",
      "subheadline": "Promise + social proof",
      "bullets": ["5-7 irresistible benefits"],
      "formCTA": "Button text",
      "exitPopup": "Last-chance offer for abandoners"
    },
    "salesPage": {
      "hero": {
        "headline": "Big promise headline",
        "subheadline": "Supporting statement",
        "cta": "Primary CTA"
      },
      "problemAgitation": "Deep dive into pain points (3-4 paragraphs)",
      "solution": "How your product solves it (2-3 paragraphs)",
      "offerStack": {
        "coreProduct": "Main product description",
        "bonuses": ["Bonus 1", "Bonus 2", "Bonus 3+"],
        "totalValue": "€X value calculation"
      },
      "priceAnchoring": "Price reveal with justification",
      "guarantee": "Risk reversal copy",
      "urgency": "Legitimate scarcity element",
      "faqs": [
        { "q": "Common objection", "a": "Reassuring answer" }
      ],
      "closingCTA": "Final push to buy"
    },
    "checkoutPage": {
      "bullets": ["Last-minute reinforcement points"],
      "trustSignals": ["Guarantees, testimonials, security"],
      "orderBump": {
        "title": "Complementary offer",
        "price": "€X (small)",
        "benefit": "Why add this now"
      }
    },
    "upsellPage": {
      "headline": "One-time offer headline",
      "offer": "What they're getting",
      "price": "€X (special price)",
      "timer": "Countdown element",
      "cta": "Accept this offer"
    },
    "downsellPage": {
      "headline": "Lower-priced alternative",
      "offer": "Stripped-down version",
      "price": "€X",
      "cta": "Get this instead"
    }
  },
  "emailSequenceLaunch": {
    "sequence": [
      {
        "day": 1,
        "subject": "Compelling subject line",
        "preview": "Preview text",
        "body": "Full email copy",
        "cta": "Call-to-action",
        "goal": "What this email achieves"
      }
    ]
  },
  "launchPlan10Day": {
    "day1": {
      "focus": "Main objective",
      "tasks": ["Detailed tasks"],
      "deliverables": ["What to complete"],
      "timeRequired": "X hours",
      "successCriteria": "How you know it's done"
    }
  },
  "automationSequence": {
    "postPurchase": ["Email 1", "Email 2", "Email 3"],
    "abandonedCart": ["Recovery email 1", "Recovery email 2"],
    "nurture": ["Ongoing value emails"]
  },
  "trafficStrategy": {
    "organic": ["SEO", "Content marketing", "Social media"],
    "paid": ["Facebook ads", "Google ads", "YouTube"],
    "partnerships": ["Affiliate", "JV", "Guest posting"],
    "timeline": "When to implement each channel"
  },
  "revenueGoals": {
    "launch": "€X (launch week)",
    "month1": "€X",
    "quarter1": "€X (on track for €100k+)"
  },
  "nextSteps": ["7-10 detailed implementation steps with deadlines"]
}

Guidelines:
- Complete copy for every funnel page
- 10-day launch plan with daily objectives
- Include upsell/downsell strategies
- Full email sequence (10+ emails)
- Add traffic and scaling strategies
- Focus on €100k+ revenue goals
- Include automation recommendations
- Optimize for conversion at every step`
};


