# ProductifyAI Design System

A comprehensive design system for building consistent, accessible, and beautiful user interfaces.

## Table of Contents

- [Philosophy](#philosophy)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing](#spacing)
- [Components](#components)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Philosophy

ProductifyAI's design system is built on three core principles:

1. **Consistency**: Every component follows the same visual language and interaction patterns
2. **Accessibility**: WCAG AA+ compliant with proper contrast ratios and keyboard navigation
3. **Flexibility**: Dark/light themes with semantic color tokens that adapt automatically

## Color System

### Theme Tokens

All colors are defined as CSS variables that automatically adapt to light/dark mode:

```css
--background          /* Page background */
--foreground          /* Primary text color */
--primary             /* Primary brand color (purple) */
--primary-foreground  /* Text on primary background */
--secondary           /* Secondary brand color (pink) */
--muted               /* Subtle backgrounds */
--muted-foreground    /* Secondary text */
--accent              /* Accent/highlight color */
--destructive         /* Error/danger states */
--border              /* Border color */
```

### Usage

```tsx
// ✅ DO: Use semantic tokens
<div className="bg-background text-foreground border-border">

// ❌ DON'T: Use hardcoded colors
<div style={{ background: '#ffffff', color: '#000000' }}>
```

### Color Palette

**Light Mode:**
- Background: White (#FFFFFF)
- Primary: Purple (#A855F7)
- Secondary: Pink (#EC4899)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)

**Dark Mode:**
- Background: Deep Purple (#0A0A0F)
- Primary: Light Purple (#C084FC)
- Secondary: Light Pink (#F472B6)
- (Success, Warning, Danger remain vibrant)

## Typography

### Font Stack

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-serif: Georgia, serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Menlo, monospace;
```

### Type Scale

| Size | Class | Usage |
|------|-------|-------|
| 48px | `text-5xl` | Hero headlines |
| 36px | `text-4xl` | Page titles |
| 30px | `text-3xl` | Section headers |
| 24px | `text-2xl` | Card headers |
| 20px | `text-xl` | Subheadings |
| 18px | `text-lg` | Large body |
| 16px | `text-base` | Body text |
| 14px | `text-sm` | Small text |
| 12px | `text-xs` | Captions |

### Font Weights

- **Normal (400)**: Body text
- **Medium (500)**: Emphasis
- **Semibold (600)**: Headings
- **Bold (700)**: Strong emphasis

### Usage Examples

```tsx
// Page Title
<h1 className="text-4xl font-bold">Create Your Product</h1>

// Section Header
<h2 className="text-2xl font-semibold">Recent Projects</h2>

// Body Text
<p className="text-base font-normal text-foreground">
  Build and launch digital products faster with AI.
</p>

// Muted Text
<span className="text-sm text-muted-foreground">Last updated 2 hours ago</span>
```

## Spacing

Use a consistent 4px spacing scale:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing |
| `space-2` | 8px | Close elements |
| `space-3` | 12px | Related elements |
| `space-4` | 16px | Standard spacing |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large gaps |
| `space-12` | 48px | Major sections |
| `space-16` | 64px | Page sections |

```tsx
// ✅ DO: Use spacing scale
<div className="p-4 gap-6">

// ❌ DON'T: Use arbitrary values
<div className="p-[13px] gap-[27px]">
```

## Components

### Buttons

Four button variants for different actions:

#### Primary Button
For primary actions (e.g., "Create Project", "Save")

```tsx
<Button variant="default">Create Project</Button>
```

#### Secondary Button
For secondary actions

```tsx
<Button variant="secondary">Cancel</Button>
```

#### Ghost Button
For tertiary actions without background

```tsx
<Button variant="ghost">Learn More</Button>
```

#### Destructive Button
For dangerous actions (e.g., "Delete")

```tsx
<Button variant="destructive">Delete Forever</Button>
```

#### Loading State

```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Creating...
</Button>
```

### Inputs

#### Text Input

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Project Name</Label>
  <Input 
    id="name" 
    type="text" 
    placeholder="My awesome product" 
  />
</div>
```

#### Textarea

```tsx
<Textarea 
  placeholder="Describe your product..." 
  rows={4}
/>
```

#### Select

```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose a template" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ebook">E-book</SelectItem>
    <SelectItem value="course">Online Course</SelectItem>
  </SelectContent>
</Select>
```

### Cards

Standard content container:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Project Analytics</CardTitle>
    <CardDescription>View your project performance</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Modals

For focused tasks and confirmations:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Product</DialogTitle>
      <DialogDescription>
        Fill in the details to create your product
      </DialogDescription>
    </DialogHeader>
    {/* Form fields */}
    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleCreate}>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toasts

For feedback messages:

```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

toast({
  title: "Success!",
  description: "Your project has been created.",
});

toast({
  title: "Error",
  description: "Something went wrong.",
  variant: "destructive",
});
```

### Badges

For status indicators:

```tsx
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Failed</Badge>
<Badge variant="outline">Pending</Badge>
```

### Skeleton Loaders

For loading states:

```tsx
<div className="space-y-4">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### Empty States

When no data is available:

```tsx
<div className="flex flex-col items-center justify-center p-12 text-center">
  <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
  <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
  <p className="text-muted-foreground mb-6">
    Create your first product to get started
  </p>
  <Button>
    <Plus className="mr-2 h-4 w-4" />
    Create Project
  </Button>
</div>
```

## Accessibility

### Keyboard Navigation

All interactive elements must be keyboard accessible:

- Tab to focus
- Enter/Space to activate
- Escape to close modals/dropdowns
- Arrow keys for navigation in lists/menus

### Focus Indicators

Always visible focus rings:

```tsx
className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
```

### ARIA Labels

Provide descriptive labels:

```tsx
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

<Input aria-describedby="email-error" />
<span id="email-error" className="text-sm text-destructive">
  Please enter a valid email
</span>
```

### Color Contrast

All text must meet WCAG AA standards:

- Normal text: 4.5:1 minimum
- Large text (18px+ or 14px+ bold): 3:1 minimum
- Interactive elements: 3:1 minimum

## Best Practices

### Do's ✅

- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- Provide descriptive labels for form fields
- Use loading states for async operations
- Show error messages clearly
- Implement keyboard navigation
- Test in both light and dark modes
- Use consistent spacing from the spacing scale
- Provide empty states for lists/grids

### Don'ts ❌

- Don't use `<div>` for buttons (use `<button>`)
- Don't rely on color alone for information
- Don't block user interaction unnecessarily
- Don't use absolute positioning for layout
- Don't hardcode colors or spacing values
- Don't forget to handle error states
- Don't skip focus indicators
- Don't assume users have a mouse

### Component Checklist

Before shipping a new component:

- [ ] Works in light and dark modes
- [ ] Keyboard accessible
- [ ] Screen reader friendly
- [ ] Has loading state (if async)
- [ ] Has error state
- [ ] Has empty state (if applicable)
- [ ] Uses design tokens (no hardcoded values)
- [ ] Follows spacing scale
- [ ] Has proper TypeScript types
- [ ] Tested on mobile viewport

## Resources

- [View all components](/style-guide)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font](https://rsms.me/inter/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

