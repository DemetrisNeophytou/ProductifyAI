# Design Guidelines: AI Digital Product Creation Platform

## Design Approach: Modern SaaS Productivity Tool
**Selected Approach:** Design System hybrid drawing from Linear's precision, Notion's approachability, and Stripe's clarity

**Key Design Principles:**
- Professional polish with creative confidence
- Clear visual hierarchy guiding users through complex workflows
- Trust-building through modern, polished interfaces
- Efficiency-focused with delightful micro-moments

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Background: 0 0% 100% (pure white)
- Surface: 240 5% 96% (soft gray)
- Border: 240 6% 90%
- Text Primary: 240 10% 10%
- Text Secondary: 240 5% 45%
- Primary Brand: 262 83% 58% (vibrant purple)
- Primary Hover: 262 83% 52%
- Accent: 142 76% 36% (success green)
- Destructive: 0 84% 60%

**Dark Mode:**
- Background: 240 10% 8%
- Surface: 240 8% 12%
- Border: 240 6% 18%
- Text Primary: 0 0% 98%
- Text Secondary: 240 5% 65%
- Primary Brand: 262 83% 65%
- Primary Hover: 262 83% 70%
- Accent: 142 76% 45%

### B. Typography

**Font Families:**
- Primary: 'Inter', system-ui, sans-serif (via Google Fonts CDN)
- Monospace: 'JetBrains Mono', monospace (for code/technical elements)

**Hierarchy:**
- Hero: text-6xl font-bold (60px)
- H1: text-4xl font-bold (36px)
- H2: text-3xl font-semibold (30px)
- H3: text-xl font-semibold (20px)
- Body: text-base (16px)
- Small: text-sm (14px)
- Tiny: text-xs (12px)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Element gaps: gap-4 to gap-6
- Container max-width: max-w-7xl

**Grid Systems:**
- Dashboard: 12-column grid with sidebar (aside 280px width)
- Product cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Form layouts: Single column max-w-md for focused inputs

### D. Component Library

**Authentication Pages (Login/Signup):**
- Centered card design (max-w-md) with soft shadow
- Logo placement: top-center with mb-8
- Input fields: Consistent h-12 with focus:ring-2 states
- Social login buttons: Full-width with provider icons (Google, GitHub)
- Form validation: Inline error states in destructive color
- "Remember me" checkbox with label alignment
- Footer links: "Need help?" and "Privacy Policy" in muted text

**Dashboard Layout:**
- Fixed sidebar (280px) with smooth navigation transitions
- Top navigation bar: User avatar, notifications bell, search bar
- Sidebar sections: Dashboard, Create Product, My Products, Settings, Help
- Active state: Left border-l-4 with primary color + bg-surface
- Main content area: Generous padding (p-8) with max-w-7xl container

**Product Creation Interface:**
- Prominent "Create New Product" hero section with gradient background
- Product type selector: Large cards (200x180px) with icons and descriptions
  - Templates, Text Content, Graphics, Marketing Copy, etc.
- Creation wizard: Step indicator at top (1/4 progress)
- Prompt input: Expandable textarea (min-h-32) with character counter
- Parameter controls: Sliders for creativity, length, style with real-time preview
- Generation button: Large, prominent with loading spinner state
- Results display: Split view (input left, output right) with copy/download actions

**Product Cards (Dashboard):**
- Card design: Rounded-xl with hover:shadow-lg transition
- Thumbnail area: aspect-video with gradient placeholder
- Product metadata: Title (font-semibold), type badge, creation date
- Action buttons: Edit, Download, Delete (icon-only with tooltips)
- Status indicators: Draft/Published with appropriate colors

**Navigation Components:**
- Header: Sticky top-0 with backdrop-blur-md effect
- Breadcrumbs: Home / Create Product / Text Generator
- Tabs: Underline style with smooth indicator transition
- Dropdown menus: Subtle shadow with border, max-h-64 scroll

**Form Elements:**
- Input fields: border rounded-lg h-12 px-4
- Focus states: ring-2 ring-primary ring-offset-2
- Labels: text-sm font-medium mb-2
- Helper text: text-xs text-muted below inputs
- Checkboxes/Radio: Custom styled with primary accent
- Select dropdowns: Chevron icon, consistent height

**Buttons:**
- Primary: bg-primary text-white px-6 h-11 rounded-lg
- Secondary: border-2 bg-transparent hover:bg-surface
- Outline on images: backdrop-blur-sm bg-white/10 border-white/20
- Icon buttons: Square (40x40px) with hover:bg-surface

**Data Display:**
- Empty states: Centered with illustration, heading, and CTA
- Loading states: Skeleton screens matching component structure
- Tables: Striped rows, sticky header, sortable columns
- Stats cards: Large number (text-4xl), label below, trend indicator

### E. Visual Enhancements

**Animations (Minimal & Purposeful):**
- Page transitions: Fade-in (opacity 0 to 1) 200ms
- Button interactions: Scale on active (scale-95)
- Card hovers: Subtle lift (translateY -2px) with shadow increase
- Loading spinners: Smooth rotation on primary actions only

**Shadows & Depth:**
- Cards: shadow-sm default, shadow-lg on hover
- Modals: shadow-2xl with backdrop blur
- Dropdowns: shadow-md
- Avoid excessive depth layers

**Border Radius:**
- Cards/Containers: rounded-xl (12px)
- Buttons: rounded-lg (8px)
- Input fields: rounded-lg (8px)
- Images: rounded-md (6px)
- Badges: rounded-full

---

## Page-Specific Guidelines

### Landing Page (Pre-Auth)
**Structure:** Hero → Features → How It Works → Pricing → CTA → Footer

**Hero Section (h-screen):**
- Large hero image: Abstract AI/digital creation visualization (gradient mesh or particle system)
- Centered headline: "Create Digital Products with AI" (text-6xl)
- Subheading explaining value proposition (text-xl max-w-2xl)
- Dual CTA: "Start Creating Free" (primary) + "Watch Demo" (outline with backdrop blur)
- Trust indicators below: "10,000+ products created" with small user avatars

**Features Grid (py-24):**
- 3-column layout showing core capabilities
- Each feature: Icon (48x48 in primary color), title, description
- Subtle hover effect (translateY -4px)

**How It Works (py-20):**
- 4-step process with numbered badges
- Alternating image-text layout (zigzag pattern)
- Screenshots of actual dashboard in product

**Footer:**
- 4-column layout: Product, Company, Resources, Legal
- Newsletter signup: Inline form with email input + button
- Social media icons (github, twitter, linkedin)
- Trust badges: Security, compliance icons

### Dashboard (Post-Auth)
**Layout:** Sidebar + Main content area

**Sidebar Navigation:**
- Logo at top with home link
- Primary nav items with icons (Heroicons)
- User profile at bottom with avatar + dropdown
- Upgrade/Pro banner if applicable

**Main Content:**
- Welcome header: "Welcome back, [Name]" with current date
- Quick stats row: Products Created, Downloads, Storage Used (3-column cards)
- Recent products grid (2-3 columns)
- Empty state for new users with onboarding prompts

### Create Product Page
**Workflow:** Type Selection → Customization → Generation → Review

**Type Selection:**
- Grid of product types (6 options)
- Large cards with gradient backgrounds
- Clear icons and descriptions

**Customization Panel:**
- Left sidebar: Parameter controls
- Main area: Large prompt input
- Examples dropdown for inspiration
- Real-time token/cost estimate

**Results View:**
- Generated content in formatted preview
- Action bar: Regenerate, Edit, Save, Download
- Version history sidebar (collapsed by default)

---

## Images

**Hero Image (Landing):**
- Abstract digital/AI visualization: Flowing gradient mesh or particle network
- Colors: Purple to blue gradient with ethereal glow
- Placement: Full-width background with content overlay
- Style: Modern, tech-forward, inspiring creativity

**Feature Screenshots:**
- Actual dashboard interface screenshots
- Placement: How It Works section, alternating sides
- Treatment: Subtle shadow, slight perspective tilt
- Border: Light border to define edges

**Product Thumbnails:**
- AI-generated preview images for each product type
- Placement: Dashboard product cards
- Size: 16:9 aspect ratio, 400x225px
- Fallback: Gradient with product type icon

---

## Accessibility & Responsive

- All interactive elements min-height: 44px (touch targets)
- Focus indicators: 2px ring in primary color
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Mobile breakpoints: Stack columns, collapsible sidebar to drawer
- Form inputs maintain dark/light mode consistency