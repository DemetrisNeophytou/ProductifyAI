# Product Editor Canvas Documentation

## Overview

The Product Editor Canvas is a visual editing system that allows users to create and edit digital products using a canvas-based interface powered by Fabric.js. Users can add text, images, shapes, and other elements to create professional-looking digital products.

## Features

### Canvas Editing
- **Fabric.js Integration**: Uses Fabric.js for powerful canvas-based editing
- **Object Manipulation**: Add, move, resize, rotate, and delete objects
- **Real-time Editing**: Live preview of changes as you edit
- **Undo/Redo**: Full history support with undo/redo functionality

### Element Types
- **Text Elements**: Add and edit text with various fonts, sizes, and colors
- **Images**: Upload and manipulate images
- **Shapes**: Add rectangles, circles, triangles, and other geometric shapes
- **Custom Objects**: Extensible system for adding custom element types

### Design Tools
- **Font Selection**: Choose from a variety of font families
- **Color Palette**: Predefined color palette with custom color picker
- **Positioning**: Precise positioning with X/Y coordinates
- **Layering**: Control object layering and z-index

### Export Options
- **PNG Export**: High-quality PNG image export
- **PDF Export**: Professional PDF export with proper scaling
- **Canvas Data**: Save/load canvas state as JSON

## API Endpoints

### GET /editor/:projectId
Loads a project for editing in the visual editor.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "title": "My Project",
    "type": "ebook",
    "canvasData": "{\"version\":\"5.3.0\",\"objects\":[...]}",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/projects/:id
Updates a project with new canvas data.

**Request Body:**
```json
{
  "canvasData": "{\"version\":\"5.3.0\",\"objects\":[...]}",
  "title": "Updated Project Title",
  "metadata": {
    "lastEdited": "2024-01-01T00:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "proj_123",
    "title": "Updated Project Title",
    "canvasData": "{\"version\":\"5.3.0\",\"objects\":[...]}",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Canvas Data Structure

The canvas data is stored as a JSON string containing Fabric.js canvas state:

```json
{
  "version": "5.3.0",
  "objects": [
    {
      "type": "text",
      "left": 100,
      "top": 100,
      "width": 200,
      "height": 50,
      "fill": "#000000",
      "fontSize": 24,
      "fontFamily": "Arial",
      "text": "Hello World"
    },
    {
      "type": "rect",
      "left": 150,
      "top": 200,
      "width": 100,
      "height": 100,
      "fill": "#FF0000",
      "stroke": "#000000",
      "strokeWidth": 2
    }
  ],
  "background": "#ffffff",
  "width": 800,
  "height": 600
}
```

## Usage

### Basic Setup
```typescript
import { fabric } from "fabric";

// Initialize canvas
const canvas = new fabric.Canvas("canvas", {
  width: 800,
  height: 600,
  backgroundColor: "#ffffff"
});

// Add text
const text = new fabric.Text("Hello World", {
  left: 100,
  top: 100,
  fontSize: 24,
  fontFamily: "Arial"
});
canvas.add(text);

// Add rectangle
const rect = new fabric.Rect({
  left: 150,
  top: 200,
  width: 100,
  height: 100,
  fill: "#FF0000"
});
canvas.add(rect);
```

### Saving Canvas State
```typescript
// Get canvas data
const canvasData = canvas.toJSON();

// Save to server
await fetch(`/api/projects/${projectId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ canvasData: JSON.stringify(canvasData) })
});
```

### Loading Canvas State
```typescript
// Load from server
const response = await fetch(`/api/projects/${projectId}`);
const { data } = await response.json();

// Load into canvas
canvas.loadFromJSON(JSON.parse(data.canvasData), () => {
  canvas.renderAll();
});
```

### Exporting
```typescript
// Export as PNG
const dataURL = canvas.toDataURL({
  format: "png",
  quality: 1
});

// Export as PDF
import jsPDF from "jspdf";

const pdf = new jsPDF({
  orientation: "landscape",
  unit: "mm",
  format: "a4"
});

const imgWidth = 297; // A4 width in mm
const imgHeight = (canvas.height * imgWidth) / canvas.width;

pdf.addImage(dataURL, "PNG", 0, 0, imgWidth, imgHeight);
pdf.save("project.pdf");
```

## Component Structure

```
VisualEditor.tsx
├── Header
│   ├── Project Title
│   ├── Undo/Redo Buttons
│   └── Save/Export Buttons
├── Toolbar
│   ├── Tools Tab
│   │   ├── Add Elements (Text, Image)
│   │   ├── Shapes (Rectangle, Circle, Triangle)
│   │   └── Actions (Duplicate, Delete)
│   └── Properties Tab
│       ├── Text Properties (Font, Size)
│       ├── Colors (Fill, Stroke)
│       └── Position & Size (X, Y coordinates)
└── Canvas Area
    └── Fabric.js Canvas
```

## Keyboard Shortcuts

- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo
- `Ctrl+S` / `Cmd+S`: Save
- `Delete`: Delete selected object
- `Ctrl+D` / `Cmd+D`: Duplicate selected object
- `Ctrl+A` / `Cmd+A`: Select all objects

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- **Fabric.js**: Canvas manipulation library
- **jsPDF**: PDF generation
- **html2canvas**: Canvas to image conversion
- **React**: UI framework
- **TypeScript**: Type safety

## Performance Considerations

- **Canvas Size**: Recommended maximum canvas size is 2000x2000 pixels
- **Object Limit**: Keep objects under 1000 for optimal performance
- **Image Optimization**: Compress images before adding to canvas
- **Memory Management**: Dispose of unused canvas instances

## Troubleshooting

### Common Issues

1. **Canvas not rendering**: Ensure Fabric.js is properly loaded
2. **Export fails**: Check canvas size and object count
3. **Save fails**: Verify API endpoint and data format
4. **Performance issues**: Reduce canvas size or object count

### Debug Mode

Enable debug mode by setting `fabric.Object.prototype.objectCaching = false` to see object boundaries and selection handles.

## Future Enhancements

- **Templates**: Pre-built design templates
- **Layers Panel**: Advanced layer management
- **Animation**: Keyframe-based animations
- **Collaboration**: Real-time collaborative editing
- **Plugins**: Extensible plugin system
- **Mobile Support**: Touch-optimized interface
