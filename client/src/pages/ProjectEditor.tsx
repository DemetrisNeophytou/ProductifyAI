import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { 
  Save, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Undo, 
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Square,
  Circle,
  Triangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Dynamic import for fabric.js to avoid build issues - loaded only when component mounts`nlet fabric: any = null;

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  metadata: {
    theme?: {
      fonts?: { heading: string; body: string };
      colors?: string[];
    };
    layout?: any;
    canvas?: any;
  };
}

interface CanvasObject {
  id: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  text?: string;
  src?: string;
}

const ProjectEditor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Color palette
  const [colors] = useState([
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
    "#FFC0CB", "#A52A2A", "#808080", "#000080", "#008000"
  ]);
  
  // Fonts
  const [fonts] = useState([
    "Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana",
    "Courier New", "Impact", "Comic Sans MS", "Trebuchet MS", "Arial Black"
  ]);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5050";


  // Load fabric.js dynamically
  useEffect(() => {
    import("fabric").then((mod) => {
      fabric = mod;
      setFabricLoaded(true);
    }).catch((err) => {
      console.error("Failed to load fabric.js:", err);
      toast({
        title: "Error",
        description: "Failed to load canvas editor. Please refresh the page.",
        variant: "destructive",
      });
    });
  }, [toast]);

  // Re-initialize canvas when fabric loads
  useEffect(() => {
    if (fabricLoaded && project) {
      initializeCanvas(project);
    }
  }, [fabricLoaded, project]);


  // Load project data
  const loadProject = async () => {
    if (!projectId) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/projects/${projectId}`);
      const data = await response.json();
      
      if (data.ok) {
        setProject(data.data);
        initializeCanvas(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load project",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize Fabric.js canvas
  const initializeCanvas = (projectData: Project) => {
    if (!canvasRef.current || !fabricLoaded || !fabric) return;
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    fabricCanvasRef.current = canvas;

    // Load existing canvas data
    if (projectData.metadata?.canvas) {
      canvas.loadFromJSON(projectData.metadata.canvas, () => {
        canvas.renderAll();
      });
    }

    // Set up event listeners
    canvas.on("selection:created", handleObjectSelected);
    canvas.on("selection:updated", handleObjectSelected);
    canvas.on("selection:cleared", () => setSelectedObject(null));
    canvas.on("object:modified", saveToHistory);
    canvas.on("object:added", saveToHistory);
    canvas.on("object:removed", saveToHistory);

    // Add some default content if canvas is empty
    if (canvas.getObjects().length === 0) {
      addTextObject("Click to edit", 100, 100);
    }
  };

  // Handle object selection
  const handleObjectSelected = (e: fabric.IEvent) => {
    const activeObject = e.selected?.[0] || null;
    setSelectedObject(activeObject);
  };

  // Save to history for undo/redo
  const saveToHistory = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvasState = fabricCanvasRef.current.toJSON();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvasState);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      fabricCanvasRef.current?.loadFromJSON(history[newIndex], () => {
        fabricCanvasRef.current?.renderAll();
      });
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      fabricCanvasRef.current?.loadFromJSON(history[newIndex], () => {
        fabricCanvasRef.current?.renderAll();
      });
    }
  };

  // Add text object
  const addTextObject = (text: string = "New Text", left: number = 100, top: number = 100) => {
    if (!fabricCanvasRef.current) return;

    const textObject = new fabric.Text(text, {
      left,
      top,
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
    });

    fabricCanvasRef.current.add(textObject);
    fabricCanvasRef.current.setActiveObject(textObject);
    fabricCanvasRef.current.renderAll();
  };

  // Add rectangle
  const addRectangle = () => {
    if (!fabricCanvasRef.current) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: "#ff0000",
      stroke: "#000000",
      strokeWidth: 2,
    });

    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
  };

  // Add circle
  const addCircle = () => {
    if (!fabricCanvasRef.current) return;

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: "#00ff00",
      stroke: "#000000",
      strokeWidth: 2,
    });

    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    fabricCanvasRef.current.renderAll();
  };

  // Add image
  const addImage = (file: File) => {
    if (!fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const fabricImage = new fabric.Image(img, {
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        fabricCanvasRef.current?.add(fabricImage);
        fabricCanvasRef.current?.setActiveObject(fabricImage);
        fabricCanvasRef.current?.renderAll();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Update selected object properties
  const updateSelectedObject = (property: string, value: any) => {
    if (!selectedObject || !fabricCanvasRef.current) return;

    selectedObject.set(property, value);
    fabricCanvasRef.current.renderAll();
  };

  // Delete selected object
  const deleteSelectedObject = () => {
    if (!selectedObject || !fabricCanvasRef.current) return;

    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
  };

  // Save project
  const saveProject = async () => {
    if (!project || !fabricCanvasRef.current) return;

    setSaving(true);
    try {
      const canvasData = fabricCanvasRef.current.toJSON();
      
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...project.metadata,
            canvas: canvasData,
            layout: canvasData,
            lastModified: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        toast({
          title: "Success",
          description: "Project saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save project",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Export to PNG
  const exportToPNG = () => {
    if (!fabricCanvasRef.current) return;

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement("a");
    link.download = `${project?.title || "project"}.png`;
    link.href = dataURL;
    link.click();
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!fabricCanvasRef.current) return;

    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/export/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canvas: fabricCanvasRef.current.toJSON()
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${project?.title || "project"}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast({
          title: "Error",
          description: "Failed to export PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  // Set canvas background
  const setBackground = (color: string) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setBackgroundColor(color, () => {
      fabricCanvasRef.current?.renderAll();
    });
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-muted-foreground">Visual Editor</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button onClick={saveProject} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={exportToPNG}>
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-background p-4 overflow-y-auto">
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={activeTool === "select" ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setActiveTool("select")}
                  >
                    <Move className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                  <Button
                    variant={activeTool === "text" ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTool("text");
                      addTextObject();
                    }}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={addRectangle}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Rectangle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={addCircle}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Circle
                  </Button>
                  <div className="pt-2">
                    <Label htmlFor="image-upload" className="text-sm">
                      Add Image
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) addImage(file);
                      }}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Background</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: color }}
                        onClick={() => setBackground(color)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              {selectedObject ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Object Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedObject.type === "text" && (
                      <>
                        <div>
                          <Label className="text-sm">Text</Label>
                          <Input
                            value={(selectedObject as fabric.Text).text || ""}
                            onChange={(e) => updateSelectedObject("text", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Font Family</Label>
                          <Select
                            value={(selectedObject as fabric.Text).fontFamily || "Arial"}
                            onValueChange={(value) => updateSelectedObject("fontFamily", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fonts.map((font) => (
                                <SelectItem key={font} value={font}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Font Size</Label>
                          <Slider
                            value={[(selectedObject as fabric.Text).fontSize || 24]}
                            onValueChange={([value]) => updateSelectedObject("fontSize", value)}
                            min={8}
                            max={72}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label className="text-sm">Fill Color</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: color }}
                            onClick={() => updateSelectedObject("fill", color)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Stroke Color</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: color }}
                            onClick={() => updateSelectedObject("stroke", color)}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Stroke Width</Label>
                      <Slider
                        value={[selectedObject.strokeWidth || 0]}
                        onValueChange={([value]) => updateSelectedObject("strokeWidth", value)}
                        min={0}
                        max={10}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={deleteSelectedObject}
                    >
                      Delete Object
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                      Select an object to edit its properties
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="assets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Media Library</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Upload images to use in your project
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        Array.from(files).forEach(addImage);
                      }
                    }}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-muted/20 p-4">
          <div className="border rounded-lg shadow-lg bg-white">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;
