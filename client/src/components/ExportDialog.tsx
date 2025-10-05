import { useState } from "react";
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

  const exportToPDF = async () => {
    try {
      setExporting(true);
      const isWorkbook = project.type === 'workbook';
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const form = pdfDoc.getForm();

      let page = pdfDoc.addPage([612, 792]);
      let y = 750;

      // Title
      page.drawText(project.title, {
        x: 50,
        y,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 50;

      // Sections
      for (const section of sections) {
        if (y < 100) {
          page = pdfDoc.addPage([612, 792]);
          y = 750;
        }

        page.drawText(section.title, {
          x: 50,
          y,
          size: 16,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        y -= 30;

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
      
      const children: Paragraph[] = [
        new Paragraph({
          text: project.title,
          heading: HeadingLevel.TITLE,
        }),
      ];

      for (const section of sections) {
        children.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_1,
          })
        );

        const content = extractTextFromContent(section.content);
        children.push(
          new Paragraph({
            children: [new TextRun(content)],
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

      let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    h1 { color: #333; font-size: 2.5em; margin-bottom: 0.5em; }
    h2 { color: #555; font-size: 1.8em; margin-top: 1.5em; border-bottom: 2px solid #8B5CF6; padding-bottom: 0.3em; }
    p { color: #444; margin: 1em 0; }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
`;

      for (const section of sections) {
        const content = extractTextFromContent(section.content);
        html += `
  <h2>${section.title}</h2>
  <p>${content.replace(/\n/g, "<br>")}</p>
`;
      }

      html += `
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>Choose a format to export your project</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.format}
                className="cursor-pointer hover-elevate"
                onClick={option.action}
                data-testid={`export-${option.format.toLowerCase()}`}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <Icon className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <h3 className="font-semibold">{option.format}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={exporting} className="w-full">
                    {exporting ? "Exporting..." : "Export"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
