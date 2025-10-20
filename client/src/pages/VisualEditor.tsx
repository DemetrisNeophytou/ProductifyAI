import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Download, 
  Save, 
  Undo, 
  Redo, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Square,
  Circle,
  Triangle,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Settings,
  Plus,
  Trash2,
  Copy,
  Scissors
} from "lucide-react";
import * as fabric from "fabric";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Project } from "@shared/schema";

interface CanvasObject {
  id: string;
  type: string;
  data: any;
}

const FONT_FAMILIES = [
  "Arial",
  "Helvetica", 
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Impact",
  "Comic Sans MS",
  "Trebuchet MS",
  "Arial Black"
];

const COLOR_PALETTE = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#000080", "#008000"
];

export default function VisualEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/ai/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/ai/projects/${projectId}`, {
        credentials: "include",
      });
      const data = await response.json();
      return data.data;
    },
    enabled: !!projectId,
  });

  // Fetch canvas data
  const { data: canvasData, isLoading: canvasLoading } = useQuery({
    queryKey: ["/api/ai/projects", projectId, "canvas"],
    queryFn: async () => {
      const response = await fetch(`/api/ai/projects/${projectId}/canvas`, {
        credentials: "include",
      });
      const data = await response.json();
      return data.data;
    },
    enabled: !!projectId,
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !project) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      selection: true,
    });

    fabricCanvasRef.current = canvas;

    // Load saved canvas data or project data
    if (canvasData && canvasData.canvasData) {
      canvas.loadFromJSON(canvasData.canvasData, () => {
        canvas.renderAll();
      });
    } else {
      loadProjectToCanvas();
    }

    // Event listeners
    canvas.on("selection:created", handleObjectSelection);
    canvas.on("selection:updated", handleObjectSelection);
    canvas.on("selection:cleared", () => setSelectedObject(null));
    canvas.on("object:modified", saveToHistory);
    canvas.on("object:added", saveToHistory);
    canvas.on("object:removed", saveToHistory);

    return () => {
      canvas.dispose();
    };
  }, [project, canvasData]);

  const loadProjectToCanvas = useCallback(() => {
    if (!fabricCanvasRef.current || !project) return;

    const canvas = fabricCanvasRef.current;
    canvas.clear();

    // Add title
    if (project.title) {
      const titleText = new fabric.Text(project.title, {
        left: 50,
        top: 50,
        fontSize: 32,
        fontFamily: "Arial",
        fill: "#000000",
        fontWeight: "bold",
      });
      canvas.add(titleText);
    }

    // Add project content based on type
    if (project.type === "ebook" && project.outline) {
      let yPosition = 120;
      project.outline.forEach((section, index) => {
        const sectionText = new fabric.Text(section.title, {
          left: 50,
          top: yPosition,
          fontSize: 18,
          fontFamily: "Arial",
          fill: "#333333",
        });
        canvas.add(sectionText);
        yPosition += 40;
      });
    }

    canvas.renderAll();
  }, [project]);

  const handleObjectSelection = useCallback((e: fabric.IEvent) => {
    if (e.selected && e.selected.length > 0) {
      setSelectedObject(e.selected[0]);
    }
  }, []);

  const saveToHistory = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvasState = JSON.stringify(fabricCanvasRef.current.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvasState);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Auto-save effect
  useEffect(() => {
    if (!fabricCanvasRef.current || !projectId) return;

    const autoSaveInterval = setInterval(() => {
      if (fabricCanvasRef.current) {
        const canvasData = fabricCanvasRef.current.toJSON();
        saveProjectMutation.mutate(canvasData);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [projectId, saveProjectMutation]);

  // Handle asset insertion from URL parameters
  useEffect(() => {
    if (!fabricCanvasRef.current || !search) return;

    const urlParams = new URLSearchParams(search);
    const insertAsset = urlParams.get('insertAsset');
    const insertAssets = urlParams.get('insertAssets');

    if (insertAsset) {
      // Fetch the asset URL from the media API
      fetch(`/api/media?userId=demo-user&assetId=${insertAsset}`, {
        credentials: "include",
      })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) {
            addImageFromUrl(data.data[0].url);
          }
        })
        .catch(error => {
          console.error('Failed to fetch asset:', error);
          toast({ 
            title: "Failed to load asset", 
            variant: "destructive" 
          });
        });
    } else if (insertAssets) {
      // Handle multiple assets
      const assetIds = insertAssets.split(',');
      assetIds.forEach((assetId, index) => {
        setTimeout(() => {
          fetch(`/api/media?userId=demo-user&assetId=${assetId}`, {
            credentials: "include",
          })
            .then(response => response.json())
            .then(data => {
              if (data.success && data.data && data.data.length > 0) {
                addImageFromUrl(data.data[0].url);
              }
            })
            .catch(error => {
              console.error('Failed to fetch asset:', error);
            });
        }, index * 500); // Stagger the loading
      });
    }
  }, [search, addImageFromUrl, toast]);

  // Tool functions
  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const text = new fabric.Text("Double click to edit", {
      left: 100,
      top: 100,
      fontSize: 16,
      fontFamily: "Arial",
      fill: "#000000",
    });
    
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  }, []);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !fabricCanvasRef.current) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imgElement = new Image();
        imgElement.onload = () => {
          const img = new fabric.Image(imgElement, {
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
          });
          fabricCanvasRef.current!.add(img);
          fabricCanvasRef.current!.renderAll();
        };
        imgElement.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  const addImageFromUrl = useCallback((imageUrl: string) => {
    if (!fabricCanvasRef.current) return;

    const imgElement = new Image();
    imgElement.crossOrigin = "anonymous";
    imgElement.onload = () => {
      const img = new fabric.Image(imgElement, {
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5,
      });
      fabricCanvasRef.current!.add(img);
      fabricCanvasRef.current!.renderAll();
      toast({ title: "Image added to canvas!" });
    };
    imgElement.onerror = () => {
      toast({ 
        title: "Failed to load image", 
        variant: "destructive" 
      });
    };
    imgElement.src = imageUrl;
  }, [toast]);

  const addShape = useCallback((shapeType: string) => {
    if (!fabricCanvasRef.current) return;
    
    let shape: fabric.Object;
    const commonProps = {
      left: 100,
      top: 100,
      fill: "#FF0000",
      stroke: "#000000",
      strokeWidth: 2,
    };

    switch (shapeType) {
      case "rect":
        shape = new fabric.Rect({ ...commonProps, width: 100, height: 100 });
        break;
      case "circle":
        shape = new fabric.Circle({ ...commonProps, radius: 50 });
        break;
      case "triangle":
        shape = new fabric.Triangle({ ...commonProps, width: 100, height: 100 });
        break;
      default:
        return;
    }

    fabricCanvasRef.current.add(shape);
    fabricCanvasRef.current.renderAll();
  }, []);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
  }, [selectedObject]);

  const duplicateSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    selectedObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (selectedObject.left || 0) + 20,
        top: (selectedObject.top || 0) + 20,
      });
      fabricCanvasRef.current!.add(cloned);
      fabricCanvasRef.current!.renderAll();
    });
  }, [selectedObject]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.loadFromJSON(history[newIndex], () => {
          fabricCanvasRef.current!.renderAll();
        });
      }
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.loadFromJSON(history[newIndex], () => {
          fabricCanvasRef.current!.renderAll();
        });
      }
    }
  }, [history, historyIndex]);

  // Save project
  const saveProjectMutation = useMutation({
    mutationFn: async (canvasData: any) => {
      return await apiRequest("PUT", `/api/ai/projects/${projectId}`, {
        canvasData: JSON.stringify(canvasData),
      });
    },
    onSuccess: () => {
      toast({ title: "Project saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/projects", projectId] });
    },
    onError: () => {
      toast({ 
        title: "Failed to save project", 
        variant: "destructive" 
      });
    },
  });

  const saveProject = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvasData = fabricCanvasRef.current.toJSON();
    saveProjectMutation.mutate(canvasData);
  }, [saveProjectMutation]);

  // Export functions
  const exportAsPNG = useCallback(async () => {
    if (!fabricCanvasRef.current) return;
    
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
    });
    
    const link = document.createElement("a");
    link.download = `${project?.title || "project"}.png`;
    link.href = dataURL;
    link.click();
  }, [project]);

  const exportAsPDF = useCallback(async () => {
    if (!fabricCanvasRef.current) return;
    
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
    });
    
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    
    const imgWidth = 297; // A4 width in mm
    const imgHeight = (fabricCanvasRef.current.height * imgWidth) / fabricCanvasRef.current.width;
    
    pdf.addImage(dataURL, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`${project?.title || "project"}.pdf`);
  }, [project]);

  // Object property handlers
  const updateObjectProperty = useCallback((property: string, value: any) => {
    if (!selectedObject || !fabricCanvasRef.current) return;
    
    selectedObject.set(property, value);
    fabricCanvasRef.current.renderAll();
  }, [selectedObject]);

  if (projectLoading) {
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
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">{project.title}</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={saveProject}
              disabled={saveProjectMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={exportAsPNG}
            >
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button
              variant="outline"
              onClick={exportAsPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Toolbar */}
        <div className="w-64 border-r bg-muted/20 p-4 space-y-4">
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tools" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Add Elements</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={addText}>
                    <Type className="h-4 w-4 mr-1" />
                    Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={addImage}>
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Image
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Shapes</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => addShape("rect")}>
                    <Square className="h-4 w-4 mr-1" />
                    Rectangle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addShape("circle")}>
                    <Circle className="h-4 w-4 mr-1" />
                    Circle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addShape("triangle")}>
                    <Triangle className="h-4 w-4 mr-1" />
                    Triangle
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Actions</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={duplicateSelected}
                    disabled={!selectedObject}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={deleteSelected}
                    disabled={!selectedObject}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              {selectedObject ? (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Text Properties</h3>
                    {selectedObject.type === "text" && (
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm text-muted-foreground">Font Family</label>
                          <Select
                            value={(selectedObject as fabric.Text).fontFamily || "Arial"}
                            onValueChange={(value) => updateObjectProperty("fontFamily", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_FAMILIES.map((font) => (
                                <SelectItem key={font} value={font}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm text-muted-foreground">Font Size</label>
                          <Slider
                            value={[(selectedObject as fabric.Text).fontSize || 16]}
                            onValueChange={([value]) => updateObjectProperty("fontSize", value)}
                            min={8}
                            max={72}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Colors</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-muted-foreground">Fill Color</label>
                        <div className="flex gap-1 mt-1">
                          <Input
                            type="color"
                            value={(selectedObject as any).fill || "#000000"}
                            onChange={(e) => updateObjectProperty("fill", e.target.value)}
                            className="w-12 h-8 p-1"
                          />
                          <Input
                            value={(selectedObject as any).fill || "#000000"}
                            onChange={(e) => updateObjectProperty("fill", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: color }}
                            onClick={() => updateObjectProperty("fill", color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Position & Size</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm text-muted-foreground">X</label>
                          <Input
                            type="number"
                            value={Math.round(selectedObject.left || 0)}
                            onChange={(e) => updateObjectProperty("left", Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Y</label>
                          <Input
                            type="number"
                            value={Math.round(selectedObject.top || 0)}
                            onChange={(e) => updateObjectProperty("top", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select an object to edit its properties
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white shadow-lg">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
