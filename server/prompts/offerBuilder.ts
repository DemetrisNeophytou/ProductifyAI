export const OFFER_BUILDER_PROMPT = `Task: Create a monetization strategy and offer structure for {productType} in {niche} targeting {audienceLevel} customers.

Output JSON Format:
{
  "priceAnchoring": {
    "lowTicket": {
      "price": "€17-€47",
      "positioning": "Entry-level offer",
      "valueJustification": "Why this price makes sense",
      "targetVolume": "Sales needed for €X revenue"
    },
    "midTicket": {
      "price": "€97-€297",
      "positioning": "Core offer",
      "valueJustification": "Perceived value explanation",
      "targetVolume": "Sales needed for €X revenue"
    },
    "highTicket": {
      "price": "€497-€997",
      "positioning": "Premium/coaching offer",
      "valueJustification": "Premium positioning",
      "targetVolume": "Sales needed for €X revenue"
    },
    "recommended": "Which tier to start with and why"
  },
  "offerStructure": {
    "problem": "Clear articulation of the problem you solve",
    "promise": "Specific, measurable outcome",
    "proof": ["Evidence this works: testimonials, case studies, data"],
    "price": "Recommended starting price with justification",
    "bonuses": [
      {
        "title": "Bonus title",
        "value": "Perceived value (€X)",
        "description": "What it is and why it matters"
      }
    ],
    "guarantee": "Risk reversal strategy (money-back, results guarantee, etc.)",
    "urgency": "Legitimate scarcity or urgency element"
  },
  "pricingPsychology": {
    "valueStack": "Total perceived value calculation",
    "discountStrategy": "When/how to discount (if at all)",
    "pricePresentation": "How to present the price for maximum conversions",
    "comparisonPoints": ["What to compare against (coffee, gym membership, etc.)"]
  },
  "bonusRecommendations": [
    {
      "title": "High-value bonus idea",
      "type": "Template/Checklist/Video/etc.",
      "creationTime": "Time to create",
      "perceivedValue": "€X value",
      "why": "Why this bonus sells"
    }
  ],
  "revenueProjections": {
    "month1": "€X (conservative estimate)",
    "month3": "€X (with optimization)",
    "month6": "€X (with growth)",
    "yearOne": "€X (€100k goal progress)"
  },
  "nextSteps": ["3-5 concrete actions to implement this offer"]
}

Quality Standards:
1. Prices must be based on market research, not guesses
2. Value justification must be compelling and specific
3. Bonuses should enhance core offer, not dilute it
4. Guarantee must be clear and confidence-inspiring
5. Revenue projections must be realistic
6. Focus on €100k+ annual revenue pathway

Guidelines:
- Research competitive pricing in the niche
- Stack value to justify price
- Create irresistible bonus packages
- Use proven psychological triggers
- Build in natural upsell paths
- Include launch vs evergreen strategies`;
