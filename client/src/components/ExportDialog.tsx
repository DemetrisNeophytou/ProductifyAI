import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Globe, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, Section } from "@shared/schema";
import { PDFDocument, rgb, StandardFonts, PDFTextField, PDFCheckBox } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

interface BrandKit {
  primaryColor: string;
  secondaryColor: string;
  colors: string[];
  fonts: {
    heading?: string;
    body?: string;
    accent?: string;
  };
}

// Helper to extract text content from TipTap JSON
function extractTextFromContent(content: any): string {
  if (!content) return "";
  
  if (typeof content === 'string') return content;
  
  // Handle TipTap JSON structure
  if (content.type === 'doc' && content.content) {
    return content.content
      .map((node: any) => extractTextFromNode(node))
      .filter(Boolean)
      .join('\n\n');
  }
  
  // Fallback for old format
  if (content.text) return content.text;
  
  return "";
}

function extractTextFromNode(node: any): string {
  if (!node) return "";
  
  if (node.type === 'text') {
    return node.text || "";
  }
  
  if (node.type === 'paragraph' && node.content) {
    return node.content.map((n: any) => extractTextFromNode(n)).join('');
  }
  
  if (node.type === 'heading' && node.content) {
    return node.content.map((n: any) => extractTextFromNode(n)).join('');
  }
  
  if (node.type === 'bulletList' && node.content) {
    return node.content.map((item: any) => '• ' + extractTextFromNode(item)).join('\n');
  }
  
  if (node.type === 'orderedList' && node.content) {
    return node.content.map((item: any, i: number) => `${i + 1}. ` + extractTextFromNode(item)).join('\n');
  }
  
  if (node.type === 'listItem' && node.content) {
    return node.content.map((n: any) => extractTextFromNode(n)).join('');
  }
  
  if (node.content) {
    return node.content.map((n: any) => extractTextFromNode(n)).join(' ');
  }
  
  return "";
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  sections: Section[];
}

export function ExportDialog({ open, onOpenChange, project, sections }: ExportDialogProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  
  // Fetch brand kit
  const { data: brandKit } = useQuery<BrandKit>({
    queryKey: ['/api/brand-kit'],
    enabled: open,
  });

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0.545, g: 0.361, b: 0.965 }; // Default purple
  };

  const exportToPDF = async () => {
    try {
      setExporting(true);
      const isWorkbook = project.type === 'workbook';
      const pdfDoc = await PDFDocument.create();
      
      // Note: pdf-lib only supports standard fonts. Custom font embedding would require
      // fetching and embedding font files, which adds significant complexity.
      // Using closest standard font match based on brand kit font family.
      const getBestStandardFont = (fontName?: string): StandardFonts => {
        if (!fontName) return StandardFonts.Helvetica;
        const lower = fontName.toLowerCase();
        if (lower.includes('serif') || lower.includes('georgia') || lower.includes('playfair')) {
          return StandardFonts.TimesRoman;
        }
        if (lower.includes('mono') || lower.includes('courier')) {
          return StandardFonts.Courier;
        }
        return StandardFonts.Helvetica; // Default sans-serif
      };
      
      const font = await pdfDoc.embedFont(getBestStandardFont(brandKit?.fonts?.body));
      const boldFont = await pdfDoc.embedFont(
        brandKit?.fonts?.heading?.toLowerCase().includes('serif') 
          ? StandardFonts.TimesRomanBold 
          : StandardFonts.HelveticaBold
      );
      const form = pdfDoc.getForm();

      let page = pdfDoc.addPage([612, 792]);
      let y = 750;

      // Apply brand colors
      const primaryColor = brandKit ? hexToRgb(brandKit.primaryColor) : { r: 0.545, g: 0.361, b: 0.965 };
      const secondaryColor = brandKit ? hexToRgb(brandKit.secondaryColor) : { r: 0.925, g: 0.286, b: 0.600 };

      // Title with brand color
      page.drawText(project.title, {
        x: 50,
        y,
        size: 24,
        font: boldFont,
        color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
      });
      y -= 50;

      // Sections
      for (const section of sections) {
        if (y < 100) {
          page = pdfDoc.addPage([612, 792]);
          y = 750;
        }

        // Section title with secondary brand color
        page.drawText(section.title, {
          x: 50,
          y,
          size: 16,
          font: boldFont,
          color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
        });
        y -= 30;

        // Embed section image if available
        if (section.imageUrl) {
          try {
            const imageResponse = await fetch(section.imageUrl);
            const imageBytes = await imageResponse.arrayBuffer();
            const imageType = section.imageUrl.toLowerCase();
            
            let embeddedImage;
            if (imageType.includes('.png') || imageType.includes('png')) {
              embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else {
              embeddedImage = await pdfDoc.embedJpg(imageBytes);
            }
            
            const imageWidth = 500;
            const imageHeight = (embeddedImage.height / embeddedImage.width) * imageWidth;
            
            // Check if image fits on current page
            if (y - imageHeight < 50) {
              page = pdfDoc.addPage([612, 792]);
              y = 750;
            }
            
            page.drawImage(embeddedImage, {
              x: 56,
              y: y - imageHeight,
              width: imageWidth,
              height: imageHeight,
            });
            
            y -= imageHeight + 20;
          } catch (error) {
            console.error('Failed to embed image:', error);
          }
        }

        const content = extractTextFromContent(section.content);
        const blockType = (section as any).type || 'text';
        
        // Handle different block types
        if (isWorkbook && (blockType === 'task' || blockType === 'exercise')) {
          // Add fillable text field for workbook exercises
          const lines = content.split('\n');
          for (const line of lines) {
            if (y < 80) {
              page = pdfDoc.addPage([612, 792]);
              y = 750;
            }
            
            page.drawText(line, {
              x: 50,
              y,
              size: 12,
              font,
              color: rgb(0, 0, 0),
            });
            y -= 25;
            
            // Add fillable field
            const textField = form.createTextField(`answer_${section.id}_${y}`);
            textField.addToPage(page, {
              x: 50,
              y: y - 5,
              width: 500,
              height: 20,
            });
            y -= 35;
          }
        } else if (isWorkbook && blockType === 'checkbox') {
          // Add checkboxes for checklist items
          const lines = content.split('\n').filter(Boolean);
          for (const line of lines) {
            if (y < 50) {
              page = pdfDoc.addPage([612, 792]);
              y = 750;
            }
            
            const checkBox = form.createCheckBox(`check_${section.id}_${y}`);
            checkBox.addToPage(page, {
              x: 50,
              y: y - 12,
              width: 15,
              height: 15,
            });
            
            page.drawText(line.replace(/^[•\-\*]\s*/, ''), {
              x: 75,
              y,
              size: 12,
              font,
              color: rgb(0, 0, 0),
            });
            y -= 25;
          }
        } else {
          // Regular text content
          const words = content.split(" ");
          let line = "";

          for (const word of words) {
            const testLine = line + word + " ";
            const width = font.widthOfTextAtSize(testLine, 12);

            if (width > 500) {
              if (y < 50) {
                page = pdfDoc.addPage([612, 792]);
                y = 750;
              }
              page.drawText(line, {
                x: 50,
                y,
                size: 12,
                font,
                color: rgb(0, 0, 0),
              });
              line = word + " ";
              y -= 20;
            } else {
              line = testLine;
            }
          }

          if (line) {
            if (y < 50) {
              page = pdfDoc.addPage([612, 792]);
              y = 750;
            }
            page.drawText(line, {
              x: 50,
              y,
              size: 12,
              font,
              color: rgb(0, 0, 0),
            });
            y -= 30;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title}${isWorkbook ? '_fillable' : ''}.pdf`;
      a.click();

      toast({ title: `PDF exported successfully${isWorkbook ? ' (fillable)' : ''}` });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
      onOpenChange(false);
    }
  };

  const exportToDOCX = async () => {
    try {
      setExporting(true);
      
      // Apply brand kit fonts and colors with proper fallbacks
      const headingFont = brandKit?.fonts?.heading || 'Calibri';
      const bodyFont = brandKit?.fonts?.body || 'Calibri';
      const primaryColor = (brandKit?.primaryColor || '#8B5CF6').replace('#', '');
      const secondaryColor = (brandKit?.secondaryColor || '#EC4899').replace('#', '');
      
      const children: Paragraph[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: project.title,
              font: headingFont,
              size: 48,
              bold: true,
              color: primaryColor,
            }),
          ],
          heading: HeadingLevel.TITLE,
        }),
      ];

      for (const section of sections) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                font: headingFont,
                size: 32,
                bold: true,
                color: secondaryColor,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: {
              before: 400,
              after: 200,
            },
          })
        );

        const content = extractTextFromContent(section.content);
        children.push(
          new Paragraph({
            children: [new TextRun({
              text: content,
              font: bodyFont,
              size: 24,
            })],
            spacing: {
              before: 200,
              after: 200,
            },
          })
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title}.docx`;
      a.click();

      toast({ title: "DOCX exported successfully" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
      onOpenChange(false);
    }
  };

  const exportToHTML = () => {
    try {
      setExporting(true);

      // Apply brand kit fonts and colors
      const headingFont = brandKit?.fonts?.heading || 'Inter, system-ui, sans-serif';
      const bodyFont = brandKit?.fonts?.body || 'Georgia, serif';
      const primaryColor = brandKit?.primaryColor || '#8B5CF6';
      const secondaryColor = brandKit?.secondaryColor || '#EC4899';
      const accentColor = brandKit?.colors?.[2] || '#F59E0B';

      let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(/ /g, '+')}:wght@400;700&family=${bodyFont.replace(/ /g, '+')}:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: '${bodyFont}', serif; 
      max-width: 900px; 
      margin: 0 auto; 
      padding: 20px;
      line-height: 1.8; 
      color: #1a1a1a;
      background: #ffffff;
    }
    @media (min-width: 768px) {
      body { padding: 60px 40px; }
    }
    h1 { 
      font-family: '${headingFont}', sans-serif;
      color: ${primaryColor}; 
      font-size: clamp(2rem, 5vw, 3rem); 
      margin-bottom: 1.5rem;
      font-weight: 700;
      line-height: 1.2;
    }
    h2 { 
      font-family: '${headingFont}', sans-serif;
      color: ${secondaryColor}; 
      font-size: clamp(1.5rem, 3vw, 2rem); 
      margin-top: 3rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid ${primaryColor}20;
      font-weight: 600;
    }
    p { 
      color: #333; 
      margin: 1.5rem 0; 
      font-size: clamp(1rem, 2vw, 1.125rem);
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 2rem auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .section {
      margin-bottom: 3rem;
      padding: 2rem;
      background: #fafafa;
      border-radius: 12px;
      border-left: 4px solid ${accentColor};
    }
    @media (max-width: 768px) {
      .section { padding: 1.5rem; }
      h2 { margin-top: 2rem; }
    }
    .footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
`;

      for (const section of sections) {
        const content = extractTextFromContent(section.content);
        html += `
  <div class="section">
    <h2>${section.title}</h2>
    <p>${content.replace(/\n/g, "<br>")}</p>`;
        
        // Include image if available
        if (section.imageUrl) {
          html += `
    <img src="${section.imageUrl}" alt="${section.title}" loading="lazy" />`;
        }
        
        html += `
  </div>
`;
      }

      html += `
  <div class="footer">
    <p>Created with Productify AI &bull; ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title}.html`;
      a.click();

      toast({ title: "HTML exported successfully" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
      onOpenChange(false);
    }
  };

  const getExportOptions = () => {
    const productType = project.type || 'ebook';
    
    const allOptions = {
      pdf: {
        format: "PDF",
        icon: File,
        description: "Professional document format",
        action: exportToPDF,
      },
      docx: {
        format: "DOCX",
        icon: FileText,
        description: "Microsoft Word document",
        action: exportToDOCX,
      },
      html: {
        format: "HTML",
        icon: Globe,
        description: "Web page format",
        action: exportToHTML,
      },
    };

    const formatsByType: Record<string, string[]> = {
      ebook: ['pdf', 'docx', 'html'],
      workbook: ['pdf', 'docx'],
      course: ['docx'],
      landing: ['html', 'pdf'],
      emails: ['html', 'docx'],
      social: ['html', 'docx'],
    };

    const formats = formatsByType[productType] || ['pdf', 'docx', 'html'];
    return formats.map(format => allOptions[format as keyof typeof allOptions]);
  };

  const exportOptions = getExportOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Export Project</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Choose a format to export your project with your brand styling
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.format}
                className="cursor-pointer hover-elevate active-elevate-2 touch-manipulation"
                onClick={option.action}
                data-testid={`export-${option.format.toLowerCase()}`}
              >
                <CardContent className="p-4 sm:p-6 text-center space-y-2 sm:space-y-3">
                  <Icon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary" />
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">{option.format}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{option.description}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={exporting} 
                    className="w-full min-h-9 touch-manipulation"
                  >
                    {exporting ? "Exporting..." : "Export"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {brandKit && (
          <div className="mt-4 p-3 sm:p-4 bg-muted rounded-lg border">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold">Brand Kit Applied:</span> Using {brandKit.fonts?.heading || 'Inter'} for headings 
              {brandKit.fonts?.body && ` and ${brandKit.fonts.body} for body text`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
