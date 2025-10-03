# Design Guidelines: Productify AI - Digital Product Creation Platform

## Design Approach: Modern Creative Productivity Tool
**Selected Approach:** Hybrid drawing from Notion's approachability, Canva's creative confidence, and Linear's precision

**Key Principles:**
- Professional polish with creative energy
- Clear workflows guiding complex product creation
- Trust through modern, polished interfaces
- Productivity-focused with delightful creative moments

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Background: 0 0% 100%
- Surface: 270 10% 98%
- Border: 270 8% 90%
- Text Primary: 270 15% 10%
- Text Secondary: 270 8% 45%
- Primary (Purple): 270 91% 65% (#8B5CF6)
- Primary Hover: 270 91% 60%
- Secondary (Pink): 330 81% 60% (#EC4899)
- Secondary Hover: 330 81% 55%
- Accent Success: 142 76% 36%
- Destructive: 0 84% 60%

**Dark Mode:**
- Background: 270 15% 8%
- Surface: 270 12% 12%
- Border: 270 10% 20%
- Text Primary: 0 0% 98%
- Text Secondary: 270 8% 65%
- Primary: 270 91% 70%
- Primary Hover: 270 91% 75%
- Secondary: 330 81% 65%

### B. Typography

**Font Families:**
- Primary: 'Inter', system-ui, sans-serif (Google Fonts CDN)
- Display: 'Cal Sans' or 'Satoshi', sans-serif (for hero headlines)
- Monospace: 'JetBrains Mono' (technical contexts)

**Hierarchy:**
- Hero Display: text-7xl font-bold (72px)
- H1: text-5xl font-bold (48px)
- H2: text-3xl font-semibold (30px)
- H3: text-xl font-semibold (20px)
- Body: text-base (16px)
- Small: text-sm (14px)

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section spacing: py-20 to py-32
- Container: max-w-7xl

### D. Component Library

**Navigation:**
- Fixed top nav: Backdrop-blur-md with border-b, h-16
- Logo left, navigation center, user controls right
- Sidebar (280px): Brand kit selector at top, main nav, upgrade banner at bottom
- Active states: Left border-l-4 primary + surface background

**Product Creation Studio:**
- Three-panel layout: Assets sidebar (240px) | Canvas/Editor (flex-1) | Properties panel (320px)
- Asset sidebar: Tabbed sections (Brand Kit, Images, Templates, Recent)
- Canvas area: Rich text editor with floating toolbar
- Properties: Context-sensitive controls (typography, colors, spacing, export settings)
- Export panel: Multi-format selector with preview thumbnails

**Brand Kit Manager:**
- Card-based layout for multiple brand kits
- Each kit shows: Name, color palette preview (5 circles), logo thumbnail
- Quick actions: Edit, Duplicate, Set as Default
- Colors displayed as swatches (40x40px rounded-lg) with HEX on hover
- Typography preview showing font pairs in actual typefaces

**Template Gallery:**
- Masonry grid layout (Pinterest-style)
- Cards: Hover reveals title + creator + "Use Template" CTA
- Filter bar: Category pills, search, sort dropdown
- Categories: eBook Covers, Course Modules, Checklists, Lead Magnets, Social Graphics

**Asset Management:**
- Grid view (default): 4-5 columns of thumbnails
- List view: Name, type, size, date, actions
- Bulk actions toolbar: Delete, Move to folder, Download
- Drag-drop upload zone with progress indicators
- Folder tree navigation in left sidebar

**Version Control Panel:**
- Timeline view showing saved versions with timestamps
- Visual diff showing changes between versions
- Actions: Restore, Compare, Create Branch
- Auto-save indicator in header with last saved time

**Export Interface:**
- Format selector: Cards for PDF, DOCX, HTML, EPUB, PNG
- Each card shows file icon, name, size estimate
- Preview pane showing actual export appearance
- Advanced options: Quality settings, compression, metadata

**Dashboard (Home):**
- Welcome header with name + quick stats (4 cards: Products Created, Downloads, Storage, Templates Saved)
- Recent projects grid (3 columns): Thumbnail, title, type badge, last edited, quick actions
- "Start Creating" hero card with gradient background and type selector buttons
- Activity feed sidebar showing recent actions and collaborator updates

### E. Visual Enhancements

**Gradients:**
- Hero backgrounds: Purple to pink diagonal (135deg)
- Product cards: Subtle surface to transparent
- CTA sections: Primary to secondary with 20% opacity overlay

**Animations (Minimal):**
- Page transitions: Fade 200ms
- Card hovers: translateY -2px with shadow increase
- Button interactions: scale-95 on active
- Panel slides: 300ms ease-out

**Shadows:**
- Cards: shadow-sm default, shadow-xl on hover
- Modals: shadow-2xl
- Floating toolbars: shadow-lg

**Border Radius:**
- Cards: rounded-xl (12px)
- Buttons: rounded-lg (8px)
- Inputs: rounded-lg (8px)
- Thumbnails: rounded-md (6px)
- Badges: rounded-full

---

## Page-Specific Guidelines

### Landing Page
**Structure:** Hero → Creator Types → Features → Template Showcase → How It Works → Pricing → Testimonials → CTA → Footer

**Hero (80vh):**
- Full-width gradient background (purple-to-pink)
- Large hero image: Mockup showcasing multiple product types (eBook cover, course interface, checklist) in floating card composition
- Centered headline: "Create Professional Digital Products in Minutes" (text-7xl)
- Subheading: Value proposition (text-xl max-w-3xl)
- Dual CTA: "Start Creating Free" (primary solid) + "Explore Templates" (outline with backdrop-blur-md bg-white/10 border-white/20)
- Trust indicators: User count, product stats, creator logos

**Creator Types (py-24):**
- 4-column grid: Content Creators, Educators, Entrepreneurs, Coaches
- Each card: Icon, headline, description, example products
- Gradient borders matching primary/secondary colors

**Features (py-24, bg-surface):**
- 6 features in 3-column grid
- Icons (Heroicons 64px) with primary color
- Title, description, "Learn more" link
- Hover: Card lifts with shadow increase

**Template Showcase (py-32):**
- Large heading: "1000+ Professional Templates"
- Tabbed categories: eBooks, Courses, Checklists, Lead Magnets
- 6-card grid showing actual template previews
- "Browse All Templates" CTA

**How It Works (py-24):**
- 4-step numbered process with large numerals
- Alternating layout: Image left/right zigzag
- Screenshots of actual studio interface
- Visual connections between steps (dotted lines)

**Pricing (py-24, bg-surface):**
- 3-tier comparison cards
- Free, Pro, Team with feature matrices
- Highlight Pro tier with primary border
- Annual/Monthly toggle

**Testimonials (py-20):**
- 3-column grid of creator testimonials
- Avatar, name, role, quote, product thumbnail
- Subtle gradient backgrounds

**Footer:**
- 5-column layout: Product, Features, Resources, Company, Legal
- Newsletter signup with inline form
- Social icons, trust badges

### Dashboard
**Welcome Section:**
- Personalized greeting with current date
- Quick stats cards (4 across): Products Created, Views/Downloads, Storage Used, Templates Saved
- Each stat: Large number (text-4xl), icon, trend indicator

**Quick Actions:**
- Large cards for: "Create New Product", "Browse Templates", "Manage Brand Kits"
- Gradient backgrounds with relevant icons

**Recent Projects:**
- 3-column grid of project cards
- Thumbnail, title, type badge, last edited timestamp
- Quick actions: Open, Duplicate, Delete

**Activity Sidebar:**
- Scrollable feed of recent actions
- Collaborator updates if team plan

### Product Studio
**Main Canvas:**
- Central editing area with ruler guides
- Floating toolbar: Text formatting, alignment, colors, assets
- Zoom controls bottom-right
- Canvas background: Subtle grid pattern

**Left Sidebar (Assets):**
- Tabs: Brand Kit, Stock Images, Icons, Shapes, Templates
- Search bar at top
- Drag-and-drop functionality
- Upload button prominent

**Right Panel (Properties):**
- Context-sensitive based on selection
- Typography controls: Font, size, weight, line height
- Color picker with brand kit swatches
- Spacing/positioning with number inputs
- Export settings at bottom

---

## Images

**Hero Image (Landing):**
- Composition: Floating mockups showing diverse products (eBook cover, course dashboard screenshot, checklist PDF, social graphic) arranged in layered perspective
- Style: Modern glass morphism effect with subtle shadows
- Colors: Products feature purple/pink accents
- Treatment: Depth with blur layers, slight rotation for dynamism
- Placement: Right side of hero, extending beyond viewport edge

**Feature Screenshots:**
- Studio interface showing actual product creation workflow
- Brand kit manager with color palettes visible
- Template gallery in masonry layout
- Placement: How It Works section, alternating sides
- Treatment: Shadow-2xl, subtle perspective tilt (2-3 degrees)

**Template Previews:**
- Actual product thumbnails (eBook covers, course interfaces, etc.)
- Placement: Template Showcase section, pricing tiers
- Aspect: Various (match product type)
- Fallback: Gradient with product icon

**Dashboard Thumbnails:**
- User project preview images
- Placement: Recent projects grid
- Size: 16:9 aspect ratio
- Treatment: Rounded-md with border

---

## Accessibility & Responsive

- Touch targets: 44px minimum
- Focus indicators: 2px ring primary color
- Contrast: WCAG AA (4.5:1 text)
- Mobile: Stack columns, sidebar converts to drawer
- Form inputs: Consistent styling across themes
- Multi-column layouts collapse to single column on mobile
- Dashboard sidebar: Collapsible with hamburger menu on tablets/mobile