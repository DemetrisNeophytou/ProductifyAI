# ProductifyAI Frontend Overview

## Quick Start

### Running Locally (No Docker Required)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5050

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # Base design system components
│   ├── AppSidebar.tsx  # Main navigation sidebar
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   └── ...
├── pages/              # Route pages
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Products.tsx    # Products management
│   ├── StyleGuide.tsx  # Design system showcase
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helpers
├── styles/             # Global styles and theme tokens
│   └── theme.ts        # Design system tokens
├── App.tsx             # Main app component and routing
├── index.css           # Global CSS with theme variables
└── main.tsx            # App entry point
```

## Theme System

ProductifyAI uses a comprehensive theme system with CSS variables that automatically adapt to light/dark mode.

### Theme Tokens

All theme tokens are defined in:
- `client/src/index.css` - CSS variables
- `client/src/styles/theme.ts` - TypeScript exports

### Using Theme Colors

```tsx
// ✅ DO: Use semantic color classes
<div className="bg-background text-foreground">
<Button variant="primary">Click me</Button>

// ❌ DON'T: Hardcode colors
<div style={{ background: '#fff', color: '#000' }}>
```

### Theme Toggle

Users can switch between light and dark mode using the theme toggle in the top-right corner. The preference is persisted to localStorage.

```tsx
import { useTheme } from "@/components/ThemeProvider";

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  // theme is 'light' or 'dark'
}
```

## Design System

### Components

All UI components follow the design system documented in `/docs/DESIGN_SYSTEM.md`.

Key component categories:
- **Buttons**: Primary, Secondary, Outline, Ghost, Destructive
- **Inputs**: Text, Textarea, Select, Checkbox, Radio, Switch, Slider
- **Cards**: Content containers with header/footer
- **Feedback**: Toasts, Alerts, Skeletons, Progress bars
- **Layout**: Separators, Scroll areas, Responsive grids

### Viewing Components

Visit `/style-guide` to see all components in action with both light and dark themes.

### Creating New Components

1. Add component to `client/src/components/ui/`
2. Follow existing patterns for theming
3. Add to Style Guide page for documentation
4. Ensure accessibility (keyboard nav, ARIA labels)

## Routing

ProductifyAI uses [Wouter](https://github.com/molefrog/wouter) for lightweight routing.

### Adding a New Route

```tsx
// In App.tsx
const MyNewPage = lazy(() => import("@/pages/MyNewPage"));

// Add route inside authenticated section
<Route path="/my-page">
  <DashboardLayout>
    <MyNewPage />
  </DashboardLayout>
</Route>
```

### Navigation

```tsx
import { Link } from "wouter";

<Link href="/products">
  <Button>View Products</Button>
</Link>

// Or programmatic navigation
import { useLocation } from "wouter";

const [, navigate] = useLocation();
navigate("/dashboard");
```

## State Management

### React Query

All API calls use React Query for caching and state management.

```tsx
import { useQuery } from "@tanstack/react-query";

const { data, isLoading, error } = useQuery({
  queryKey: ["/products"],
  queryFn: async () => {
    const response = await fetch(`${API_BASE}/products`);
    return response.json();
  },
});
```

### Local State

Use React hooks for component-local state:

```tsx
const [open, setOpen] = useState(false);
const [count, setCount] = useState(0);
```

## API Integration

### Base URL

The API base URL is configured via environment variable:

```env
VITE_API_URL=http://localhost:5050
```

Access in code:

```tsx
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";
```

### Making Requests

```tsx
// GET request
const response = await fetch(`${API_BASE}/products`);
const data = await response.json();

// POST request
const response = await fetch(`${API_BASE}/api/ai/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idea: "My product idea" }),
});
```

### Error Handling

Always wrap API calls in try/catch and show user-friendly errors:

```tsx
try {
  const response = await fetch(url);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  
  // Success
  toast({ title: "Success!", description: data.message });
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive",
  });
}
```

## User Feedback

### Toasts

For temporary notifications:

```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

toast({
  title: "Product created",
  description: "Your product has been created successfully",
});

toast({
  title: "Error",
  description: "Failed to save changes",
  variant: "destructive",
});
```

### Loading States

Always show loading indicators:

```tsx
// Button loading
<Button disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {loading ? "Saving..." : "Save"}
</Button>

// Skeleton loading
{isLoading ? (
  <Skeleton className="h-12 w-full" />
) : (
  <div>{content}</div>
)}
```

### Error States

Use Alert components for errors:

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    {error.message}
  </AlertDescription>
</Alert>
```

### Empty States

Show helpful empty states:

```tsx
{items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <FileQuestion className="h-12 w-12 text-muted-foreground mb-3" />
    <h3 className="text-lg font-semibold mb-2">No items found</h3>
    <p className="text-sm text-muted-foreground mb-4">
      Create your first item to get started
    </p>
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create Item
    </Button>
  </div>
)}
```

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus indicators are visible (ring on focus)
- Modals trap focus and can be closed with Escape
- Dropdowns support arrow key navigation

### Screen Readers

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Provide ARIA labels for icon-only buttons
- Associate labels with form inputs
- Announce dynamic content changes

### Color Contrast

All color combinations meet WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

## Performance

### Code Splitting

All pages are lazy-loaded:

```tsx
const Dashboard = lazy(() => import("@/pages/Dashboard"));
```

### Image Optimization

```tsx
<img 
  src={imageUrl} 
  alt="Description" 
  loading="lazy"
  className="w-full h-auto"
/>
```

### Lighthouse Targets

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

## Responsive Design

### Breakpoints

```ts
sm: '640px'   // Small devices
md: '768px'   // Tablets
lg: '1024px'  // Desktops
xl: '1280px'  // Large desktops
2xl: '1536px' // Extra large
```

### Mobile-First Approach

```tsx
// Base styles for mobile, then scale up
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Sidebar Behavior

- Desktop: Persistent sidebar, collapsible
- Mobile: Hidden by default, opens as drawer

## Testing

### Type Checking

```bash
npm run check
```

### Linting

```bash
npm run lint
```

### Manual Testing Checklist

- [ ] Test in light and dark modes
- [ ] Test on mobile viewport (375px)
- [ ] Test keyboard navigation
- [ ] Test all forms with validation
- [ ] Test loading and error states
- [ ] Test with slow network (throttling)

## Development Workflow

### Local Development

1. Make changes to files
2. Vite hot-reloads automatically
3. Check browser console for errors
4. Test in both themes
5. Test responsive behavior

### Before Committing

```bash
# Type check
npm run check

# Run linter
npm run lint

# Test build
npm run build
```

### Code Style

- Use TypeScript for type safety
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic to custom hooks
- Use Tailwind classes for styling
- Follow existing patterns

## Common Patterns

### Data Fetching Pattern

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ["/endpoint"],
  queryFn: async () => {
    const response = await fetch(`${API_BASE}/endpoint`);
    if (!response.ok) throw new Error("Failed to fetch");
    return response.json();
  },
});

if (isLoading) return <Skeleton />;
if (error) return <Alert variant="destructive">{error.message}</Alert>;
if (!data) return <EmptyState />;

return <div>{/* Render data */}</div>;
```

### Form Pattern

```tsx
const [formData, setFormData] = useState({ name: "", email: "" });
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  
  try {
    // Submit form
    toast({ title: "Success!" });
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
  } finally {
    setSubmitting(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <Label htmlFor="name">Name</Label>
    <Input
      id="name"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    />
    <Button type="submit" disabled={submitting}>
      {submitting ? "Saving..." : "Save"}
    </Button>
  </form>
);
```

### Modal Pattern

```tsx
const [open, setOpen] = useState(false);

return (
  <>
    <Button onClick={() => setOpen(true)}>Open Modal</Button>
    
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
        {/* Content */}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAction}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);
```

## Troubleshooting

### Common Issues

**Issue**: Styles not applying
- Check Tailwind class names are correct
- Verify theme variables are defined
- Clear browser cache

**Issue**: Components not loading
- Check import paths are correct
- Verify component is exported
- Check for TypeScript errors

**Issue**: API requests failing
- Verify backend is running on port 5050
- Check CORS is enabled on backend
- Verify API endpoint exists

**Issue**: Theme not switching
- Check ThemeProvider is wrapping app
- Verify localStorage is accessible
- Check CSS variables are defined

## Resources

- [Design System Documentation](/docs/DESIGN_SYSTEM.md)
- [Style Guide (Live)](/style-guide)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Wouter Routing](https://github.com/molefrog/wouter)
- [Lucide Icons](https://lucide.dev/)

## Support

For questions or issues:
1. Check this documentation
2. Review the Style Guide at `/style-guide`
3. Check Design System docs
4. Review existing component implementations

