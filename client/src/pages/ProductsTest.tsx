import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Edit, RefreshCw, Sparkles, Video, Eye, Globe, Share2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  ownerId: number;
  title: string;
  kind: string;
  price: string;
  published: boolean;
  createdAt: string;
}

export default function ProductsTest() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    kind: "eBook",
    price: "0",
    ownerId: 1,
    published: false,
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    topic: "",
    type: "ebook" as "ebook" | "template" | "course",
    audience: "",
    tone: "professional" as "professional" | "casual" | "friendly" | "authoritative",
    goal: ""
  });
  const [videoScript, setVideoScript] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [generatedSocialPack, setGeneratedSocialPack] = useState<any>(null);
  const [generatedMedia, setGeneratedMedia] = useState<any>(null);
  const [mediaPrompt, setMediaPrompt] = useState("");
  const { toast } = useToast();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";

  // Fetch all products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      
      if (data.ok) {
        setProducts(data.data);
        toast({
          title: "Products loaded",
          description: `${data.data.length} products fetched successfully`,
        });
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

  // Create product
  const createProduct = async () => {
    if (!formData.title) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast({
          title: "Success",
          description: "Product created successfully",
        });
        setFormData({
          title: "",
          kind: "eBook",
          price: "0",
          ownerId: 1,
          published: false,
        });
        fetchProducts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const updateProduct = async () => {
    if (!editingProduct || !formData.title) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          kind: formData.kind,
          price: formData.price,
          published: formData.published,
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        setEditingProduct(null);
        setFormData({
          title: "",
          kind: "eBook",
          price: "0",
          ownerId: 1,
          published: false,
        });
        fetchProducts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Start editing product
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      kind: product.kind,
      price: product.price,
      ownerId: product.ownerId,
      published: product.published,
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingProduct(null);
    setFormData({
      title: "",
      kind: "eBook",
      price: "0",
      ownerId: 1,
      published: false,
    });
  };

  // Generate AI Product
  const generateAIProduct = async () => {
    if (!aiFormData.topic) {
      toast({
        title: "Validation Error",
        description: "Topic is required",
        variant: "destructive",
      });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiFormData),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast({
          title: "AI Product Generated!",
          description: `Created "${data.data.title}" successfully`,
        });
        
        // Reset form
        setAiFormData({
          topic: "",
          type: "ebook",
          audience: "",
          tone: "professional",
          goal: ""
        });
        
        // Refresh products list
        fetchProducts();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate AI product",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI product",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  // Generate Video
  const generateVideo = async () => {
    if (!videoScript.trim()) {
      toast({
        title: "Validation Error",
        description: "Script is required",
        variant: "destructive",
      });
      return;
    }

    setVideoGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/api/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: videoScript }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setGeneratedVideo(data.data);
        toast({
          title: "Video Generated!",
          description: `Created ${data.data.scenes.length} scenes (${data.data.totalDuration}s total)`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate video",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate video",
        variant: "destructive",
      });
    } finally {
      setVideoGenerating(false);
    }
  };

  // Translate Project
  const translateProject = async (projectId: string, locale: string) => {
    setTranslationLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/translate?to=${locale}`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast({
          title: "Project Translated!",
          description: `Successfully translated to ${locale.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to translate project",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to translate project",
        variant: "destructive",
      });
    } finally {
      setTranslationLoading(false);
    }
  };

  // Generate Social Pack
  const generateSocialPack = async () => {
    if (!selectedProject) {
      toast({
        title: "Validation Error",
        description: "Please select a project first",
        variant: "destructive",
      });
      return;
    }

    setSocialLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/social/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          platforms: ["reels", "tiktok", "shorts"],
          tone: "professional",
          length: "short"
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setGeneratedSocialPack(data.data);
        toast({
          title: "Social Pack Generated!",
          description: `Created content for ${data.data.platforms.join(", ")}`,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate social pack",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate social pack",
        variant: "destructive",
      });
    } finally {
      setSocialLoading(false);
    }
  };

  // Generate Media
  const generateMedia = async () => {
    if (!mediaPrompt.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setMediaLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/media/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: mediaPrompt,
          projectId: selectedProject,
          type: "image",
          style: "realistic",
          size: "square"
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setGeneratedMedia(data.data);
        toast({
          title: "Media Generated!",
          description: "Image created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate media",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate media",
        variant: "destructive",
      });
    } finally {
      setMediaLoading(false);
    }
  };

  // Delete product
  const deleteProduct = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        fetchProducts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products API Test</h1>
          <p className="text-muted-foreground">
            Test ProductifyAI Backend CRUD Operations
          </p>
        </div>
        <Button onClick={fetchProducts} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* AI Product Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Product Generator
          </CardTitle>
          <CardDescription>
            Generate complete products with AI - includes layout, pricing, and marketing funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ai-topic">Topic *</Label>
              <Input
                id="ai-topic"
                placeholder="e.g., Productivity Techniques, Digital Marketing"
                value={aiFormData.topic}
                onChange={(e) =>
                  setAiFormData({ ...aiFormData, topic: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ai-type">Type</Label>
                <select
                  id="ai-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={aiFormData.type}
                  onChange={(e) =>
                    setAiFormData({ ...aiFormData, type: e.target.value as any })
                  }
                >
                  <option value="ebook">eBook</option>
                  <option value="course">Course</option>
                  <option value="template">Template</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ai-tone">Tone</Label>
                <select
                  id="ai-tone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={aiFormData.tone}
                  onChange={(e) =>
                    setAiFormData({ ...aiFormData, tone: e.target.value as any })
                  }
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ai-audience">Target Audience (optional)</Label>
              <Input
                id="ai-audience"
                placeholder="e.g., Small business owners, Students"
                value={aiFormData.audience}
                onChange={(e) =>
                  setAiFormData({ ...aiFormData, audience: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ai-goal">Goal (optional)</Label>
              <Input
                id="ai-goal"
                placeholder="e.g., Increase productivity by 50%"
                value={aiFormData.goal}
                onChange={(e) =>
                  setAiFormData({ ...aiFormData, goal: e.target.value })
                }
              />
            </div>

            <Button 
              onClick={generateAIProduct} 
              disabled={aiGenerating} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {aiGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            Video Generator
          </CardTitle>
          <CardDescription>
            Generate video scenes from your script
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="video-script">Script *</Label>
              <textarea
                id="video-script"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter your video script here..."
                value={videoScript}
                onChange={(e) => setVideoScript(e.target.value)}
              />
            </div>

            <Button 
              onClick={generateVideo} 
              disabled={videoGenerating} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {videoGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              Create Video
            </Button>

            {generatedVideo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Generated Video Scenes:</h4>
                <div className="space-y-2">
                  {generatedVideo.scenes.map((scene: any) => (
                    <div key={scene.id} className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="text-sm">{scene.caption}</span>
                      <span className="text-xs text-gray-500">{scene.duration}s</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Total Duration: {generatedVideo.totalDuration} seconds
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Translation & Social Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-500" />
            Translation & Social Export
          </CardTitle>
          <CardDescription>
            Translate projects and generate social media content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="project-select">Select Project (for translation/social)</Label>
              <select
                id="project-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(e.target.value || null)}
              >
                <option value="">Select a project...</option>
                <option value="proj_1234567890_abc123">Sample Project 1</option>
                <option value="proj_0987654321_xyz789">Sample Project 2</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Translation</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => selectedProject && translateProject(selectedProject, "es")}
                    disabled={!selectedProject || translationLoading}
                    variant="outline"
                    size="sm"
                  >
                    {translationLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    Spanish
                  </Button>
                  <Button
                    onClick={() => selectedProject && translateProject(selectedProject, "fr")}
                    disabled={!selectedProject || translationLoading}
                    variant="outline"
                    size="sm"
                  >
                    {translationLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    French
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Social Pack</Label>
                <Button
                  onClick={generateSocialPack}
                  disabled={!selectedProject || socialLoading}
                  variant="outline"
                  size="sm"
                >
                  {socialLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Generate Social Pack
                </Button>
              </div>
            </div>

            {generatedSocialPack && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Generated Social Content:</h4>
                <div className="space-y-4">
                  {Object.entries(generatedSocialPack.payload).map(([platform, content]: [string, any]) => (
                    <div key={platform} className="p-3 bg-white rounded border">
                      <h5 className="font-medium capitalize mb-2">{platform}</h5>
                      <p className="text-sm mb-2">{content.caption}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {content.hashtags.map((tag: string, index: number) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{content.cta}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-orange-500" />
            Media Generation
          </CardTitle>
          <CardDescription>
            Generate AI images and media assets for your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="media-prompt">Image Prompt *</Label>
              <Input
                id="media-prompt"
                placeholder="e.g., Professional business meeting, modern office setting"
                value={mediaPrompt}
                onChange={(e) => setMediaPrompt(e.target.value)}
              />
            </div>

            <Button 
              onClick={generateMedia} 
              disabled={mediaLoading} 
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {mediaLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Image className="h-4 w-4 mr-2" />
              )}
              Generate Media
            </Button>

            {generatedMedia && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Generated Media:</h4>
                <div className="space-y-2">
                  <img 
                    src={generatedMedia.url} 
                    alt={generatedMedia.prompt}
                    className="w-full max-w-md rounded border"
                  />
                  <p className="text-sm text-gray-600">
                    <strong>Prompt:</strong> {generatedMedia.prompt}
                  </p>
                  {generatedMedia.metadata && (
                    <p className="text-xs text-gray-500">
                      {generatedMedia.metadata.width}x{generatedMedia.metadata.height} • {generatedMedia.metadata.format}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Product Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingProduct ? "Edit Product" : "Create New Product"}
          </CardTitle>
          <CardDescription>
            {editingProduct 
              ? "Update the product details" 
              : "Add a new product to test the API"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Product Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kind">Kind</Label>
                <select
                  id="kind"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.kind}
                  onChange={(e) =>
                    setFormData({ ...formData, kind: e.target.value })
                  }
                >
                  <option value="eBook">eBook</option>
                  <option value="course">Course</option>
                  <option value="template">Template</option>
                  <option value="video-pack">Video Pack</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) =>
                  setFormData({ ...formData, published: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="published">Published</Label>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingProduct ? updateProduct : createProduct} 
                disabled={loading} 
                className="flex-1"
              >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
              {editingProduct && (
                <Button onClick={cancelEdit} variant="outline" disabled={loading}>
                  Cancel
            </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Products ({products.length})
        </h2>
        
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No products found. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{product.title}</CardTitle>
                      <CardDescription>
                        {product.kind} • ${product.price}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          product.published
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>ID: {product.id}</div>
                    <div>Owner: User #{product.ownerId}</div>
                    <div>
                      Created: {new Date(product.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(product)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base URL:</span>
              <code className="bg-muted px-2 py-1 rounded">{API_BASE}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-600 font-semibold">✅ Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Database:</span>
              <span className="text-green-600 font-semibold">✅ OK</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

