import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Loader2, 
  Plus, 
  Save, 
  Trash2,
  Download,
  Upload,
  Search,
  Settings,
  User,
  FileQuestion
} from "lucide-react";

export default function StyleGuide() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const showToast = (variant?: "default" | "destructive") => {
    toast({
      title: variant === "destructive" ? "Error occurred" : "Action successful",
      description: variant === "destructive" 
        ? "Something went wrong. Please try again." 
        : "Your changes have been saved successfully.",
      variant,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-4">ProductifyAI Design System</h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive showcase of all UI components and patterns used throughout the application.
        </p>
      </div>

      <Tabs defaultValue="buttons" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        {/* Buttons */}
        <TabsContent value="buttons" className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Buttons</h2>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>Different button styles for various actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button variant="default">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="destructive">Destructive Button</Button>
                  <Button variant="link">Link Button</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Button Sizes</CardTitle>
                <CardDescription>Available size options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Plus className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Button States</CardTitle>
                <CardDescription>Loading and disabled states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button disabled>Disabled Button</Button>
                  <Button>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Buttons with Icons</CardTitle>
                <CardDescription>Common button patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                  <Button variant="secondary">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Inputs */}
        <TabsContent value="inputs" className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Form Inputs</h2>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Text Inputs</CardTitle>
                <CardDescription>Standard text input fields</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text Input</Label>
                  <Input id="text-input" type="text" placeholder="Enter text..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-input">Email Input</Label>
                  <Input id="email-input" type="email" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-input">Password Input</Label>
                  <Input id="password-input" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled-input">Disabled Input</Label>
                  <Input id="disabled-input" type="text" placeholder="Disabled" disabled />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Textarea</CardTitle>
                <CardDescription>Multi-line text input</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Enter a longer description..." rows={4} />
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Dropdown</CardTitle>
                <CardDescription>Choose from options</CardDescription>
              </CardHeader>
              <CardContent>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Checkbox & Radio</CardTitle>
                <CardDescription>Selection controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Checkboxes</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="check1" />
                    <label htmlFor="check1" className="text-sm cursor-pointer">
                      Option 1
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="check2" />
                    <label htmlFor="check2" className="text-sm cursor-pointer">
                      Option 2
                    </label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Radio Group</Label>
                  <RadioGroup defaultValue="radio1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="radio1" id="radio1" />
                      <Label htmlFor="radio1">Radio Option 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="radio2" id="radio2" />
                      <Label htmlFor="radio2">Radio Option 2</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Switch & Slider</CardTitle>
                <CardDescription>Toggle and range controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch id="switch1" />
                  <Label htmlFor="switch1">Enable notifications</Label>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Volume</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Cards */}
        <TabsContent value="cards" className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Cards</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Card</CardTitle>
                  <CardDescription>A simple card with title and description</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This is the card content area where you can place any component or text.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Card with Footer</CardTitle>
                  <CardDescription>Card with action buttons</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This card includes a footer section for actions.
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Confirm</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stats Card</CardTitle>
                  <CardDescription>Display key metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">1,234</div>
                  <p className="text-sm text-muted-foreground">
                    Total projects created
                  </p>
                  <div className="mt-4">
                    <Progress value={75} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Empty State Card</CardTitle>
                  <CardDescription>When there's no data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileQuestion className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No items found</p>
                    <Button size="sm" className="mt-4">
                      <Plus className="mr-2 h-3 w-3" />
                      Add Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges" className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Badges</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Badge Variants</CardTitle>
                <CardDescription>Status indicators and labels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-green-500">Active</Badge>
                  <Badge className="bg-yellow-500">Pending</Badge>
                  <Badge className="bg-blue-500">Draft</Badge>
                  <Badge className="bg-gray-500">Archived</Badge>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback" className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Feedback Components</h2>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>Important messages and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>
                    This is an informational alert message.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Your action was completed successfully!
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Something went wrong. Please try again.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Toasts</CardTitle>
                <CardDescription>Temporary notification messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button onClick={() => showToast()}>Show Success Toast</Button>
                  <Button variant="destructive" onClick={() => showToast("destructive")}>
                    Show Error Toast
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Skeleton Loaders</CardTitle>
                <CardDescription>Loading state placeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Bar</CardTitle>
                <CardDescription>Visual progress indicator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="text-muted-foreground">25%</span>
                  </div>
                  <Progress value={25} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading</span>
                    <span className="text-muted-foreground">75%</span>
                  </div>
                  <Progress value={75} />
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography" className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Typography</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Type Scale</CardTitle>
                <CardDescription>Heading and text styles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h1 className="text-5xl font-bold mb-2">Heading 1</h1>
                  <code className="text-xs text-muted-foreground">text-5xl font-bold</code>
                </div>
                <div>
                  <h2 className="text-4xl font-bold mb-2">Heading 2</h2>
                  <code className="text-xs text-muted-foreground">text-4xl font-bold</code>
                </div>
                <div>
                  <h3 className="text-3xl font-semibold mb-2">Heading 3</h3>
                  <code className="text-xs text-muted-foreground">text-3xl font-semibold</code>
                </div>
                <div>
                  <h4 className="text-2xl font-semibold mb-2">Heading 4</h4>
                  <code className="text-xs text-muted-foreground">text-2xl font-semibold</code>
                </div>
                <div>
                  <p className="text-lg mb-2">Large body text for emphasis</p>
                  <code className="text-xs text-muted-foreground">text-lg</code>
                </div>
                <div>
                  <p className="text-base mb-2">Regular body text for content</p>
                  <code className="text-xs text-muted-foreground">text-base</code>
                </div>
                <div>
                  <p className="text-sm mb-2">Small text for secondary information</p>
                  <code className="text-xs text-muted-foreground">text-sm</code>
                </div>
                <div>
                  <p className="text-xs mb-2">Extra small text for captions</p>
                  <code className="text-xs text-muted-foreground">text-xs</code>
                </div>
                <Separator />
                <div>
                  <p className="text-base text-muted-foreground mb-2">
                    Muted text for less important information
                  </p>
                  <code className="text-xs text-muted-foreground">text-muted-foreground</code>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors" className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Color Palette</h2>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>Primary and secondary brand colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="h-24 rounded-lg bg-primary mb-2"></div>
                    <p className="text-sm font-medium">Primary</p>
                    <code className="text-xs text-muted-foreground">bg-primary</code>
                  </div>
                  <div>
                    <div className="h-24 rounded-lg bg-secondary mb-2"></div>
                    <p className="text-sm font-medium">Secondary</p>
                    <code className="text-xs text-muted-foreground">bg-secondary</code>
                  </div>
                  <div>
                    <div className="h-24 rounded-lg bg-accent mb-2"></div>
                    <p className="text-sm font-medium">Accent</p>
                    <code className="text-xs text-muted-foreground">bg-accent</code>
                  </div>
                  <div>
                    <div className="h-24 rounded-lg bg-muted mb-2"></div>
                    <p className="text-sm font-medium">Muted</p>
                    <code className="text-xs text-muted-foreground">bg-muted</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Semantic Colors</CardTitle>
                <CardDescription>Status and feedback colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="h-24 rounded-lg bg-destructive mb-2"></div>
                    <p className="text-sm font-medium">Destructive</p>
                    <code className="text-xs text-muted-foreground">bg-destructive</code>
                  </div>
                  <div>
                    <div className="h-24 rounded-lg bg-green-500 mb-2"></div>
                    <p className="text-sm font-medium">Success</p>
                    <code className="text-xs text-muted-foreground">bg-green-500</code>
                  </div>
                  <div>
                    <div className="h-24 rounded-lg bg-yellow-500 mb-2"></div>
                    <p className="text-sm font-medium">Warning</p>
                    <code className="text-xs text-muted-foreground">bg-yellow-500</code>
                  </div>
                  <div>
                    <div className="h-24 rounded-lg bg-blue-500 mb-2"></div>
                    <p className="text-sm font-medium">Info</p>
                    <code className="text-xs text-muted-foreground">bg-blue-500</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* Layout */}
        <TabsContent value="layout" className="space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6">Layout Components</h2>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Separator</CardTitle>
                <CardDescription>Visual dividers between sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">Content above separator</p>
                  <Separator />
                  <p className="text-sm">Content below separator</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Scroll Area</CardTitle>
                <CardDescription>Scrollable content container</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 w-full rounded-md border p-4">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="py-2">
                      Item {i + 1}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grid Layouts</CardTitle>
                <CardDescription>Responsive grid patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 rounded-lg bg-muted flex items-center justify-center">
                      Grid Item {i}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

