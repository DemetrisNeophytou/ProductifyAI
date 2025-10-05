# What this is

Color accessibility ensures your digital products are readable and usable for people with color vision deficiencies (color blindness) and visual impairments.

# When to use

- **Brand kit design**: Choose accessible color combinations
- **Document creation**: eBooks, workbooks, presentations
- **Web design**: Landing pages, checkout pages
- **Charts/graphs**: Data visualization for analytics

# 5-step build recipe

1. **Test contrast ratio**: Aim for 4.5:1 minimum (WCAG AA standard)
2. **Avoid problematic pairs**: Red/green, blue/purple for color blind users
3. **Use patterns/icons**: Don't rely on color alone to convey meaning
4. **Test with tools**: WebAIM Contrast Checker, Colorblind simulator
5. **Provide alternatives**: Text labels, high-contrast mode

# Outline template

```
Primary color: [Main brand color]
Text color (dark mode): [Light text on dark background]
Text color (light mode): [Dark text on light background]
Accent color: [Buttons, links, highlights]
Contrast ratio: [4.5:1 minimum]
```

# Contrast ratios (WCAG standards)

- **AAA (best)**: 7:1 or higher - Ideal for accessibility
- **AA (good)**: 4.5:1 - Minimum standard for body text
- **AA Large**: 3:1 - For large text (18pt+ or 14pt+ bold)

# Accessible color combinations

**High contrast (recommended):**
- Black (#000000) on White (#FFFFFF) - 21:1
- Dark gray (#333333) on White (#FFFFFF) - 12.6:1
- Navy (#003366) on Light yellow (#FFFFCC) - 8.5:1

**Brand colors (test before using):**
- Purple (#8B5CF6) on White (#FFFFFF) - 5.5:1 ✅
- Purple (#8B5CF6) on Light gray (#F3F4F6) - 4.9:1 ✅
- Green (#10B981) on White (#FFFFFF) - 4.3:1 ⚠️ (close, use darker shade)

# Color blindness considerations

- **Protanopia/Deuteranopia** (red-green): Avoid red/green combinations
- **Tritanopia** (blue-yellow): Avoid blue/yellow combinations
- **Solution**: Use patterns, icons, or text labels in addition to color

# Common mistakes

- Low contrast (light gray text on white background)
- Relying on color alone (red = error, green = success with no icons)
- Tiny text with low contrast (12pt light gray)
- No dark mode option (strain for users in low light)

# Metrics to watch

- Accessibility score (Lighthouse, WAVE)
- User feedback (readability complaints)
- Bounce rate (users leaving due to poor readability)
- Conversion rate (harder to read = fewer conversions)

# Testing tools

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Colorblind simulator**: Sim Daltonism (Mac), Color Oracle (Windows)
- **Lighthouse (Chrome DevTools)**: Accessibility audit
- **WAVE**: Web accessibility evaluation tool

# Quick prompts

"Check if [hex color 1] on [hex color 2] meets WCAG AA contrast standards."

Example: "Check if #6B7280 (gray) on #FFFFFF (white) meets WCAG AA contrast standards."
