import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Sparkles, Video, BarChart3, Settings, LogOut, BookOpen, FileText, PlayCircle, Image, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MediaGallery from "./MediaGallery";
import AnalyticsDashboard from "./AnalyticsDashboard";

interface Product {
  id: number;
  ownerId: number;
  title: string;
  kind: string;
  price: string;
  published: boolean;
  createdAt: string;
}

interface AIGeneration {
  idea: string;
  productType: string;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [aiGeneration, setAiGeneration] = useState<AIGeneration>({
    idea: "",
    productType: "eBook"
  });
  const [videoScript, setVideoScript] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { toast } = useToast();

  const API_BASE = "http://localhost:5050";

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate AI Product
  const generateAIProduct = async () => {
    if (!aiGeneration.idea.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an idea for your product",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: aiGeneration.idea,
          userId: 1, // TODO: Get from auth
          productType: aiGeneration.productType,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success!",
          description: `AI generated "${data.data.product.title}"`,
        });
        setAiGeneration({ idea: "", productType: "eBook" });
        setAiModalOpen(false);
        fetchProducts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate Video
  const generateVideo = async () => {
    if (!videoScript.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a script for your video",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: videoScript,
          template: "modern",
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Video Generated!",
          description: `${data.data.summary.totalScenes} scenes created (${data.data.summary.estimatedDuration})`,
        });
        setVideoScript("");
        setVideoModalOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const sidebarItems = [
    { id: "products", label: "Products", icon: BookOpen },
    { id: "ai-generator", label: "AI Generator", icon: Sparkles },
    { id: "video-builder", label: "Video Builder", icon: Video },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "media-gallery", label: "Media Gallery", icon: Image, action: () => setShowMediaGallery(true) },
    { id: "analytics-dashboard", label: "Analytics Dashboard", icon: TrendingUp, action: () => setShowAnalytics(true) },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const getProductIcon = (kind: string) => {
    switch (kind) {
      case "eBook": return FileText;
      case "course": return BookOpen;
      case "template": return FileText;
      case "video-pack": return PlayCircle;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r">
          <div className="p-6">
            <h1 className="text-2xl font-bold">ProductifyAI</h1>
            <p className="text-sm text-muted-foreground">Digital Product Creator</p>
          </div>
          
          <nav className="px-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => item.action ? item.action() : setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Button variant="outline" className="w-full" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Your Products</h2>
                  <p className="text-muted-foreground">
                    Manage your digital products and create new ones
                  </p>
                </div>
                <div className="flex gap-3">
                  <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        Create Video
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>

              {/* Products Grid */}
              {loading && products.length === 0 ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first digital product using AI
                    </p>
                    <Button onClick={() => setAiModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate with AI
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => {
                    const Icon = getProductIcon(product.kind);
                    return (
                      <Card key={product.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{product.title}</CardTitle>
                                <CardDescription>{product.kind}</CardDescription>
                              </div>
                            </div>
                            <Badge variant={product.published ? "default" : "secondary"}>
                              {product.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span className="font-semibold">${product.price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Created:</span>
                              <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "ai-generator" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">AI Product Generator</h2>
                <p className="text-muted-foreground">
                  Transform your ideas into complete digital products
                </p>
              </div>
              
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Generate New Product</CardTitle>
                  <CardDescription>
                    Enter your idea and let AI create a complete product structure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="idea">Product Idea</Label>
                    <Textarea
                      id="idea"
                      placeholder="e.g., A comprehensive guide to productivity for remote workers..."
                      value={aiGeneration.idea}
                      onChange={(e) => setAiGeneration({ ...aiGeneration, idea: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="productType">Product Type</Label>
                    <select
                      id="productType"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={aiGeneration.productType}
                      onChange={(e) => setAiGeneration({ ...aiGeneration, productType: e.target.value })}
                    >
                      <option value="eBook">eBook</option>
                      <option value="course">Course</option>
                      <option value="template">Template</option>
                      <option value="video-pack">Video Pack</option>
                    </select>
                  </div>

                  <Button onClick={generateAIProduct} disabled={loading} className="w-full">
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Product
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "video-builder" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">Video Builder</h2>
                <p className="text-muted-foreground">
                  Create engaging videos from your scripts
                </p>
              </div>
              
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Create Video</CardTitle>
                  <CardDescription>
                    Enter your script and generate video scenes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="script">Video Script</Label>
                    <Textarea
                      id="script"
                      placeholder="Enter your video script here. The AI will break it down into scenes..."
                      value={videoScript}
                      onChange={(e) => setVideoScript(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <Button onClick={generateVideo} disabled={loading} className="w-full">
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Video className="h-4 w-4 mr-2" />
                    )}
                    Generate Video
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">Analytics</h2>
                <p className="text-muted-foreground">
                  Track your product performance
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{products.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Published</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {products.filter(p => p.published).length}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$0.00</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">Settings</h2>
                <p className="text-muted-foreground">
                  Manage your account and preferences
                </p>
              </div>
              
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="user@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" placeholder="Your Name" />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate AI Product</DialogTitle>
            <DialogDescription>
              Describe your idea and AI will create a complete product structure.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="modal-idea">Product Idea</Label>
              <Textarea
                id="modal-idea"
                placeholder="e.g., A guide to productivity for remote workers..."
                value={aiGeneration.idea}
                onChange={(e) => setAiGeneration({ ...aiGeneration, idea: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modal-type">Product Type</Label>
              <select
                id="modal-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={aiGeneration.productType}
                onChange={(e) => setAiGeneration({ ...aiGeneration, productType: e.target.value })}
              >
                <option value="eBook">eBook</option>
                <option value="course">Course</option>
                <option value="template">Template</option>
                <option value="video-pack">Video Pack</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateAIProduct} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Generation Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Video</DialogTitle>
            <DialogDescription>
              Enter your script to generate video scenes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="modal-script">Video Script</Label>
              <Textarea
                id="modal-script"
                placeholder="Enter your video script here..."
                value={videoScript}
                onChange={(e) => setVideoScript(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateVideo} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Gallery Modal */}
      <Dialog open={showMediaGallery} onOpenChange={setShowMediaGallery}>
        <DialogContent className="max-w-6xl h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Media Gallery</DialogTitle>
            <DialogDescription>
              Generate and manage AI-created media assets
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <MediaGallery />
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dashboard Modal */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-6xl h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Analytics Dashboard</DialogTitle>
            <DialogDescription>
              Track and analyze your product performance
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <AnalyticsDashboard />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}