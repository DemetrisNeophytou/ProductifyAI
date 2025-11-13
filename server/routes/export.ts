/**
 * Export Routes
 * Handles project export functionality (PDF, PNG, etc.)
 */

import { Router } from "express";
import { db } from "../db";
import { projects } from "../schema";
import { eq, and } from "drizzle-orm";
// Note: For production, consider using puppeteer or similar for better PDF generation
// For now, we'll use a simpler approach

const router = Router();

// POST /api/projects/:id/export/pdf - Export project to PDF
router.post("/:id/export/pdf", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { canvas } = req.body;

    if (!canvas) {
      return res.status(400).json({
        ok: false,
        error: "Canvas data is required"
      });
    }

    // Get project details
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    // Generate HTML from canvas data
    const html = generateHTMLFromCanvas(canvas, project[0]);

    // For now, return the HTML as a downloadable file
    // In production, you would use puppeteer or similar to generate actual PDF
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${project[0].title}.html"`);
    res.send(html);

  } catch (error: any) {
    console.error('PDF export error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to export PDF"
    });
  }
});

// POST /api/projects/:id/export/png - Export project to PNG
router.post("/:id/export/png", async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { canvas } = req.body;

    if (!canvas) {
      return res.status(400).json({
        ok: false,
        error: "Canvas data is required"
      });
    }

    // Get project details
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project.length) {
      return res.status(404).json({
        ok: false,
        error: "Project not found"
      });
    }

    // Generate HTML from canvas data
    const html = generateHTMLFromCanvas(canvas, project[0]);

    // For now, return the HTML as a downloadable file
    // In production, you would use puppeteer or similar to generate actual PNG
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${project[0].title}.html"`);
    res.send(html);

  } catch (error: any) {
    console.error('PNG export error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to export PNG"
    });
  }
});

// Generate HTML from canvas data
function generateHTMLFromCanvas(canvasData: any, project: any): string {
  const { objects, background } = canvasData;
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${project.title}</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background-color: ${background || '#ffffff'};
          font-family: Arial, sans-serif;
        }
        .canvas-container {
          position: relative;
          width: 800px;
          height: 600px;
          margin: 0 auto;
          background-color: ${background || '#ffffff'};
          border: 1px solid #ccc;
        }
        .canvas-object {
          position: absolute;
        }
        .text-object {
          font-family: inherit;
          white-space: nowrap;
        }
        .rect-object, .circle-object {
          border: 1px solid #000;
        }
        .circle-object {
          border-radius: 50%;
        }
        .image-object {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      <div class="canvas-container">
  `;

  // Render canvas objects
  if (objects && Array.isArray(objects)) {
    objects.forEach((obj: any) => {
      const style = `
        left: ${obj.left || 0}px;
        top: ${obj.top || 0}px;
        width: ${obj.width || 0}px;
        height: ${obj.height || 0}px;
        transform: rotate(${obj.angle || 0}deg) scale(${obj.scaleX || 1}, ${obj.scaleY || 1});
        transform-origin: center;
      `;

      if (obj.type === 'text') {
        html += `
          <div class="canvas-object text-object" style="${style}; font-size: ${obj.fontSize || 24}px; font-family: ${obj.fontFamily || 'Arial'}; color: ${obj.fill || '#000000'};">
            ${obj.text || ''}
          </div>
        `;
      } else if (obj.type === 'rect') {
        html += `
          <div class="canvas-object rect-object" style="${style}; background-color: ${obj.fill || '#ff0000'}; border-color: ${obj.stroke || '#000000'}; border-width: ${obj.strokeWidth || 0}px;">
          </div>
        `;
      } else if (obj.type === 'circle') {
        html += `
          <div class="canvas-object circle-object" style="${style}; background-color: ${obj.fill || '#00ff00'}; border-color: ${obj.stroke || '#000000'}; border-width: ${obj.strokeWidth || 0}px;">
          </div>
        `;
      } else if (obj.type === 'image') {
        html += `
          <img class="canvas-object image-object" style="${style};" src="${obj.src || ''}" alt="Image" />
        `;
      }
    });
  }

  html += `
      </div>
    </body>
    </html>
  `;

  return html;
}

export default router;


