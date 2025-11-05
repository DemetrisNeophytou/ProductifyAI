# ProductifyAI Visual Editor

This document describes the visual editor functionality for ProductifyAI projects.

## Overview

The visual editor provides a canvas-based interface for creating and editing digital products using Fabric.js. Users can add text, shapes, images, and other elements to create professional-looking designs.

## Features

### Core Functionality
- **Canvas-based editing** using Fabric.js
- **Real-time visual editing** with immediate feedback
- **Undo/Redo** functionality with history management
- **Object manipulation** (move, resize, rotate, delete)
- **Layer management** with z-index control
- **Auto-save** functionality

### Design Tools
- **Text editing** with font selection and sizing
- **Shape tools** (rectangles, circles, triangles)
- **Image upload** and manipulation
- **Color palette** with predefined colors
- **Background customization**
- **Stroke and fill** options

### Export Options
- **PNG export** for high-quality images
- **PDF export** for print-ready documents
- **HTML export** for web compatibility

## Technical Implementation

### Frontend Architecture

#### Main Component: `ProjectEditor.tsx`
```typescript
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
```

#### Canvas Management
- Uses Fabric.js for canvas operations
- Real-time object manipulation
- Event-driven updates
- State management with React hooks

#### Key Features Implementation

**Canvas Initialization:**
```typescript
const initializeCanvas = (projectData: Project) => {
  const canvas = new fabric.Canvas(canvasRef.current, {
    width: 800,
    height: 600,
    backgroundColor: "#ffffff",
  });
  
  // Load existing canvas data
  if (projectData.metadata?.canvas) {
    canvas.loadFromJSON(projectData.metadata.canvas, () => {
      canvas.renderAll();
    });
  }
};
```

**Object Creation:**
```typescript
// Text objects
const addTextObject = (text: string, left: number, top: number) => {
  const textObject = new fabric.Text(text, {
    left, top, fontSize: 24, fontFamily: "Arial", fill: "#000000"
  });
  fabricCanvasRef.current.add(textObject);
};

// Shape objects
const addRectangle = () => {
  const rect = new fabric.Rect({
    left: 100, top: 100, width: 100, height: 100,
    fill: "#ff0000", stroke: "#000000", strokeWidth: 2
  });
  fabricCanvasRef.current.add(rect);
};
```

**History Management:**
```typescript
const saveToHistory = useCallback(() => {
  const canvasState = fabricCanvasRef.current.toJSON();
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(canvasState);
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
}, [history, historyIndex]);
```

### Backend Architecture

#### Export Routes: `server/routes/export.ts`

**PDF Export:**
```typescript
router.post("/:id/export/pdf", async (req, res) => {
  const { canvas } = req.body;
  const html = generateHTMLFromCanvas(canvas, project);
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="${project.title}.html"`);
  res.send(html);
});
```

**PNG Export:**
```typescript
router.post("/:id/export/png", async (req, res) => {
  const { canvas } = req.body;
  const html = generateHTMLFromCanvas(canvas, project);
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment: filename="${project.title}.html"`);
  res.send(html);
});
```

#### HTML Generation
```typescript
function generateHTMLFromCanvas(canvasData: any, project: any): string {
  const { objects, background } = canvasData;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${project.title}</title>
      <style>
        .canvas-container {
          position: relative;
          width: 800px;
          height: 600px;
          background-color: ${background || '#ffffff'};
        }
        .canvas-object {
          position: absolute;
        }
      </style>
    </head>
    <body>
      <div class="canvas-container">
  `;
  
  // Render canvas objects
  objects.forEach((obj: any) => {
    // Convert Fabric.js objects to HTML elements
  });
  
  return html + '</div></body></html>';
}
```

## User Interface

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header: Project Title + Save/Export Buttons            │
├─────────────┬───────────────────────────────────────────┤
│ Sidebar     │ Canvas Area                               │
│ - Tools     │ - Fabric.js Canvas                       │
│ - Properties│ - Object Manipulation                    │
│ - Assets    │ - Visual Editing                         │
└─────────────┴───────────────────────────────────────────┘
```

### Sidebar Tabs

#### 1. Tools Tab
- **Select Tool** - Move and manipulate objects
- **Text Tool** - Add and edit text elements
- **Shape Tools** - Rectangle, Circle, Triangle
- **Image Upload** - Add images to canvas
- **Background** - Set canvas background color

#### 2. Properties Tab
- **Text Properties** - Font, size, color, alignment
- **Shape Properties** - Fill, stroke, dimensions
- **Object Properties** - Position, rotation, scaling
- **Delete Object** - Remove selected element

#### 3. Assets Tab
- **Media Library** - Uploaded images and assets
- **Templates** - Pre-made design elements
- **Brand Kit** - Company colors and fonts

### Canvas Controls
- **Zoom In/Out** - Adjust canvas view
- **Reset View** - Return to default zoom
- **Grid Toggle** - Show/hide alignment grid
- **Snap to Grid** - Align objects to grid

## API Endpoints

### Project Management
- `GET /api/projects/:id` - Load project data
- `PUT /api/projects/:id` - Save project changes

### Export Functions
- `POST /api/projects/:id/export/pdf` - Export to PDF
- `POST /api/projects/:id/export/png` - Export to PNG

### Request/Response Examples

**Load Project:**
```typescript
// Request
GET /api/projects/proj_123

// Response
{
  "ok": true,
  "data": {
    "id": "proj_123",
    "title": "My Project",
    "type": "ebook",
    "metadata": {
      "canvas": {
        "objects": [...],
        "background": "#ffffff"
      }
    }
  }
}
```

**Save Project:**
```typescript
// Request
PUT /api/projects/proj_123
{
  "metadata": {
    "canvas": {
      "objects": [...],
      "background": "#ffffff"
    }
  }
}

// Response
{
  "ok": true,
  "data": {
    "id": "proj_123",
    "title": "My Project",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Export PDF:**
```typescript
// Request
POST /api/projects/proj_123/export/pdf
{
  "canvas": {
    "objects": [...],
    "background": "#ffffff"
  }
}

// Response
// Returns HTML file download
```

## Canvas Data Structure

### Fabric.js Canvas JSON
```typescript
interface CanvasData {
  version: string;
  objects: CanvasObject[];
  background: string;
  width: number;
  height: number;
}

interface CanvasObject {
  type: 'text' | 'rect' | 'circle' | 'image';
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
```

### Object Types

#### Text Objects
```typescript
{
  type: 'text',
  text: 'Hello World',
  fontSize: 24,
  fontFamily: 'Arial',
  fill: '#000000',
  left: 100,
  top: 100
}
```

#### Rectangle Objects
```typescript
{
  type: 'rect',
  width: 100,
  height: 100,
  fill: '#ff0000',
  stroke: '#000000',
  strokeWidth: 2,
  left: 100,
  top: 100
}
```

#### Circle Objects
```typescript
{
  type: 'circle',
  radius: 50,
  fill: '#00ff00',
  stroke: '#000000',
  strokeWidth: 2,
  left: 100,
  top: 100
}
```

#### Image Objects
```typescript
{
  type: 'image',
  src: 'data:image/png;base64,...',
  scaleX: 0.5,
  scaleY: 0.5,
  left: 100,
  top: 100
}
```

## Usage Examples

### Basic Text Editing
```typescript
// Add text to canvas
const addText = () => {
  const text = new fabric.Text('Hello World', {
    left: 100,
    top: 100,
    fontSize: 24,
    fontFamily: 'Arial',
    fill: '#000000'
  });
  canvas.add(text);
};

// Update text properties
const updateText = (textObject, properties) => {
  textObject.set(properties);
  canvas.renderAll();
};
```

### Shape Creation
```typescript
// Add rectangle
const addRect = () => {
  const rect = new fabric.Rect({
    left: 100,
    top: 100,
    width: 100,
    height: 100,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2
  });
  canvas.add(rect);
};

// Add circle
const addCircle = () => {
  const circle = new fabric.Circle({
    left: 100,
    top: 100,
    radius: 50,
    fill: '#00ff00',
    stroke: '#000000',
    strokeWidth: 2
  });
  canvas.add(circle);
};
```

### Image Handling
```typescript
// Add image from file
const addImage = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const fabricImage = new fabric.Image(img, {
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5
      });
      canvas.add(fabricImage);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};
```

### Export Functionality
```typescript
// Export to PNG
const exportPNG = () => {
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2
  });
  
  const link = document.createElement('a');
  link.download = 'project.png';
  link.href = dataURL;
  link.click();
};

// Export to PDF (via API)
const exportPDF = async () => {
  const canvasData = canvas.toJSON();
  const response = await fetch(`/api/projects/${projectId}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canvas: canvasData })
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project.pdf';
    link.click();
  }
};
```

## Performance Considerations

### Canvas Optimization
- **Object pooling** for frequently created/destroyed objects
- **Lazy loading** for large images
- **Debounced saving** to prevent excessive API calls
- **Memory management** for long editing sessions

### Export Optimization
- **Canvas scaling** for high-resolution exports
- **Image compression** for smaller file sizes
- **Background processing** for large exports
- **Progress indicators** for long operations

## Security Considerations

### Input Validation
- **File type validation** for image uploads
- **Size limits** for uploaded files
- **XSS prevention** for text content
- **Path traversal** protection

### Data Sanitization
- **HTML escaping** for user content
- **File name sanitization** for exports
- **Content filtering** for inappropriate material

## Future Enhancements

### Advanced Features
- **Layer management** with drag-and-drop reordering
- **Grouping/ungrouping** of objects
- **Alignment tools** (snap to grid, align to objects)
- **Advanced typography** (kerning, leading, etc.)
- **Custom shapes** and drawing tools
- **Animation support** for interactive content

### Integration Features
- **Template library** with pre-made designs
- **Brand kit integration** for consistent styling
- **Collaborative editing** with real-time updates
- **Version control** with design history
- **Comment system** for feedback and reviews

### Export Enhancements
- **Multiple format support** (SVG, EPS, etc.)
- **Batch export** for multiple projects
- **Print optimization** with bleed and margins
- **Web optimization** with responsive sizing

---

*Last updated: October 17, 2025*
